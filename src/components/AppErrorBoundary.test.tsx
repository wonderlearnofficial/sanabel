import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

const BrokenScreen = () => {
  throw new Error("render failed");
};

describe("AppErrorBoundary", () => {
  it("shows a recoverable error instead of a blank screen", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenScreen />
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Error code: CLIENT_RENDER_ERROR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
