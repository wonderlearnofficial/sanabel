import { useState } from "react";
import axios from "axios";
import { WizardStep, ImportRow, TabImportConfig, BatchResult } from "./importConfig";
import { parseImportFile, validateRows, buildBatches, isOfficialTemplate } from "./importUtils";

interface Refs {
  organizations: string[];
  classes: string[];
  grades: string[];
}

export function useImportWizard(config: TabImportConfig, refs: Refs, token: string | null) {
  const [step, setStep] = useState<WizardStep>("idle");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [officialTemplateDetected, setOfficialTemplateDetected] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("idle");
    setRows([]);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
  };

  const onFileSelected = async (file: File) => {
    setStep("parsing");
    setError(null);
    try {
      const { headers, rows: parsedRows } = await parseImportFile(file, config.officialHeaders);
      if (parsedRows.length === 0) {
        setError("No data rows found in this file.");
        setStep("idle");
        return;
      }
      setOfficialTemplateDetected(isOfficialTemplate(headers, config));
      setRows(validateRows(parsedRows, config, refs));
      setStep("reviewing");
    } catch (e: any) {
      setError(e?.message || "Could not read this file.");
      setStep("idle");
    }
  };

  const applySuggestion = (index: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.index !== index || !r.suggestion) return r;
        const data = { ...r.data, [r.suggestion.field]: r.suggestion.value };
        return { ...validateRows([data], config, refs)[0], index };
      }),
    );
  };

  const startImport = async () => {
    const batches = buildBatches(rows, config);
    if (batches.length === 0) {
      setError("No valid rows to import.");
      return;
    }
    setStep("importing");
    setProgress({ done: 0, total: batches.length });

    const aggregate: BatchResult = { successCount: 0, failureCount: 0, successfulEntries: [], failedEntries: [] };
    for (let i = 0; i < batches.length; i++) {
      const form = new FormData();
      form.append("file", batches[i], "batch.csv");
      try {
        const res = await axios.post(config.endpoint, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data as BatchResult;
        aggregate.successCount += data.successCount || 0;
        aggregate.failureCount += data.failureCount || 0;
        aggregate.successfulEntries.push(...(data.successfulEntries || []));
        aggregate.failedEntries.push(...(data.failedEntries || []));
      } catch (e: any) {
        aggregate.failureCount += 1;
        aggregate.failedEntries.push({ row: {}, error: e?.response?.data?.message || "Batch upload failed" });
      }
      setProgress({ done: i + 1, total: batches.length });
    }

    setResult(aggregate);
    setStep("done");
  };

  return {
    step, rows, officialTemplateDetected, progress, result, error,
    onFileSelected, applySuggestion, startImport, reset,
  };
}
