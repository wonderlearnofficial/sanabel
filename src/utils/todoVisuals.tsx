import type { ReactNode } from "react";
import {
  FaUsers,
  FaListUl,
  FaRegClock,
  FaHourglassHalf,
  FaRegCheckCircle,
  FaUser,
  FaChalkboardTeacher,
  FaUserFriends,
  FaLayerGroup,
} from "react-icons/fa";

// Centralized visual identity for the Student To-Do page. Icons and tints are
// defined once here so cards, chips, tabs and sheets can never drift apart.
// Colors stay in the app's existing palette: blue = primary/self,
// teal = teacher, amber = parent/pending, purple = multiple, green = done.

// The four real Sanabel catalogue category tints, keyed by TaskCategories.id.
// A mission's icon comes from its task type asset, not a generic category icon.
const CATEGORY_VISUALS = [
  { chip: "bg-blue-50 text-blueprimary" },
  { chip: "bg-red-50 text-redprimary" },
  { chip: "bg-amber-50 text-yellowprimary" },
  { chip: "bg-emerald-50 text-greenprimary" },
];

export const getCategoryVisual = (categoryId: number | undefined) =>
  CATEGORY_VISUALS[(((categoryId || 1) - 1) % CATEGORY_VISUALS.length + CATEGORY_VISUALS.length) % CATEGORY_VISUALS.length];

export type TodoStatusKey = "active" | "pending" | "completed" | "all";

const STATUS_VISUALS: Record<TodoStatusKey, { icon: ReactNode; iconClass: string }> = {
  all: { icon: <FaListUl size={11} aria-hidden="true" />, iconClass: "text-blueprimary" },
  active: { icon: <FaRegClock size={11} aria-hidden="true" />, iconClass: "text-blue-400" },
  pending: { icon: <FaHourglassHalf size={11} aria-hidden="true" />, iconClass: "text-amber-500" },
  completed: { icon: <FaRegCheckCircle size={11} aria-hidden="true" />, iconClass: "text-green-600" },
};

export const getStatusVisual = (status: TodoStatusKey) => STATUS_VISUALS[status];

export type TodoSourceVisualKey = "all" | "self" | "teacher" | "parent" | "multi";

const SOURCE_VISUALS: Record<
  TodoSourceVisualKey,
  { icon: ReactNode; iconClass: string; triggerClass: string }
> = {
  all: {
    icon: <FaLayerGroup size={11} aria-hidden="true" />,
    iconClass: "text-gray-500",
    triggerClass: "bg-gray-100 text-gray-700",
  },
  self: {
    icon: <FaUser size={11} aria-hidden="true" />,
    iconClass: "text-blueprimary",
    triggerClass: "bg-blue-50 text-blueprimary",
  },
  teacher: {
    icon: <FaChalkboardTeacher size={12} aria-hidden="true" />,
    iconClass: "text-teal-600",
    triggerClass: "bg-teal-50 text-teal-700",
  },
  parent: {
    icon: <FaUserFriends size={12} aria-hidden="true" />,
    iconClass: "text-orange-500",
    triggerClass: "bg-orange-50 text-orange-600",
  },
  multi: {
    icon: <FaUsers size={12} aria-hidden="true" />,
    iconClass: "text-purple-500",
    triggerClass: "bg-purple-50 text-purple-600",
  },
};

export const getSourceVisual = (kind: TodoSourceVisualKey) => SOURCE_VISUALS[kind];
