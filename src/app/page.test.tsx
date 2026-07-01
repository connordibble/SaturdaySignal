import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the Saturday Signal product shell", () => {
    render(<Home />);

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
