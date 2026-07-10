// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAiProvider } from "./openai";
import { LlmProviderError, type LlmRequest } from "./types";

const request: LlmRequest = {
  system: "You are a test analyst.",
  messages: [{ role: "user", content: "next game?" }],
};

function completionJson(text: string) {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 1,
    model: "gpt-4o",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
  };
}

function sseBody(deltas: string[]) {
  const chunks = deltas.map((text) =>
    `data: ${JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion.chunk",
      created: 1,
      model: "gpt-4o",
      choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
    })}\n\n`,
  );

  return `${chunks.join("")}data: [DONE]\n\n`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openai provider", () => {
  it("requires an API key", () => {
    expect(() => createOpenAiProvider({})).toThrow(LlmProviderError);
  });

  it("sends the chat completions shape with a leading system message", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(completionJson("Grounded answer.")), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = createOpenAiProvider({ OPENAI_API_KEY: "sk-test" });
    const result = await provider.generate(request);

    expect(result.text).toBe("Grounded answer.");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string | URL, { body: string }];
    expect(String(url)).toContain("/chat/completions");
    const body = JSON.parse(init.body) as { model: string; messages: Array<{ role: string }> };
    expect(body.model).toBe("gpt-4o");
    expect(body.messages[0]).toEqual({ role: "system", content: request.system });
    expect(body.messages[1]).toEqual({ role: "user", content: "next game?" });
  });

  it("streams content deltas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(sseBody(["Texas ", "wins ", "early downs."]), {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    );

    const provider = createOpenAiProvider({ OPENAI_API_KEY: "sk-test" });
    let streamed = "";
    for await (const delta of provider.stream(request)) {
      streamed += delta;
    }

    expect(streamed).toBe("Texas wins early downs.");
  });

  it("wraps API failures in LlmProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: "bad", type: "invalid_request_error" } }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const provider = createOpenAiProvider({ OPENAI_API_KEY: "sk-test" });
    await expect(provider.generate(request)).rejects.toThrow(LlmProviderError);
  });
});
