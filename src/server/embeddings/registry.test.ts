// @vitest-environment node
import { describe, expect, it } from "vitest";
import { describeEmbeddingProvider, resolveEmbeddingProvider } from "./registry";

describe("embedding provider registry", () => {
  it("defaults to the mock provider when no keys are configured", () => {
    const resolved = resolveEmbeddingProvider({});

    expect(resolved.provider.name).toBe("mock");
    expect(resolved.provider.dimensions).toBe(1536);
    expect(resolved.warning).toBeUndefined();
  });

  it("auto-detects openai when its key is present", () => {
    const resolved = resolveEmbeddingProvider({ OPENAI_API_KEY: "sk-test" });

    expect(resolved.provider.name).toBe("openai");
    expect(resolved.provider.model).toBe("text-embedding-3-small");
  });

  it("honors an explicit EMBEDDINGS_PROVIDER and model override", () => {
    const resolved = resolveEmbeddingProvider({
      EMBEDDINGS_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-test",
      OPENAI_EMBEDDING_MODEL: "text-embedding-3-large",
    });

    expect(resolved.provider.name).toBe("openai");
    expect(resolved.provider.model).toBe("text-embedding-3-large");
  });

  it("falls back to mock with a warning when openai is forced without a key", () => {
    const resolved = resolveEmbeddingProvider({ EMBEDDINGS_PROVIDER: "openai" });

    expect(resolved.provider.name).toBe("mock");
    expect(resolved.warning).toContain("OPENAI_API_KEY");
  });

  it("falls back to mock with a warning for an unknown provider name", () => {
    const resolved = resolveEmbeddingProvider({ EMBEDDINGS_PROVIDER: "cohere" });

    expect(resolved.provider.name).toBe("mock");
    expect(resolved.warning).toContain('Unknown EMBEDDINGS_PROVIDER "cohere"');
  });

  it("describes the active provider for health checks", () => {
    expect(describeEmbeddingProvider({ EMBEDDINGS_PROVIDER: "mock" })).toMatchObject({
      provider: "mock",
      source: "explicit",
    });
    expect(describeEmbeddingProvider({}).source).toBe("auto");
  });
});
