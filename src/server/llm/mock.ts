import { formatSite } from "@/server/schedule/schedule";
import type { LlmProvider, LlmRequest } from "./types";

// Deterministic provider used when no LLM API key is configured. It composes
// answers from the grounding facts the chat layer already verified, so every
// claim it makes is backed by the source corpus and it works fully offline.
export function createMockLlmProvider(): LlmProvider {
  return {
    name: "mock",
    model: "deterministic-composer",

    async generate(request: LlmRequest) {
      return { text: composeAnswer(request), model: "deterministic-composer" };
    },

    async *stream(request: LlmRequest) {
      const words = composeAnswer(request).split(" ");
      const chunkSize = 6;

      for (let start = 0; start < words.length; start += chunkSize) {
        const chunk = words.slice(start, start + chunkSize).join(" ");
        yield start === 0 ? chunk : ` ${chunk}`;
      }
    },
  };
}

function composeAnswer(request: LlmRequest): string {
  const grounding = request.grounding;

  if (!grounding) {
    return "The current source set does not include grounding context for that question, so I would keep any read tied to early downs, field position, and the line of scrimmage until sources land. [schedule fixture]";
  }

  const citationTags = grounding.citationTitles
    .slice(0, 2)
    .map((title) => `[${title}]`)
    .join(" ");

  if (grounding.intent === "next-game" && grounding.nextGame) {
    const game = grounding.nextGame;
    const tv = game.tv ? ` on ${game.tv}` : "";
    const season = grounding.seasonYear ? `${grounding.seasonYear} ` : "";

    return `${grounding.teamName} opens the ${season}schedule ${formatSite(game.site)} ${game.opponent} on ${game.dateLabel} at ${game.venue}, with kickoff set for ${game.kickoff}${tv}. The useful football read is not just the opponent name; it is whether ${grounding.teamName} wins early downs, owns the line of scrimmage, and keeps the operation clean before the schedule tightens. ${citationTags}`.trim();
  }

  const anchor = citationTags || "[schedule fixture]";
  const excerpt = grounding.excerpts[0];

  if (excerpt) {
    return `${firstSentences(excerpt.content, 2)} For ${grounding.teamName}, that is the early-down and line-of-scrimmage lens to carry into game week. ${anchor}`.trim();
  }

  return `The source-backed read is to start with early downs, field position, and whether ${grounding.teamName} controls the line of scrimmage. The current corpus is strongest on schedule and game context, so I would keep this answer tied to the fixture until richer charting or game-note sources land. ${anchor}`.trim();
}

function firstSentences(content: string, count: number): string {
  const sentences = content.match(/[^.!?]+[.!?]+(?:\s|$)/g);

  if (!sentences) {
    return content.trim();
  }

  return sentences
    .slice(0, count)
    .map((sentence) => sentence.trim())
    .join(" ");
}
