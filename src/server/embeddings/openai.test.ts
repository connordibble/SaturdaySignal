// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAiEmbeddingProvider } from "./openai";
import { EmbeddingProviderError, embeddingDimensions } from "./types";

// The OpenAI SDK requests base64-encoded embeddings by default and decodes
// them to number[], so fixtures must encode float32 bytes the same way.
function toBase64(vector: number[]): string {
  return Buffer.from(new Float32Array(vector).buffer).toString("base64");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openai embedding provider", () => {
  it("requires an API key", () => {
    expect(() => createOpenAiEmbeddingProvider({})).toThrow(EmbeddingProviderError);
  });

  it("returns [] for empty input without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provider = createOpenAiEmbeddingProvider({ OPENAI_API_KEY: "sk-test" });
    expect(await provider.embed([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the configured dimensions and orders results by index", async () => {
    // Data returned out of index order to prove the provider re-sorts.
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          object: "list",
          model: "text-embedding-3-small",
          data: [
            { object: "embedding", index: 1, embedding: toBase64([1, 1]) },
            { object: "embedding", index: 0, embedding: toBase64([3, 3]) },
          ],
          usage: { prompt_tokens: 1, total_tokens: 1 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = createOpenAiEmbeddingProvider({ OPENAI_API_KEY: "sk-test" });
    const result = await provider.embed(["a", "b"]);

    expect(result).toEqual([
      [3, 3],
      [1, 1],
    ]);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { body: string }];
    const body = JSON.parse(init.body) as { dimensions: number; input: string[] };
    expect(body.dimensions).toBe(embeddingDimensions);
    expect(body.input).toEqual(["a", "b"]);
  });

  it("wraps API failures in EmbeddingProviderError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: "bad", type: "invalid_request_error" } }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const provider = createOpenAiEmbeddingProvider({ OPENAI_API_KEY: "sk-test" });
    await expect(provider.embed(["x"])).rejects.toThrow(EmbeddingProviderError);
  });
});
