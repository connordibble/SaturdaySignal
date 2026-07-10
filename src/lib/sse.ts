export type SseMessage = {
  event: string;
  data: string;
};

// Minimal Server-Sent Events reader for fetch() response bodies. Yields each
// event as soon as its terminating blank line arrives so streamed deltas
// render incrementally.
export async function* readSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseMessage, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const message = parseSseMessage(rawEvent);
        if (message) {
          yield message;
        }

        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseMessage(rawEvent: string): SseMessage | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return { event, data: dataLines.join("\n") };
}
