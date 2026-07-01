import texasSchedule from "../../../data/fixtures/texas-football/schedule.json";

export type ScheduleSite = "home" | "away" | "neutral";

export type ScheduleGame = {
  id: string;
  opponent: string;
  site: ScheduleSite;
  dateLabel: string;
  startsAt: string | null;
  kickoff: string;
  venue: string;
  tv: string | null;
};

export type TeamSchedule = {
  teamSlug: string;
  teamName: string;
  teamDisplayName: string;
  seasonYear: number;
  sourceUrl: string;
  capturedAt: string;
  games: ScheduleGame[];
};

const schedules: Record<string, TeamSchedule> = {
  "texas-football": texasSchedule as unknown as TeamSchedule,
};

export function getTeamSchedule(teamSlug: string): TeamSchedule | undefined {
  return schedules[teamSlug];
}

// Returns the first game that has not yet happened. A game counts as upcoming
// when its kickoff is in the future or its start time is still unscheduled
// (null), which keeps later-season TBD games ahead of already-played ones.
export function getNextGame(teamSlug: string, now = new Date()): ScheduleGame | undefined {
  const schedule = getTeamSchedule(teamSlug);

  if (!schedule || schedule.games.length === 0) {
    return undefined;
  }

  const upcoming = schedule.games.find(
    (game) => !game.startsAt || new Date(game.startsAt) >= now,
  );

  return upcoming ?? schedule.games[0];
}

export function formatSite(site: ScheduleSite): string {
  return site === "away" ? "at" : "vs";
}

export function formatCaptureDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
