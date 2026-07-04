import React from "react";
import { FaInbox } from "react-icons/fa";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  accentColor = "#3b82f6",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
        style={{ backgroundColor: `${accentColor}10` }}
      >
        <FaInbox size={28} style={{ color: accentColor }} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
