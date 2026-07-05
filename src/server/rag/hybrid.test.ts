// @vitest-environment node
import { describe, expect, it } from "vitest";
import { collectSourceDocuments } from "@/server/ingest/pipeline";
import { fuseByRrf, retrieveHybrid } from "./hybrid";
import type { RetrievalHit } from "./retrieve";
import type { SourceChunk } from "./chunk";

function hit(id: string): RetrievalHit {
  return {
    score: 1,
    chunk: { id, sourceDocumentId: id, chunkIndex: 0, content: id, tokenEstimate: 1 } as SourceChunk,
  };
}

describe("fuseByRrf", () => {
  it("ranks a chunk appearing in both lists above singletons", () => {
    const lexical = [hit("a"), hit("b")];
    const vector = [hit("c"), hit("a")];

    const fused = fuseByRrf([lexical, vector], 3);

    // "a" appears in both rankings, so RRF sums put it first.
    expect(fused[0].chunk.id).toBe("a");
    expect(fused.map((entry) => entry.chunk.id)).toHaveLength(3);
  });

  it("dedupes by chunk id", () => {
    const fused = fuseByRrf([[hit("a")], [hit("a")]], 5);

    expect(fused).toHaveLength(1);
    expect(fused[0].chunk.id).toBe("a");
  });
});

describe("retrieveHybrid", () => {
  it("falls back to pure lexical retrieval when no database is configured", async () => {
    const ingest = await collectSourceDocuments("texas-football");

    // deps.db = null forces the vector path to no-op, mirroring an offline run.
    const hits = await retrieveHybrid(
      "Give me the next-game briefing.",
      ingest.documents,
      "texas-football",
      4,
      { db: null },
    );

    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits[0].chunk.document.title).toBe("Texas football 2026 schedule");
  });

  it("returns nothing when neither lexical nor vector match", async () => {
    const ingest = await collectSourceDocuments("texas-football");

    const hits = await retrieveHybrid("zzz qqq xyzzy", ingest.documents, "texas-football", 4, {
      db: null,
    });

    expect(hits).toEqual([]);
  });
});
