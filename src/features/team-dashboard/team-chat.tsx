"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ExternalLink, Loader2 } from "lucide-react";
import { readSseStream } from "@/lib/sse";

type TeamChatProps = {
  compactTagline: string;
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

export function TeamChat({
  compactTagline,
  teamSlug,
  suggestedPrompts,
  tagline,
}: TeamChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(0);
  const sessionId = useRef<string | undefined>(undefined);
  const threadRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5">
      {!hasMessages ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 [grid-template-areas:'intro'_'composer'_'prompts'] lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] lg:items-start lg:[grid-template-areas:'intro_prompts'_'composer_composer']">
          <div className="min-w-0 [grid-area:intro]">
            <p className="text-sm font-semibold uppercase tracking-normal text-[var(--team-accent-strong)]">
              Grounded assistant
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-normal text-[var(--team-ink)] sm:text-3xl xl:text-4xl">
              <span className="sm:hidden">{compactTagline}</span>
              <span className="hidden sm:inline">{tagline}</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--team-muted)]">
              Ask for matchup context, schedule reads, and source-backed football
              notes. The answer should name its evidence and stay inside the lane.
            </p>
          </div>
          <ChatComposer
            className="min-w-0 [grid-area:composer]"
            hasMessages={false}
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={(message) => submit(message)}
          />
          <PromptButtons
            className="grid min-w-0 gap-2 [grid-area:prompts] sm:grid-cols-3 lg:grid-cols-1"
            disabled={isLoading}
            onSelect={(prompt) => submit(prompt)}
            prompts={suggestedPrompts}
            testId="suggested-prompts"
          />
        </div>
      ) : (
        <>
          <div
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1"
            ref={threadRef}
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <div className="flex justify-end" key={message.id}>
                  <p className="max-w-[85%] rounded-md bg-[var(--team-accent)] px-4 py-2.5 text-sm leading-6 text-[var(--team-contrast)] shadow-sm">
                    {message.content}
                  </p>
                </div>
              ) : (
                <AssistantMessage key={message.id} message={message} />
              ),
            )}
          </div>
          <ChatComposer
            hasMessages
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={(message) => submit(message)}
          />
        </>
      )}
    </div>
  );
}

function PromptButtons({
  className,
  disabled,
  onSelect,
  prompts,
  testId,
}: {
  className: string;
  disabled: boolean;
  onSelect: (prompt: string) => void;
  prompts: string[];
  testId: string;
}) {
  return (
    <div className={className} data-testid={testId}>
      {prompts.map((prompt) => (
        <button
          aria-label={prompt}
          className="min-h-12 min-w-0 rounded-md border border-[var(--team-border)] bg-[var(--team-surface-soft)] p-3 text-left text-sm font-medium leading-5 text-[var(--team-ink-subtle)] transition-[background-color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--team-accent)] hover:bg-[var(--team-surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-accent)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-14"
          disabled={disabled}
          key={prompt}
          onClick={() => onSelect(prompt)}
          title={prompt}
          type="button"
        >
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
            {prompt}
          </span>
        </button>
      ))}
    </div>
  );
}

function ChatComposer({
  className,
  hasMessages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: {
  className?: string;
  hasMessages: boolean;
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => void;
}) {
  return (
    <form
      className={`${className ?? ""} ${hasMessages ? "mt-auto" : ""} flex flex-col gap-3 border-t border-[var(--team-border)] pt-4 sm:flex-row`}
      data-testid="chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(input);
      }}
    >
      <label className="sr-only" htmlFor="chat-input">
        Ask Saturday Signal
      </label>
      <input
        className="min-h-12 flex-1 rounded-md border border-[var(--team-border-strong)] bg-[var(--team-contrast)] px-4 text-sm text-[var(--team-ink)] outline-none transition-[background-color,border-color,box-shadow] duration-150 ease-out placeholder:text-[var(--team-muted)] hover:bg-[var(--team-surface)] focus:border-[var(--team-accent)] focus:ring-2 focus:ring-[var(--team-accent-soft)]"
        id="chat-input"
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Ask a football question..."
        type="text"
        value={input}
      />
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[var(--team-accent)] px-5 text-sm font-semibold text-[var(--team-contrast)] transition-[background-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:bg-[var(--team-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-accent)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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
      {message.content || !message.error ? (
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--team-ink-subtle)]">
          {message.content}
          {message.streaming ? (
            <span aria-hidden="true" className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-[var(--team-accent)] align-text-bottom" />
          ) : null}
        </p>
      ) : null}
      {message.error ? (
        <p className="mt-2 text-sm font-medium leading-6 text-[var(--team-accent-strong)]">
          {message.error}
        </p>
      ) : null}
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
    "flex min-w-0 items-start justify-between gap-3 rounded-md border border-[var(--team-border)] bg-[var(--team-surface)] px-3 py-2 text-sm font-medium text-[var(--team-ink-subtle)] sm:items-center";

  const meta = (
    <span className="inline-flex shrink-0 items-center gap-2 text-xs uppercase text-[var(--team-muted)]">
      {citation.provider}
      {citation.sourceUrl ? <ExternalLink aria-hidden="true" size={14} /> : null}
    </span>
  );

  if (!citation.sourceUrl) {
    return (
      <div className={rowClass}>
        <span className="min-w-0">{citation.title}</span>
        {meta}
      </div>
    );
  }

  return (
    <a
      className={`${rowClass} transition-[border-color] duration-150 ease-out hover:border-[var(--team-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--team-accent)]`}
      href={citation.sourceUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span className="min-w-0">{citation.title}</span>
      {meta}
    </a>
  );
}
