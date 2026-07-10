import type { TeamConfig } from "@/config/team";
import { formatCaptureDate, getTeamSchedule } from "@/server/schedule/schedule";
import type { SourceDocument } from "./types";

export function getOfficialLinkDocuments(team: TeamConfig): SourceDocument[] {
  const schedule = getTeamSchedule(team.slug);

  if (!schedule) {
    return [];
  }

  const fetchedAt = schedule.capturedAt;

  return [
    {
      id: `${team.slug}-official-schedule-link`,
      teamSlug: team.slug,
      provider: "official",
      sourceType: "schedule",
      sourceUrl: schedule.sourceUrl,
      title: `Official ${team.displayName} schedule link`,
      body: `The official ${team.displayName} schedule page is the canonical source for kickoff windows, TV assignments, venues, and game-center links. Source freshness: link verified ${formatCaptureDate(fetchedAt)}.`,
      metadata: {
        trustedSourceLabels: team.sourcePolicy.trustedSourceLabels,
      },
      fetchedAt,
    },
  ];
}
