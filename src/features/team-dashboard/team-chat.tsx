"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ExternalLink, Loader2 } from "lucide-react";
import { readSseStream } from "@/lib/sse";

type TeamChatProps = {
  teamSlug: string;
  suggestedPrompts: string[];
  tagline: string;
};

type ChatCitation = {
  id: string;
  title: string;
  sourceUrl?: string;
  provider: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: ChatCitation[];
  confidence?: string;
  freshness?: string;
  streaming: boolean;
  error?: string;
};

const maxHistorySent = 8;

export function TeamChat({ teamSlug, suggestedPrompts, tagline }: TeamChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(0);
  const sessionId = useRef<string | undefined>(undefined);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thread = threadRef.current;

    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages]);

  function updateMessage(id: number, patch: (message: ChatMessage) => ChatMessage) {
    setMessages((current) =>
      current.map((message) => (message.id === id ? patch(message) : message)),
    );
  }

  async function submit(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const history = messages
      .filter((entry) => !entry.error && entry.content)
      .slice(-maxHistorySent)
      .map((entry) => ({ role: entry.role, content: entry.content }));

    const userId = nextId.current++;
    const assistantId = nextId.current++;

    setIsLoading(true);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: trimmed, citations: [], streaming: false },
      { id: assistantId, role: "assistant", content: "", citations: [], streaming: true },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          teamSlug,
          message: trimmed,
          history,
          sessionId: sessionId.current,
        }),
      });

      if (!response.ok || !response.body) {
        const detail = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(detail?.error ?? "Saturday Signal could not answer that yet.");
      }

      for await (const event of readSseStream(response.body)) {
        if (event.event === "citations") {
          const { citations } = JSON.parse(event.data) as { citations: ChatCitation[] };
          updateMessage(assistantId, (entry) => ({ ...entry, citations }));
        } else if (event.event === "delta") {
          const { text } = JSON.parse(event.data) as { text: string };
          updateMessage(assistantId, (entry) => ({ ...entry, content: entry.content + text }));
        } else if (event.event === "done") {
          const answer = JSON.parse(event.data) as {
            answer: string;
            citations: ChatCitation[];
            confidence: string;
            freshness: string;
            sessionId?: string;
          };
          if (answer.sessionId) {
            sessionId.current = answer.sessionId;
          }
          updateMessage(assistantId, (entry) => ({
            ...entry,
            content: answer.answer,
            citations: answer.citations,
            confidence: answer.confidence,
            freshness: answer.freshness,
            streaming: false,
          }));
        } else if (event.event === "error") {
          const { error } = JSON.parse(event.data) as { error: string };
          throw new Error(error);
        }
      }
    } catch (unknownError) {
      updateMessage(assistantId, (entry) => ({
        ...entry,
        streaming: false,
        error:
          unknownError instanceof Error ? unknownError.message : "Unknown chat error.",
      }));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
          Grounded assistant
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-[var(--team-ink)] sm:text-4xl">
          {tagline}
        </h2>
      </div>

      {messages.length === 0 ? (
        <>
          <p className="max-w-2xl text-base leading-7 text-[var(--team-muted)]">
            Saturday Signal pairs trusted sources, retrieval, and a sports-native
            voice so answers sound like a sharp fan analyst with citations, not a
            tech demo in team colors.
          </p>
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
        </>
      ) : (
        <div
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
          ref={threadRef}
        >
          {messages.map((message) =>
            message.role === "user" ? (
              <div className="flex justify-end" key={message.id}>
                <p className="max-w-[85%] rounded-md bg-[var(--team-accent)] px-4 py-2.5 text-sm leading-6 text-[var(--team-contrast)]">
                  {message.content}
                </p>
              </div>
            ) : (
              <AssistantMessage key={message.id} message={message} />
            ),
          )}
        </div>
      )}

      <form
        className="mt-auto flex flex-col gap-3 border-t border-[var(--team-border)] pt-5 sm:flex-row"
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
          {isLoading ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={17} />
          ) : (
            <Activity aria-hidden="true" size={17} />
          )}
          Ask Saturday Signal
        </button>
      </form>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <section className="rounded-md border border-[var(--team-border-strong)] bg-[var(--team-surface-soft)] p-4">
      {message.confidence || message.freshness ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
          {message.confidence ? <span>Confidence: {message.confidence}</span> : null}
          {message.confidence && message.freshness ? <span aria-hidden="true">/</span> : null}
          {message.freshness ? <span className="normal-case">{message.freshness}</span> : null}
        </div>
      ) : null}
      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--team-ink-subtle)]">
        {message.error ?? message.content}
        {message.streaming ? (
          <span aria-hidden="true" className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-[var(--team-accent)] align-text-bottom" />
        ) : null}
      </p>
      {message.citations.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {message.citations.map((citation) => (
            <CitationRow citation={citation} key={citation.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function CitationRow({ citation }: { citation: ChatCitation }) {
  const rowClass =
    "inline-flex items-center justify-between gap-3 rounded-md border border-[var(--team-border)] bg-[var(--team-surface)] px-3 py-2 text-sm font-medium text-[var(--team-ink-subtle)]";

  const meta = (
    <span className="inline-flex items-center gap-2 text-xs uppercase text-[var(--team-muted)]">
      {citation.provider}
      {citation.sourceUrl ? <ExternalLink aria-hidden="true" size={14} /> : null}
    </span>
  );

  if (!citation.sourceUrl) {
    return (
      <div className={rowClass}>
        <span>{citation.title}</span>
        {meta}
      </div>
    );
  }

  return (
    <a
      className={`${rowClass} transition hover:border-[var(--team-accent)]`}
      href={citation.sourceUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span>{citation.title}</span>
      {meta}
    </a>
  );
}
