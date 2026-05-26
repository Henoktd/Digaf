"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createShareholder } from "@/src/lib/api";

const actorId = "henok.local_dev";

type ShareholderType = "individual" | "institution";
type KycStatus = "not_started" | "pending" | "verified" | "expired";
type RiskClassification = "low" | "medium" | "high";

type CreateShareholderFormProps = {
  entityId: string | null;
};

type FormState = {
  legalName: string;
  type: ShareholderType;
  email: string;
  phone: string;
  kycStatus: KycStatus;
  kycExpiry: string;
  riskClassification: RiskClassification;
  proxyEligible: boolean;
  relationshipStartDate: string;
};

const initialFormState: FormState = {
  legalName: "",
  type: "individual",
  email: "",
  phone: "",
  kycStatus: "not_started",
  kycExpiry: "",
  riskClassification: "low",
  proxyEligible: false,
  relationshipStartDate: "",
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const labelClass = "space-y-2 text-sm font-semibold text-slate-700";

export function CreateShareholderForm({
  entityId,
}: CreateShareholderFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!entityId) {
      setError("No governance entity is available for shareholder creation.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await createShareholder({
        entityId,
        legalName: formState.legalName.trim(),
        type: formState.type,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        kycStatus: formState.kycStatus,
        kycExpiry: formState.kycExpiry || undefined,
        riskClassification: formState.riskClassification,
        proxyEligible: formState.proxyEligible,
        relationshipStartDate: formState.relationshipStartDate || undefined,
        actorId,
      });

      setFormState(initialFormState);
      setMessage("Shareholder created. Registry refreshed.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create shareholder"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Create Shareholder
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a controlled shareholder master record to the governance ledger.
          </p>
        </div>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          Actor: {actorId}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className={labelClass}>
          Legal name
          <input
            value={formState.legalName}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                legalName: event.target.value,
              }))
            }
            required
            className={fieldClass}
            placeholder="Shareholder legal name"
          />
        </label>

        <label className={labelClass}>
          Type
          <select
            value={formState.type}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                type: event.target.value as ShareholderType,
              }))
            }
            className={fieldClass}
          >
            <option value="individual">Individual</option>
            <option value="institution">Institution</option>
          </select>
        </label>

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
          Email
          <input
            type="email"
            value={formState.email}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="name@example.com"
          />
        </label>

        <label className={labelClass}>
          Phone
          <input
            value={formState.phone}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="+251..."
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
          Relationship start date
          <input
            type="date"
            value={formState.relationshipStartDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                relationshipStartDate: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={formState.proxyEligible}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                proxyEligible: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          Proxy eligible
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !entityId}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Creating..." : "Create shareholder"}
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
