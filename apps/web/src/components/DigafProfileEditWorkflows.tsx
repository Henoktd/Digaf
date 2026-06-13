"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createShareholderBeneficialOwner,
  createShareholderIdentityDocument,
  updateShareholderCoreDetails,
  updateShareholderDocumentChecklist,
  updateShareholderKycProfile,
  updateShareholderNextOfKin,
  updateShareholderPaymentProfile,
  type ShareholderProfileDetails,
} from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

type PilotRole =
  | "maker"
  | "compliance_officer"
  | "checker_2"
  | "governance_admin";

const pilotRoles: {
  value: PilotRole;
  label: string;
  description: string;
}[] = [
  {
    value: "governance_admin",
    label: "Pilot admin",
    description: "Local pilot role with access to every Stage 66F workflow.",
  },
  {
    value: "maker",
    label: "Maker",
    description: "Customer Service or Governance Officer capture role.",
  },
  {
    value: "compliance_officer",
    label: "Compliance Officer",
    description: "KYC, AML, CFT, and document review role.",
  },
  {
    value: "checker_2",
    label: "Finance Checker",
    description: "Finance or payment verification role.",
  },
];

const workflowRoles = {
  core: ["maker", "governance_admin"],
  identity: ["maker", "compliance_officer", "governance_admin"],
  kyc: ["compliance_officer", "governance_admin"],
  beneficialOwner: ["maker", "compliance_officer", "governance_admin"],
  nextOfKin: ["maker", "governance_admin"],
  checklist: ["maker", "compliance_officer", "governance_admin"],
  payment: ["checker_2", "governance_admin"],
} satisfies Record<string, PilotRole[]>;

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

const labelClass = "space-y-2 text-sm font-semibold text-slate-700";

const helpTextClass = "text-xs font-medium text-slate-500";

const submitClass =
  "rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300";

function toInputValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function toOptional(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function selectToBoolean(value: string) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function booleanToSelect(value: boolean | null | undefined) {
  if (value === true) {
    return "true";
  }

  if (value === false) {
    return "false";
  }

  return "";
}

function toOptionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function validateRequired(value: string, fieldName: string) {
  return value.trim() ? null : `${fieldName} is required.`;
}

function validateEmail(value: string, fieldName: string) {
  if (!value.trim()) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : `${fieldName} must be a valid email address.`;
}

function validateDateNotFuture(value: string, fieldName: string) {
  if (!value) {
    return null;
  }

  const inputDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(inputDate.getTime())) {
    return `${fieldName} must be a valid date.`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate > today ? `${fieldName} cannot be in the future.` : null;
}

function validateDateOrder(
  startValue: string,
  endValue: string,
  fieldName: string
) {
  if (!startValue || !endValue) {
    return null;
  }

  return new Date(endValue) < new Date(startValue)
    ? `${fieldName} cannot be before the issue date.`
    : null;
}

function validateOptionalNumberRange(
  value: string,
  fieldName: string,
  min: number,
  max?: number
) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return `${fieldName} must be a valid number.`;
  }

  if (parsed < min) {
    return `${fieldName} must be at least ${min}.`;
  }

  if (max !== undefined && parsed > max) {
    return `${fieldName} must be no more than ${max}.`;
  }

  return null;
}

function SectionForm({
  title,
  description,
  actorRole,
  allowedRoles,
  children,
}: {
  title: string;
  description: string;
  actorRole: PilotRole;
  allowedRoles: PilotRole[];
  children: ReactNode;
}) {
  const canEdit = allowedRoles.includes(actorRole);

  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words font-bold text-slate-900">{title}</h3>
            <p className="mt-1 max-w-3xl break-words text-sm text-slate-600">
              {description}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {canEdit ? "Open" : "Role locked"}
          </span>
        </div>
      </summary>

      <div className="mt-5">
        {canEdit ? (
          children
        ) : (
          <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
            The selected pilot role cannot edit this section. Allowed roles:
            {" "}
            <span className="font-semibold text-slate-900">
              {allowedRoles
                .map(
                  (role) =>
                    pilotRoles.find((pilotRole) => pilotRole.value === role)
                      ?.label ?? role
                )
                .join(", ")}
            </span>
            .
          </p>
        )}
      </div>
    </details>
  );
}

function FormFooter({
  isSubmitting,
  message,
  error,
  submitLabel = "Save pilot update",
}: {
  isSubmitting: boolean;
  message: string | null;
  error: string | null;
  submitLabel?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="submit" disabled={isSubmitting} className={submitClass}>
        {isSubmitting ? "Saving..." : submitLabel}
      </button>

      <div aria-live="polite" className="min-w-0 text-sm">
        {message ? (
          <span className="break-words font-semibold text-emerald-700">
            {message}
          </span>
        ) : null}
        {error ? (
          <span className="break-words font-semibold text-rose-700">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActorNotice({ actorRole }: { actorRole: PilotRole }) {
  const roleLabel =
    pilotRoles.find((pilotRole) => pilotRole.value === actorRole)?.label ??
    actorRole;

  return (
    <p className="mb-4 max-w-full break-words rounded-xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
      Auth: <span className="font-semibold text-slate-900">Supabase JWT</span>.
      {" "}Selected pilot role:{" "}
      <span className="font-semibold text-slate-900">{roleLabel}</span>. Draft
      fields remain pending Digaf validation.
    </p>
  );
}

type SubmissionState = {
  isSubmitting: boolean;
  message: string | null;
  error: string | null;
};

function useSubmissionState() {
  return useState<SubmissionState>({
    isSubmitting: false,
    message: null,
    error: null,
  });
}

function CoreDetailsForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const core = details.core;
  const [formState, setFormState] = useState({
    shareholderCode: toInputValue(core.shareholder_code),
    gender: toInputValue(core.gender),
    dateOfBirth: toDateInputValue(core.date_of_birth),
    nationality: toInputValue(core.nationality),
    occupation: toInputValue(core.occupation),
    tinNumber: toInputValue(core.tin_number),
    primaryIdNumber: toInputValue(core.primary_id_number),
    mobileNumber: toInputValue(core.mobile_number),
    emailAddress: toInputValue(core.email_address),
    physicalAddress: toInputValue(core.physical_address),
    sourceOfFundsDeclaration: toInputValue(core.source_of_funds_declaration),
  });
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      validateDateNotFuture(formState.dateOfBirth, "Date of birth") ??
      validateEmail(formState.emailAddress, "Email address") ??
      (formState.mobileNumber.trim() && formState.mobileNumber.trim().length < 7
        ? "Mobile number must be at least 7 characters when provided."
        : null);

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await updateShareholderCoreDetails(core.shareholder_id, {
        shareholderCode: toOptional(formState.shareholderCode),
        gender: toOptional(formState.gender),
        dateOfBirth: toOptional(formState.dateOfBirth),
        nationality: toOptional(formState.nationality),
        occupation: toOptional(formState.occupation),
        tinNumber: toOptional(formState.tinNumber),
        primaryIdNumber: toOptional(formState.primaryIdNumber),
        mobileNumber: toOptional(formState.mobileNumber),
        emailAddress: toOptional(formState.emailAddress),
        physicalAddress: toOptional(formState.physicalAddress),
        sourceOfFundsDeclaration: toOptional(
          formState.sourceOfFundsDeclaration
        ),
      }, token);

      setSubmission({
        isSubmitting: false,
        message: "Core shareholder details saved. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update core details",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Shareholder code", "shareholderCode"],
          ["Gender", "gender"],
          ["Nationality", "nationality"],
          ["Occupation", "occupation"],
          ["TIN number", "tinNumber"],
          ["Primary ID number", "primaryIdNumber"],
          ["Mobile number", "mobileNumber"],
          ["Email address", "emailAddress"],
          ["Physical address", "physicalAddress"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          Date of birth
          <input
            type="date"
            value={formState.dateOfBirth}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                dateOfBirth: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Source of funds declaration
        <textarea
          rows={3}
          value={formState.sourceOfFundsDeclaration}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              sourceOfFundsDeclaration: event.target.value,
            }))
          }
          className={fieldClass}
        />
      </label>

      <FormFooter {...submission} submitLabel="Save core details" />
    </form>
  );
}

function IdentityDocumentForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    documentRole: "primary",
    idType: "",
    idNumber: "",
    issuingAuthority: "",
    issueDate: "",
    expiryDate: "",
    countryOfIssue: "",
    verificationStatus: "pending",
    notes: "",
  });
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      validateRequired(formState.idType, "ID type") ??
      validateRequired(formState.idNumber, "ID number") ??
      validateDateOrder(
        formState.issueDate,
        formState.expiryDate,
        "Expiry date"
      );

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await createShareholderIdentityDocument(details.core.shareholder_id, {
        documentRole: toOptional(formState.documentRole),
        idType: toOptional(formState.idType),
        idNumber: toOptional(formState.idNumber),
        issuingAuthority: toOptional(formState.issuingAuthority),
        issueDate: toOptional(formState.issueDate),
        expiryDate: toOptional(formState.expiryDate),
        countryOfIssue: toOptional(formState.countryOfIssue),
        verificationStatus: toOptional(formState.verificationStatus),
        notes: toOptional(formState.notes),
      }, token);

      setFormState((current) => ({ ...current, idNumber: "", notes: "" }));
      setSubmission({
        isSubmitting: false,
        message: "Identity document captured. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to capture identity document",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          Document role
          <select
            value={formState.documentRole}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                documentRole: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="supporting">Supporting</option>
          </select>
        </label>

        {[
          ["ID type", "idType"],
          ["ID number", "idNumber"],
          ["Issuing authority", "issuingAuthority"],
          ["Country of issue", "countryOfIssue"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          Issue date
          <input
            type="date"
            value={formState.issueDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                issueDate: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Expiry date
          <input
            type="date"
            value={formState.expiryDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                expiryDate: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Verification status
          <select
            value={formState.verificationStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                verificationStatus: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Notes
        <textarea
          rows={3}
          value={formState.notes}
          onChange={(event) =>
            setFormState((current) => ({ ...current, notes: event.target.value }))
          }
          className={fieldClass}
        />
      </label>

      <FormFooter {...submission} submitLabel="Capture identity document" />
    </form>
  );
}

function KycProfileForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const profile = details.kyc_profile;
  const [formState, setFormState] = useState({
    cddCompleted: booleanToSelect(profile?.cdd_completed),
    cddCompletedAt: toDateTimeLocalValue(profile?.cdd_completed_at),
    pepStatus: toInputValue(profile?.pep_status),
    pepFamilyOrAssociate: booleanToSelect(profile?.pep_family_or_associate),
    sanctionScreeningResult: toInputValue(profile?.sanction_screening_result),
    adverseMediaScreeningResult: toInputValue(
      profile?.adverse_media_screening_result
    ),
    riskRating: toInputValue(profile?.risk_rating),
    amlOfficerApprovalStatus: toInputValue(
      profile?.aml_officer_approval_status
    ),
    amlApprovalNotes: toInputValue(profile?.aml_approval_notes),
    sourceOfFundsSummary: toInputValue(profile?.source_of_funds_summary),
    employmentStatus: toInputValue(profile?.employment_status),
    employerBusinessName: toInputValue(profile?.employer_business_name),
    conflictOfInterestDeclared: booleanToSelect(
      profile?.conflict_of_interest_declared
    ),
    reviewStatus: profile?.review_status ?? "draft",
  });
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      formState.cddCompleted === "true" && !formState.cddCompletedAt
        ? "CDD completed at is required when CDD is marked complete."
        : null;

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await updateShareholderKycProfile(details.core.shareholder_id, {
        cddCompleted: selectToBoolean(formState.cddCompleted),
        cddCompletedAt: fromDateTimeLocalValue(formState.cddCompletedAt),
        pepStatus: toOptional(formState.pepStatus),
        pepFamilyOrAssociate: selectToBoolean(formState.pepFamilyOrAssociate),
        sanctionScreeningResult: toOptional(
          formState.sanctionScreeningResult
        ),
        adverseMediaScreeningResult: toOptional(
          formState.adverseMediaScreeningResult
        ),
        riskRating: toOptional(formState.riskRating),
        amlOfficerApprovalStatus: toOptional(
          formState.amlOfficerApprovalStatus
        ),
        amlApprovalNotes: toOptional(formState.amlApprovalNotes),
        sourceOfFundsSummary: toOptional(formState.sourceOfFundsSummary),
        employmentStatus: toOptional(formState.employmentStatus),
        employerBusinessName: toOptional(formState.employerBusinessName),
        conflictOfInterestDeclared: selectToBoolean(
          formState.conflictOfInterestDeclared
        ),
        reviewStatus: toOptional(formState.reviewStatus),
      }, token);

      setSubmission({
        isSubmitting: false,
        message: "Draft KYC profile saved. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update KYC profile",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <p className={`${helpTextClass} mb-4`}>
        Draft KYC structure pending Digaf validation. This does not represent an
        approved Digaf policy or official regulatory document.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          CDD completed
          <select
            value={formState.cddCompleted}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                cddCompleted: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className={labelClass}>
          CDD completed at
          <input
            type="datetime-local"
            value={formState.cddCompletedAt}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                cddCompletedAt: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        {[
          ["PEP status", "pepStatus"],
          ["Sanction screening result", "sanctionScreeningResult"],
          ["Adverse media result", "adverseMediaScreeningResult"],
          ["Risk rating", "riskRating"],
          ["AML approval status", "amlOfficerApprovalStatus"],
          ["Employment status", "employmentStatus"],
          ["Employer / business name", "employerBusinessName"],
          ["Review status", "reviewStatus"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          PEP family or associate
          <select
            value={formState.pepFamilyOrAssociate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                pepFamilyOrAssociate: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className={labelClass}>
          Conflict of interest declared
          <select
            value={formState.conflictOfInterestDeclared}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                conflictOfInterestDeclared: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Source of funds summary
          <textarea
            rows={3}
            value={formState.sourceOfFundsSummary}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                sourceOfFundsSummary: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          AML approval notes
          <textarea
            rows={3}
            value={formState.amlApprovalNotes}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                amlApprovalNotes: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <FormFooter {...submission} submitLabel="Save draft KYC profile" />
    </form>
  );
}

function BeneficialOwnerForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    beneficialOwnerFullName: "",
    relationshipToShareholder: "",
    beneficialOwnerIdType: "",
    beneficialOwnerIdNumber: "",
    beneficialOwnerTin: "",
    beneficialOwnerCountryOfResidence: "",
    percentageReference: "",
    isUltimateBeneficialOwner: "",
    verificationStatus: "pending",
    verificationNotes: "",
  });
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      validateRequired(
        formState.beneficialOwnerFullName,
        "Beneficial owner full name"
      ) ??
      validateOptionalNumberRange(
        formState.percentageReference,
        "Percentage reference",
        0,
        100
      );

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await createShareholderBeneficialOwner(details.core.shareholder_id, {
        beneficialOwnerFullName: toOptional(
          formState.beneficialOwnerFullName
        ),
        relationshipToShareholder: toOptional(
          formState.relationshipToShareholder
        ),
        beneficialOwnerIdType: toOptional(formState.beneficialOwnerIdType),
        beneficialOwnerIdNumber: toOptional(
          formState.beneficialOwnerIdNumber
        ),
        beneficialOwnerTin: toOptional(formState.beneficialOwnerTin),
        beneficialOwnerCountryOfResidence: toOptional(
          formState.beneficialOwnerCountryOfResidence
        ),
        percentageReference: toOptionalNumber(formState.percentageReference),
        isUltimateBeneficialOwner: selectToBoolean(
          formState.isUltimateBeneficialOwner
        ),
        verificationStatus: toOptional(formState.verificationStatus),
        verificationNotes: toOptional(formState.verificationNotes),
      }, token);

      setFormState((current) => ({
        ...current,
        beneficialOwnerFullName: "",
        beneficialOwnerIdNumber: "",
        verificationNotes: "",
      }));
      setSubmission({
        isSubmitting: false,
        message: "Beneficial owner record captured. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to capture beneficial owner",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Full name", "beneficialOwnerFullName"],
          ["Relationship", "relationshipToShareholder"],
          ["ID type", "beneficialOwnerIdType"],
          ["ID number", "beneficialOwnerIdNumber"],
          ["TIN", "beneficialOwnerTin"],
          ["Country of residence", "beneficialOwnerCountryOfResidence"],
          ["Reference percentage", "percentageReference"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          Ultimate beneficial owner
          <select
            value={formState.isUltimateBeneficialOwner}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                isUltimateBeneficialOwner: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className={labelClass}>
          Verification status
          <select
            value={formState.verificationStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                verificationStatus: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Verification notes
        <textarea
          rows={3}
          value={formState.verificationNotes}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              verificationNotes: event.target.value,
            }))
          }
          className={fieldClass}
        />
      </label>

      <FormFooter {...submission} submitLabel="Capture beneficial owner" />
    </form>
  );
}

function NextOfKinForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const primaryContact = details.next_of_kin[0] ?? null;
  const [formState, setFormState] = useState({
    fullName: toInputValue(primaryContact?.full_name),
    relationship: toInputValue(primaryContact?.relationship),
    phoneNumber: toInputValue(primaryContact?.phone_number),
    emailAddress: toInputValue(primaryContact?.email_address),
    residentialAddress: toInputValue(primaryContact?.residential_address),
    cityCountry: toInputValue(primaryContact?.city_country),
    isPrimary: primaryContact?.is_primary ?? true,
    notes: toInputValue(primaryContact?.notes),
  });
  const [confirmReplacement, setConfirmReplacement] = useState(false);
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      !confirmReplacement
        ? "Confirm that this pilot update will replace the current next-of-kin list."
        : validateRequired(formState.fullName, "Full name") ??
          validateRequired(formState.relationship, "Relationship") ??
          (!formState.phoneNumber.trim() && !formState.emailAddress.trim()
            ? "Provide at least one next-of-kin phone number or email address."
            : null) ??
          validateEmail(formState.emailAddress, "Next-of-kin email address");

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await updateShareholderNextOfKin(details.core.shareholder_id, {
        contacts: [
          {
            fullName: toOptional(formState.fullName),
            relationship: toOptional(formState.relationship),
            phoneNumber: toOptional(formState.phoneNumber),
            emailAddress: toOptional(formState.emailAddress),
            residentialAddress: toOptional(formState.residentialAddress),
            cityCountry: toOptional(formState.cityCountry),
            isPrimary: formState.isPrimary,
            notes: toOptional(formState.notes),
          },
        ],
      }, token);

      setSubmission({
        isSubmitting: false,
        message: "Next-of-kin contact saved. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update next of kin",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <p className={`${helpTextClass} mb-4`}>
        Pilot note: this route replaces the current next-of-kin list with the
        contact below. Use only for pilot/demo records until final Digaf rules
        are confirmed.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Full name", "fullName"],
          ["Relationship", "relationship"],
          ["Phone number", "phoneNumber"],
          ["Email address", "emailAddress"],
          ["Residential address", "residentialAddress"],
          ["City / country", "cityCountry"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState] as string}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          Primary contact
          <select
            value={formState.isPrimary ? "true" : "false"}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                isPrimary: event.target.value === "true",
              }))
            }
            className={fieldClass}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Notes
        <textarea
          rows={3}
          value={formState.notes}
          onChange={(event) =>
            setFormState((current) => ({ ...current, notes: event.target.value }))
          }
          className={fieldClass}
        />
      </label>

      <label className="mt-4 flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
        <input
          type="checkbox"
          checked={confirmReplacement}
          onChange={(event) => setConfirmReplacement(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
        />
        <span>
          I understand this pilot action replaces the current next-of-kin list
          for this shareholder.
        </span>
      </label>

      <FormFooter {...submission} submitLabel="Save next of kin" />
    </form>
  );
}

function DocumentChecklistForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const firstItem = details.document_checklist[0] ?? null;
  const [formState, setFormState] = useState({
    documentType: toInputValue(firstItem?.document_type),
    requirementStatus: firstItem?.requirement_status ?? "required",
    checklistStatus: firstItem?.checklist_status ?? "pending",
    sourceBasis: firstItem?.source_basis ?? "draft_kyc_form",
    reviewedBy: toInputValue(firstItem?.reviewed_by),
    reviewedAt: toDateTimeLocalValue(firstItem?.reviewed_at),
    notes: toInputValue(firstItem?.notes),
  });
  const [confirmReplacement, setConfirmReplacement] = useState(false);
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = !confirmReplacement
      ? "Confirm that this pilot update will replace the current document checklist."
      : validateRequired(formState.documentType, "Document type");

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await updateShareholderDocumentChecklist(details.core.shareholder_id, {
        items: [
          {
            documentType: formState.documentType.trim(),
            requirementStatus: toOptional(formState.requirementStatus),
            checklistStatus: toOptional(formState.checklistStatus),
            sourceBasis: toOptional(formState.sourceBasis),
            reviewedBy: toOptional(formState.reviewedBy),
            reviewedAt: fromDateTimeLocalValue(formState.reviewedAt),
            notes: toOptional(formState.notes),
          },
        ],
      }, token);

      setSubmission({
        isSubmitting: false,
        message: "Document checklist saved. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update document checklist",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <p className={`${helpTextClass} mb-4`}>
        Pilot note: this route replaces the current checklist with the item
        below. Use this as a safe single-item pilot workflow until final
        checklist editing is designed.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          Document type
          <input
            required
            value={formState.documentType}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                documentType: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Requirement status
          <select
            value={formState.requirementStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                requirementStatus: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="required">Required</option>
            <option value="conditional">Conditional</option>
            <option value="optional">Optional</option>
            <option value="waived">Waived</option>
          </select>
        </label>

        <label className={labelClass}>
          Checklist status
          <select
            value={formState.checklistStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                checklistStatus: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="pending">Pending</option>
            <option value="attached">Attached</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="waived">Waived</option>
          </select>
        </label>

        <label className={labelClass}>
          Source basis
          <input
            value={formState.sourceBasis}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                sourceBasis: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Reviewed by
          <input
            value={formState.reviewedBy}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                reviewedBy: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>

        <label className={labelClass}>
          Reviewed at
          <input
            type="datetime-local"
            value={formState.reviewedAt}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                reviewedAt: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Notes
        <textarea
          rows={3}
          value={formState.notes}
          onChange={(event) =>
            setFormState((current) => ({ ...current, notes: event.target.value }))
          }
          className={fieldClass}
        />
      </label>

      <label className="mt-4 flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
        <input
          type="checkbox"
          checked={confirmReplacement}
          onChange={(event) => setConfirmReplacement(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
        />
        <span>
          I understand this pilot action replaces the current document checklist
          for this shareholder.
        </span>
      </label>

      <FormFooter {...submission} submitLabel="Save checklist item" />
    </form>
  );
}

function PaymentProfileForm({
  details,
  actorRole,
}: {
  details: ShareholderProfileDetails;
  actorRole: PilotRole;
}) {
  const router = useRouter();
  const paymentProfile = details.payment_profiles[0] ?? null;
  const [formState, setFormState] = useState({
    paymentProfileType: paymentProfile?.payment_profile_type ?? "dividend",
    paymentMethod: toInputValue(paymentProfile?.payment_method),
    totalInvestmentAmount: toInputValue(paymentProfile?.total_investment_amount),
    bankName: toInputValue(paymentProfile?.bank_name),
    branchNameCode: toInputValue(paymentProfile?.branch_name_code),
    accountName: toInputValue(paymentProfile?.account_name),
    accountNumber: toInputValue(paymentProfile?.account_number),
    accountType: toInputValue(paymentProfile?.account_type),
    dividendPaymentPreference: toInputValue(
      paymentProfile?.dividend_payment_preference
    ),
    paymentVerificationStatus:
      paymentProfile?.payment_verification_status ?? "pending",
    paymentVerifiedBy: toInputValue(paymentProfile?.payment_verified_by),
    paymentVerifiedAt: toDateTimeLocalValue(
      paymentProfile?.payment_verified_at
    ),
    notes: toInputValue(paymentProfile?.notes),
  });
  const [submission, setSubmission] = useSubmissionState();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError =
      validateOptionalNumberRange(
        formState.totalInvestmentAmount,
        "Total investment amount",
        0
      ) ??
      (formState.paymentVerificationStatus === "verified" &&
      !formState.paymentVerifiedBy.trim()
        ? "Payment verified by is required when verification status is verified."
        : null) ??
      (formState.paymentVerificationStatus === "verified" &&
      !formState.paymentVerifiedAt
        ? "Payment verified at is required when verification status is verified."
        : null);

    if (validationError) {
      setSubmission({ isSubmitting: false, message: null, error: validationError });
      return;
    }

    setSubmission({ isSubmitting: true, message: null, error: null });

    try {
      const token = await getAccessToken();
      await updateShareholderPaymentProfile(details.core.shareholder_id, {
        paymentProfileType: toOptional(formState.paymentProfileType),
        paymentMethod: toOptional(formState.paymentMethod),
        totalInvestmentAmount: toOptionalNumber(formState.totalInvestmentAmount),
        bankName: toOptional(formState.bankName),
        branchNameCode: toOptional(formState.branchNameCode),
        accountName: toOptional(formState.accountName),
        accountNumber: toOptional(formState.accountNumber),
        accountType: toOptional(formState.accountType),
        dividendPaymentPreference: toOptional(
          formState.dividendPaymentPreference
        ),
        paymentVerificationStatus: toOptional(
          formState.paymentVerificationStatus
        ),
        paymentVerifiedBy: toOptional(formState.paymentVerifiedBy),
        paymentVerifiedAt: fromDateTimeLocalValue(
          formState.paymentVerifiedAt
        ),
        notes: toOptional(formState.notes),
      }, token);

      setSubmission({
        isSubmitting: false,
        message: "Payment profile saved. Profile refreshed.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setSubmission({
        isSubmitting: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update payment profile",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ActorNotice actorRole={actorRole} />
      <p className={`${helpTextClass} mb-4`}>
        Payment and bank fields are sensitive pilot fields. Use demo or approved
        pilot records only until Digaf confirms final finance controls.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Profile type", "paymentProfileType"],
          ["Payment method", "paymentMethod"],
          ["Total investment amount", "totalInvestmentAmount"],
          ["Bank name", "bankName"],
          ["Branch name / code", "branchNameCode"],
          ["Account name", "accountName"],
          ["Account number", "accountNumber"],
          ["Account type", "accountType"],
          ["Dividend preference", "dividendPaymentPreference"],
          ["Payment verified by", "paymentVerifiedBy"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              value={formState[key as keyof typeof formState]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </label>
        ))}

        <label className={labelClass}>
          Verification status
          <select
            value={formState.paymentVerificationStatus}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                paymentVerificationStatus: event.target.value,
              }))
            }
            className={fieldClass}
          >
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className={labelClass}>
          Payment verified at
          <input
            type="datetime-local"
            value={formState.paymentVerifiedAt}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                paymentVerifiedAt: event.target.value,
              }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className={`${labelClass} mt-4 block`}>
        Notes
        <textarea
          rows={3}
          value={formState.notes}
          onChange={(event) =>
            setFormState((current) => ({ ...current, notes: event.target.value }))
          }
          className={fieldClass}
        />
      </label>

      <FormFooter {...submission} submitLabel="Save payment profile" />
    </form>
  );
}

export function DigafProfileEditWorkflows({
  details,
}: {
  details: ShareholderProfileDetails;
}) {
  const [actorRole, setActorRole] = useState<PilotRole>("governance_admin");
  const selectedRole =
    pilotRoles.find((pilotRole) => pilotRole.value === actorRole) ??
    ({
      value: "governance_admin",
      label: "Pilot admin",
      description: "Local pilot role with access to every Stage 66F workflow.",
    } satisfies (typeof pilotRoles)[number]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold text-slate-900">
            Pilot Edit Workflows
          </h2>
          <p className="mt-1 max-w-3xl break-words text-sm text-slate-600">
            Controlled Stage 66F forms for pilot preparation. Select a pilot
            role to preview the assumed edit boundaries pending Digaf
            validation.
          </p>
        </div>
        <span className="inline-flex max-w-full items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
          Pending Digaf validation
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <label className={labelClass}>
          Pilot role
          <select
            value={actorRole}
            onChange={(event) => setActorRole(event.target.value as PilotRole)}
            className={`${fieldClass} max-w-full sm:max-w-md`}
          >
            {pilotRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 max-w-3xl break-words text-xs font-medium text-slate-600">
          {selectedRole.description} This is a frontend pilot control only;
          final authorization remains pending Digaf validation.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <SectionForm
          title="Edit Core Shareholder Details"
          description="Update nullable Digaf master-data fields without changing existing MVP identifiers."
          actorRole={actorRole}
          allowedRoles={workflowRoles.core}
        >
          <CoreDetailsForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Capture Identification Document"
          description="Append ID document metadata. File upload and SharePoint document linking remain a later workflow."
          actorRole={actorRole}
          allowedRoles={workflowRoles.identity}
        >
          <IdentityDocumentForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Update Draft KYC / AML / CFT Profile"
          description="Maintain a draft due-diligence profile pending Digaf policy validation."
          actorRole={actorRole}
          allowedRoles={workflowRoles.kyc}
        >
          <KycProfileForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Capture Beneficial Owner"
          description="Append a pilot beneficial-owner record for compliance review."
          actorRole={actorRole}
          allowedRoles={workflowRoles.beneficialOwner}
        >
          <BeneficialOwnerForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Replace Next of Kin"
          description="Pilot single-contact replacement workflow for next-of-kin details."
          actorRole={actorRole}
          allowedRoles={workflowRoles.nextOfKin}
        >
          <NextOfKinForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Replace Document Checklist Item"
          description="Pilot single-item checklist workflow until final checklist UX is confirmed."
          actorRole={actorRole}
          allowedRoles={workflowRoles.checklist}
        >
          <DocumentChecklistForm details={details} actorRole={actorRole} />
        </SectionForm>

        <SectionForm
          title="Update Payment Profile"
          description="Maintain payment and dividend instruction fields using the interim finance role mapping."
          actorRole={actorRole}
          allowedRoles={workflowRoles.payment}
        >
          <PaymentProfileForm details={details} actorRole={actorRole} />
        </SectionForm>
      </div>
    </section>
  );
}
