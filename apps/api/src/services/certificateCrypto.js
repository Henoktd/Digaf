"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalCertificateString = buildCanonicalCertificateString;
exports.generateCertificateHash = generateCertificateHash;
exports.generateSignatureToken = generateSignatureToken;
const crypto_1 = __importDefault(require("crypto"));
function buildCanonicalCertificateString(data) {
    return [
        `entity_id=${data.entityId}`,
        `certificate_serial_number=${data.serialNumber}`,
        `shareholder_id=${data.shareholderId}`,
        `share_class_id=${data.shareClassId}`,
        `quantity=${data.quantity}`,
        `issue_date=${data.issueDate}`,
        `issuing_authority=${data.issuingAuthority}`,
    ].join("|");
}
function generateCertificateHash(canonicalString) {
    return crypto_1.default.createHash("sha256").update(canonicalString).digest("hex");
}
function generateSignatureToken(certificateHash) {
    const secret = process.env.CERTIFICATE_HMAC_SECRET;
    if (!secret) {
        throw new Error("CERTIFICATE_HMAC_SECRET is not defined");
    }
    return crypto_1.default
        .createHmac("sha256", secret)
        .update(certificateHash)
        .digest("hex");
}
//# sourceMappingURL=certificateCrypto.js.map