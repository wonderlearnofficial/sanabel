import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentChallenges from "./StudentChallenges";

const state = vi.hoisted(() => ({ user: { id: 1, classId: 4 } as any }));

vi.mock("./StudentToDoList", () => ({ default: () => <div>persistent-todo-workspace</div> }));
vi.mock("./challenges/ChooseSanabelType", () => ({ default: () => <div>legacy-school-catalog-workspace</div> }));
vi.mock("../../components/navbar/StudentNavbar", () => ({ default: () => <nav>student-nav</nav> }));
vi.mock("../../context/StudentUserProvider", () => ({ useUserContext: () => ({ user: state.user }) }));
vi.mock("../../guides/useAutoStartGuide", () => ({ useAutoStartGuide: vi.fn() }));

describe("Student mission workspace", () => {
  beforeEach(() => { state.user = { id: 1, classId: 4 }; });

  it("routes a School Student to the persistent To-Do workspace", () => {
    render(<StudentChallenges />);
    expect(screen.getByText("persistent-todo-workspace")).toBeInTheDocument();
    expect(screen.queryByText("legacy-school-catalog-workspace")).not.toBeInTheDocument();
  });

  it("preserves the same To-Do entry point for a Solo User", () => {
    state.user = { id: 1, classId: null };
    render(<StudentChallenges />);
    expect(screen.getByText("persistent-todo-workspace")).toBeInTheDocument();
  });
});
