import { describe, expect, it } from "vitest";
import {
  defaultTeamConfig,
  defaultTeamSlug,
  enabledTeamSlugs,
  getTeamConfig,
  validateTeamConfig,
} from "./team";

describe("team config", () => {
  it("exposes the Texas football deployment as the MVP default", () => {
    expect(defaultTeamSlug).toBe("texas-football");
    expect(enabledTeamSlugs).toEqual(["texas-football"]);
    expect(getTeamConfig("texas-football")?.displayName).toBe("Texas football");
  });

  it("keeps legal and voice guardrails in config", () => {
    const config = validateTeamConfig(defaultTeamConfig);

    expect(config.sourcePolicy.disclaimer).toContain("not affiliated");
    expect(config.sourcePolicy.protectedMarksGuidance).toContain(
      "Do not use Bevo as product branding.",
    );
    expect(config.voice.preferredTerms).toContain("line of scrimmage");
    expect(config.voice.bannedPhrases).toContain("as an AI");
  });
});
