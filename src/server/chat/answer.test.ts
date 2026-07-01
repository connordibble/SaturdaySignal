import { describe, expect, it } from "vitest";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { answerQuestion } from "./answer";

describe("answerQuestion", () => {
  it("answers next-game questions with citations and football language", async () => {
    const result = await answerQuestion("Give me the next-game briefing.");

    expect(result.answer).toContain("Texas State");
    expect(result.answer).toContain("early downs");
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.confidence).toBe("high");
    expect(evaluateVoiceSample(result.answer).passed).toBe(true);
  });

  it("caveats rumor and injury questions", async () => {
    const result = await answerQuestion("I heard a message board injury rumor. Is it true?");

    expect(result.confidence).toBe("low");
    expect(result.answer).toContain("not treat that as confirmed");
    expect(result.answer).toContain("should not launder injury");
  });
});
