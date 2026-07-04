import { createMockEmbeddingProvider } from "./mock";
import { createOpenAiEmbeddingProvider, defaultOpenAiEmbeddingModel } from "./openai";
import type { EmbeddingEnv, EmbeddingProvider } from "./types";

export type EmbeddingProviderName = "mock" | "openai";

export type ResolvedEmbeddingProvider = {
  provider: EmbeddingProvider;
  warning?: string;
};

const providerNames: EmbeddingProviderName[] = ["mock", "openai"];

// Mirrors the LLM registry: explicit EMBEDDINGS_PROVIDER wins (falling back to
// mock with a warning when unsatisfiable), otherwise openai auto-activates
// when its key is present, and the deterministic mock covers everything else.
export function resolveEmbeddingProvider(
  env: EmbeddingEnv = process.env,
): ResolvedEmbeddingProvider {
  const requested = (env.EMBEDDINGS_PROVIDER || "").trim().toLowerCase();

  if (requested && !isProviderName(requested)) {
    return {
      provider: createMockEmbeddingProvider(),
      warning: `Unknown EMBEDDINGS_PROVIDER "${requested}"; expected one of ${providerNames.join(", ")}. Using mock embeddings.`,
    };
  }

  const name = requested || (env.OPENAI_API_KEY ? "openai" : "mock");

  try {
    return {
      provider:
        name === "openai" ? createOpenAiEmbeddingProvider(env) : createMockEmbeddingProvider(),
    };
  } catch (error) {
    return {
      provider: createMockEmbeddingProvider(),
      warning:
        error instanceof Error
          ? `${error.message} Using mock embeddings.`
          : "Embedding provider failed to initialize. Using mock embeddings.",
    };
  }
}

export type EmbeddingProviderStatus = {
  provider: EmbeddingProviderName;
  model: string;
  source: "explicit" | "auto";
  warning?: string;
};

export function describeEmbeddingProvider(
  env: EmbeddingEnv = process.env,
): EmbeddingProviderStatus {
  const requested = (env.EMBEDDINGS_PROVIDER || "").trim().toLowerCase();
  const resolved = resolveEmbeddingProvider(env);

  return {
    provider: resolved.provider.name as EmbeddingProviderName,
    model: resolved.provider.model,
    source: requested ? "explicit" : "auto",
    warning: resolved.warning,
  };
}

function isProviderName(value: string): value is EmbeddingProviderName {
  return (providerNames as string[]).includes(value);
}

export const defaultEmbeddingModels = {
  openai: defaultOpenAiEmbeddingModel,
} as const;
