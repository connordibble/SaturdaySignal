export type ChatCitation = {
  id: string;
  title: string;
  sourceUrl?: string;
  provider: string;
  sourceType: string;
};

export type ChatAnswer = {
  teamSlug: string;
  answer: string;
  citations: ChatCitation[];
  confidence: "high" | "medium" | "low";
  freshness: string;
  mode: "deterministic-grounded";
};
