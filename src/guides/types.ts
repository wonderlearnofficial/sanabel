export type GuideAdvanceMode = "interaction" | "next-button";

export interface GuideStepConfig {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  // data-guide-id of a real element on the page. When present the overlay
  // dims everything except that element (spotlight) and anchors the tooltip
  // to it. If the element hasn't mounted yet (cross-page steps), the guide
  // waits invisibly until it appears.
  targetId?: string;
  // "interaction": advancing requires actually tapping the highlighted real
  // element — teach by doing. "next-button" (default): a Next button.
  advanceOn?: GuideAdvanceMode;
}

export type GuideRole = "Student" | "Teacher" | "Parent" | "Admin";

export interface GuideConfig {
  id: string;
  role: GuideRole;
  // Shown as the row label in the Settings replay list.
  titleKey: string;
  steps: GuideStepConfig[];
}
