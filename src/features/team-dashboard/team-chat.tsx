"use client";

import { useState } from "react";
import { Activity, ExternalLink, Loader2 } from "lucide-react";

type TeamChatProps = {
  teamSlug: string;
  suggestedPrompts: string[];
};

type ChatCitation = {
  id: string;
  title: string;
  sourceUrl?: string;
  provider: string;
};

type ChatResponse = {
  answer: string;
  citations: ChatCitation[];
  confidence: string;
  freshness: string;
};

const starterAnswer: ChatResponse = {
  answer:
    "Ask for a next-game brief, schedule context, or an opponent note. I will keep answers tied to the current source set and show citations here.",
  citations: [],
  confidence: "scaffold",
  freshness: "Waiting for your first question.",
};

export function TeamChat({ teamSlug, suggestedPrompts }: TeamChatProps) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ChatResponse>(starterAnswer);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setInput(trimmed);

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamSlug, message: trimmed }),
      });

      if (!result.ok) {
        throw new Error("Saturday Signal could not answer that yet.");
      }

      setResponse((await result.json()) as ChatResponse);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unknown chat error.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-8 p-5">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
          Grounded assistant
        </p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-[var(--team-ink)] sm:text-5xl">
          Texas context, clean sources, Saturday-level signal.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--team-muted)]">
          Saturday Signal pairs trusted sources, retrieval, and a sports-native
          voice so answers sound like a sharp fan analyst with citations, not a
          tech demo in team colors.
        </p>
      </div>

      <section className="rounded-md border border-[var(--team-border-strong)] bg-[var(--team-surface-soft)] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
          <span>Confidence: {response.confidence}</span>
          <span aria-hidden="true">/</span>
          <span>{response.freshness}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--team-ink-subtle)]">
          {error ?? response.answer}
        </p>
        {response.citations.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {response.citations.map((citation) => (
              <a
                className="inline-flex items-center justify-between gap-3 rounded-md border border-[var(--team-border)] bg-[var(--team-surface)] px-3 py-2 text-sm font-medium text-[var(--team-ink-subtle)] transition hover:border-[var(--team-accent)]"
                href={citation.sourceUrl ?? "#"}
                key={citation.id}
                rel="noreferrer"
                target="_blank"
              >
                <span>{citation.title}</span>
                <span className="inline-flex items-center gap-2 text-xs uppercase text-[var(--team-muted)]">
                  {citation.provider}
                  <ExternalLink aria-hidden="true" size={14} />
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {suggestedPrompts.map((prompt) => (
          <button
            className="min-h-24 rounded-md border border-[var(--team-border)] bg-[var(--team-surface-soft)] p-4 text-left text-sm font-medium leading-5 text-[var(--team-ink-subtle)] transition hover:border-[var(--team-accent)] hover:bg-[var(--team-surface-strong)]"
            key={prompt}
            onClick={() => submit(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="flex flex-col gap-3 border-t border-[var(--team-border)] pt-5 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(input);
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Ask Saturday Signal
        </label>
        <input
          className="min-h-12 flex-1 rounded-md border border-[var(--team-border-strong)] bg-[var(--team-contrast)] px-4 text-sm text-[var(--team-ink)] outline-none transition placeholder:text-[var(--team-muted)] focus:border-[var(--team-accent)] focus:ring-2 focus:ring-[var(--team-accent-soft)]"
          id="chat-input"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for a next-game brief, matchup read, or source-backed context..."
          type="text"
          value={input}
        />
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--team-accent)] px-5 text-sm font-semibold text-[var(--team-contrast)] transition hover:bg-[var(--team-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? <Loader2 aria-hidden="true" className="animate-spin" size={17} /> : <Activity aria-hidden="true" size={17} />}
          Ask Saturday Signal
        </button>
      </form>
    </div>
  );
}
