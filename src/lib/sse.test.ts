// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readSseStream, type SseMessage } from "./sse";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(chunks: string[]): Promise<SseMessage[]> {
  const messages: SseMessage[] = [];

  for await (const message of readSseStream(streamOf(chunks))) {
    messages.push(message);
  }

  return messages;
}

describe("readSseStream", () => {
  it("parses complete events", async () => {
    const messages = await collect([
      'event: delta\ndata: {"text":"a"}\n\nevent: done\ndata: {"answer":"a"}\n\n',
    ]);

    expect(messages).toEqual([
      { event: "delta", data: '{"text":"a"}' },
      { event: "done", data: '{"answer":"a"}' },
    ]);
  });

  it("handles events split across network chunks", async () => {
    const messages = await collect([
      "event: del",
      'ta\ndata: {"text":"hel',
      'lo"}\n\nevent: done\nda',
      'ta: {"ok":true}\n\n',
    ]);

    expect(messages).toEqual([
      { event: "delta", data: '{"text":"hello"}' },
      { event: "done", data: '{"ok":true}' },
    ]);
  });

  it("joins multi-line data blocks and skips empty events", async () => {
    const messages = await collect(["event: note\ndata: line one\ndata: line two\n\n\n\n"]);

    expect(messages).toEqual([{ event: "note", data: "line one\nline two" }]);
  });
});
