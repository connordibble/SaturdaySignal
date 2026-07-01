import scheduleFixture from "../../../data/fixtures/texas-football/schedule.json";
import { createSourceDocumentId } from "./ids";
import type { SourceDocument } from "./types";

type ScheduleFixture = typeof scheduleFixture;
type FixtureGame = ScheduleFixture["games"][number];

export function getFixtureScheduleDocuments(teamSlug: string): SourceDocument[] {
  if (teamSlug !== scheduleFixture.teamSlug) {
    return [];
  }

  const fetchedAt = scheduleFixture.capturedAt;
  const summary = createScheduleSummaryDocument(scheduleFixture, fetchedAt);
  const games = scheduleFixture.games.map((game) =>
    createGameDocument(scheduleFixture, game, fetchedAt),
  );

  return [summary, ...games];
}

function createScheduleSummaryDocument(
  fixture: ScheduleFixture,
  fetchedAt: string,
): SourceDocument {
  return {
    id: createSourceDocumentId([fixture.teamSlug, String(fixture.seasonYear), "schedule"]),
    teamSlug: fixture.teamSlug,
    provider: "fixture",
    sourceType: "schedule",
    sourceUrl: fixture.sourceUrl,
    title: `Texas football ${fixture.seasonYear} schedule`,
    body: `Texas has ${fixture.games.length} regular-season games on the ${fixture.seasonYear} official schedule fixture. The opener is ${formatSite(fixture.games[0])} ${fixture.games[0].opponent} on ${fixture.games[0].dateLabel} at ${fixture.games[0].venue}. Source freshness: captured from the official schedule on July 1, 2026.`,
    metadata: {
      seasonYear: fixture.seasonYear,
      gameCount: fixture.games.length,
    },
    fetchedAt,
  };
}

function createGameDocument(
  fixture: ScheduleFixture,
  game: FixtureGame,
  fetchedAt: string,
): SourceDocument {
  const tv = game.tv ? ` TV: ${game.tv}.` : " TV assignment is not confirmed in the fixture.";

  return {
    id: createSourceDocumentId([fixture.teamSlug, game.id]),
    teamSlug: fixture.teamSlug,
    provider: "fixture",
    sourceType: "game",
    sourceUrl: fixture.sourceUrl,
    title: `Texas ${formatSite(game)} ${game.opponent}`,
    body: `Texas ${formatSite(game)} ${game.opponent} on ${game.dateLabel}. Kickoff: ${game.kickoff}. Venue: ${game.venue}.${tv} Source freshness: official schedule fixture captured July 1, 2026.`,
    metadata: {
      seasonYear: fixture.seasonYear,
      gameId: game.id,
      opponent: game.opponent,
      site: game.site,
      startsAt: game.startsAt,
      kickoff: game.kickoff,
      venue: game.venue,
      tv: game.tv,
    },
    publishedAt: game.startsAt ?? undefined,
    fetchedAt,
  };
}

function formatSite(game: Pick<FixtureGame, "site">) {
  if (game.site === "away") {
    return "at";
  }

  if (game.site === "neutral") {
    return "vs";
  }

  return "vs";
}
