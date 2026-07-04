import { getTeamConfig } from "@/config/team";
import { answerQuestion, streamAnswerEvents } from "@/server/chat/answer";
import type { ChatHistoryMessage } from "@/server/chat/prompt";
import type { ChatStreamEvent } from "@/server/chat/types";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  teamSlug?: string;
  history?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;

  if (!body.message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  if (body.teamSlug && !getTeamConfig(body.teamSlug)) {
    return Response.json({ error: `Unknown team slug: ${body.teamSlug}` }, { status: 404 });
  }

  const history = parseHistory(body.history);

  if (history === null) {
    return Response.json(
      { error: "history must be an array of { role: 'user' | 'assistant', content: string }" },
      { status: 400 },
    );
  }

  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return streamResponse(body.message, body.teamSlug, history);
  }

  const answer = await answerQuestion(body.message, body.teamSlug, { history });
  return Response.json(answer);
}

function streamResponse(message: string, teamSlug: string | undefined, history: ChatHistoryMessage[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamAnswerEvents(message, teamSlug, { history })) {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "stream failed";
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: detail })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function encodeSseEvent(event: ChatStreamEvent): string {
  switch (event.type) {
    case "citations":
      return `event: citations\ndata: ${JSON.stringify({ citations: event.citations })}\n\n`;
    case "delta":
      return `event: delta\ndata: ${JSON.stringify({ text: event.text })}\n\n`;
    case "done":
      return `event: done\ndata: ${JSON.stringify(event.answer)}\n\n`;
  }
}

function parseHistory(value: unknown): ChatHistoryMessage[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const history: ChatHistoryMessage[] = [];

  for (const entry of value) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("role" in entry) ||
      !("content" in entry)
    ) {
      return null;
    }

    const { role, content } = entry as { role: unknown; content: unknown };

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return null;
    }

    history.push({ role, content });
  }

  return history;
}
