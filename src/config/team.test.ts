import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultTeamConfig,
  defaultTeamSlug,
  enabledTeamSlugs,
  getSourceReadiness,
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

describe("source readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("marks the fixture and official links ready and gates CFBD on its key", () => {
    vi.stubEnv("CFBD_API_KEY", "");
    const states = getSourceReadiness(defaultTeamConfig);

    expect(states).toContainEqual({ label: "Schedule fixture", state: "Ready" });
    expect(states).toContainEqual({ label: "Team notes (sample)", state: "Ready" });
    expect(states).toContainEqual({ label: "Official links", state: "Ready" });
    expect(states).toContainEqual({ label: "CFBD adapter", state: "Needs key" });
  });

  it("marks the CFBD adapter ready when a key is present", () => {
    vi.stubEnv("CFBD_API_KEY", "test-key");
    const states = getSourceReadiness(defaultTeamConfig);

    expect(states).toContainEqual({ label: "CFBD adapter", state: "Ready" });
  });
});
