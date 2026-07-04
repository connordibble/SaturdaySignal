import OpenAI from "openai";
import {
  EmbeddingProviderError,
  embeddingDimensions,
  type EmbeddingEnv,
  type EmbeddingProvider,
} from "./types";

export const defaultOpenAiEmbeddingModel = "text-embedding-3-small";

export function createOpenAiEmbeddingProvider(
  env: EmbeddingEnv = process.env,
): EmbeddingProvider {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new EmbeddingProviderError("openai", "OPENAI_API_KEY is not configured.");
  }

  const model = env.OPENAI_EMBEDDING_MODEL || defaultOpenAiEmbeddingModel;
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    model,
    dimensions: embeddingDimensions,

    async embed(texts: string[]) {
      if (texts.length === 0) {
        return [];
      }

      try {
        const response = await client.embeddings.create({
          model,
          input: texts,
          dimensions: embeddingDimensions,
        });

        // The API documents index-aligned output; sort defensively.
        return [...response.data]
          .sort((left, right) => left.index - right.index)
          .map((entry) => entry.embedding);
      } catch (error) {
        if (error instanceof OpenAI.APIError) {
          throw new EmbeddingProviderError(
            "openai",
            `API error ${error.status}: ${error.message}`,
            { cause: error },
          );
        }

        throw new EmbeddingProviderError("openai", "Request failed.", { cause: error });
      }
    },
  };
}
