import { describe, expect, it } from "vitest";
import { POST } from "./route";

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  it("rejects an empty message with 400", async () => {
    const response = await POST(chatRequest({ message: "   " }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "message is required" });
  });

  it("rejects an unknown team slug with 404 instead of throwing", async () => {
    const response = await POST(
      chatRequest({ message: "next-game brief", teamSlug: "nope-football" }),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Unknown team slug: nope-football",
    });
  });

  it("answers a valid request with grounded citations", async () => {
    const response = await POST(
      chatRequest({ message: "Give me the next-game briefing.", teamSlug: "texas-football" }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      answer: string;
      citations: unknown[];
    };
    expect(body.answer).toContain("Texas State");
    expect(body.citations.length).toBeGreaterThanOrEqual(2);
  });
});
