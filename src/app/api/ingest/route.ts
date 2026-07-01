import { collectSourceDocuments } from "@/server/ingest/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { teamSlug?: string };
  const result = await collectSourceDocuments(body.teamSlug);

  return Response.json({
    teamSlug: result.teamSlug,
    counts: result.counts,
    warnings: result.warnings,
    documentCount: result.documents.length,
    documents: result.documents.map((document) => ({
      id: document.id,
      provider: document.provider,
      sourceType: document.sourceType,
      title: document.title,
      sourceUrl: document.sourceUrl,
      fetchedAt: document.fetchedAt,
    })),
  });
}
