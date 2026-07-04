export type ChatCitation = {
  id: string;
  title: string;
  sourceUrl?: string;
  provider: string;
  sourceType: string;
};

export type ChatAnswerMode = "grounded" | "guardrail" | "no-context";

export type ChatAnswer = {
  teamSlug: string;
  answer: string;
  citations: ChatCitation[];
  confidence: "high" | "medium" | "low";
  freshness: string;
  mode: ChatAnswerMode;
  provider: string;
  model: string;
};

export type ChatStreamEvent =
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "delta"; text: string }
  | { type: "done"; answer: ChatAnswer };
