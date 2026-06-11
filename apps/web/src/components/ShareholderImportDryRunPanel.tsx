"use client";

import { useState } from "react";
import {
  createShareholderImportBatch,
  dryRunShareholderImport,
  fetchShareholderImportBatches,
  revalidateShareholderImportBatch,
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

const demoRows: ShareholderImportDryRunRow[] = [
  {
    rowNumber: 2,
    shareholderCode: "DIGAF-DEMO-IMPORT-001",
    legalName: "Demo Shareholder Alpha",
    type: "individual",
    gender: "female",
    dateOfBirth: "1990-04-12",
    nationality: "Ethiopian",
    occupation: "Business owner",
    tinNumber: "TIN-DEMO-IMPORT-001",
    primaryIdNumber: "ID-DEMO-IMPORT-001",
    mobileNumber: "+251911000001",
    emailAddress: "alpha.import.demo@example.com",
    physicalAddress: "Demo address one",
    shareCertificateNumber: "CERT-DEMO-IMPORT-001",
    numberOfSharesPurchased: 1000,
    parValuePerShare: 1,
    totalInvestmentAmount: 1000,
    dateOfPurchase: "2026-01-15",
    paymentMethod: "bank_transfer",
    sourceOfFundsDeclaration: "Business profits declaration on file",
    status: "pending",
    cddCompleted: true,
    pepStatus: "clear",
    sanctionScreeningResult: "clear",
    adverseMediaScreeningResult: "clear",
    riskRating: "low",
    amlOfficerApprovalStatus: "approved",
  },
  {
    rowNumber: 3,
    shareholderCode: "DIGAF-DEMO-IMPORT-002",
    legalName: "",
    type: "individual",
    gender: "",
    dateOfBirth: "2030-02-01",
    nationality: "",
    occupation: "",
    tinNumber: "",
    primaryIdNumber: "",
    mobileNumber: "123",
    emailAddress: "not-an-email",
    physicalAddress: "",
    numberOfSharesPurchased: -50,
    parValuePerShare: 1,
    totalInvestmentAmount: -50,
    dateOfPurchase: "2026-02-20",
    paymentMethod: "",
    sourceOfFundsDeclaration: "",
    cddCompleted: "",
    pepStatus: "",
    sanctionScreeningResult: "",
    adverseMediaScreeningResult: "",
    riskRating: "unknown",
    amlOfficerApprovalStatus: "",
  },
  {
    rowNumber: 4,
    shareholderCode: "DIGAF-DEMO-IMPORT-003",
    legalName: "Demo Shareholder Gamma",
    type: "individual",
    gender: "male",
    dateOfBirth: "1986-08-25",
    nationality: "Ethiopian",
    occupation: "Investor",
    tinNumber: "TIN-DEMO-IMPORT-001",
    primaryIdNumber: "ID-DEMO-IMPORT-003",
    mobileNumber: "+251911000003",
    emailAddress: "gamma.import.demo@example.com",
    physicalAddress: "Demo address three",
    shareCertificateNumber: "CERT-DEMO-IMPORT-003",
    numberOfSharesPurchased: 500,
    parValuePerShare: 1,
    totalInvestmentAmount: 750,
    dateOfPurchase: "2026-01-20",
    paymentMethod: "bank_transfer",
    sourceOfFundsDeclaration: "Savings declaration on file",
    status: "pending",
    cddCompleted: true,
    pepStatus: "clear",
    sanctionScreeningResult: "clear",
    adverseMediaScreeningResult: "clear",
    riskRating: "medium",
    amlOfficerApprovalStatus: "pending",
  },
];

function summaryCards(result: ShareholderImportDryRunResult) {
  return [
    ["Rows", result.summary.totalRows],
    ["Ready", result.summary.readyRows],
    ["Warnings", result.summary.warningRows],
    ["Blocked", result.summary.blockedRows],
    ["Errors", result.summary.errorCount],
    ["Duplicate candidates", result.summary.duplicateCandidateCount],
  ];
}

function rowTone(status: string) {
  if (status === "ready") {
    return "success";
  }

  if (status === "blocked") {
    return "danger";
  }

  return "warning";
}

export function ShareholderImportDryRunPanel() {
  const [result, setResult] = useState<ShareholderImportDryRunResult | null>(
    null
  );
  const [persistedBatch, setPersistedBatch] =
    useState<ShareholderImportBatchDetail | null>(null);
  const [batches, setBatches] = useState<ShareholderImportBatch[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDryRun() {
    setIsRunning(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await dryRunShareholderImport({ rows: demoRows }, token);

      setResult(response.data);
    } catch (dryRunError) {
      setResult(null);
      setError(
        dryRunError instanceof Error
          ? dryRunError.message
          : "Failed to run shareholder import dry-run"
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function persistDemoBatch() {
    setIsPersisting(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await createShareholderImportBatch(
        {
          confirmNoProductionData: true,
          sourceFilename: "stage-75-demo-import-payload.json",
          rows: demoRows,
        },
        token
      );

      setPersistedBatch(response.data);
      await loadBatches();
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Failed to persist demo import batch"
      );
    } finally {
      setIsPersisting(false);
    }
  }

  async function loadBatches() {
    setIsLoadingBatches(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await fetchShareholderImportBatches(token);
      setBatches(response.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load persisted import batches"
      );
    } finally {
      setIsLoadingBatches(false);
    }
  }

  async function revalidatePersistedBatch() {
    if (!persistedBatch) {
      return;
    }

    setIsPersisting(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const response = await revalidateShareholderImportBatch(
        persistedBatch.batch.id,
        { confirmNoProductionData: true },
        token
      );

      setPersistedBatch(response.data);
      await loadBatches();
    } catch (revalidateError) {
      setError(
        revalidateError instanceof Error
          ? revalidateError.message
          : "Failed to revalidate persisted import batch"
      );
    } finally {
      setIsPersisting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-slate-900">
              Demo Dry-Run Validation
            </h2>
            <p className="mt-2 max-w-3xl break-words text-sm text-slate-600">
              Runs three fake sample rows through the Stage 72 validator. This
              does not upload Excel files and does not write to the database.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runDryRun}
              disabled={isRunning}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRunning ? "Running..." : "Run demo dry-run"}
            </button>
            <button
              type="button"
              onClick={persistDemoBatch}
              disabled={isPersisting}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isPersisting ? "Saving..." : "Persist demo batch"}
            </button>
            <button
              type="button"
              onClick={loadBatches}
              disabled={isLoadingBatches}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isLoadingBatches ? "Loading..." : "Refresh batches"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            Demo data only
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            No database commit
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            Auth: Supabase JWT
          </span>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        ) : null}
      </section>

      {persistedBatch ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-slate-900">
                Persisted Demo Batch
              </h2>
              <p className="mt-2 max-w-3xl break-words text-sm text-slate-600">
                Batch ID:{" "}
                <span className="font-mono text-xs">
                  {persistedBatch.batch.id}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={persistedBatch.batch.batch_status} />
              <button
                type="button"
                onClick={revalidatePersistedBatch}
                disabled={isPersisting}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Revalidate
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Rows
              </p>
              <p className="mt-2 text-2xl font-bold">
                {persistedBatch.rows.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Messages
              </p>
              <p className="mt-2 text-2xl font-bold">
                {persistedBatch.messages.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Events
              </p>
              <p className="mt-2 text-2xl font-bold">
                {persistedBatch.events.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Dry-run only
              </p>
              <p className="mt-2 text-2xl font-bold">
                {persistedBatch.batch.dry_run_only ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {batches.length > 0 ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Recent Persisted Batches
          </h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Batch
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">Rows</th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Errors
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Warnings
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="break-all border-b border-slate-100 px-4 py-3 font-mono text-xs">
                      <a
                        href={`/imports/batches/${batch.id}`}
                        className="text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-600"
                      >
                        {batch.id}
                      </a>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      <StatusBadge status={batch.batch_status} />
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {batch.row_count ?? "0"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {batch.error_count ?? "0"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3">
                      {batch.warning_count ?? "0"}
                    </td>
                    <td className="break-words border-b border-slate-100 px-4 py-3">
                      {batch.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {summaryCards(result).map(([label, value]) => (
              <article
                key={label}
                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <p className="break-words text-xs font-semibold uppercase text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {value}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Row Results
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Mapping version: {result.mappingVersion}
                </p>
              </div>
              <StatusBadge
                status={result.summary.blockedRows > 0 ? "warning" : "passed"}
                label={
                  result.summary.blockedRows > 0
                    ? "Review required"
                    : "Ready for review"
                }
                tone={result.summary.blockedRows > 0 ? "warning" : "success"}
              />
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">Row</th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Shareholder
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Errors
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Warnings
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => {
                    const errors = row.messages.filter(
                      (message) => message.severity === "error"
                    );
                    const warnings = row.messages.filter(
                      (message) => message.severity === "warning"
                    );

                    return (
                      <tr key={row.rowNumber}>
                        <td className="border-b border-slate-100 px-4 py-3 font-semibold">
                          {row.rowNumber}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <div className="space-y-1">
                            <p className="break-words font-medium text-slate-900">
                              {row.normalized.legalName || "Missing name"}
                            </p>
                            <p className="break-words text-xs text-slate-500">
                              {row.normalized.shareholderCode || "No code"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <StatusBadge
                            status={row.status}
                            tone={rowTone(row.status)}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {errors.length}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          {warnings.length}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <details>
                            <summary className="cursor-pointer font-semibold text-slate-700">
                              Messages
                            </summary>
                            {row.messages.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {row.messages.map((message) => (
                                  <div
                                    key={`${message.field}-${message.code}-${message.message}`}
                                    className={`rounded-xl px-3 py-2 text-xs ring-1 ${
                                      message.severity === "error"
                                        ? "bg-rose-50 text-rose-800 ring-rose-200"
                                        : "bg-amber-50 text-amber-900 ring-amber-200"
                                    }`}
                                  >
                                    <p className="break-words font-semibold">
                                      {message.field}: {message.message}
                                    </p>
                                    <p className="mt-1 break-words">
                                      {message.suggestedAction}
                                    </p>
                                    <p className="mt-1 font-semibold">
                                      Owner: {message.responsibleRole}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-slate-500">
                                No validation messages.
                              </p>
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

          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Field Mapping Returned by API
            </h2>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Excel header
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      API field
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Target
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.fieldMapping.map((field) => (
                    <tr key={field.field}>
                      <td className="break-words border-b border-slate-100 px-4 py-3">
                        {field.excelHeader}
                      </td>
                      <td className="break-words border-b border-slate-100 px-4 py-3 font-mono text-xs">
                        {field.field}
                      </td>
                      <td className="break-words border-b border-slate-100 px-4 py-3">
                        {field.target}
                      </td>
                      <td className="break-words border-b border-slate-100 px-4 py-3">
                        {String(field.required)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
