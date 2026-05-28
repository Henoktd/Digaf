"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateShareholderKyc } from "@/src/lib/api";

const actorId = "henok.local_dev";

type KycStatus = "not_started" | "pending" | "verified" | "expired";
type RiskClassification = "low" | "medium" | "high";

type UpdateKycFormProps = {
  shareholderId: string;
  currentKycStatus: KycStatus;
  currentKycExpiry: string | null;
  currentRiskClassification: RiskClassification | null;
};

type FormState = {
  kycStatus: KycStatus;
  kycExpiry: string;
  riskClassification: RiskClassification;
  decisionNotes: string;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const labelClass = "space-y-2 text-sm font-semibold text-slate-700";

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function UpdateKycForm({
  shareholderId,
  currentKycStatus,
  currentKycExpiry,
  currentRiskClassification,
}: UpdateKycFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    kycStatus: currentKycStatus,
    kycExpiry: toDateInputValue(currentKycExpiry),
    riskClassification: currentRiskClassification ?? "low",
    decisionNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await updateShareholderKyc(shareholderId, {
        kycStatus: formState.kycStatus,
        kycExpiry: formState.kycExpiry || undefined,
        riskClassification: formState.riskClassification,
        decisionNotes: formState.decisionNotes.trim(),
        actorId,
      });

      setFormState((current) => ({
        ...current,
        decisionNotes: "",
      }));
      setMessage("KYC status updated. Profile refreshed.");
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update shareholder KYC"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Update KYC</h3>
          <p className="mt-1 text-sm text-slate-600">
            Record reviewed KYC status, expiry, and risk classification.
          </p>
        </div>
        <span className="max-w-full break-all rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          Actor: {actorId}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className={labelClass}>
          KYC status
          <select
            value={formState.kycStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                kycStatus: event.target.value as KycStatus,
              }))
            }
            className={fieldClass}
          >
            <option value="not_started">Not started</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="expired">Expired</option>
          </select>
        </label>

        <label className={labelClass}>
          KYC expiry date
          <input
            type="date"
            value={formState.kycExpiry}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                kycExpiry: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Risk classification
          <select
            value={formState.riskClassification}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                riskClassification: event.target.value as RiskClassification,
              }))
            }
            className={fieldClass}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Decision notes
        <textarea
          value={formState.decisionNotes}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              decisionNotes: event.target.value,
            }))
          }
          required
          rows={3}
          className={fieldClass}
          placeholder="Summarize the review decision"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Updating..." : "Update KYC"}
        </button>

        <div aria-live="polite" className="text-sm">
          {message ? (
            <span className="font-semibold text-emerald-700">{message}</span>
          ) : null}
          {error ? (
            <span className="font-semibold text-rose-700">{error}</span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
