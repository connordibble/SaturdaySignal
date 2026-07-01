import { getTeamConfig } from "@/config/team";
import { answerQuestion } from "@/server/chat/answer";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  teamSlug?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;

  if (!body.message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  if (body.teamSlug && !getTeamConfig(body.teamSlug)) {
    return Response.json({ error: `Unknown team slug: ${body.teamSlug}` }, { status: 404 });
  }

  const answer = await answerQuestion(body.message, body.teamSlug);

  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return streamAnswer(answer);
  }

  return Response.json(answer);
}

function streamAnswer(answer: Awaited<ReturnType<typeof answerQuestion>>) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: answer\ndata: ${JSON.stringify({ answer: answer.answer })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(
          `event: citations\ndata: ${JSON.stringify({ citations: answer.citations })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify(answer)}\n\n`));
      controller.close();
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
