import { defaultTeamConfig, getTeamConfig, type TeamConfig } from "@/config/team";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { collectSourceDocuments } from "@/server/ingest/pipeline";
import { createMockLlmProvider } from "@/server/llm/mock";
import { resolveLlmProvider } from "@/server/llm/registry";
import type { LlmEnv, LlmProvider, LlmRequest } from "@/server/llm/types";
import { retrieveSourceChunks } from "@/server/rag/retrieve";
import { formatCaptureDate, getTeamSchedule } from "@/server/schedule/schedule";
import { buildChatRequest, type ChatHistoryMessage } from "./prompt";
import type { ChatAnswer, ChatCitation, ChatStreamEvent } from "./types";

const rumorPattern = /rumou?r|message board|heard|leak|injur|out for season|bet|lock/i;

export type AnswerOptions = {
  history?: ChatHistoryMessage[];
  env?: LlmEnv;
};

export async function answerQuestion(
  question: string,
  teamSlug = defaultTeamConfig.slug,
  options: AnswerOptions = {},
): Promise<ChatAnswer> {
  const prepared = await prepareAnswer(question, teamSlug, options);

  if (prepared.kind === "static") {
    return prepared.answer;
  }

  const { provider, fallback } = resolveProviders(options.env);

  try {
    const result = await provider.generate(prepared.request);
    return finalizeAnswer(prepared, provider.name, result.model, result.text);
  } catch {
    // A misbehaving or unreachable provider must not take chat down; the
    // deterministic composer always has a grounded answer available.
    const result = await fallback.generate(prepared.request);
    return finalizeAnswer(
      prepared,
      fallback.name,
      result.model,
      result.text,
      `Live LLM provider "${provider.name}" failed; served deterministic answer.`,
    );
  }
}

export async function* streamAnswerEvents(
  question: string,
  teamSlug = defaultTeamConfig.slug,
  options: AnswerOptions = {},
): AsyncGenerator<ChatStreamEvent, void, void> {
  const prepared = await prepareAnswer(question, teamSlug, options);

  if (prepared.kind === "static") {
    yield { type: "citations", citations: prepared.answer.citations };
    yield { type: "delta", text: prepared.answer.answer };
    yield { type: "done", answer: prepared.answer };
    return;
  }

  yield { type: "citations", citations: prepared.citations };

  const { provider, fallback } = resolveProviders(options.env);
  let streamed = "";
  let active = provider;
  let warning: string | undefined;

  try {
    for await (const delta of provider.stream(prepared.request)) {
      streamed += delta;
      yield { type: "delta", text: delta };
    }
  } catch {
    if (streamed.length > 0) {
      // Partial answer already reached the client; close it out honestly
      // rather than splicing in a second answer.
      warning = `Live LLM provider "${provider.name}" failed mid-stream; the answer may be incomplete.`;
      const notice = " [Answer truncated: the live provider failed mid-stream.]";
      streamed += notice;
      yield { type: "delta", text: notice };
    } else {
      active = fallback;
      if (provider !== fallback) {
        warning = `Live LLM provider "${provider.name}" failed; served deterministic answer.`;
      }
      for await (const delta of fallback.stream(prepared.request)) {
        streamed += delta;
        yield { type: "delta", text: delta };
      }
    }
  }

  const answer = finalizeAnswer(prepared, active.name, active.model, streamed, warning);

  if (answer.answer !== streamed) {
    yield { type: "delta", text: answer.answer.slice(streamed.length) };
  }

  yield { type: "done", answer };
}

type PreparedGeneration = {
  kind: "generate";
  team: TeamConfig;
  request: LlmRequest;
  citations: ChatCitation[];
  freshness: string;
};

type PreparedAnswer = { kind: "static"; answer: ChatAnswer } | PreparedGeneration;

async function prepareAnswer(
  question: string,
  teamSlug: string,
  options: AnswerOptions,
): Promise<PreparedAnswer> {
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
      kind: "static",
      answer: {
        teamSlug: team.slug,
        answer: `I would not treat that as confirmed from this source set. Saturday Signal can speak to the official schedule fixture and trusted links for ${team.displayName}, but it should not launder injury, betting, or message-board claims without a real source. Source freshness only holds for what the corpus actually verifies.`,
        citations: anchor.slice(0, 1),
        confidence: "low",
        freshness,
        mode: "guardrail",
        provider: "policy",
        model: "guardrail",
      },
    };
  }

  if (hits.length === 0) {
    const anchor =
      officialCitations.length > 0
        ? officialCitations
        : createCitations(ingest.documents.slice(0, 1));
    return {
      kind: "static",
      answer: {
        teamSlug: team.slug,
        answer: `The current source set does not confirm enough to answer that cleanly. Ask for the next-game brief, schedule context, or a sourced opponent note and I can stay on firmer ground about ${team.shortName} on early downs and field position.`,
        citations: anchor.slice(0, 1),
        confidence: "low",
        freshness,
        mode: "no-context",
        provider: "policy",
        model: "guardrail",
      },
    };
  }

  return {
    kind: "generate",
    team,
    request: buildChatRequest(team, question, hits, options.history ?? []),
    citations,
    freshness,
  };
}

function resolveProviders(env?: LlmEnv): {
  provider: LlmProvider;
  fallback: LlmProvider;
} {
  const resolved = resolveLlmProvider(env ?? process.env);
  const fallback =
    resolved.provider.name === "mock" ? resolved.provider : createMockLlmProvider();

  return { provider: resolved.provider, fallback };
}

function finalizeAnswer(
  prepared: PreparedGeneration,
  providerName: string,
  model: string,
  text: string,
  warning?: string,
): ChatAnswer {
  const freshness = warning ? `${prepared.freshness} ${warning}` : prepared.freshness;
  const voice = evaluateVoiceSample(text);
  const answer = voice.passed ? text : `${text} Source freshness: ${freshness}.`;

  return {
    teamSlug: prepared.team.slug,
    answer,
    citations: prepared.citations,
    confidence: warning ? "low" : prepared.citations.length >= 2 ? "high" : "medium",
    freshness,
    mode: "grounded",
    provider: providerName,
    model,
  };
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
