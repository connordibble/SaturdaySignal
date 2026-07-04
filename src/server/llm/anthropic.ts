import Anthropic from "@anthropic-ai/sdk";
import { LlmProviderError, type LlmEnv, type LlmProvider, type LlmRequest } from "./types";

export const defaultAnthropicModel = "claude-opus-4-8";

const defaultMaxTokens = 1024;

export function createAnthropicProvider(env: LlmEnv = process.env): LlmProvider {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new LlmProviderError("anthropic", "ANTHROPIC_API_KEY is not configured.");
  }

  const model = env.ANTHROPIC_MODEL || defaultAnthropicModel;
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    model,

    async generate(request: LlmRequest) {
      try {
        const response = await client.messages.create(buildParams(model, request));
        const text = response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");

        if (response.stop_reason === "refusal") {
          throw new LlmProviderError("anthropic", "The model declined to answer this request.");
        }

        return { text, model: response.model };
      } catch (error) {
        throw wrapError(error);
      }
    },

    async *stream(request: LlmRequest) {
      try {
        const stream = client.messages.stream(buildParams(model, request));

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            yield event.delta.text;
          }
        }

        const final = await stream.finalMessage();

        if (final.stop_reason === "refusal") {
          throw new LlmProviderError("anthropic", "The model declined to answer this request.");
        }
      } catch (error) {
        throw wrapError(error);
      }
    },
  };
}

function buildParams(model: string, request: LlmRequest): Anthropic.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: request.maxTokens ?? defaultMaxTokens,
    thinking: { type: "adaptive" },
    system: request.system,
    messages: request.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
}

function wrapError(error: unknown): LlmProviderError {
  if (error instanceof LlmProviderError) {
    return error;
  }

  if (error instanceof Anthropic.APIError) {
    return new LlmProviderError("anthropic", `API error ${error.status}: ${error.message}`, {
      cause: error,
    });
  }

  return new LlmProviderError("anthropic", "Request failed.", { cause: error });
}
