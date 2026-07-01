export type SourceProvider = "fixture" | "cfbd" | "official";
export type SourceType = "schedule" | "game" | "news" | "team-note";

export type SourceDocument = {
  id: string;
  teamSlug: string;
  provider: SourceProvider;
  sourceType: SourceType;
  sourceUrl?: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  publishedAt?: string;
  fetchedAt: string;
};

export type IngestResult = {
  teamSlug: string;
  documents: SourceDocument[];
  counts: Record<SourceProvider, number>;
  warnings: string[];
};
