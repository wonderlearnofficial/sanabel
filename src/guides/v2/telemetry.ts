import { TutorialTelemetryEvent } from "./types";

// Event contract only. Phase 1 ships a no-op sink: no new provider, no network
// call, no PII. A later phase can register a real sink once product agrees what
// the analytics surface is.
//
// Rules that hold regardless of sink:
//   * preview and impersonated sessions emit nothing
//   * payloads carry ids, versions and counts — never copy, names or emails

export interface TutorialTelemetryPayload {
  guideId?: string;
  version?: number;
  stepId?: string;
  stepIndex?: number;
  experience?: string;
  trigger?: "auto" | "replay" | "handoff";
  reason?: string;
  placement?: string;
  tier?: number;
  durationMs?: number;
  hasOrganization?: boolean;
  hasClass?: boolean;
}

export type TutorialTelemetrySink = (
  event: TutorialTelemetryEvent,
  payload: TutorialTelemetryPayload,
) => void;

let sink: TutorialTelemetrySink | null = null;

export const setTutorialTelemetrySink = (next: TutorialTelemetrySink | null): void => {
  sink = next;
};

export interface EmitOptions {
  /** Preview and impersonated sessions must not reach a production sink. */
  suppressed?: boolean;
}

export const emitTutorialEvent = (
  event: TutorialTelemetryEvent,
  payload: TutorialTelemetryPayload = {},
  options: EmitOptions = {},
): void => {
  if (options.suppressed) return;
  if (!sink) return;
  try {
    sink(event, payload);
  } catch {
    // Telemetry can never break a tutorial step.
  }
};
