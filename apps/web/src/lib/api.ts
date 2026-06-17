const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ApiErrorBody = {
  error?:
    | {
        message?: string;
        details?: unknown;
      }
    | string;
  message?: string;
};

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function readApiError(response: Response, fallback: string) {
  let message = fallback;

  try {
    const body = (await response.json()) as ApiErrorBody;
    const errObj = typeof body?.error === "object" ? body.error : undefined;
    const detailsMsg =
      errObj?.details && typeof errObj.details === "object" && "message" in errObj.details
        ? String((errObj.details as { message: unknown }).message)
        : undefined;
    message =
      detailsMsg ||
      errObj?.message ||
      (typeof body?.error === "string" ? body.error : undefined) ||
      body?.message ||
      message;
  } catch {
    // Keep the generic message if the API did not return JSON.
  }

  return message;
}

async function sendJsonRequest<TResponse>(
  url: string,
  method: "POST" | "PUT" | "PATCH",
  body: unknown,
  fallbackMessage: string,
  token?: string
) {
  const response = await fetch(url, {
    method,
    headers: buildHeaders(token),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, fallbackMessage));
  }

  return response.json() as Promise<TResponse>;
}

async function sendGetRequest(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers: Object.keys(headers).length ? headers : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readApiError(response, `Request failed: ${url}`);
    throw new Error(message);
  }

  return response.json();
}

export async function fetchEntities(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/entities`, token);
}

export async function fetchShareClasses(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/share-classes`, token);
}

export type DashboardSummary = {
  entity_count: number;
  shareholder_count: number;
  active_shareholder_count: number;
  total_shares: number;
  certificate_count: number;
  issued_certificate_count: number;
  revoked_certificate_count: number;
  transfer_count: number;
  pending_transfer_count: number;
  completed_transfer_count: number;
  pending_approval_count: number;
  approved_approval_count: number;
  overdue_approval_count: number;
  active_legal_hold_count: number;
  active_transfer_freeze_count: number;
  audit_log_count: number;
  document_reference_count: number;
  communication_count: number;
  kyc_verified_count: number;
  kyc_expired_count: number;
  kyc_expiring_soon_count: number;
  dividend_count: number;
  total_dividends_declared: number;
  top_ownership_rows: {
    shareholder_name: string;
    quantity: number;
    ownership_percentage: number;
  }[];
  recent_audit_actions: {
    actor_id: string;
    action: string;
    table_name: string;
    timestamp_utc: string;
  }[];
  sla_snapshot: {
    request_type: string;
    stage: string;
    status: string;
    sla_due_date: string | null;
    computed_sla_status: string;
  }[];
};

export async function fetchDashboardSummary(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/dashboard/summary`, token);
}

export type IntegrationStatus = {
  sharePoint: {
    configured: boolean;
    siteUrlPresent: boolean;
    documentLibraryPresent: boolean;
  };
  powerAutomate: {
    configured: boolean;
    notificationWebhookPresent: boolean;
  };
  powerBi: {
    configured: boolean;
    workspaceIdPresent: boolean;
    reportIdPresent: boolean;
  };
};

export async function fetchIntegrationStatus(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/integrations/status`, token);
}

export async function fetchShareholders(token?: string, page = 1, limit = 50) {
  return sendGetRequest(`${API_BASE_URL}/api/shareholders?page=${page}&limit=${limit}`, token);
}

export type ShareholderImportDryRunRow = {
  rowNumber?: number;
  shareholderCode?: string | null;
  legalName?: string | null;
  type?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  occupation?: string | null;
  tinNumber?: string | null;
  primaryIdNumber?: string | null;
  mobileNumber?: string | null;
  emailAddress?: string | null;
  physicalAddress?: string | null;
  shareCertificateNumber?: string | null;
  numberOfSharesPurchased?: number | string | null;
  parValuePerShare?: number | string | null;
  totalInvestmentAmount?: number | string | null;
  dateOfPurchase?: string | null;
  paymentMethod?: string | null;
  sourceOfFundsDeclaration?: string | null;
  status?: string | null;
  cddCompleted?: boolean | string | null;
  pepStatus?: string | null;
  sanctionScreeningResult?: string | null;
  adverseMediaScreeningResult?: string | null;
  riskRating?: string | null;
  amlOfficerApprovalStatus?: string | null;
};

export type ShareholderImportValidationMessage = {
  rowNumber: number;
  field: string;
  severity: "error" | "warning";
  code: string;
  message: string;
  suggestedAction: string;
  responsibleRole: "Maker" | "Compliance" | "Finance" | "Governance";
};

export type ShareholderImportDryRunResult = {
  dryRunOnly: true;
  mappingVersion: string;
  generatedAtUtc: string;
  summary: {
    totalRows: number;
    readyRows: number;
    warningRows: number;
    blockedRows: number;
    errorCount: number;
    warningCount: number;
    duplicateCandidateCount: number;
  };
  rows: {
    rowNumber: number;
    status: "ready" | "ready_with_warnings" | "blocked";
    normalized: ShareholderImportDryRunRow & { rowNumber: number };
    messages: ShareholderImportValidationMessage[];
  }[];
  fieldMapping: {
    excelHeader: string;
    field: string;
    target: string;
    required: boolean | string;
  }[];
  requestedBy: {
    actorId: string;
    actorRole: string;
  };
};

export type ShareholderImportBatch = {
  id: string;
  entity_id: string | null;
  source_filename: string | null;
  source_document_reference_id: string | null;
  mapping_version: string;
  batch_status: string;
  dry_run_only: boolean;
  submitted_by: string | null;
  submitted_role: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  summary_json:
    | ShareholderImportDryRunResult["summary"]
    | Record<string, unknown>;
  review_status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  row_count?: number;
  error_count?: number;
  warning_count?: number;
  duplicate_candidate_count?: number;
};

export type ShareholderImportBatchRow = {
  id: string;
  batch_id: string;
  source_row_number: number;
  source_payload_json: Record<string, unknown>;
  normalized_payload_json: Record<string, unknown>;
  row_status: string;
  error_count: number;
  warning_count: number;
  duplicate_candidate_count: number;
  review_decision: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_shareholder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderImportBatchMessage = {
  id: string;
  batch_id: string;
  row_id: string;
  source_row_number: number;
  field_name: string;
  severity: "error" | "warning" | string;
  code: string;
  message: string;
  suggested_action: string | null;
  responsible_role: string | null;
  resolution_status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
};

export type ShareholderImportBatchEvent = {
  id: string;
  batch_id: string;
  event_type: string;
  actor_id: string;
  actor_role: string | null;
  event_payload_json: Record<string, unknown>;
  created_at: string;
};

export type ShareholderImportBatchDetail = {
  batch: ShareholderImportBatch;
  rows: ShareholderImportBatchRow[];
  messages: ShareholderImportBatchMessage[];
  events: ShareholderImportBatchEvent[];
};

export async function dryRunShareholderImport(
  input: { rows: ShareholderImportDryRunRow[] },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportDryRunResult }>(
    `${API_BASE_URL}/api/imports/shareholders/dry-run`,
    "POST",
    input,
    "Failed to run shareholder import dry-run",
    token
  );
}

export async function createShareholderImportBatch(
  input: {
    confirmNoProductionData: true;
    sourceFilename?: string;
    rows: ShareholderImportDryRunRow[];
  },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/batches`,
    "POST",
    input,
    "Failed to create shareholder import batch",
    token
  );
}

export async function fetchShareholderImportBatches(token?: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/imports/shareholders/batches`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder import batches");
  }

  return response.json() as Promise<{ data: ShareholderImportBatch[] }>;
}

export async function fetchShareholderImportBatch(
  batchId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder import batch");
  }

  return response.json() as Promise<{ data: ShareholderImportBatchDetail }>;
}

export async function revalidateShareholderImportBatch(
  batchId: string,
  input: { confirmNoProductionData: true },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}/revalidate`,
    "POST",
    input,
    "Failed to revalidate shareholder import batch",
    token
  );
}

export async function submitShareholderImportBatchForReview(
  batchId: string,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}/submit-review`,
    "POST",
    {},
    "Failed to submit shareholder import batch for review",
    token
  );
}

export async function resolveShareholderImportMessage(
  messageId: string,
  input: { resolutionStatus: string; resolutionNotes?: string },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/messages/${messageId}/resolve`,
    "POST",
    input,
    "Failed to resolve shareholder import message",
    token
  );
}

export async function excludeShareholderImportRow(
  rowId: string,
  input: { reviewNotes?: string },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/rows/${rowId}/exclude`,
    "POST",
    input,
    "Failed to exclude shareholder import row",
    token
  );
}

export async function cancelShareholderImportBatch(
  batchId: string,
  input: { reason?: string },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}/cancel`,
    "POST",
    input,
    "Failed to cancel shareholder import batch",
    token
  );
}

export async function rejectShareholderImportBatch(
  batchId: string,
  input: { reviewNotes?: string },
  token: string
) {
  return sendJsonRequest<{ data: ShareholderImportBatchDetail }>(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}/reject`,
    "POST",
    input,
    "Failed to reject shareholder import batch",
    token
  );
}

export type CreateShareholderInput = {
  entityId: string;
  legalName: string;
  type: "individual" | "institution";
  status?: string;
  email?: string;
  phone?: string;
  kycStatus?: "not_started" | "pending" | "verified" | "expired";
  kycExpiry?: string;
  riskClassification?: "low" | "medium" | "high";
  proxyEligible?: boolean;
  relationshipStartDate?: string;
};

export async function createShareholder(
  input: CreateShareholderInput,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/shareholders`,
    "POST",
    input,
    "Failed to create shareholder",
    token
  );
}

export async function fetchShareholderProfile(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder profile");
  }

  return response.json();
}

export type DigafShareholderCore = {
  shareholder_id: string;
  entity_id: string;
  entity_name?: string;
  legal_name: string;
  type: string;
  status: string;
  contact_details: Record<string, string | number | boolean | null> | null;
  kyc_status: "not_started" | "pending" | "verified" | "expired";
  kyc_expiry: string | null;
  risk_classification: "low" | "medium" | "high" | null;
  proxy_eligible: boolean;
  relationship_start_date: string | null;
  shareholder_code: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  occupation: string | null;
  tin_number: string | null;
  primary_id_number: string | null;
  mobile_number: string | null;
  email_address: string | null;
  physical_address: string | null;
  source_of_funds_declaration: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ShareholderIdentityDocument = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  document_role: string | null;
  id_type: string | null;
  id_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  country_of_issue: string | null;
  document_reference_id: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderKycProfile = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  kyc_record_id: string | null;
  cdd_completed: boolean | null;
  cdd_completed_at: string | null;
  cdd_completed_by: string | null;
  pep_status: string | null;
  pep_family_or_associate: boolean | null;
  pep_position_role: string | null;
  pep_country_or_organization: string | null;
  sanction_screening_result: string | null;
  sanction_screened_at: string | null;
  sanction_screened_by: string | null;
  adverse_media_screening_result: string | null;
  adverse_media_screened_at: string | null;
  adverse_media_screened_by: string | null;
  risk_rating: string | null;
  aml_officer_approval_status: string | null;
  aml_officer_id: string | null;
  aml_approval_date: string | null;
  aml_approval_notes: string | null;
  source_of_funds_summary: string | null;
  source_of_funds_categories: unknown[];
  annual_income_range: string | null;
  employment_status: string | null;
  employer_business_name: string | null;
  employer_address: string | null;
  business_sector: string | null;
  years_at_current_job: string | number | null;
  international_sanctions_declared: boolean | null;
  financial_crime_declared: boolean | null;
  regulatory_investigation_declared: boolean | null;
  other_financial_institution_shareholding: boolean | null;
  conflict_of_interest_declared: boolean | null;
  declaration_notes: string | null;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderBeneficialOwner = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  is_ultimate_beneficial_owner: boolean | null;
  beneficial_owner_full_name: string | null;
  relationship_to_shareholder: string | null;
  beneficial_owner_id_type: string | null;
  beneficial_owner_id_number: string | null;
  beneficial_owner_tin: string | null;
  beneficial_owner_country_of_residence: string | null;
  percentage_reference: string | number | null;
  verification_status: string;
  verification_method: string | null;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  document_reference_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderNextOfKin = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  full_name: string | null;
  relationship: string | null;
  phone_number: string | null;
  email_address: string | null;
  residential_address: string | null;
  city_country: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderDocumentChecklistItem = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  document_type: string;
  requirement_status: string;
  checklist_status: string;
  source_basis: string | null;
  document_reference_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderPaymentProfile = {
  id: string;
  shareholder_id: string;
  entity_id: string | null;
  payment_profile_type: string;
  bank_name: string | null;
  branch_name_code: string | null;
  account_name: string | null;
  account_number: string | null;
  account_type: string | null;
  swift_bic_code: string | null;
  iban: string | null;
  mobile_wallet_identifier: string | null;
  dividend_payment_preference: string | null;
  payment_method: string | null;
  total_investment_amount: string | number | null;
  payment_verification_status: string;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  document_reference_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ShareholderProfileDetails = {
  core: DigafShareholderCore;
  identity_documents: ShareholderIdentityDocument[];
  kyc_profile: ShareholderKycProfile | null;
  beneficial_owners: ShareholderBeneficialOwner[];
  next_of_kin: ShareholderNextOfKin[];
  document_checklist: ShareholderDocumentChecklistItem[];
  payment_profiles: ShareholderPaymentProfile[];
};

export type ShareholderProfileDetailsResponse = {
  data: ShareholderProfileDetails;
};

export async function fetchShareholderProfileDetails(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/profile-details`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder Digaf profile details");
  }

  return response.json() as Promise<ShareholderProfileDetailsResponse>;
}

export type UpdateCoreDetailsInput = {
  shareholderCode?: string | undefined;
  gender?: string | undefined;
  dateOfBirth?: string | undefined;
  nationality?: string | undefined;
  occupation?: string | undefined;
  tinNumber?: string | undefined;
  primaryIdNumber?: string | undefined;
  mobileNumber?: string | undefined;
  emailAddress?: string | undefined;
  physicalAddress?: string | undefined;
  sourceOfFundsDeclaration?: string | undefined;
};

export async function updateShareholderCoreDetails(
  shareholderId: string,
  input: UpdateCoreDetailsInput,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/core-details`,
    "PUT",
    input,
    "Failed to update shareholder core details",
    token
  );
}

export async function fetchShareholderIdentityDocuments(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/identity-documents`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder identity documents");
  }

  return response.json() as Promise<{ data: ShareholderIdentityDocument[] }>;
}

export type CreateIdentityDocumentInput = {
  documentRole?: string | undefined;
  idType?: string | undefined;
  idNumber?: string | undefined;
  issuingAuthority?: string | undefined;
  issueDate?: string | undefined;
  expiryDate?: string | undefined;
  countryOfIssue?: string | undefined;
  documentReferenceId?: string | undefined;
  verificationStatus?: string | undefined;
  verifiedBy?: string | undefined;
  verifiedAt?: string | undefined;
  notes?: string | undefined;
};

export async function createShareholderIdentityDocument(
  shareholderId: string,
  input: CreateIdentityDocumentInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderIdentityDocument }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/identity-documents`,
    "POST",
    input,
    "Failed to create shareholder identity document",
    token
  );
}

export async function fetchShareholderKycProfile(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/kyc-profile`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder KYC profile");
  }

  return response.json() as Promise<{ data: ShareholderKycProfile | null }>;
}

export type UpdateKycProfileInput = Record<string, unknown>;

export async function updateShareholderKycProfile(
  shareholderId: string,
  input: UpdateKycProfileInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderKycProfile }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/kyc-profile`,
    "PUT",
    input,
    "Failed to update shareholder KYC profile",
    token
  );
}

export async function fetchShareholderBeneficialOwners(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/beneficial-owners`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder beneficial owners");
  }

  return response.json() as Promise<{ data: ShareholderBeneficialOwner[] }>;
}

export type CreateBeneficialOwnerInput = {
  isUltimateBeneficialOwner?: boolean | undefined;
  beneficialOwnerFullName?: string | undefined;
  relationshipToShareholder?: string | undefined;
  beneficialOwnerIdType?: string | undefined;
  beneficialOwnerIdNumber?: string | undefined;
  beneficialOwnerTin?: string | undefined;
  beneficialOwnerCountryOfResidence?: string | undefined;
  percentageReference?: number | undefined;
  verificationStatus?: string | undefined;
  verificationMethod?: string | undefined;
  verificationNotes?: string | undefined;
  verifiedBy?: string | undefined;
  verifiedAt?: string | undefined;
  documentReferenceId?: string | undefined;
};

export async function createShareholderBeneficialOwner(
  shareholderId: string,
  input: CreateBeneficialOwnerInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderBeneficialOwner }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/beneficial-owners`,
    "POST",
    input,
    "Failed to create shareholder beneficial owner",
    token
  );
}

export async function fetchShareholderNextOfKin(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/next-of-kin`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder next of kin");
  }

  return response.json() as Promise<{ data: ShareholderNextOfKin[] }>;
}

export type UpdateNextOfKinInput = {
  contacts: {
    fullName?: string | undefined;
    relationship?: string | undefined;
    phoneNumber?: string | undefined;
    emailAddress?: string | undefined;
    residentialAddress?: string | undefined;
    cityCountry?: string | undefined;
    isPrimary?: boolean | undefined;
    notes?: string | undefined;
  }[];
};

export async function updateShareholderNextOfKin(
  shareholderId: string,
  input: UpdateNextOfKinInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderNextOfKin[] }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/next-of-kin`,
    "PUT",
    input,
    "Failed to update shareholder next of kin",
    token
  );
}

export async function fetchShareholderDocumentChecklist(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/document-checklist`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder document checklist");
  }

  return response.json() as Promise<{
    data: ShareholderDocumentChecklistItem[];
  }>;
}

export type UpdateDocumentChecklistInput = {
  items: {
    documentType: string;
    requirementStatus?: string | undefined;
    checklistStatus?: string | undefined;
    sourceBasis?: string | undefined;
    documentReferenceId?: string | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: string | undefined;
    notes?: string | undefined;
  }[];
};

export async function updateShareholderDocumentChecklist(
  shareholderId: string,
  input: UpdateDocumentChecklistInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderDocumentChecklistItem[] }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/document-checklist`,
    "PUT",
    input,
    "Failed to update shareholder document checklist",
    token
  );
}

export async function fetchShareholderPaymentProfile(
  shareholderId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/payment-profile`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder payment profile");
  }

  return response.json() as Promise<{ data: ShareholderPaymentProfile[] }>;
}

export type UpdatePaymentProfileInput = {
  paymentProfileType?: string | undefined;
  bankName?: string | undefined;
  branchNameCode?: string | undefined;
  accountName?: string | undefined;
  accountNumber?: string | undefined;
  accountType?: string | undefined;
  swiftBicCode?: string | undefined;
  iban?: string | undefined;
  mobileWalletIdentifier?: string | undefined;
  dividendPaymentPreference?: string | undefined;
  paymentMethod?: string | undefined;
  totalInvestmentAmount?: number | undefined;
  paymentVerificationStatus?: string | undefined;
  paymentVerifiedBy?: string | undefined;
  paymentVerifiedAt?: string | undefined;
  documentReferenceId?: string | undefined;
  notes?: string | undefined;
};

export async function updateShareholderPaymentProfile(
  shareholderId: string,
  input: UpdatePaymentProfileInput,
  token: string
) {
  return sendJsonRequest<{ data: ShareholderPaymentProfile }>(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/payment-profile`,
    "PUT",
    input,
    "Failed to update shareholder payment profile",
    token
  );
}

export const getShareholderProfileDetails = fetchShareholderProfileDetails;
export const getShareholderIdentityDocuments =
  fetchShareholderIdentityDocuments;
export const getShareholderKycProfile = fetchShareholderKycProfile;
export const getShareholderBeneficialOwners = fetchShareholderBeneficialOwners;
export const getShareholderNextOfKin = fetchShareholderNextOfKin;
export const getShareholderDocumentChecklist =
  fetchShareholderDocumentChecklist;
export const getShareholderPaymentProfile = fetchShareholderPaymentProfile;

export type UpdateShareholderKycInput = {
  kycStatus: "not_started" | "pending" | "verified" | "expired";
  kycExpiry?: string;
  riskClassification: "low" | "medium" | "high";
  decisionNotes: string;
};

export async function updateShareholderKyc(
  shareholderId: string,
  input: UpdateShareholderKycInput,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/kyc`,
    "PATCH",
    input,
    "Failed to update shareholder KYC",
    token
  );
}

export async function fetchCapTable(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/cap-table`, token);
}

export async function fetchTransfers(token?: string, page = 1, limit = 50) {
  return sendGetRequest(`${API_BASE_URL}/api/transfers?page=${page}&limit=${limit}`, token);
}

export type TransferEligibilityInput = {
  entityId: string;
  transferorId: string;
  transfereeId: string;
  shares: number;
  pricePerShare?: number;
};

export type CreateTransferInput = TransferEligibilityInput & {
  supportingDocuments?: unknown[];
};

export async function checkTransferEligibility(
  input: TransferEligibilityInput,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/transfers/eligibility-check`,
    "POST",
    input,
    "Failed to check transfer eligibility",
    token
  );
}

export async function createTransfer(input: CreateTransferInput, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/transfers`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to create transfer";

    try {
      const body = await response.json();
      const blockingReasons = body?.error?.details?.blockingReasons;
      message =
        body?.error?.message ||
        (Array.isArray(blockingReasons)
          ? `Transfer blocked: ${blockingReasons.join(", ")}`
          : undefined) ||
        (typeof body?.error === "string" ? body.error : undefined) ||
        body?.message ||
        message;
    } catch {
      // Keep the generic message if the API did not return JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function cancelTransfer(
  transferId: string,
  reason: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/transfers/${transferId}/cancel`,
    "POST",
    { reason },
    "Failed to cancel transfer",
    token
  );
}

export async function fetchApprovals(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/approvals`, token);
}

export async function rejectApproval(
  approvalId: string,
  decisionNotes: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/approvals/${approvalId}/reject`,
    "POST",
    { decisionNotes },
    "Failed to reject approval",
    token
  );
}

export async function approveChecker1(
  approvalId: string,
  decisionNotes: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/approvals/${approvalId}/approve-checker-1`,
    "POST",
    { decisionNotes },
    "Failed to approve Checker 1",
    token
  );
}

export async function approveChecker2(
  approvalId: string,
  decisionNotes: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/approvals/${approvalId}/approve-checker-2`,
    "POST",
    { decisionNotes },
    "Failed to approve Checker 2",
    token
  );
}

export async function fetchAuditLogs(token?: string, page = 1, limit = 50) {
  return sendGetRequest(`${API_BASE_URL}/api/audit-logs?page=${page}&limit=${limit}`, token);
}

export async function fetchSlaMonitor(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/sla-monitor`, token);
}

export async function fetchLegalHolds(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/legal-holds`, token);
}

export async function fetchCommunications(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/communications`, token);
}

export async function fetchDocuments(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/documents`, token);
}

export async function fetchCertificates(token?: string, page = 1, limit = 50) {
  return sendGetRequest(`${API_BASE_URL}/api/certificates?page=${page}&limit=${limit}`, token);
}

export async function createCertificate(
  data: { shareholder_id: string; quantity: number; serial_number: string },
  token?: string
) {
  return sendJsonRequest(`${API_BASE_URL}/api/certificates`, "POST", data, "Failed to create certificate", token);
}

export async function fetchCertificateRenderData(
  certificateId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/${certificateId}/render-data`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch certificate render data");
  }

  return response.json();
}

export function getCertificatePrintPreviewUrl(certificateId: string) {
  return `${API_BASE_URL}/api/certificates/${certificateId}/print-preview`;
}

export function getCertificateQrSvgUrl(certificateId: string) {
  return `${API_BASE_URL}/api/certificates/${certificateId}/qr.svg`;
}

export async function fetchCertificateEvents(
  certificateId: string,
  token?: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/${certificateId}/events`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch certificate events");
  }

  return response.json();
}

// Public endpoints — no auth required
export async function verifyCertificate(serialNumber: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/verify/${encodeURIComponent(serialNumber)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    return response.json();
  }

  if (!response.ok) {
    throw new Error("Failed to verify certificate");
  }

  return response.json();
}

export async function verifyCertificateByToken(qrToken: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/verify/by-token/${encodeURIComponent(qrToken)}`,
    { cache: "no-store" }
  );

  if (response.status === 404) {
    return response.json();
  }

  if (!response.ok) {
    throw new Error("Failed to verify certificate token");
  }

  return response.json();
}

// Certificate actions
export async function issueCertificate(certificateId: string, token: string) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/certificates/${certificateId}/issue`,
    "POST",
    {},
    "Failed to issue certificate",
    token
  );
}

export async function revokeCertificate(
  certificateId: string,
  reason: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/certificates/${certificateId}/revoke`,
    "POST",
    { reason },
    "Failed to revoke certificate",
    token
  );
}

export async function reissueCertificate(
  certificateId: string,
  newSerialNumber: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/certificates/${certificateId}/reissue`,
    "POST",
    { newSerialNumber },
    "Failed to reissue certificate",
    token
  );
}

// Import commit
export async function commitShareholderImportBatch(
  batchId: string,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/imports/shareholders/batches/${batchId}/commit`,
    "POST",
    {},
    "Failed to commit import batch",
    token
  );
}

// Share class management
export async function createShareClass(
  input: Record<string, unknown>,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/share-classes`,
    "POST",
    input,
    "Failed to create share class",
    token
  );
}

export async function updateShareClass(
  shareClassId: string,
  input: Record<string, unknown>,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/share-classes/${shareClassId}`,
    "PUT",
    input,
    "Failed to update share class",
    token
  );
}

// Board resolutions
export async function fetchBoardResolutions(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/board-resolutions`, token);
}

export async function createBoardResolution(
  input: Record<string, unknown>,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/board-resolutions`,
    "POST",
    input,
    "Failed to create board resolution",
    token
  );
}

// SLA config
export async function fetchSlaConfig(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/sla-config`, token);
}

export async function updateSlaConfig(
  slaConfigId: string,
  input: Record<string, unknown>,
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/sla-config/${slaConfigId}`,
    "PUT",
    input,
    "Failed to update SLA config",
    token
  );
}

// Dividend Register
export async function fetchDividends(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/dividends`, token);
}

export async function fetchDividend(id: string, token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/dividends/${id}`, token);
}

export async function createDividend(
  input: {
    record_date: string;
    payment_date?: string;
    amount_per_share: number;
    share_class_id?: string;
    withholding_tax_rate?: number;
    board_resolution_ref?: string;
    notes?: string;
  },
  token: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/dividends`,
    "POST",
    input,
    "Failed to create dividend declaration",
    token
  );
}

export async function markDividendPaid(id: string, token: string) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/dividends/${id}/mark-paid`,
    "PATCH",
    {},
    "Failed to mark dividend as paid",
    token
  );
}

// Power Automate webhook test
export async function testPowerAutomateWebhook(token: string) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/integrations/power-automate/test`,
    "POST",
    {},
    "Failed to test Power Automate webhook",
    token
  ) as Promise<{ success: boolean; statusCode?: number; error?: string }>;
}

export async function fetchUsers(token?: string) {
  return sendGetRequest(`${API_BASE_URL}/api/users`, token);
}

export async function updateUserRole(
  userId: string,
  role: string,
  token?: string
) {
  return sendJsonRequest(
    `${API_BASE_URL}/api/users/${userId}/role`,
    "PATCH",
    { role },
    "Failed to update user role",
    token
  );
}
