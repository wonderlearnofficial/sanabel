import React, { useCallback, useRef, useState } from "react";
import { RADIUS, SHADOW, cx } from "../../theme";

interface Position {
  top: number;
  left: number;
}

export interface TooltipProps {
  /** Tooltip text. When empty the wrapper is a passthrough. */
  label: string;
  /** Set false to disable, e.g. an expanded sidebar that already shows labels. */
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const GAP = 8;

/**
 * Tooltip anchored to the inline-end side of its trigger, shown on hover and on
 * keyboard focus.
 *
 * Positioned `fixed` from the trigger's bounding rect rather than absolutely
 * inside it. The collapsed sidebar rail is only 76px wide and scrolls
 * vertically, and a scroll container clips on both axes — an absolutely
 * positioned tooltip would be cut off at the rail's edge.
 *
 * Direction comes from the document `dir`, so in RTL (the panel's default) the
 * tooltip opens to the left of the rail, which is where the content area is.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  label,
  enabled = true,
  className,
  children,
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  const show = useCallback(() => {
    if (!enabled || !label) return;
    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const isRTL =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("dir") === "rtl";
    setPosition({
      top: rect.top + rect.height / 2,
      left: isRTL ? rect.left - GAP : rect.right + GAP,
    });
  }, [enabled, label]);

  const hide = useCallback(() => setPosition(null), []);

  if (!enabled || !label) return <>{children}</>;

  const isRTL =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("dir") === "rtl";

  // The wrapper must generate a box: with `display: contents`,
  // getBoundingClientRect() returns zeros and the tooltip lands at the viewport
  // origin instead of beside the trigger.
  return (
    <span
      ref={triggerRef}
      className={cx("block", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {position && (
        <span
          role="tooltip"
          className={cx(
            "fixed z-[70] px-2.5 py-1.5 pointer-events-none whitespace-nowrap",
            "text-xs font-semibold text-white bg-slate-900",
            RADIUS.sm,
            SHADOW.raised,
          )}
          style={{
            top: position.top,
            left: position.left,
            transform: isRTL
              ? "translate(-100%, -50%)"
              : "translate(0, -50%)",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
};
