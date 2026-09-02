import React from "react";
import { CONTROL, RADIUS, STATUS, StatusTone, cx } from "../../theme";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: cx(CONTROL.heightSm, "px-3 text-xs"),
  md: cx(CONTROL.height, "px-3.5 text-xs"),
  lg: cx(CONTROL.heightLg, "px-5 text-sm"),
};

const TONE: Record<Variant, string> = {
  primary: "text-white",
  secondary: CONTROL.buttonGhost,
  quiet: CONTROL.buttonQuiet,
  danger: STATUS.danger.solid,
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Leading icon. Sits at the inline start, so it flips with RTL. */
  icon?: React.ReactNode;
  /** Trailing icon, e.g. a menu chevron. */
  trailingIcon?: React.ReactNode;
  /** Fills the container instead of hugging its content. */
  block?: boolean;
}

/**
 * The panel's button. Height, radius, focus ring and disabled treatment come
 * from `CONTROL`, so a button always lines up with an input beside it.
 *
 * `primary` paints itself with the Sanabel brand colour via inline style —
 * Tailwind cannot generate a class for a value that lives in `theme.ts`.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  icon,
  trailingIcon,
  block = false,
  className,
  children,
  style,
  ...rest
}) => (
  <button
    type={rest.type ?? "button"}
    className={cx(
      "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors",
      RADIUS.sm,
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      SIZE_CLASS[size],
      TONE[variant],
      block && "w-full",
      className,
    )}
    style={
      variant === "primary"
        ? { backgroundColor: "var(--admin-primary)", ...style }
        : style
    }
    {...rest}
  >
    {icon && <span className="flex items-center shrink-0">{icon}</span>}
    {children && <span className="truncate">{children}</span>}
    {trailingIcon && (
      <span className="flex items-center shrink-0 opacity-60">{trailingIcon}</span>
    )}
  </button>
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only control needs an accessible name. */
  label: string;
  size?: Size;
  tone?: StatusTone | "plain";
}

/** Square icon-only control. `label` becomes both `aria-label` and `title`. */
export const IconButton: React.FC<IconButtonProps> = ({
  label,
  size = "md",
  tone = "plain",
  className,
  children,
  ...rest
}) => (
  <button
    type={rest.type ?? "button"}
    aria-label={label}
    title={label}
    className={cx(
      "inline-flex items-center justify-center shrink-0 transition-colors",
      RADIUS.sm,
      size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9",
      tone === "plain"
        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        : STATUS[tone].tint,
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);
