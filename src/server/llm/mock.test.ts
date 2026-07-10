// @vitest-environment node
import { describe, expect, it } from "vitest";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { createMockLlmProvider } from "./mock";
import type { LlmRequest } from "./types";

const nextGameRequest: LlmRequest = {
  system: "system prompt",
  messages: [{ role: "user", content: "Give me the next-game briefing." }],
  grounding: {
    teamName: "Texas",
    teamDisplayName: "Texas football",
    seasonYear: 2026,
    intent: "next-game",
    nextGame: {
      opponent: "Texas State",
      site: "home",
      dateLabel: "Saturday, September 5",
      kickoff: "2:30 p.m. CT",
      venue: "DKR-Texas Memorial Stadium, Austin, Texas",
      tv: "ESPN",
    },
    excerpts: [{ title: "Texas vs Texas State", content: "Texas vs Texas State on September 5." }],
    citationTitles: ["Texas football 2026 schedule", "Texas vs Texas State"],
  },
};

describe("mock LLM provider", () => {
  it("composes a grounded next-game answer that passes the voice contract", async () => {
    const provider = createMockLlmProvider();
    const result = await provider.generate(nextGameRequest);

    expect(result.text).toContain("Texas opens the 2026 schedule vs Texas State");
    expect(result.text).toContain("[Texas football 2026 schedule]");
    expect(evaluateVoiceSample(result.text).passed).toBe(true);
  });

  it("quotes the top excerpt for general questions", async () => {
    const provider = createMockLlmProvider();
    const result = await provider.generate({
      ...nextGameRequest,
      grounding: {
        ...nextGameRequest.grounding!,
        intent: "general",
        excerpts: [
          {
            title: "Sample roster note",
            content: "The interior offensive line rotation is still unsettled. More detail here.",
          },
        ],
        citationTitles: ["Sample roster note"],
      },
    });

    expect(result.text).toContain("The interior offensive line rotation is still unsettled.");
    expect(result.text).toContain("[Sample roster note]");
    expect(evaluateVoiceSample(result.text).passed).toBe(true);
  });

  it("streams the exact same text it generates", async () => {
    const provider = createMockLlmProvider();
    const generated = await provider.generate(nextGameRequest);

    let streamed = "";
    for await (const delta of provider.stream(nextGameRequest)) {
      streamed += delta;
    }

    expect(streamed).toBe(generated.text);
  });

  it("answers safely when no grounding is provided", async () => {
    const provider = createMockLlmProvider();
    const result = await provider.generate({ system: "s", messages: [] });

    expect(evaluateVoiceSample(result.text).passed).toBe(true);
  });
});
