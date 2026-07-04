import React from "react";

interface SkeletonLoaderProps {
  cols: number;
  rowsCount?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  cols,
  rowsCount = 8,
}) => {
  return (
    <>
      {Array.from({ length: rowsCount }).map((_, rIdx) => (
        <tr
          key={rIdx}
          className="border-b border-slate-100/80 last:border-0"
        >
          <td className="px-3 py-4 w-10">
            <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
          </td>
          {Array.from({ length: cols - 1 }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-4">
              <div
                className="h-4 bg-slate-100 rounded-lg animate-pulse"
                style={{
                  width:
                    cIdx === 0
                      ? "40%"
                      : cIdx === 1
                      ? "70%"
                      : cIdx === cols - 2
                      ? "30%"
                      : "80%",
                  maxWidth: "180px",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
