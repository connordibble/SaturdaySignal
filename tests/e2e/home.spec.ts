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

test("desktop keeps the source rail compact and moves schedule out of it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only layout contract");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  // Assert the structural layout contract (chat is primary, the rail is
  // trimmed to two panels, and the schedule lives in the main column below
  // chat rather than in the rail) using relationships between elements, not
  // absolute pixel heights that break whenever copy or source counts change.
  const layout = await page.evaluate(() => {
    const chatPanel = document.querySelector('[data-testid="team-chat-panel"]');
    const sourceRail = document.querySelector('[data-testid="signal-rail"]');
    const scheduleStrip = document.querySelector('[data-testid="schedule-strip"]');

    if (!chatPanel || !sourceRail || !scheduleStrip) {
      throw new Error("Expected dashboard layout elements to be present.");
    }

    const chatRect = chatPanel.getBoundingClientRect();
    const railRect = sourceRail.getBoundingClientRect();
    const scheduleRect = scheduleStrip.getBoundingClientRect();

    return {
      railPanelCount: sourceRail.querySelectorAll("section").length,
      scheduleIsLeftOfRail: scheduleRect.left < railRect.left,
      scheduleIsBelowChat: scheduleRect.top >= chatRect.bottom - 1,
      scheduleSharesChatColumn: Math.abs(scheduleRect.left - chatRect.left) <= 1,
    };
  });

  expect(layout.railPanelCount).toBeLessThanOrEqual(2);
  expect(layout.scheduleIsLeftOfRail).toBe(true);
  expect(layout.scheduleIsBelowChat).toBe(true);
  expect(layout.scheduleSharesChatColumn).toBe(true);
});

for (const width of [1440, 768, 414, 375, 320]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    // Allow 1px for sub-pixel rounding; anything more is a real overflow.
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

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
  expect(ingestBody.documentCount).toBe(20);
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

test("chat UI streams a grounded answer with citations", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ask Saturday Signal").fill("Give me the next-game briefing.");
  await page.getByRole("button", { name: "Ask Saturday Signal" }).click();

  await expect(page.getByText("Texas opens the 2026 schedule vs Texas State")).toBeVisible();
  await expect(page.getByRole("link", { name: /Texas football 2026 schedule/i })).toBeVisible();
});

test("chat UI holds a multi-turn conversation", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ask Saturday Signal").fill("Give me the next-game briefing.");
  await page.getByRole("button", { name: "Ask Saturday Signal" }).click();
  await expect(page.getByText("Texas opens the 2026 schedule vs Texas State")).toBeVisible();

  await page.getByLabel("Ask Saturday Signal").fill("How does Ohio State look?");
  await page.getByRole("button", { name: "Ask Saturday Signal" }).click();

  await expect(page.getByText("How does Ohio State look?")).toBeVisible();
  await expect(
    page.getByText(/Ohio State in week two is the schedule's first real line-of-scrimmage test/),
  ).toBeVisible();
  await expect(page.getByText("Give me the next-game briefing.")).toBeVisible();
});
