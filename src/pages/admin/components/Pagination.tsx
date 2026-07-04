import React from "react";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface PaginationProps {
  page: number;
  setPage: (p: number) => void;
  total: number;
  limit: number;
  accentColor: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  setPage,
  total,
  limit,
  accentColor,
}) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Description text */}
      <p className="text-xs text-slate-400 font-medium">
        {t("Showing")} <span className="font-bold text-slate-600">{startItem}–{endItem}</span> {t("of")}{" "}
        <span className="font-bold text-slate-600">{total.toLocaleString()}</span> {t("results")}
      </p>

      {/* Button controls */}
      <div className="flex items-center gap-1.5" dir="ltr">
        {/* Previous page */}
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center"
        >
          <FaChevronLeft size={10} className="text-slate-500" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-2 text-slate-300 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className="text-xs font-bold w-9 h-9 rounded-xl transition-all shadow-sm flex items-center justify-center"
              style={
                page === p
                  ? {
                      backgroundColor: accentColor,
                      color: "white",
                      boxShadow: `0 2px 8px ${accentColor}25`,
                    }
                  : {
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                    }
              }
            >
              {p}
            </button>
          )
        )}

        {/* Next page */}
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center"
        >
          <FaChevronRight size={10} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
};
