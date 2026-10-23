import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { requiresMissionApproval } from "./studentGameplayMode";
import StudentNavbar from "../components/navbar/StudentNavbar";

const state = vi.hoisted(() => ({ user: { organizationId: null, classId: null } as { organizationId: number | null; classId: number | null } }));
vi.mock("../context/StudentUserProvider", () => ({ useUserContext: () => state }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
vi.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: "/student/home" }) }));
vi.mock("@ionic/react", () => ({ IonRouterLink: ({ routerLink, children }: any) => <a href={routerLink}>{children}</a> }));

describe("mission approval and class feature boundaries", () => {
  it.each([
    [null, null, false, false], [2, 4, true, true],
    [2, null, true, false], [null, 4, true, true],
  ] as const)("organization=%s class=%s: approval=%s leaderboard=%s", (organizationId, classId, approval, leaderboard) => {
    state.user = { organizationId, classId };
    expect(requiresMissionApproval(state.user)).toBe(approval);
    render(<StudentNavbar />);
    expect(Boolean(screen.queryByRole("link", { name: "المتصدرين" }))).toBe(leaderboard);
  });
});
