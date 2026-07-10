import { defaultTeamConfig, getTeamConfig } from "@/config/team";
import { getCfbdScheduleDocuments } from "@/server/sources/cfbd";
import { getFixtureScheduleDocuments } from "@/server/sources/fixtures";
import { getTeamNoteDocuments } from "@/server/sources/notes";
import { getOfficialLinkDocuments } from "@/server/sources/official";
import type { IngestResult, SourceDocument, SourceProvider } from "@/server/sources/types";

const providers: SourceProvider[] = ["fixture", "cfbd", "official"];

export async function collectSourceDocuments(
  teamSlug = defaultTeamConfig.slug,
): Promise<IngestResult> {
  const team = getTeamConfig(teamSlug);

  if (!team) {
    throw new Error(`Unknown team slug: ${teamSlug}`);
  }

  const fixtureDocuments = getFixtureScheduleDocuments(team.slug);
  const noteDocuments = getTeamNoteDocuments(team.slug);
  const officialDocuments = getOfficialLinkDocuments(team);
  const cfbd = await getCfbdScheduleDocuments(team);
  const documents = dedupeDocuments([
    ...fixtureDocuments,
    ...noteDocuments,
    ...officialDocuments,
    ...cfbd.documents,
  ]);

  return {
    teamSlug: team.slug,
    documents,
    counts: countProviders(documents),
    warnings: cfbd.warning ? [cfbd.warning] : [],
  };
}

function dedupeDocuments(documents: SourceDocument[]) {
  const seen = new Map<string, SourceDocument>();

  for (const document of documents) {
    seen.set(document.id, document);
  }

  return [...seen.values()];
}

function countProviders(documents: SourceDocument[]) {
  const counts = Object.fromEntries(providers.map((provider) => [provider, 0])) as Record<
    SourceProvider,
    number
  >;

  for (const document of documents) {
    counts[document.provider] += 1;
  }

  return counts;
}
