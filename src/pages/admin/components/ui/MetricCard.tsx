import React from "react";
import { RADIUS, SHADOW, STATUS, StatusTone, SURFACE, TEXT, cx } from "../../theme";

export interface MetricCardProps {
  label: string;
  /**
   * The figure. Pass `null` for a value that is genuinely unknown — it renders
   * an em dash. Never pass 0 to stand in for "no data": the platform stores no
   * history for several metrics (XP issued, Snabel spent, emails sent), and a 0
   * there would be a fabricated measurement.
   */
  value: number | string | null | undefined;
  /** Supporting line: the reason a value is unknown, or a denominator. */
  hint?: string;
  icon?: React.ReactNode;
  /** Icon tint. Purely decorative — it does not encode the value. */
  tone?: StatusTone;
  /** Shows a skeleton in place of the value. */
  loading?: boolean;
  className?: string;
}

const formatValue = (value: MetricCardProps["value"]): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : "—";
  }
  return value;
};

/** A single KPI figure. The dashboard's unit of measurement. */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  loading = false,
  className,
}) => (
  <div
    className={cx(
      "flex items-start gap-3 p-4 min-w-0",
      SURFACE.card,
      RADIUS.md,
      SHADOW.card,
      className,
    )}
  >
    {icon && (
      <span
        className={cx(
          "flex items-center justify-center w-9 h-9 shrink-0 border",
          RADIUS.sm,
          STATUS[tone].tint,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className={cx(TEXT.muted, "mb-1.5 truncate")}>{label}</p>
      {loading ? (
        <div className="w-16 h-6 rounded bg-slate-100 animate-pulse" />
      ) : (
        <p className={TEXT.metric}>{formatValue(value)}</p>
      )}
      {hint && <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  </div>
);
