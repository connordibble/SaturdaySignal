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
        <p className="text-sm font-semibold uppercase tracking-normal text-[#7f3f25]">
          Grounded assistant
        </p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-[#111411] sm:text-5xl">
          Built for fans who want signal, not generic recap sludge.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#4f5a52]">
          Saturday Signal pairs trusted sources, retrieval, and a sports-native
          voice so answers sound like a sharp fan analyst with citations, not a
          tech demo in team colors.
        </p>
      </div>

      <section className="rounded-md border border-[#d8d4c6] bg-[#f9f7ef] p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-[#657068]">
          <span>Confidence: {response.confidence}</span>
          <span aria-hidden="true">/</span>
          <span>{response.freshness}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#29322d]">
          {error ?? response.answer}
        </p>
        {response.citations.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {response.citations.map((citation) => (
              <a
                className="inline-flex items-center justify-between gap-3 rounded-md border border-[#d8d4c6] bg-[#fffdf7] px-3 py-2 text-sm font-medium text-[#29322d] transition hover:border-[#8aa897]"
                href={citation.sourceUrl ?? "#"}
                key={citation.id}
                rel="noreferrer"
                target="_blank"
              >
                <span>{citation.title}</span>
                <span className="inline-flex items-center gap-2 text-xs uppercase text-[#657068]">
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
            className="min-h-24 rounded-md border border-[#d8d4c6] bg-[#f9f7ef] p-4 text-left text-sm font-medium leading-5 text-[#29322d] transition hover:border-[#8aa897] hover:bg-[#eef5ef]"
            key={prompt}
            onClick={() => submit(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="flex flex-col gap-3 border-t border-[#e0dccf] pt-5 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(input);
        }}
      >
        <label className="sr-only" htmlFor="chat-input">
          Ask Saturday Signal
        </label>
        <input
          className="min-h-12 flex-1 rounded-md border border-[#c9c2b0] bg-white px-4 text-sm text-[#171916] outline-none transition placeholder:text-[#7b827b] focus:border-[#557763] focus:ring-2 focus:ring-[#b8d8c0]"
          id="chat-input"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for a next-game brief, matchup read, or source-backed context..."
          type="text"
          value={input}
        />
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#17221d] px-5 text-sm font-semibold text-[#f6f5f1] transition hover:bg-[#26382f] disabled:cursor-not-allowed disabled:opacity-70"
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
