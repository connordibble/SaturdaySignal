// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createMockEmbeddingProvider } from "./mock";
import { embeddingDimensions } from "./types";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
}

describe("mock embedding provider", () => {
  it("emits deterministic, correctly-sized, L2-normalized vectors", async () => {
    const provider = createMockEmbeddingProvider();
    const [a] = await provider.embed(["early downs and the line of scrimmage"]);
    const [b] = await provider.embed(["early downs and the line of scrimmage"]);

    expect(a).toHaveLength(embeddingDimensions);
    expect(a).toEqual(b); // deterministic
    expect(cosine(a, a)).toBeCloseTo(1, 5); // unit length
  });

  it("scores related text more similar than unrelated text", async () => {
    const provider = createMockEmbeddingProvider();
    const [query, related, unrelated] = await provider.embed([
      "how does the offensive line look",
      "the interior offensive line rotation is unsettled",
      "kickoff is set for 2:30 p.m. on ESPN",
    ]);

    expect(cosine(query, related)).toBeGreaterThan(cosine(query, unrelated));
  });

  it("handles empty input and empty strings without NaNs", async () => {
    const provider = createMockEmbeddingProvider();

    expect(await provider.embed([])).toEqual([]);
    const [empty] = await provider.embed([""]);
    expect(empty).toHaveLength(embeddingDimensions);
    expect(empty.every((value) => Number.isFinite(value))).toBe(true);
  });
});
