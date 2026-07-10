// Environment shape accepted by provider factories. Looser than
// NodeJS.ProcessEnv on purpose so callers and tests can pass plain objects.
export type LlmEnv = Record<string, string | undefined>;

export type LlmRole = "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

// Structured facts the chat layer derived from retrieval and team config.
// Real LLM providers answer from `system` + `messages` alone and ignore this;
// the mock provider uses it to compose deterministic grounded answers so the
// app works end-to-end without any API key.
export type GroundingContext = {
  teamName: string;
  teamDisplayName: string;
  seasonYear?: number;
  intent: "next-game" | "general";
  nextGame?: {
    opponent: string;
    site: "home" | "away" | "neutral";
    dateLabel: string;
    kickoff: string;
    venue: string;
    tv: string | null;
  };
  excerpts: Array<{ title: string; content: string }>;
  citationTitles: string[];
};

export type LlmRequest = {
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
  grounding?: GroundingContext;
};

export type LlmResult = {
  text: string;
  model: string;
};

export type LlmProvider = {
  readonly name: string;
  readonly model: string;
  generate(request: LlmRequest): Promise<LlmResult>;
  stream(request: LlmRequest): AsyncGenerator<string, void, void>;
};

export class LlmProviderError extends Error {
  constructor(
    readonly provider: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(`[${provider}] ${message}`, options);
    this.name = "LlmProviderError";
  }
}
