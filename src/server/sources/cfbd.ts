import type { TeamConfig } from "@/config/team";
import { createSourceDocumentId } from "./ids";
import type { SourceDocument } from "./types";

type CfbdGame = {
  id: number;
  season: number;
  week: number;
  startDate?: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
};

export async function getCfbdScheduleDocuments(team: TeamConfig) {
  const apiKey = process.env.CFBD_API_KEY;

  if (!apiKey) {
    return {
      documents: [] satisfies SourceDocument[],
      warning: "CFBD_API_KEY not configured; skipped live CFBD ingest.",
    };
  }

  if (!team.cfbd) {
    return {
      documents: [] satisfies SourceDocument[],
      warning: `CFBD live ingest is not configured for ${team.slug}.`,
    };
  }

  const { team: cfbdTeam, season } = team.cfbd;
  const query = new URLSearchParams({
    year: String(season),
    team: cfbdTeam,
    seasonType: "regular",
  });

  const response = await fetch(`https://api.collegefootballdata.com/games?${query}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    return {
      documents: [] satisfies SourceDocument[],
      warning: `CFBD ingest failed with ${response.status}.`,
    };
  }

  const games = (await response.json()) as CfbdGame[];
  const fetchedAt = new Date().toISOString();

  return {
    documents: games.map((game) => ({
      id: createSourceDocumentId([team.slug, "cfbd", String(game.id)]),
      teamSlug: team.slug,
      provider: "cfbd" as const,
      sourceType: "game" as const,
      sourceUrl: "https://collegefootballdata.com/",
      title: `CFBD game ${game.id}: ${game.awayTeam} at ${game.homeTeam}`,
      body: `CollegeFootballData lists ${game.awayTeam} at ${game.homeTeam} in week ${game.week} of ${game.season}. Venue: ${game.venue ?? "not listed"}. Source freshness: live CFBD fetch at ${fetchedAt}.`,
      metadata: game as unknown as Record<string, unknown>,
      publishedAt: game.startDate,
      fetchedAt,
    })),
    warning: undefined,
  };
}
