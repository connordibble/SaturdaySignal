import { defaultTeamConfig, getTeamConfig, type TeamConfig } from "@/config/team";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { collectSourceDocuments } from "@/server/ingest/pipeline";
import {
  formatCaptureDate,
  formatSite,
  getNextGame,
  getTeamSchedule,
} from "@/server/schedule/schedule";
import { retrieveSourceChunks } from "@/server/rag/retrieve";
import type { ChatAnswer, ChatCitation } from "./types";

const rumorPattern = /rumou?r|message board|heard|leak|injur|out for season|bet|lock/i;

export async function answerQuestion(
  question: string,
  teamSlug = defaultTeamConfig.slug,
): Promise<ChatAnswer> {
  const team = getTeamConfig(teamSlug);

  if (!team) {
    throw new Error(`Unknown team slug: ${teamSlug}`);
  }

  const ingest = await collectSourceDocuments(team.slug);
  const hits = retrieveSourceChunks(question, ingest.documents, 4);
  const citations = createCitations(hits.map((hit) => hit.chunk.document));
  const freshness = createFreshness(team.slug, citations, ingest.warnings);
  const officialCitations = createCitations(
    ingest.documents.filter((document) => document.provider === "official"),
  );

  if (rumorPattern.test(question)) {
    const anchor = officialCitations.length > 0 ? officialCitations : citations;
    return {
      teamSlug: team.slug,
      answer: `I would not treat that as confirmed from this source set. Saturday Signal can speak to the official schedule fixture and trusted links for ${team.displayName}, but it should not launder injury, betting, or message-board claims without a real source. Source freshness only holds for what the corpus actually verifies.`,
      citations: anchor.slice(0, 1),
      confidence: "low",
      freshness,
      mode: "deterministic-grounded",
    };
  }

  if (hits.length === 0) {
    const anchor =
      officialCitations.length > 0
        ? officialCitations
        : createCitations(ingest.documents.slice(0, 1));
    return {
      teamSlug: team.slug,
      answer: `The current source set does not confirm enough to answer that cleanly. Ask for the next-game brief, schedule context, or a sourced opponent note and I can stay on firmer ground about ${team.shortName} on early downs and field position.`,
      citations: anchor.slice(0, 1),
      confidence: "low",
      freshness,
      mode: "deterministic-grounded",
    };
  }

  const answer = buildGroundedAnswer(team, question, citations);
  const voice = evaluateVoiceSample(answer);

  return {
    teamSlug: team.slug,
    answer: voice.passed ? answer : `${answer} Source freshness: ${freshness}.`,
    citations,
    confidence: citations.length >= 2 ? "high" : "medium",
    freshness,
    mode: "deterministic-grounded",
  };
}

function buildGroundedAnswer(team: TeamConfig, question: string, citations: ChatCitation[]) {
  const citationTags = citations
    .slice(0, 2)
    .map((citation) => `[${citation.title}]`)
    .join(" ");

  if (/next|opener|brief|schedule/i.test(question)) {
    const schedule = getTeamSchedule(team.slug);
    const next = getNextGame(team.slug);

    if (schedule && next) {
      const tv = next.tv ? ` on ${next.tv}` : "";
      return `${team.shortName} opens the ${schedule.seasonYear} schedule ${formatSite(next.site)} ${next.opponent} on ${next.dateLabel} at ${next.venue}, with kickoff set for ${next.kickoff}${tv}. The useful football read is not just the opponent name; it is whether ${team.shortName} wins early downs, owns the line of scrimmage, and keeps the operation clean before the schedule tightens. ${citationTags}`.trim();
    }
  }

  const anchorTag = citationTags || `[${citations[0]?.title ?? "schedule fixture"}]`;
  return `The source-backed read is to start with early downs, field position, and whether ${team.shortName} controls the line of scrimmage. The current corpus is strongest on schedule and game context, so I would keep this answer tied to the fixture until richer charting or game-note sources land. ${anchorTag}`.trim();
}

function createCitations(
  documents: Array<{
    id: string;
    title: string;
    sourceUrl?: string;
    provider: string;
    sourceType: string;
  }>,
) {
  const seen = new Map<string, ChatCitation>();

  for (const document of documents) {
    seen.set(document.id, {
      id: document.id,
      title: document.title,
      sourceUrl: document.sourceUrl,
      provider: document.provider,
      sourceType: document.sourceType,
    });
  }

  return [...seen.values()].slice(0, 4);
}

function createFreshness(teamSlug: string, citations: ChatCitation[], warnings: string[]) {
  const providers = [...new Set(citations.map((citation) => citation.provider))].join(", ");
  const schedule = getTeamSchedule(teamSlug);
  const captured = schedule ? formatCaptureDate(schedule.capturedAt) : "an unknown date";
  const warningText = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";

  return `Sources: ${providers || "fixture"}. Official schedule fixture captured ${captured}.${warningText}`;
}
