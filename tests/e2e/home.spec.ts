import { expect, test } from "@playwright/test";

test("loads the Saturday Signal shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Texas football reference deployment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Independent fan project")).toBeVisible();
  await expect(page.getByText("First six-game stretch")).toBeVisible();
});

test("loads the canonical Texas football route", async ({ page }) => {
  await page.goto("/teams/texas-football");

  await expect(page.getByRole("heading", { name: "Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Grounded assistant")).toBeVisible();
});

test("health and ingest APIs respond", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const healthBody = (await health.json()) as {
    ok: boolean;
    enabledTeams: string[];
  };
  expect(healthBody.ok).toBe(true);
  expect(healthBody.enabledTeams).toEqual(["texas-football"]);

  const ingest = await request.post("/api/ingest", {
    data: { teamSlug: "texas-football" },
  });
  expect(ingest.ok()).toBe(true);
  const ingestBody = (await ingest.json()) as {
    teamSlug: string;
    documentCount: number;
  };
  expect(ingestBody.teamSlug).toBe("texas-football");
  expect(ingestBody.documentCount).toBe(14);
});

test("chat API returns grounded citations", async ({ request }) => {
  const response = await request.post("/api/chat", {
    data: {
      teamSlug: "texas-football",
      message: "Give me the next-game briefing.",
    },
  });

  expect(response.ok()).toBe(true);
  const body = (await response.json()) as {
    answer: string;
    citations: Array<{ title: string }>;
  };
  expect(body.answer).toContain("Texas State");
  expect(body.citations.length).toBeGreaterThanOrEqual(2);
});

test("chat API can stream server-sent events", async ({ request }) => {
  const response = await request.post("/api/chat", {
    headers: { Accept: "text/event-stream" },
    data: {
      teamSlug: "texas-football",
      message: "Give me the next-game briefing.",
    },
  });

  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("event: citations");
  expect(body).toContain("event: delta");
  expect(body).toContain("event: done");
});

test("chat UI submits a question and opens citations", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ask Saturday Signal").fill("Give me the next-game briefing.");
  await page.getByRole("button", { name: "Ask Saturday Signal" }).click();

  await expect(page.getByText("Texas opens the 2026 schedule vs Texas State")).toBeVisible();
  await expect(page.getByRole("link", { name: /Texas football 2026 schedule/i })).toBeVisible();
});
