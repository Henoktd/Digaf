type CertificateCanonicalData = {
    entityId: string;
    serialNumber: string;
    shareholderId: string;
    shareClassId: string;
    quantity: string;
    issueDate: string;
    issuingAuthority: string;
};
export declare function buildCanonicalCertificateString(data: CertificateCanonicalData): string;
export declare function generateCertificateHash(canonicalString: string): string;
export declare function generateSignatureToken(certificateHash: string): string;
export {};
//# sourceMappingURL=certificateCrypto.d.ts.map