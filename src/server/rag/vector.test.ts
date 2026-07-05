// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createMockEmbeddingProvider } from "@/server/embeddings/mock";
import { retrieveVectorHits } from "./vector";

describe("retrieveVectorHits", () => {
  it("returns [] when no database is configured (offline)", async () => {
    const embed = vi.spyOn(createMockEmbeddingProvider(), "embed");

    const hits = await retrieveVectorHits("next game", "texas-football", 4, { db: null });

    expect(hits).toEqual([]);
    // With no db we must not even bother embedding the query.
    expect(embed).not.toHaveBeenCalled();
  });
});
