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
