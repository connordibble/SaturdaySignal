import { createAnthropicProvider, defaultAnthropicModel } from "./anthropic";
import { createMockLlmProvider } from "./mock";
import { createOpenAiProvider, defaultOpenAiModel } from "./openai";
import type { LlmEnv, LlmProvider } from "./types";

export type LlmProviderName = "mock" | "anthropic" | "openai";

export type ResolvedLlmProvider = {
  provider: LlmProvider;
  // Set when the configuration asked for something the environment cannot
  // satisfy (e.g. LLM_PROVIDER=anthropic without a key) and we fell back.
  warning?: string;
};

const providerNames: LlmProviderName[] = ["mock", "anthropic", "openai"];

// Resolution order:
// 1. Explicit LLM_PROVIDER wins; if its key is missing we fall back to mock
//    with a warning rather than taking the chat surface down.
// 2. Otherwise auto-detect: anthropic if ANTHROPIC_API_KEY, else openai if
//    OPENAI_API_KEY, else mock. Adding a key is all it takes to go live.
export function resolveLlmProvider(env: LlmEnv = process.env): ResolvedLlmProvider {
  const requested = (env.LLM_PROVIDER || "").trim().toLowerCase();

  if (requested && !isProviderName(requested)) {
    return {
      provider: createMockLlmProvider(),
      warning: `Unknown LLM_PROVIDER "${requested}"; expected one of ${providerNames.join(", ")}. Using mock provider.`,
    };
  }

  const name = requested || autoDetect(env);

  try {
    return { provider: createProvider(name as LlmProviderName, env) };
  } catch (error) {
    return {
      provider: createMockLlmProvider(),
      warning: error instanceof Error ? `${error.message} Using mock provider.` : "LLM provider failed to initialize. Using mock provider.",
    };
  }
}

export type LlmProviderStatus = {
  provider: LlmProviderName;
  model: string;
  source: "explicit" | "auto";
  warning?: string;
};

// Reported by /api/health so a deploy can verify which provider is live
// without sending a chat message.
export function describeLlmProvider(env: LlmEnv = process.env): LlmProviderStatus {
  const requested = (env.LLM_PROVIDER || "").trim().toLowerCase();
  const resolved = resolveLlmProvider(env);

  return {
    provider: resolved.provider.name as LlmProviderName,
    model: resolved.provider.model,
    source: requested ? "explicit" : "auto",
    warning: resolved.warning,
  };
}

function createProvider(name: LlmProviderName, env: LlmEnv): LlmProvider {
  switch (name) {
    case "anthropic":
      return createAnthropicProvider(env);
    case "openai":
      return createOpenAiProvider(env);
    case "mock":
      return createMockLlmProvider();
  }
}

function autoDetect(env: LlmEnv): LlmProviderName {
  if (env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }

  if (env.OPENAI_API_KEY) {
    return "openai";
  }

  return "mock";
}

function isProviderName(value: string): value is LlmProviderName {
  return (providerNames as string[]).includes(value);
}

export const defaultModels = {
  anthropic: defaultAnthropicModel,
  openai: defaultOpenAiModel,
} as const;
