import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getSharedDb, type Db } from "@/server/db/client";
import { sourceChunks, sourceDocuments } from "@/server/db/schema";
import { resolveEmbeddingProvider } from "@/server/embeddings/registry";
import type { EmbeddingProvider } from "@/server/embeddings/types";
import type { RetrievalHit } from "./retrieve";

// Nearest neighbors always exist, even for nonsense queries; anything below
// this cosine similarity is treated as "no semantic match" so the no-context
// guardrail still fires. Works for both the hashed-BoW mock (~0 for unrelated
// text) and real embedding models (unrelated text lands well under 0.15).
const minSimilarity = 0.15;

export type VectorSearchDeps = {
  db?: Db | null;
  provider?: EmbeddingProvider;
};

// Cosine search over seeded source_chunks. Returns [] when no database is
// configured or nothing has been seeded, so callers can fall back to lexical
// retrieval without special-casing.
export async function retrieveVectorHits(
  query: string,
  teamSlug: string,
  limit = 4,
  deps: VectorSearchDeps = {},
): Promise<RetrievalHit[]> {
  const db = deps.db !== undefined ? deps.db : getSharedDb();

  if (!db) {
    return [];
  }

  const provider = deps.provider ?? resolveEmbeddingProvider().provider;
  const [embedded] = await provider.embed([query]);
  const vectorParam = `[${embedded.join(",")}]`;
  const distance = sql`${sourceChunks.embedding} <=> ${vectorParam}::vector`;

  const rows = await db
    .select({
      chunkId: sourceChunks.id,
      sourceDocumentId: sourceChunks.sourceDocumentId,
      chunkIndex: sourceChunks.chunkIndex,
      content: sourceChunks.content,
      tokenEstimate: sourceChunks.tokenEstimate,
      similarity: sql<number>`1 - (${distance})`,
      documentTeamSlug: sourceDocuments.teamSlug,
      documentProvider: sourceDocuments.provider,
      documentSourceType: sourceDocuments.sourceType,
      documentSourceUrl: sourceDocuments.sourceUrl,
      documentTitle: sourceDocuments.title,
      documentBody: sourceDocuments.body,
      documentMetadata: sourceDocuments.metadata,
      documentPublishedAt: sourceDocuments.publishedAt,
      documentFetchedAt: sourceDocuments.fetchedAt,
    })
    .from(sourceChunks)
    .innerJoin(sourceDocuments, eq(sourceChunks.sourceDocumentId, sourceDocuments.id))
    .where(and(eq(sourceDocuments.teamSlug, teamSlug), isNotNull(sourceChunks.embedding)))
    .orderBy(distance)
    .limit(limit);

  return rows
    .filter((row) => Number(row.similarity) >= minSimilarity)
    .map((row) => ({
      score: Number(row.similarity),
      chunk: {
        id: row.chunkId,
        sourceDocumentId: row.sourceDocumentId,
        chunkIndex: row.chunkIndex,
        content: row.content,
        tokenEstimate: row.tokenEstimate,
        document: {
          id: row.sourceDocumentId,
          teamSlug: row.documentTeamSlug,
          provider: row.documentProvider as "fixture" | "cfbd" | "official",
          sourceType: row.documentSourceType as "schedule" | "game" | "news" | "team-note",
          sourceUrl: row.documentSourceUrl ?? undefined,
          title: row.documentTitle,
          body: row.documentBody,
          metadata: row.documentMetadata,
          publishedAt: row.documentPublishedAt?.toISOString(),
          fetchedAt: row.documentFetchedAt.toISOString(),
        },
      },
    }));
}
