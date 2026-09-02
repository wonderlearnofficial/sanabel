import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RADIUS, SHADOW, SURFACE, TEXT, cx } from "../../theme";

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Renders in danger tone, for destructive entries. */
  destructive?: boolean;
  /** Secondary line under the label. */
  hint?: string;
}

export interface MenuProps {
  /** The control that opens the menu. Receives open state so it can indicate it. */
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  items: MenuItem[];
  /** Aligns the panel's inline start or end with the trigger's. */
  align?: "start" | "end";
  /** Optional heading inside the panel. */
  title?: string;
  className?: string;
}

/**
 * Dropdown menu, used by the header for the import/export groups and the admin
 * profile. Closes on outside click, on Escape, and after a selection.
 *
 * Alignment uses logical `start`/`end`, so an end-aligned menu opens toward the
 * page centre in both LTR and the panel's default RTL.
 */
export const Menu: React.FC<MenuProps> = ({
  trigger,
  items,
  align = "end",
  title,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cx("relative", className)}>
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cx(
              "absolute z-50 mt-2 min-w-[220px] max-w-[280px] p-1.5",
              align === "end" ? "end-0" : "start-0",
              SURFACE.overlay,
              RADIUS.md,
              SHADOW.raised,
            )}
          >
            {title && (
              <p className={cx(TEXT.label, "px-2.5 pt-1.5 pb-2")}>{title}</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cx(
                  "flex items-center w-full gap-2.5 px-2.5 py-2 text-start",
                  "text-sm font-medium transition-colors",
                  RADIUS.sm,
                  item.destructive
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-100",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                )}
              >
                {item.icon && (
                  <span className="flex items-center shrink-0 text-slate-400">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                  {item.hint && (
                    <span className="block text-[11px] font-normal text-slate-400 truncate">
                      {item.hint}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
