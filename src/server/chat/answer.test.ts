// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateVoiceSample } from "@/lib/content/voice";
import { answerQuestion, streamAnswerEvents } from "./answer";
import type { ChatStreamEvent } from "./types";

function anthropicMessage(text: string) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-8",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

function anthropicSseBody(deltas: string[]) {
  return [
    anthropicSseHead(deltas),
    `event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`,
    `event: message_delta\ndata: ${JSON.stringify({
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 5 },
    })}\n\n`,
    `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
  ].join("");
}

function anthropicSseHead(deltas: string[]) {
  return [
    `event: message_start\ndata: ${JSON.stringify({
      type: "message_start",
      message: { ...anthropicMessage(""), content: [], stop_reason: null },
    })}\n\n`,
    `event: content_block_start\ndata: ${JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    })}\n\n`,
    ...deltas.map(
      (text) =>
        `event: content_block_delta\ndata: ${JSON.stringify({
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text },
        })}\n\n`,
    ),
  ].join("");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("answerQuestion", () => {
  it("answers next-game questions with citations and football language", async () => {
    const result = await answerQuestion("Give me the next-game briefing.");

    expect(result.answer).toContain("Texas State");
    expect(result.answer).toContain("early downs");
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.confidence).toBe("high");
    expect(result.mode).toBe("grounded");
    expect(result.provider).toBe("mock");
    expect(evaluateVoiceSample(result.answer).passed).toBe(true);
  });

  it("caveats rumor and injury questions without calling any provider", async () => {
    const result = await answerQuestion("I heard a message board injury rumor. Is it true?");

    expect(result.confidence).toBe("low");
    expect(result.mode).toBe("guardrail");
    expect(result.answer).toContain("not treat that as confirmed");
    expect(result.answer).toContain("should not launder injury");
  });

  it("falls back to the deterministic composer when the live provider fails", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-broken");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ type: "error", error: { type: "api_error", message: "down" } }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await answerQuestion("Give me the next-game briefing.");

    expect(result.provider).toBe("mock");
    expect(result.confidence).toBe("low");
    expect(result.freshness).toContain('Live LLM provider "anthropic" failed');
    expect(result.answer).toContain("Texas State");
  }, 30_000);

  it("falls back to the deterministic composer when the live provider returns an empty answer", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-empty");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(anthropicMessage("   ")), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await answerQuestion("Give me the next-game briefing.");

    expect(result.provider).toBe("mock");
    expect(result.confidence).toBe("low");
    expect(result.freshness).toContain('Live LLM provider "anthropic" failed');
    expect(result.answer).toContain("Texas State");
  }, 30_000);

  it("rejects unknown teams", async () => {
    await expect(answerQuestion("hello", "nope-football")).rejects.toThrow("Unknown team slug");
  });
});

describe("streamAnswerEvents", () => {
  async function collect(question: string) {
    const events: ChatStreamEvent[] = [];

    for await (const event of streamAnswerEvents(question)) {
      events.push(event);
    }

    return events;
  }

  it("streams citations first, then deltas that assemble the final answer", async () => {
    const events = await collect("Give me the next-game briefing.");

    expect(events[0].type).toBe("citations");
    const deltas = events.filter((event) => event.type === "delta");
    const done = events.at(-1);

    expect(deltas.length).toBeGreaterThan(1);
    if (done?.type !== "done") {
      throw new Error("expected a done event");
    }
    expect(deltas.map((delta) => delta.text).join("")).toBe(done.answer.answer);
    expect(done.answer.citations.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back when the live provider finishes a stream without answer text", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-empty");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(anthropicSseBody([]), {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    );

    const events = await collect("Give me the next-game briefing.");
    const done = events.at(-1);

    if (done?.type !== "done") {
      throw new Error("expected a done event");
    }
    expect(done.answer.provider).toBe("mock");
    expect(done.answer.confidence).toBe("low");
    expect(done.answer.freshness).toContain('Live LLM provider "anthropic" failed');
    expect(done.answer.answer).toContain("Texas State");
    expect(events.filter((event) => event.type === "delta")).not.toHaveLength(0);
  }, 30_000);

  it("marks the answer incomplete when the live provider dies mid-stream", async () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-broken");

    const encoder = new TextEncoder();
    const sseHead = anthropicSseHead(["Partial answer "]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(encoder.encode(sseHead));
              // Let the SDK consume the delta before the connection drops,
              // so the orchestrator hits the mid-stream (partial) path.
              setTimeout(() => controller.error(new Error("connection reset")), 25);
            },
          }),
          { status: 200, headers: { "Content-Type": "text/event-stream" } },
        ),
      ),
    );

    const events = await collect("Give me the next-game briefing.");
    const done = events.at(-1);

    if (done?.type !== "done") {
      throw new Error("expected a done event");
    }
    expect(done.answer.confidence).toBe("low");
    expect(done.answer.freshness).toContain("failed mid-stream");
    expect(done.answer.answer).toContain("[Answer truncated");
  }, 30_000);

  it("streams guardrail answers as a single delta", async () => {
    const events = await collect("Any betting locks this week?");
    const done = events.at(-1);

    if (done?.type !== "done") {
      throw new Error("expected a done event");
    }
    expect(done.answer.mode).toBe("guardrail");
    expect(events.filter((event) => event.type === "delta")).toHaveLength(1);
  });
});
