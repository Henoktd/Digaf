import { EmptyState } from "@/src/components/EmptyState";
import { DigafProfileEditWorkflows } from "@/src/components/DigafProfileEditWorkflows";
import { StatusBadge, formatStatusLabel } from "@/src/components/StatusBadge";
import type { ReactNode } from "react";
import type {
  ShareholderBeneficialOwner,
  ShareholderDocumentChecklistItem,
  ShareholderIdentityDocument,
  ShareholderKycProfile,
  ShareholderNextOfKin,
  ShareholderPaymentProfile,
  ShareholderProfileDetails,
} from "@/src/lib/api";

type DetailValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[];

type DetailItem = {
  label: string;
  value: DetailValue;
  type?: "date" | "datetime" | "currency";
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatValue(value: DetailValue, type?: DetailItem["type"]) {
  if (type === "date") {
    return formatDate(typeof value === "string" ? value : null);
  }

  if (type === "datetime") {
    return formatDateTime(typeof value === "string" ? value : null);
  }

  if (type === "currency") {
    return formatMoney(typeof value === "string" || typeof value === "number" ? value : null);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(String).join(", ") : "Not set";
  }

  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

function SectionShell({
  title,
  description,
  draft = false,
  children,
}: {
  title: string;
  description?: string;
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl break-words text-sm text-slate-600">
              {description}
            </p>
          ) : null}
        </div>

        {draft ? (
          <span className="inline-flex max-w-full items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            <span className="break-words">
              Draft KYC structure pending Digaf validation
            </span>
          </span>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words font-semibold text-slate-900">
            {formatValue(item.value, item.type)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyProfileSection({
  title,
  description = "Pending Digaf validation. To be completed during pilot onboarding.",
}: {
  title: string;
  description?: string;
}) {
  return <EmptyState title={title} description={description} />;
}

function CoreDetailsSection({ details }: { details: ShareholderProfileDetails }) {
  const core = details.core;

  return (
    <SectionShell
      title="Core Shareholder Details"
      description="Digaf-aligned master profile fields from the shareholder registration template."
    >
      <DetailGrid
        items={[
          { label: "Shareholder Code", value: core.shareholder_code },
          { label: "Shareholder Type", value: formatStatusLabel(core.type) },
          { label: "Gender", value: core.gender },
          { label: "Date of Birth", value: core.date_of_birth, type: "date" },
          { label: "Nationality", value: core.nationality },
          { label: "Occupation", value: core.occupation },
          { label: "TIN Number", value: core.tin_number },
          { label: "Primary ID Number", value: core.primary_id_number },
          { label: "Mobile Number", value: core.mobile_number },
          { label: "Email Address", value: core.email_address },
          { label: "Physical Address", value: core.physical_address },
          {
            label: "Source of Funds Declaration",
            value: core.source_of_funds_declaration,
          },
        ]}
      />
    </SectionShell>
  );
}

function IdentityDocumentsSection({
  documents,
}: {
  documents: ShareholderIdentityDocument[];
}) {
  return (
    <SectionShell
      title="Identification Documents"
      description="Structured ID metadata for primary and supporting identity evidence."
      draft
    >
      {documents.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Number</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issuer
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Country
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue Date
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expiry
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document Ref
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {formatStatusLabel(document.document_role)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {formatStatusLabel(document.id_type)}
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3 font-medium">
                    {document.id_number || "Not set"}
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3">
                    {document.issuing_authority || "Not set"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {document.country_of_issue || "Not set"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {formatDate(document.issue_date)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    {formatDate(document.expiry_date)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <StatusBadge status={document.verification_status} />
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3">
                    {document.document_reference_id || "Not attached"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyProfileSection title="No identity documents have been captured yet." />
      )}
    </SectionShell>
  );
}

function KycProfileSection({ profile }: { profile: ShareholderKycProfile | null }) {
  return (
    <SectionShell
      title="KYC / AML / CFT Profile"
      description="Expanded due diligence and screening fields for the production-ready pilot."
      draft
    >
      {profile ? (
        <div className="space-y-5">
          <DetailGrid
            items={[
              { label: "CDD Completed", value: profile.cdd_completed },
              {
                label: "CDD Completed At",
                value: profile.cdd_completed_at,
                type: "datetime",
              },
              { label: "CDD Completed By", value: profile.cdd_completed_by },
              { label: "PEP Status", value: profile.pep_status },
              {
                label: "PEP Family or Associate",
                value: profile.pep_family_or_associate,
              },
              { label: "PEP Role", value: profile.pep_position_role },
              {
                label: "PEP Country / Organization",
                value: profile.pep_country_or_organization,
              },
              {
                label: "Sanction Screening Result",
                value: profile.sanction_screening_result,
              },
              {
                label: "Sanction Screened At",
                value: profile.sanction_screened_at,
                type: "datetime",
              },
              {
                label: "Adverse Media Result",
                value: profile.adverse_media_screening_result,
              },
              {
                label: "Adverse Media Screened At",
                value: profile.adverse_media_screened_at,
                type: "datetime",
              },
              { label: "Risk Rating", value: profile.risk_rating },
              {
                label: "Source of Funds Summary",
                value: profile.source_of_funds_summary,
              },
              {
                label: "Source of Funds Categories",
                value: profile.source_of_funds_categories,
              },
              { label: "Annual Income Range", value: profile.annual_income_range },
              { label: "Employment Status", value: profile.employment_status },
              { label: "Employer / Business", value: profile.employer_business_name },
              { label: "Business Sector", value: profile.business_sector },
              {
                label: "Years at Current Job",
                value: profile.years_at_current_job,
              },
            ]}
          />

          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500">
              Declarations
            </h3>
            <div className="mt-3">
              <DetailGrid
                items={[
                  {
                    label: "International Sanctions Declared",
                    value: profile.international_sanctions_declared,
                  },
                  {
                    label: "Financial Crime Declared",
                    value: profile.financial_crime_declared,
                  },
                  {
                    label: "Regulatory Investigation Declared",
                    value: profile.regulatory_investigation_declared,
                  },
                  {
                    label: "Other FI Shareholding",
                    value: profile.other_financial_institution_shareholding,
                  },
                  {
                    label: "Conflict of Interest Declared",
                    value: profile.conflict_of_interest_declared,
                  },
                  { label: "Declaration Notes", value: profile.declaration_notes },
                ]}
              />
            </div>
          </div>
        </div>
      ) : (
        <EmptyProfileSection
          title="No KYC profile has been captured yet."
          description="Pending Digaf validation. To be completed during pilot onboarding."
        />
      )}
    </SectionShell>
  );
}

function BeneficialOwnershipSection({
  owners,
}: {
  owners: ShareholderBeneficialOwner[];
}) {
  return (
    <SectionShell
      title="Beneficial Ownership"
      description="Pilot beneficial ownership capture and verification summary."
      draft
    >
      {owners.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {owners.map((owner) => (
            <article
              key={owner.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-900">
                    {owner.beneficial_owner_full_name || "Unnamed owner"}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {owner.relationship_to_shareholder || "Relationship not set"}
                  </p>
                </div>
                <StatusBadge status={owner.verification_status} />
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p className="break-words">
                  <span className="text-slate-500">ID:</span>{" "}
                  {owner.beneficial_owner_id_number || "Not set"}
                </p>
                <p className="break-words">
                  <span className="text-slate-500">TIN:</span>{" "}
                  {owner.beneficial_owner_tin || "Not set"}
                </p>
                <p className="break-words">
                  <span className="text-slate-500">Residence:</span>{" "}
                  {owner.beneficial_owner_country_of_residence || "Not set"}
                </p>
                <p className="break-words">
                  <span className="text-slate-500">Reference %:</span>{" "}
                  {formatValue(owner.percentage_reference)}
                </p>
                <p className="break-words">
                  <span className="text-slate-500">Ultimate BO:</span>{" "}
                  {formatValue(owner.is_ultimate_beneficial_owner)}
                </p>
                <p className="break-words">
                  <span className="text-slate-500">Document Ref:</span>{" "}
                  {owner.document_reference_id || "Not attached"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyProfileSection title="No beneficial owner records have been captured yet." />
      )}
    </SectionShell>
  );
}

function NextOfKinSection({ contacts }: { contacts: ShareholderNextOfKin[] }) {
  return (
    <SectionShell
      title="Next of Kin / Emergency Contact"
      description="Draft contact structure for pilot onboarding."
      draft
    >
      {contacts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((contact) => (
            <article
              key={contact.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-900">
                    {contact.full_name || "Unnamed contact"}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {contact.relationship || "Relationship not set"}
                  </p>
                </div>
                {contact.is_primary ? (
                  <StatusBadge status="primary" label="Primary" tone="info" />
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="break-words">Phone: {contact.phone_number || "Not set"}</p>
                <p className="break-words">Email: {contact.email_address || "Not set"}</p>
                <p className="break-words">
                  Address: {contact.residential_address || "Not set"}
                </p>
                <p className="break-words">
                  City / Country: {contact.city_country || "Not set"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyProfileSection title="No next of kin has been captured yet." />
      )}
    </SectionShell>
  );
}

function DocumentChecklistSection({
  items,
}: {
  items: ShareholderDocumentChecklistItem[];
}) {
  return (
    <SectionShell
      title="Document Checklist"
      description="Required and conditional evidence tracking for pilot onboarding."
      draft
    >
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Requirement
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Source
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reviewed
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document Ref
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="break-words border-b border-slate-100 px-4 py-3 font-medium capitalize">
                    {formatStatusLabel(item.document_type)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3 capitalize">
                    {formatStatusLabel(item.requirement_status)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-3">
                    <StatusBadge status={item.checklist_status} />
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3">
                    {formatStatusLabel(item.source_basis)}
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3">
                    {item.reviewed_by || "Not reviewed"} |{" "}
                    {formatDateTime(item.reviewed_at)}
                  </td>
                  <td className="break-words border-b border-slate-100 px-4 py-3">
                    {item.document_reference_id || "Not attached"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyProfileSection title="No document checklist has been captured yet." />
      )}
    </SectionShell>
  );
}

function PaymentProfileSection({
  profiles,
}: {
  profiles: ShareholderPaymentProfile[];
}) {
  return (
    <SectionShell
      title="Payment Profile"
      description="Payment method, investment amount, and draft banking/dividend instruction fields."
      draft
    >
      {profiles.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold capitalize text-slate-900">
                    {formatStatusLabel(profile.payment_profile_type)}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {profile.payment_method || "Payment method not set"}
                  </p>
                </div>
                <StatusBadge status={profile.payment_verification_status} />
              </div>

              <div className="mt-4">
                <DetailGrid
                  items={[
                    { label: "Bank Name", value: profile.bank_name },
                    { label: "Branch", value: profile.branch_name_code },
                    { label: "Account Name", value: profile.account_name },
                    { label: "Account Number", value: profile.account_number },
                    { label: "Account Type", value: profile.account_type },
                    { label: "SWIFT / BIC", value: profile.swift_bic_code },
                    { label: "IBAN", value: profile.iban },
                    {
                      label: "Mobile Wallet",
                      value: profile.mobile_wallet_identifier,
                    },
                    {
                      label: "Dividend Preference",
                      value: profile.dividend_payment_preference,
                    },
                    {
                      label: "Total Investment Amount",
                      value: profile.total_investment_amount,
                      type: "currency",
                    },
                    {
                      label: "Verified By",
                      value: profile.payment_verified_by,
                    },
                    {
                      label: "Verified At",
                      value: profile.payment_verified_at,
                      type: "datetime",
                    },
                  ]}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyProfileSection title="No payment profile has been captured yet." />
      )}
    </SectionShell>
  );
}

function ApprovalSummarySection({
  kycProfile,
  paymentProfiles,
  checklistItems,
}: {
  kycProfile: ShareholderKycProfile | null;
  paymentProfiles: ShareholderPaymentProfile[];
  checklistItems: ShareholderDocumentChecklistItem[];
}) {
  const latestPaymentProfile = paymentProfiles[0] ?? null;
  const reviewedChecklistItems = checklistItems.filter(
    (item) => item.reviewed_by || item.reviewed_at
  );

  return (
    <SectionShell
      title="Approval / Office-Use Summary"
      description="Current backend-supported review and verification fields."
      draft
    >
      <DetailGrid
        items={[
          {
            label: "KYC Review Status",
            value: kycProfile?.review_status,
          },
          {
            label: "KYC Reviewed By",
            value: kycProfile?.reviewed_by,
          },
          {
            label: "KYC Reviewed At",
            value: kycProfile?.reviewed_at,
            type: "datetime",
          },
          {
            label: "AML Approval Status",
            value: kycProfile?.aml_officer_approval_status,
          },
          {
            label: "AML Officer ID",
            value: kycProfile?.aml_officer_id,
          },
          {
            label: "AML Approval Date",
            value: kycProfile?.aml_approval_date,
            type: "date",
          },
          {
            label: "Payment Verification",
            value: latestPaymentProfile?.payment_verification_status,
          },
          {
            label: "Payment Verified By",
            value: latestPaymentProfile?.payment_verified_by,
          },
          {
            label: "Payment Verified At",
            value: latestPaymentProfile?.payment_verified_at,
            type: "datetime",
          },
          {
            label: "Reviewed Checklist Items",
            value: reviewedChecklistItems.length,
          },
        ]}
      />
    </SectionShell>
  );
}

export function DigafProfileSections({
  details,
}: {
  details: ShareholderProfileDetails;
}) {
  return (
    <div className="space-y-6">
      <CoreDetailsSection details={details} />
      <DigafProfileEditWorkflows details={details} />
      <IdentityDocumentsSection documents={details.identity_documents} />
      <KycProfileSection profile={details.kyc_profile} />
      <BeneficialOwnershipSection owners={details.beneficial_owners} />
      <NextOfKinSection contacts={details.next_of_kin} />
      <DocumentChecklistSection items={details.document_checklist} />
      <PaymentProfileSection profiles={details.payment_profiles} />
      <ApprovalSummarySection
        kycProfile={details.kyc_profile}
        paymentProfiles={details.payment_profiles}
        checklistItems={details.document_checklist}
      />
    </div>
  );
}
