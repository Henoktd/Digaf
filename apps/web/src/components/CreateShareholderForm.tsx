"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createShareholder } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";
import { fieldClass, wrapLabelClass as labelClass } from "@/src/components/ui/field";

type ShareholderType = "individual" | "institution";
type KycStatus = "not_started" | "pending" | "verified" | "expired";
type RiskClassification = "low" | "medium" | "high";

type ShareClass = {
  share_class_id: string;
  class_name: string;
  par_value: number | null;
};

type CreateShareholderFormProps = {
  entityId: string | null;
  shareClasses?: ShareClass[];
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
  addressCity: string;
  weredaKk: string;
  kebele: string;
  houseNo: string;
  shareClassId: string;
  initialShares: string;
  purchaseDate: string;
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
  addressCity: "",
  weredaKk: "",
  kebele: "",
  houseNo: "",
  shareClassId: "",
  initialShares: "",
  purchaseDate: "",
};

export function CreateShareholderForm({
  entityId,
  shareClasses = [],
}: CreateShareholderFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getAccessToken(): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Not authenticated");
    return data.session.access_token;
  }

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
      const token = await getAccessToken();
      const initialSharesParsed = formState.initialShares
        ? parseFloat(formState.initialShares)
        : undefined;

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
        addressCity: formState.addressCity.trim() || undefined,
        weredaKk: formState.weredaKk.trim() || undefined,
        kebele: formState.kebele.trim() || undefined,
        houseNo: formState.houseNo.trim() || undefined,
        shareClassId: formState.shareClassId || undefined,
        initialShares: initialSharesParsed,
        purchaseDate: formState.purchaseDate || undefined,
      }, token);

      setFormState(initialFormState);
      setMessage("Shareholder created and added to cap table.");
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

  const selectedClass = shareClasses.find(
    (sc) => sc.share_class_id === formState.shareClassId
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Create Shareholder
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a shareholder record and optionally record their initial share purchase.
          </p>
        </div>
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
          Address city
          <input
            value={formState.addressCity}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                addressCity: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="e.g. Addis Ababa"
          />
        </label>

        <label className={labelClass}>
          Wereda K.K
          <input
            value={formState.weredaKk}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                weredaKk: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="Wereda / Kifle Ketema"
          />
        </label>

        <label className={labelClass}>
          Kebele
          <input
            value={formState.kebele}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                kebele: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="e.g. 07"
          />
        </label>

        <label className={labelClass}>
          House No.
          <input
            value={formState.houseNo}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                houseNo: event.target.value,
              }))
            }
            className={fieldClass}
            placeholder="House number"
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

      {shareClasses.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Initial Share Purchase (Optional)
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className={labelClass}>
              Share class
              <select
                value={formState.shareClassId}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    shareClassId: event.target.value,
                  }))
                }
                className={fieldClass}
              >
                <option value="">— None / record shares later —</option>
                {shareClasses.map((sc) => (
                  <option key={sc.share_class_id} value={sc.share_class_id}>
                    {sc.class_name}
                    {sc.par_value != null ? ` (ETB ${sc.par_value} par)` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Number of shares purchased
              <input
                type="number"
                min="1"
                step="1"
                value={formState.initialShares}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    initialShares: event.target.value,
                  }))
                }
                disabled={!formState.shareClassId}
                className={fieldClass}
                placeholder="e.g. 100"
              />
            </label>

            <label className={labelClass}>
              Date of purchase
              <input
                type="date"
                value={formState.purchaseDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    purchaseDate: event.target.value,
                  }))
                }
                disabled={!formState.shareClassId}
                className={fieldClass}
              />
            </label>
          </div>

          {formState.shareClassId && formState.initialShares && selectedClass?.par_value != null && (
            <p className="mt-2 text-xs text-slate-500">
              Total investment:{" "}
              <span className="font-semibold text-slate-700">
                ETB {(parseFloat(formState.initialShares) * selectedClass.par_value).toLocaleString()}
              </span>
              {" "}(at par value ETB {selectedClass.par_value} × {formState.initialShares} shares)
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !entityId}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
