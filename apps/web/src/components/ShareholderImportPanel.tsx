"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  createShareholderImportBatch,
  dryRunShareholderImport,
  fetchShareholderImportBatches,
  type ShareholderImportBatch,
  type ShareholderImportBatchDetail,
  type ShareholderImportDryRunResult,
  type ShareholderImportDryRunRow,
} from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";
import { StatusBadge } from "@/src/components/StatusBadge";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return token;
}

const EXCEL_HEADER_MAP: Record<string, keyof ShareholderImportDryRunRow> = {
  "Shareholder ID": "shareholderCode",
  "Full Name": "legalName",
  "Type": "type",
  "Gender": "gender",
  "Date of Birth": "dateOfBirth",
  "Nationality": "nationality",
  "Occupation": "occupation",
  "TIN Number": "tinNumber",
  "National ID / Passport Number": "primaryIdNumber",
  "Mobile Number": "mobileNumber",
  "Email Address": "emailAddress",
  "Physical Address": "physicalAddress",
  "Share Certificate Number": "shareCertificateNumber",
  "Number of Shares Purchased": "numberOfSharesPurchased",
  "Par Value Per Share": "parValuePerShare",
  "Total Investment Amount": "totalInvestmentAmount",
  "Date of Purchase": "dateOfPurchase",
  "Payment Method": "paymentMethod",
  "Source of Funds Declaration": "sourceOfFundsDeclaration",
  "CDD Completed": "cddCompleted",
  "PEP Status": "pepStatus",
  "Sanction Screening Result": "sanctionScreeningResult",
  "Adverse Media Screening Result": "adverseMediaScreeningResult",
  "Risk Rating": "riskRating",
  "AML Officer Approval": "amlOfficerApprovalStatus",
};

const REQUIRED_COLUMNS = ["Full Name", "Number of Shares Purchased", "Date of Purchase"];

function parseExcelFile(file: File): Promise<{ rows: ShareholderImportDryRunRow[]; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("The file contains no sheets.");
        const sheet = workbook.Sheets[sheetName];

        const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])[0] ?? [];
        const fileHeaders = headerRow.map(String);
        const missing = REQUIRED_COLUMNS.filter((col) => !fileHeaders.includes(col));
        if (missing.length > 0) {
          throw new Error(
            `Missing required columns: ${missing.join(", ")}. ` +
              `Download the template to ensure the correct column headers are used.`
          );
        }

        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
          defval: null,
        });

        const rows: ShareholderImportDryRunRow[] = rawRows.map((raw, index) => {
          const mapped: Record<string, unknown> = { rowNumber: index + 2 };

          for (const [excelHeader, apiField] of Object.entries(EXCEL_HEADER_MAP)) {
            if (excelHeader in raw) {
              mapped[apiField] = raw[excelHeader];
            }
          }

          for (const [key, value] of Object.entries(raw)) {
            if (!(key in EXCEL_HEADER_MAP)) {
              const camelKey = key.charAt(0).toLowerCase() + key.slice(1).replace(/\s+./g, (m) => m.trim().toUpperCase());
              if (!(camelKey in mapped)) {
                mapped[camelKey] = value;
              }
            }
          }

          return mapped as unknown as ShareholderImportDryRunRow;
        });

        resolve({ rows, filename: file.name });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function rowTone(status: string) {
  if (status === "ready") return "success";
  if (status === "blocked") return "danger";
  return "warning";
}

export function ShareholderImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ShareholderImportDryRunRow[]>([]);
  const [sourceFilename, setSourceFilename] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);

  const [result, setResult] = useState<ShareholderImportDryRunResult | null>(null);
  const [persistedBatch, setPersistedBatch] = useState<ShareholderImportBatchDetail | null>(null);
  const [batches, setBatches] = useState<ShareholderImportBatch[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setResult(null);
    setPersistedBatch(null);

    parseExcelFile(file)
      .then(({ rows, filename }) => {
        setParsedRows(rows);
        setSourceFilename(filename);
      })
      .catch((err) => {
        setParsedRows([]);
        setParseError(err instanceof Error ? err.message : "Failed to parse file");
      });
  }

  function downloadTemplate() {
    const headers = Object.keys(EXCEL_HEADER_MAP);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shareholders");
    XLSX.writeFile(wb, "digaf-shareholder-import-template.xlsx");
  }

  function clearFile() {
    setParsedRows([]);
    setSourceFilename("");
    setParseError(null);
    setResult(null);
    setPersistedBatch(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function runValidation() {
    if (parsedRows.length === 0) return;
    setIsRunning(true);
    setActionError(null);
    try {
      const token = await getAccessToken();
      const response = await dryRunShareholderImport({ rows: parsedRows }, token);
      setResult(response.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsRunning(false);
    }
  }

  async function persistBatch() {
    if (parsedRows.length === 0) return;
    setIsPersisting(true);
    setActionError(null);
    try {
      const token = await getAccessToken();
      const response = await createShareholderImportBatch(
        {
          confirmNoProductionData: true,
          sourceFilename: sourceFilename || "shareholder-import.xlsx",
          rows: parsedRows,
        },
        token
      );
      setPersistedBatch(response.data);
      await loadBatches();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to persist batch");
    } finally {
      setIsPersisting(false);
    }
  }

  async function loadBatches() {
    setIsLoadingBatches(true);
    try {
      const token = await getAccessToken();
      const response = await fetchShareholderImportBatches(token);
      setBatches(response.data);
    } catch {
      // silently fail on background load
    } finally {
      setIsLoadingBatches(false);
    }
  }

  const hasRows = parsedRows.length > 0;
  const hasBlockers = (result?.summary.blockedRows ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Upload panel */}
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Upload File</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload an Excel file (.xlsx, .xls) or CSV. Column headers must match the Digaf field
            mapping. The first row is treated as the header row.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Shareholder import file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Download template
          </button>

          {hasRows && (
            <button
              type="button"
              onClick={clearFile}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        {parseError && (
          <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            {parseError}
          </p>
        )}

        {hasRows && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {parsedRows.length} rows loaded from {sourceFilename}
            </span>
            <button
              type="button"
              onClick={runValidation}
              disabled={isRunning}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRunning ? "Validating..." : "Run validation"}
            </button>
            {result && (
              <button
                type="button"
                onClick={persistBatch}
                disabled={isPersisting}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isPersisting ? "Saving..." : hasBlockers ? "Persist batch (blocked rows)" : "Persist batch"}
              </button>
            )}
          </div>
        )}

        {actionError && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            {actionError}
          </p>
        )}
      </section>

      {/* Field mapping reference */}
      <details className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Expected Excel column headers ({Object.keys(EXCEL_HEADER_MAP).length} columns)
        </summary>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.keys(EXCEL_HEADER_MAP).map((header) => (
            <span
              key={header}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
            >
              {header}
            </span>
          ))}
        </div>
      </details>

      {/* Persisted batch summary */}
      {persistedBatch && (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Batch persisted</h2>
              <p className="mt-1 font-mono text-xs text-slate-500">{persistedBatch.batch.id}</p>
            </div>
            <StatusBadge status={persistedBatch.batch.batch_status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/imports/batches/${persistedBatch.batch.id}`}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Open batch
            </a>
          </div>
        </section>
      )}

      {/* Validation results */}
      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              ["Rows", result.summary.totalRows],
              ["Ready", result.summary.readyRows],
              ["Warnings", result.summary.warningRows],
              ["Blocked", result.summary.blockedRows],
              ["Errors", result.summary.errorCount],
              ["Duplicates", result.summary.duplicateCandidateCount],
            ].map(([label, value]) => (
              <article
                key={String(label)}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Validation Results</h2>
              <StatusBadge
                status={hasBlockers ? "warning" : "passed"}
                label={hasBlockers ? "Review required" : "Ready for review"}
                tone={hasBlockers ? "warning" : "success"}
              />
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Row</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Errors</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warnings</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => {
                    const errors = row.messages.filter((m) => m.severity === "error");
                    const warnings = row.messages.filter((m) => m.severity === "warning");
                    return (
                      <tr key={row.rowNumber}>
                        <td className="border-b border-slate-100 px-4 py-3 font-semibold">{row.rowNumber}</td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <p className="break-words font-medium text-slate-900">
                            {row.normalized.legalName || "Missing name"}
                          </p>
                          <p className="break-words text-xs text-slate-500">
                            {row.normalized.shareholderCode || "No code"}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <StatusBadge status={row.status} tone={rowTone(row.status)} />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">{errors.length}</td>
                        <td className="border-b border-slate-100 px-4 py-3">{warnings.length}</td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <details>
                            <summary className="cursor-pointer font-semibold text-slate-700">
                              {row.messages.length === 0 ? "No issues" : `${row.messages.length} message${row.messages.length === 1 ? "" : "s"}`}
                            </summary>
                            {row.messages.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {row.messages.map((msg) => (
                                  <div
                                    key={`${msg.field}-${msg.code}-${msg.message}`}
                                    className={`rounded-xl px-3 py-2 text-xs ring-1 ${
                                      msg.severity === "error"
                                        ? "bg-rose-50 text-rose-800 ring-rose-200"
                                        : "bg-amber-50 text-amber-900 ring-amber-200"
                                    }`}
                                  >
                                    <p className="break-words font-semibold">
                                      {msg.field}: {msg.message}
                                    </p>
                                    <p className="mt-1 break-words">{msg.suggestedAction}</p>
                                    <p className="mt-1 font-semibold">Owner: {msg.responsibleRole}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Batch list */}
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Import Batches</h2>
          <button
            type="button"
            onClick={loadBatches}
            disabled={isLoadingBatches}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
          >
            {isLoadingBatches ? "Loading..." : "Refresh"}
          </button>
        </div>

        {batches.length > 0 ? (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">File</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Rows</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Errors</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Warnings</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <a
                        href={`/imports/batches/${batch.id}`}
                        className="break-words font-mono text-xs text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-600"
                      >
                        {batch.source_filename ?? batch.id}
                      </a>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge status={batch.batch_status} />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">{batch.row_count ?? 0}</td>
                    <td className="border-b border-slate-100 px-4 py-3">{batch.error_count ?? 0}</td>
                    <td className="border-b border-slate-100 px-4 py-3">{batch.warning_count ?? 0}</td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                      {batch.created_at
                        ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(batch.created_at))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No import batches yet.</p>
        )}
      </section>
    </div>
  );
}
