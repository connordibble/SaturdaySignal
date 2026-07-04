import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined),
}));

describe("Home", () => {
  it("renders the Saturday Signal product shell", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Saturday Signal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Texas football reference deployment"),
    ).toBeInTheDocument();
    expect(screen.getByText("Grounded assistant")).toBeInTheDocument();
    expect(screen.getByText("First six-game stretch")).toBeInTheDocument();
  });
});
