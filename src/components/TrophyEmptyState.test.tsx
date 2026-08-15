import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import TrophyEmptyState from "./TrophyEmptyState";

afterEach(() => {
  cleanup();
});

describe("TrophyEmptyState", () => {
  it("shows a concise Arabic empty state", async () => {
    await i18n.changeLanguage("ar");
    render(<TrophyEmptyState />);

    expect(screen.getByText("لا توجد جوائز بعد")).toBeInTheDocument();
    expect(
      screen.getByText("أكمل التحديات لتحصل على جوائزك الأولى"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No trophies found. Complete challenges to earn trophies!",
      ),
    ).not.toBeInTheDocument();
  });

  it("has a polished English translation", async () => {
    await i18n.changeLanguage("en");
    render(<TrophyEmptyState />);

    expect(screen.getByText("No trophies yet")).toBeInTheDocument();
    expect(
      screen.getByText("Complete challenges to earn your first trophy."),
    ).toBeInTheDocument();
  });
});
