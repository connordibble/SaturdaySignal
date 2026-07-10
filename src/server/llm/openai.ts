import OpenAI from "openai";
import { LlmProviderError, type LlmEnv, type LlmProvider, type LlmRequest } from "./types";

export const defaultOpenAiModel = "gpt-4o";

const defaultMaxTokens = 16000;

export function createOpenAiProvider(env: LlmEnv = process.env): LlmProvider {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new LlmProviderError("openai", "OPENAI_API_KEY is not configured.");
  }

  const model = env.OPENAI_MODEL || defaultOpenAiModel;
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    model,

    async generate(request: LlmRequest) {
      try {
        const response = await client.chat.completions.create({
          model,
          max_completion_tokens: request.maxTokens ?? defaultMaxTokens,
          messages: buildMessages(request),
        });

        return {
          text: response.choices[0]?.message?.content ?? "",
          model: response.model,
        };
      } catch (error) {
        throw wrapError(error);
      }
    },

    async *stream(request: LlmRequest) {
      try {
        const stream = await client.chat.completions.create({
          model,
          max_completion_tokens: request.maxTokens ?? defaultMaxTokens,
          messages: buildMessages(request),
          stream: true,
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;

          if (delta) {
            yield delta;
          }
        }
      } catch (error) {
        throw wrapError(error);
      }
    },
  };
}

function buildMessages(
  request: LlmRequest,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: request.system },
    ...request.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

function wrapError(error: unknown): LlmProviderError {
  if (error instanceof LlmProviderError) {
    return error;
  }

  if (error instanceof OpenAI.APIError) {
    return new LlmProviderError("openai", `API error ${error.status}: ${error.message}`, {
      cause: error,
    });
  }

  return new LlmProviderError("openai", "Request failed.", { cause: error });
}
