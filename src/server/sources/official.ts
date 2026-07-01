import type { TeamConfig } from "@/config/team";
import type { SourceDocument } from "./types";

export function getOfficialLinkDocuments(team: TeamConfig): SourceDocument[] {
  const fetchedAt = new Date("2026-07-01T14:00:00.000Z").toISOString();

  return [
    {
      id: `${team.slug}-official-schedule-link`,
      teamSlug: team.slug,
      provider: "official",
      sourceType: "schedule",
      sourceUrl: "https://texaslonghorns.com/sports/football/schedule/2026",
      title: "Official Texas football schedule link",
      body: "The official Texas Athletics schedule page is the canonical source for kickoff windows, TV assignments, venues, and game-center links. Source freshness: link verified July 1, 2026.",
      metadata: {
        trustedSourceLabels: team.sourcePolicy.trustedSourceLabels,
      },
      fetchedAt,
    },
  ];
}
