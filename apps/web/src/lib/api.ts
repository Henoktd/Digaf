const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function fetchEntities() {
  const response = await fetch(`${API_BASE_URL}/api/entities`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch entities");
  }

  return response.json();
}

export async function fetchShareClasses() {
  const response = await fetch(`${API_BASE_URL}/api/share-classes`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch share classes");
  }

  return response.json();
}


export async function fetchShareholders() {
  const response = await fetch(`${API_BASE_URL}/api/shareholders`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shareholders");
  }

  return response.json();
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
  actorId: string;
};

export async function createShareholder(input: CreateShareholderInput) {
  const response = await fetch(`${API_BASE_URL}/api/shareholders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to create shareholder";

    try {
      const body = await response.json();
      message =
        body?.error?.message ||
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

export async function fetchShareholderProfile(shareholderId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch shareholder profile");
  }

  return response.json();
}

export type UpdateShareholderKycInput = {
  kycStatus: "not_started" | "pending" | "verified" | "expired";
  kycExpiry?: string;
  riskClassification: "low" | "medium" | "high";
  actorId: string;
  decisionNotes: string;
};

export async function updateShareholderKyc(
  shareholderId: string,
  input: UpdateShareholderKycInput
) {
  const response = await fetch(
    `${API_BASE_URL}/api/shareholders/${shareholderId}/kyc`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Failed to update shareholder KYC";

    try {
      const body = await response.json();
      message =
        body?.error?.message ||
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

export async function fetchCapTable() {
  const response = await fetch(`${API_BASE_URL}/api/cap-table`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cap table");
  }

  return response.json();
}

export async function fetchTransfers() {
  const response = await fetch(`${API_BASE_URL}/api/transfers`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transfers");
  }

  return response.json();
}

export type TransferGuardInput = {
  entityId: string;
  transferorId: string;
  transfereeId: string;
  shares: number;
  actorId: string;
};

export type CreateTransferInput = TransferGuardInput & {
  supportingDocuments?: unknown[];
};

export async function checkTransferEligibility(input: TransferGuardInput) {
  const response = await fetch(
    `${API_BASE_URL}/api/transfers/eligibility-check`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Failed to check transfer eligibility";

    try {
      const body = await response.json();
      message =
        body?.error?.message ||
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

export async function createTransfer(input: CreateTransferInput) {
  const response = await fetch(`${API_BASE_URL}/api/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

export async function fetchApprovals() {
  const response = await fetch(`${API_BASE_URL}/api/approvals`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch approvals");
  }

  return response.json();
}

export async function approveChecker1(
  approvalId: string,
  actorId: string,
  decisionNotes: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/approvals/${approvalId}/approve-checker-1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId,
        decisionNotes,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Failed to approve Checker 1";

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the generic message if the API did not return JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function approveChecker2(
  approvalId: string,
  actorId: string,
  decisionNotes: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/approvals/${approvalId}/approve-checker-2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        actorId,
        decisionNotes,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Failed to approve Checker 2";

    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the generic message if the API did not return JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function fetchAuditLogs() {
  const response = await fetch(`${API_BASE_URL}/api/audit-logs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return response.json();
}

export async function fetchSlaMonitor() {
  const response = await fetch(`${API_BASE_URL}/api/sla-monitor`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch SLA monitor");
  }

  return response.json();
}

export async function fetchLegalHolds() {
  const response = await fetch(`${API_BASE_URL}/api/legal-holds`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch legal holds");
  }

  return response.json();
}

export async function fetchCommunications() {
  const response = await fetch(`${API_BASE_URL}/api/communications`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch communications");
  }

  return response.json();
}

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}

export async function fetchCertificates() {
  const response = await fetch(`${API_BASE_URL}/api/certificates`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch certificates");
  }

  return response.json();
}

export async function fetchCertificateEvents(certificateId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/${certificateId}/events`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch certificate events");
  }

  return response.json();
}

export async function verifyCertificate(serialNumber: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/certificates/verify/${serialNumber}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to verify certificate");
  }

  return response.json();
}
