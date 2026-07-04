import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUpload, FaDownload, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { IMPORT_CONFIGS } from "./importConfig";
import { useImportWizard } from "./useImportWizard";
import { buildTemplateCsv, buildExampleCsv } from "./importUtils";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  activeTab: string;
  onClose: () => void;
  onImportComplete: () => void;
  organizations: string[];
  classes: string[];
  grades: string[];
  token: string | null;
  t: (k: string) => string;
}

const ImportWizard: React.FC<Props> = ({
  open, activeTab, onClose, onImportComplete, organizations, classes, grades, token, t,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const config = IMPORT_CONFIGS[activeTab];
  const wizard = useImportWizard(config, { organizations, classes, grades }, token);

  if (!open || !config) return null;

  const handleClose = () => {
    if (wizard.step === "done" && wizard.result && wizard.result.successCount > 0) {
      onImportComplete();
    }
    wizard.reset();
    onClose();
  };

  const validCount = wizard.rows.filter((r) => r.status !== "blocked").length;
  const warningCount = wizard.rows.filter((r) => r.status === "warning").length;
  const blockedCount = wizard.rows.filter((r) => r.status === "blocked").length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="w-full max-w-2xl mx-4 overflow-hidden bg-white shadow-2xl rounded-t-3xl sm:rounded-2xl"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-indigo-600 w-9 h-9 rounded-xl bg-indigo-50">
                <FaUpload size={14} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t("admin.import.title")}</h2>
            </div>
            <button onClick={handleClose} className="p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100">
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {(wizard.step === "idle" || wizard.step === "parsing") && (
              <>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) wizard.onFileSelected(f);
                  }}
                  className="p-10 text-center transition-all border-2 border-dashed cursor-pointer rounded-2xl border-slate-200 bg-slate-50 hover:border-indigo-400"
                >
                  <FaUpload size={28} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-sm font-medium text-gray-500">
                    {wizard.step === "parsing" ? t("admin.import.reading") : t("admin.import.dropzone")}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && wizard.onFileSelected(e.target.files[0])}
                  />
                </div>
                {wizard.error && (
                  <p className="text-sm font-medium text-center text-red-600">{wizard.error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCsv(buildTemplateCsv(config), `${activeTab}_template.csv`)}
                    className="flex items-center justify-center flex-1 gap-2 py-2.5 text-sm font-medium border rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FaDownload size={12} /> {t("admin.import.downloadTemplate")}
                  </button>
                  <button
                    onClick={() => downloadCsv(buildExampleCsv(config), `${activeTab}_example.csv`)}
                    className="flex items-center justify-center flex-1 gap-2 py-2.5 text-sm font-medium border rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FaDownload size={12} /> {t("admin.import.downloadExample")}
                  </button>
                </div>
              </>
            )}

            {wizard.step === "reviewing" && (
              <>
                {wizard.officialTemplateDetected && (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 rounded-xl bg-green-50">
                    <FaCheck /> {t("admin.import.officialDetected")}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 text-center bg-green-50 rounded-xl">
                    <div className="text-xl font-bold text-green-700">{validCount}</div>
                    <div className="text-xs text-green-600">{t("admin.import.ready")}</div>
                  </div>
                  <div className="p-3 text-center bg-amber-50 rounded-xl">
                    <div className="text-xl font-bold text-amber-700">{warningCount}</div>
                    <div className="text-xs text-amber-600">{t("admin.import.warnings")}</div>
                  </div>
                  <div className="p-3 text-center bg-red-50 rounded-xl">
                    <div className="text-xl font-bold text-red-700">{blockedCount}</div>
                    <div className="text-xs text-red-600">{t("admin.import.blocked")}</div>
                  </div>
                </div>

                <div className="overflow-hidden border rounded-xl border-slate-100 max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        {config.officialHeaders.map((h) => (
                          <th key={h} className="px-3 py-2 font-semibold text-left text-slate-500">{h}</th>
                        ))}
                        <th className="px-3 py-2 font-semibold text-left text-slate-500">{t("admin.import.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wizard.rows.slice(0, 10).map((r) => (
                        <tr
                          key={r.index}
                          className={
                            r.status === "blocked" ? "bg-red-50" : r.status === "warning" ? "bg-amber-50" : ""
                          }
                        >
                          {config.officialHeaders.map((h) => (
                            <td key={h} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">{r.data[h] || "—"}</td>
                          ))}
                          <td className="px-3 py-1.5">
                            {r.issues.length === 0 ? (
                              <span className="text-green-600">{t("admin.import.ok")}</span>
                            ) : (
                              <span title={r.issues.join("; ")} className={r.status === "blocked" ? "text-red-600" : "text-amber-600"}>
                                {r.issues[0]}
                                {r.suggestion && (
                                  <button
                                    onClick={() => wizard.applySuggestion(r.index)}
                                    className="ml-2 font-semibold text-indigo-600 underline"
                                  >
                                    {t("admin.import.applySuggestion")}
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {wizard.rows.length > 10 && (
                  <p className="text-xs text-center text-slate-400">
                    {t("admin.import.previewNote")} ({wizard.rows.length})
                  </p>
                )}

                <div className="flex gap-2">
                  <button onClick={wizard.reset} className="flex-1 py-2.5 text-sm font-medium border rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                    {t("admin.import.startOver")}
                  </button>
                  <button
                    onClick={wizard.startImport}
                    disabled={validCount === 0}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
                  >
                    {t("admin.import.importN").replace("{n}", String(validCount))}
                  </button>
                </div>
              </>
            )}

            {wizard.step === "importing" && (
              <div className="py-8 text-center">
                <div className="w-full h-2 mb-4 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full bg-indigo-500"
                    animate={{ width: `${(wizard.progress.done / Math.max(1, wizard.progress.total)) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {t("admin.import.importing")} {wizard.progress.done}/{wizard.progress.total}
                </p>
              </div>
            )}

            {wizard.step === "done" && wizard.result && (
              <>
                <div className="flex items-center justify-center w-16 h-16 mx-auto text-2xl text-white bg-green-500 rounded-full">
                  <FaCheck />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <div className="text-xl font-bold text-green-700">{wizard.result.successCount}</div>
                    <div className="text-xs text-green-600">{t("admin.import.imported")}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <div className="text-xl font-bold text-red-700">{wizard.result.failureCount}</div>
                    <div className="text-xs text-red-600">{t("admin.import.failed")}</div>
                  </div>
                </div>
                {wizard.result.failedEntries.length > 0 && (
                  <button
                    onClick={() => {
                      const rows = wizard.result!.failedEntries.map((f: any) => ({ ...f.row, error: f.error }));
                      const csv = [
                        [...config.officialHeaders, "error"].join(","),
                        ...rows.map((r: any) => [...config.officialHeaders.map((h) => r[h] || ""), r.error].join(",")),
                      ].join("\n");
                      downloadCsv(csv, `${activeTab}_failed_rows.csv`);
                    }}
                    className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium border rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <FaExclamationTriangle size={12} /> {t("admin.import.downloadErrors")}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-full py-3 font-bold text-white rounded-xl"
                  style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
                >
                  {t("admin.import.done")}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportWizard;
