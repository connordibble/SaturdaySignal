import { describe, expect, it } from "vitest";
import { evaluateVoiceSample } from "@/lib/content/voice";

describe("sports-native voice eval", () => {
  it("accepts source-grounded fan analyst language", () => {
    const result = evaluateVoiceSample(
      "Texas has to win early downs so the pass game is not living behind the sticks. The next-game fixture points to Ohio State as the first real line-of-scrimmage test. [Schedule fixture]",
    );

    expect(result.passed).toBe(true);
    expect(result.matchedFootballTerms).toContain("early downs");
    expect(result.matchedFootballTerms).toContain("line of scrimmage");
  });

  it("rejects generic tech-demo sports copy", () => {
    const result = evaluateVoiceSample(
      "As an AI, it is important to note that fans should check the application for more information about the team.",
    );

    expect(result.passed).toBe(false);
    expect(result.flags).toContain("banned phrase: as an ai");
    expect(result.flags).toContain("missing football-specific language");
    expect(result.flags).toContain("missing citation or freshness cue");
  });

  it("rejects rivalry bait even when football terms are present", () => {
    const result = evaluateVoiceSample(
      "The front seven matchup matters, but calling the opponent a poverty program is lazy rivalry bait. [Source freshness: fixture]",
    );

    expect(result.passed).toBe(false);
    expect(result.flags).toContain("toxic rivalry language: poverty program");
  });
});
