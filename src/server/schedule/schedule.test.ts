import { describe, expect, it } from "vitest";
import {
  formatCaptureDate,
  formatSite,
  getNextGame,
  getTeamSchedule,
} from "./schedule";

describe("team schedule", () => {
  it("loads the Texas fixture and ignores unknown teams", () => {
    const schedule = getTeamSchedule("texas-football");

    expect(schedule?.teamName).toBe("Texas");
    expect(schedule?.teamDisplayName).toBe("Texas football");
    expect(schedule?.games.length).toBe(12);
    expect(getTeamSchedule("nope-football")).toBeUndefined();
  });

  it("derives the next game from the schedule ahead of the season", () => {
    const next = getNextGame("texas-football", new Date("2026-07-01T00:00:00Z"));

    expect(next?.opponent).toBe("Texas State");
    expect(getNextGame("nope-football")).toBeUndefined();
  });

  it("advances the next game past kickoffs that already happened", () => {
    const next = getNextGame("texas-football", new Date("2026-09-13T00:00:00Z"));

    expect(next?.opponent).toBe("UTSA");
  });

  it("formats site and capture date consistently", () => {
    expect(formatSite("home")).toBe("vs");
    expect(formatSite("neutral")).toBe("vs");
    expect(formatSite("away")).toBe("at");
    expect(formatCaptureDate("2026-07-01T13:55:00.000Z")).toBe("July 1, 2026");
  });
});
