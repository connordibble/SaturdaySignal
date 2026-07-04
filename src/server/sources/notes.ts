import teamNotes from "../../../data/fixtures/texas-football/team-notes.json";
import { createSourceDocumentId } from "./ids";
import type { SourceDocument } from "./types";

type TeamNotesFixture = typeof teamNotes;
type TeamNote = TeamNotesFixture["notes"][number];

const fixtures: Record<string, TeamNotesFixture> = {
  [teamNotes.teamSlug]: teamNotes,
};

// Sample analyst notes shipped as fixture data so the assistant has real
// retrieval variety offline. A licensed notes provider can replace this
// adapter without touching the pipeline: same SourceDocument contract.
export function getTeamNoteDocuments(teamSlug: string): SourceDocument[] {
  const fixture = fixtures[teamSlug];

  if (!fixture) {
    return [];
  }

  return fixture.notes.map((note) => createNoteDocument(fixture, note));
}

function createNoteDocument(fixture: TeamNotesFixture, note: TeamNote): SourceDocument {
  return {
    id: createSourceDocumentId([fixture.teamSlug, "note", note.id]),
    teamSlug: fixture.teamSlug,
    provider: "fixture",
    sourceType: "team-note",
    title: note.title,
    body: note.body,
    metadata: {
      topics: note.topics,
      sample: true,
      disclaimer: fixture.disclaimer,
    },
    publishedAt: note.publishedAt,
    fetchedAt: fixture.capturedAt,
  };
}
