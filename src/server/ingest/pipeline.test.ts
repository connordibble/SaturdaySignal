import { describe, expect, it } from "vitest";
import { collectSourceDocuments } from "./pipeline";

describe("ingest pipeline", () => {
  it("loads offline Texas schedule fixtures without API keys", async () => {
    const result = await collectSourceDocuments("texas-football");

    expect(result.counts.fixture).toBe(13);
    expect(result.counts.official).toBe(1);
    expect(result.warnings).toContain(
      "CFBD_API_KEY not configured; skipped live CFBD ingest.",
    );
    expect(result.documents[0].sourceUrl).toBe(
      "https://texaslonghorns.com/sports/football/schedule/2026",
    );
  });

  it("keeps document ids stable and unique", async () => {
    const first = await collectSourceDocuments("texas-football");
    const second = await collectSourceDocuments("texas-football");
    const ids = first.documents.map((document) => document.id);

    expect(ids).toEqual(second.documents.map((document) => document.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejects unknown teams", async () => {
    await expect(collectSourceDocuments("nope-football")).rejects.toThrow(
      "Unknown team slug",
    );
  });
});
