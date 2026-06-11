"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkTransferEligibility, createTransfer } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

type Shareholder = {
  shareholder_id: string;
  entity_id: string;
  legal_name: string;
  kyc_status: string;
  risk_classification: string | null;
};

type EligibilityResult = {
  eligible: boolean;
  blockingReasons: string[];
  warnings: string[];
  availableShares: string;
  transferorKycStatus: string;
  transfereeKycStatus: string;
  transferorFreezeActive: boolean;
  transfereeFreezeActive: boolean;
  transferorLegalHoldActive: boolean;
  transfereeLegalHoldActive: boolean;
};

type CreateTransferFormProps = {
  shareholders: Shareholder[];
};

type FormState = {
  transferorId: string;
  transfereeId: string;
  shares: string;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const labelClass = "space-y-2 text-sm font-semibold text-slate-700";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatShares(value: string) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function getInitialFormState(shareholders: Shareholder[]): FormState {
  const transferorId = shareholders[0]?.shareholder_id ?? "";
  const transfereeId =
    shareholders.find(
      (shareholder) => shareholder.shareholder_id !== transferorId
    )?.shareholder_id ?? "";

  return {
    transferorId,
    transfereeId,
    shares: "",
  };
}

export function CreateTransferForm({ shareholders }: CreateTransferFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(() =>
    getInitialFormState(shareholders)
  );
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transferor = shareholders.find(
    (shareholder) => shareholder.shareholder_id === formState.transferorId
  );
  const shares = Number(formState.shares);
  const canSubmit =
    Boolean(transferor) &&
    Boolean(formState.transferorId) &&
    Boolean(formState.transfereeId) &&
    Number.isFinite(shares) &&
    shares > 0;

  async function getAccessToken(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Not authenticated");
    return data.session.access_token;
  }

  async function handleEligibilityCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEligibility(null);
    setMessage(null);
    setError(null);

    if (!canSubmit || !transferor) {
      setError("Choose two shareholders and enter a positive share amount.");
      return;
    }

    setIsChecking(true);

    try {
      const token = await getAccessToken();
      const response = await checkTransferEligibility({
        entityId: transferor.entity_id,
        transferorId: formState.transferorId,
        transfereeId: formState.transfereeId,
        shares,
      }, token) as { data: EligibilityResult };

      setEligibility(response.data);
      setMessage(
        response.data.eligible
          ? "Transfer is eligible for initiation."
          : "Transfer is blocked by eligibility rules."
      );
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : "Failed to check transfer eligibility"
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleCreateTransfer() {
    if (!eligibility?.eligible || !canSubmit || !transferor) {
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getAccessToken();
      await createTransfer({
        entityId: transferor.entity_id,
        transferorId: formState.transferorId,
        transfereeId: formState.transfereeId,
        shares,
      }, token);

      setEligibility(null);
      setFormState((current) => ({
        ...current,
        shares: "",
      }));
      setMessage("Transfer created and routed to Checker 1.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create transfer"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form
      onSubmit={handleEligibilityCheck}
      className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Initiate Transfer
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Check eligibility before routing a transfer to Checker 1.
          </p>
        </div>
        <span className="max-w-full break-all rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          Auth: Supabase JWT
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className={labelClass}>
          Transferor
          <select
            value={formState.transferorId}
            onChange={(event) => {
              setEligibility(null);
              setFormState((current) => ({
                ...current,
                transferorId: event.target.value,
              }));
            }}
            className={fieldClass}
          >
            {shareholders.map((shareholder) => (
              <option
                key={shareholder.shareholder_id}
                value={shareholder.shareholder_id}
              >
                {shareholder.legal_name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Transferee
          <select
            value={formState.transfereeId}
            onChange={(event) => {
              setEligibility(null);
              setFormState((current) => ({
                ...current,
                transfereeId: event.target.value,
              }));
            }}
            className={fieldClass}
          >
            {shareholders.map((shareholder) => (
              <option
                key={shareholder.shareholder_id}
                value={shareholder.shareholder_id}
              >
                {shareholder.legal_name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Shares
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={formState.shares}
            onChange={(event) => {
              setEligibility(null);
              setFormState((current) => ({
                ...current,
                shares: event.target.value,
              }));
            }}
            className={fieldClass}
            placeholder="0.00"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isChecking || isCreating || !canSubmit}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isChecking ? "Checking..." : "Check Eligibility"}
        </button>

        {eligibility?.eligible ? (
          <button
            type="button"
            onClick={handleCreateTransfer}
            disabled={isCreating}
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "Creating..." : "Create Transfer"}
          </button>
        ) : null}

        <div aria-live="polite" className="text-sm">
          {message ? (
            <span className="font-semibold text-slate-700">{message}</span>
          ) : null}
          {error ? (
            <span className="font-semibold text-rose-700">{error}</span>
          ) : null}
        </div>
      </div>

      {eligibility ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="text-slate-500">Eligible</p>
              <p className="font-semibold text-slate-900">
                {eligibility.eligible ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Available Shares</p>
              <p className="font-semibold text-slate-900">
                {formatShares(eligibility.availableShares)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Transferor KYC</p>
              <p className="font-semibold capitalize text-slate-900">
                {formatLabel(eligibility.transferorKycStatus)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Transferee KYC</p>
              <p className="font-semibold capitalize text-slate-900">
                {formatLabel(eligibility.transfereeKycStatus)}
              </p>
            </div>
          </div>

          {eligibility.blockingReasons.length > 0 ? (
            <div className="mt-4">
              <p className="font-semibold text-rose-800">Blocking reasons</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {eligibility.blockingReasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold capitalize text-rose-800"
                  >
                    {formatLabel(reason)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {eligibility.warnings.length > 0 ? (
            <div className="mt-4">
              <p className="font-semibold text-amber-800">Warnings</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {eligibility.warnings.map((warning) => (
                  <span
                    key={warning}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800"
                  >
                    {formatLabel(warning)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
