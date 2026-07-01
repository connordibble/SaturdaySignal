import { expect, test } from "@playwright/test";

test("loads the Saturday Signal shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Texas football reference deployment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Independent fan project")).toBeVisible();
});

test("loads the canonical Texas football route", async ({ page }) => {
  await page.goto("/teams/texas-football");

  await expect(page.getByRole("heading", { name: "Saturday Signal" })).toBeVisible();
  await expect(page.getByText("Configured for Texas football")).toBeVisible();
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
