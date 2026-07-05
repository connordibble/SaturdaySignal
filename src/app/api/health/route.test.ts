// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("reports service, LLM provider, and source readiness", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      enabledTeams: string[];
      llm: { provider: string; model: string; source: string };
      embeddings: { provider: string; model: string; source: string };
      sources: Record<string, Array<{ label: string; state: string }>>;
    };

    expect(body.ok).toBe(true);
    expect(body.enabledTeams).toEqual(["texas-football"]);
    expect(["mock", "anthropic", "openai"]).toContain(body.llm.provider);
    expect(["mock", "openai"]).toContain(body.embeddings.provider);
    expect(body.sources["texas-football"]).toContainEqual({
      label: "Schedule fixture",
      state: "Ready",
    });
  });
});
