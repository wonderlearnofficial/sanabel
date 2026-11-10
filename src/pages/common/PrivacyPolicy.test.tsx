import { describe, expect, it, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PrivacyPolicy from "./PrivacyPolicy";

describe("public PrivacyPolicy page", () => {
  beforeEach(() => localStorage.clear());

  it("renders in Arabic when Arabic is the saved language, with contact and deletion links", () => {
    localStorage.setItem("language", "ar");
    render(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("سياسة الخصوصية لتطبيق سنابل الإحسان");
    expect(document.querySelector("main")?.getAttribute("dir")).toBe("rtl");
    expect(document.querySelector('a[href="/delete-account"]')).not.toBeNull();
    expect(document.querySelector('a[href="mailto:emohamed@wonderlearn.com.eg"]')).not.toBeNull();
  });

  it("switches to English and covers what Play reviewers look for", () => {
    localStorage.setItem("language", "ar");
    render(<PrivacyPolicy />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(document.querySelector("main")?.getAttribute("dir")).toBe("ltr");
    for (const heading of ["Data we collect", "Children", "Retention and deletion", "Contact us"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeDefined();
    }
    expect(screen.getByText(/does not send your location to our servers/)).toBeDefined();
  });

  it("opens in English when the saved language is English", () => {
    localStorage.setItem("language", "en");
    render(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Sanabel Al Ehsan privacy policy");
  });
});
