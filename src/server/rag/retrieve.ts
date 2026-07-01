import { chunkSourceDocuments, type SourceChunk } from "./chunk";
import type { SourceDocument } from "@/server/sources/types";

export type RetrievalHit = {
  chunk: SourceChunk;
  score: number;
};

const stopwords = new Set([
  "a",
  "an",
  "and",
  "are",
  "for",
  "from",
  "give",
  "how",
  "is",
  "me",
  "of",
  "on",
  "should",
  "the",
  "to",
  "what",
  "where",
  "with",
]);

export function retrieveSourceChunks(
  query: string,
  documents: SourceDocument[],
  limit = 4,
): RetrievalHit[] {
  const queryTerms = tokenize(query);
  const chunks = chunkSourceDocuments(documents);

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms, query) }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function scoreChunk(chunk: SourceChunk, queryTerms: string[], rawQuery: string) {
  const content = `${chunk.document.title} ${chunk.content}`.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (content.includes(term)) {
      score += term.length > 4 ? 2 : 1;
    }
  }

  // Schedule-intent questions should surface the schedule summary and game
  // documents first. This is generic across teams; opponent-specific matches
  // fall out of the term scoring above.
  if (/next|opener|brief|schedule/i.test(rawQuery)) {
    if (chunk.document.sourceType === "schedule") {
      score += 4;
    }

    if (chunk.document.sourceType === "game") {
      score += 1;
    }
  }

  return score;
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopwords.has(term));
}
