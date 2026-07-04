import type { TeamConfig } from "@/config/team";
import { getNextGame, getTeamSchedule } from "@/server/schedule/schedule";
import type { RetrievalHit } from "@/server/rag/retrieve";
import type { GroundingContext, LlmMessage, LlmRequest } from "@/server/llm/types";

export const maxHistoryMessages = 8;
export const maxMessageLength = 4000;

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildChatRequest(
  team: TeamConfig,
  question: string,
  hits: RetrievalHit[],
  history: ChatHistoryMessage[] = [],
): LlmRequest {
  return {
    system: buildSystemPrompt(team, hits),
    messages: [...sanitizeHistory(history), { role: "user", content: question.trim() }],
    grounding: buildGroundingContext(team, question, hits),
  };
}

// The voice contract, source policy, and grounding rules all come from typed
// team config so a second deployment inherits its own persona automatically.
function buildSystemPrompt(team: TeamConfig, hits: RetrievalHit[]): string {
  const preferredTerms = team.voice.preferredTerms.join(", ");
  const bannedPhrases = team.voice.bannedPhrases.join("; ");
  const excerpts = hits
    .map(
      (hit, index) =>
        `[${index + 1}] "${hit.chunk.document.title}" (${hit.chunk.document.provider}, fetched ${hit.chunk.document.fetchedAt})\n${hit.chunk.content}`,
    )
    .join("\n\n");

  return [
    `You are Saturday Signal, an independent fan intelligence analyst covering ${team.displayName}.`,
    `Persona: ${team.voice.posture}. Use football-native language such as ${preferredTerms}.`,
    `Never use these phrases: ${bannedPhrases}. No toxic rivalry bait, no betting certainty, no unsupported injury speculation.`,
    `${team.sourcePolicy.disclaimer} Never imply official affiliation.`,
    "Ground every factual claim in the source excerpts below. Cite sources inline as [source title]. If the excerpts do not support an answer, say what the corpus is missing instead of guessing.",
    "Keep answers to one tight paragraph unless asked for more.",
    "",
    "Source excerpts:",
    excerpts || "(no relevant sources retrieved)",
  ].join("\n");
}

function buildGroundingContext(
  team: TeamConfig,
  question: string,
  hits: RetrievalHit[],
): GroundingContext {
  const schedule = getTeamSchedule(team.slug);
  const nextGame = getNextGame(team.slug);
  const intent = /next|opener|brief|schedule/i.test(question) ? "next-game" : "general";

  return {
    teamName: team.shortName,
    teamDisplayName: team.displayName,
    seasonYear: schedule?.seasonYear,
    intent,
    nextGame: nextGame
      ? {
          opponent: nextGame.opponent,
          site: nextGame.site,
          dateLabel: nextGame.dateLabel,
          kickoff: nextGame.kickoff,
          venue: nextGame.venue,
          tv: nextGame.tv,
        }
      : undefined,
    excerpts: hits.map((hit) => ({
      title: hit.chunk.document.title,
      content: hit.chunk.content,
    })),
    citationTitles: dedupe(hits.map((hit) => hit.chunk.document.title)),
  };
}

export function sanitizeHistory(history: ChatHistoryMessage[]): LlmMessage[] {
  return history
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-maxHistoryMessages)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, maxMessageLength),
    }));
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
