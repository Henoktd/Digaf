import crypto from "crypto";

type CertificateCanonicalData = {
  entityId: string;
  serialNumber: string;
  shareholderId: string;
  shareClassId?: string | null;
  quantity: string;
  issueDate: string;
  issuingAuthority: string;
};

export function buildCanonicalCertificateString(data: CertificateCanonicalData) {
  return [
    `entity_id=${data.entityId}`,
    `certificate_serial_number=${data.serialNumber}`,
    `shareholder_id=${data.shareholderId}`,
    `share_class_id=${data.shareClassId ?? ""}`,
    `quantity=${data.quantity}`,
    `issue_date=${data.issueDate}`,
    `issuing_authority=${data.issuingAuthority}`,
  ].join("|");
}

export function generateCertificateHash(canonicalString: string) {
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}

export function generateSignatureToken(certificateHash: string) {
  const secret = process.env.CERTIFICATE_HMAC_SECRET;

  if (!secret) {
    throw new Error("CERTIFICATE_HMAC_SECRET is not defined");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(certificateHash)
    .digest("hex");
}