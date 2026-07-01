import { defaultTeamConfig, getTeamConfig } from "@/config/team";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { collectSourceDocuments } from "@/server/ingest/pipeline";
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
  const freshness = createFreshness(citations, ingest.warnings);

  if (rumorPattern.test(question)) {
    return {
      teamSlug: team.slug,
      answer:
        "I would not treat that as confirmed from this source set. Saturday Signal can speak to the official schedule fixture and trusted links, but it should not launder injury, betting, or message-board claims without a real source. [Official Texas football schedule link]",
      citations: citations.slice(0, 1),
      confidence: "low",
      freshness,
      mode: "deterministic-grounded",
    };
  }

  if (hits.length === 0) {
    return {
      teamSlug: team.slug,
      answer:
        "The current source set does not confirm enough to answer that cleanly. Ask for the next-game brief, schedule context, or a sourced opponent note and I can stay on firmer ground. [Official Texas football schedule link]",
      citations: createCitations(ingest.documents.slice(0, 1)),
      confidence: "low",
      freshness,
      mode: "deterministic-grounded",
    };
  }

  const answer = buildGroundedAnswer(question, citations);
  const voice = evaluateVoiceSample(answer);

  return {
    teamSlug: team.slug,
    answer: voice.passed
      ? answer
      : `${answer} Source freshness: ${freshness}.`,
    citations,
    confidence: citations.length >= 2 ? "high" : "medium",
    freshness,
    mode: "deterministic-grounded",
  };
}

function buildGroundedAnswer(question: string, citations: ChatCitation[]) {
  if (/next|opener|brief|schedule/i.test(question)) {
    return "Texas opens the 2026 schedule vs Texas State on Saturday, September 5 at DKR-Texas Memorial Stadium, with kickoff set for 2:30 p.m. CT on ESPN. The useful football read is not just the opponent name; it is whether Texas wins early downs, owns the line of scrimmage, and keeps the operation clean before Ohio State arrives one week later. [Texas football 2026 schedule] [Texas vs Texas State]";
  }

  if (/ohio/i.test(question)) {
    return "Ohio State is the second game on the official 2026 fixture, not the opener. That makes the first week a calibration point: Texas needs clean early-down efficiency and no cheap field-position leaks before the line-of-scrimmage test gets much louder. [Texas vs Ohio State] [Texas football 2026 schedule]";
  }

  return `The source-backed read is to start with early downs, field position, and whether Texas controls the line of scrimmage. The current corpus is strongest on schedule and game context, so I would keep this answer tied to the fixture until richer charting or game-note sources land. [${citations[0]?.title ?? "Texas football 2026 schedule"}]`;
}

function createCitations(documents: Array<{ id: string; title: string; sourceUrl?: string; provider: string; sourceType: string }>) {
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

function createFreshness(citations: ChatCitation[], warnings: string[]) {
  const providers = [...new Set(citations.map((citation) => citation.provider))].join(", ");
  const warningText = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";

  return `Sources: ${providers || "fixture"}. Official schedule fixture captured July 1, 2026.${warningText}`;
}
