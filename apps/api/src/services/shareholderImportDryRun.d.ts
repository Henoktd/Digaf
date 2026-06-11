export type ShareholderImportDryRunSeverity = "error" | "warning";
export type ShareholderImportValidationMessage = {
    rowNumber: number;
    field: string;
    severity: ShareholderImportDryRunSeverity;
    code: string;
    message: string;
    suggestedAction: string;
    responsibleRole: "Maker" | "Compliance" | "Finance" | "Governance";
};
export type ShareholderImportNormalizedRow = {
    rowNumber: number;
    shareholderCode: string | null;
    legalName: string | null;
    type: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    occupation: string | null;
    tinNumber: string | null;
    primaryIdNumber: string | null;
    mobileNumber: string | null;
    emailAddress: string | null;
    physicalAddress: string | null;
    shareCertificateNumber: string | null;
    numberOfSharesPurchased: number | null;
    parValuePerShare: number | null;
    totalInvestmentAmount: number | null;
    dateOfPurchase: string | null;
    paymentMethod: string | null;
    sourceOfFundsDeclaration: string | null;
    status: string | null;
    cddCompleted: boolean | null;
    pepStatus: string | null;
    sanctionScreeningResult: string | null;
    adverseMediaScreeningResult: string | null;
    riskRating: string | null;
    amlOfficerApprovalStatus: string | null;
};
export type ShareholderImportValidatedRow = {
    rowNumber: number;
    status: "ready" | "ready_with_warnings" | "blocked";
    normalized: ShareholderImportNormalizedRow;
    messages: ShareholderImportValidationMessage[];
};
export type ShareholderImportDryRunSummary = {
    totalRows: number;
    readyRows: number;
    warningRows: number;
    blockedRows: number;
    errorCount: number;
    warningCount: number;
    duplicateCandidateCount: number;
};
export type ShareholderImportDryRunResult = {
    dryRunOnly: true;
    mappingVersion: "digaf-shareholder-registration-v1";
    generatedAtUtc: string;
    summary: ShareholderImportDryRunSummary;
    rows: ShareholderImportValidatedRow[];
    fieldMapping: typeof digafShareholderImportFieldMapping;
};
export type ExistingShareholderImportIndex = {
    shareholderCodes: Set<string>;
    tinNumbers: Set<string>;
    primaryIdNumbers: Set<string>;
    emailAddresses: Set<string>;
    mobileNumbers: Set<string>;
    certificateNumbers: Set<string>;
};
type RawImportRow = Record<string, unknown>;
export declare const digafShareholderImportFieldMapping: readonly [{
    readonly excelHeader: "Shareholder ID";
    readonly field: "shareholderCode";
    readonly target: "shareholder.shareholder_code";
    readonly required: false;
}, {
    readonly excelHeader: "Full Name";
    readonly field: "legalName";
    readonly target: "shareholder.legal_name";
    readonly required: true;
}, {
    readonly excelHeader: "Gender";
    readonly field: "gender";
    readonly target: "shareholder.gender";
    readonly required: "individual";
}, {
    readonly excelHeader: "Date of Birth";
    readonly field: "dateOfBirth";
    readonly target: "shareholder.date_of_birth";
    readonly required: "individual";
}, {
    readonly excelHeader: "Nationality";
    readonly field: "nationality";
    readonly target: "shareholder.nationality";
    readonly required: true;
}, {
    readonly excelHeader: "Occupation";
    readonly field: "occupation";
    readonly target: "shareholder.occupation";
    readonly required: "individual";
}, {
    readonly excelHeader: "TIN Number";
    readonly field: "tinNumber";
    readonly target: "shareholder.tin_number";
    readonly required: true;
}, {
    readonly excelHeader: "National ID / Passport Number";
    readonly field: "primaryIdNumber";
    readonly target: "shareholder.primary_id_number";
    readonly required: true;
}, {
    readonly excelHeader: "Mobile Number";
    readonly field: "mobileNumber";
    readonly target: "shareholder.mobile_number";
    readonly required: true;
}, {
    readonly excelHeader: "Email Address";
    readonly field: "emailAddress";
    readonly target: "shareholder.email_address";
    readonly required: true;
}, {
    readonly excelHeader: "Physical Address";
    readonly field: "physicalAddress";
    readonly target: "shareholder.physical_address";
    readonly required: true;
}, {
    readonly excelHeader: "Share Certificate Number";
    readonly field: "shareCertificateNumber";
    readonly target: "share_certificate.serial_number";
    readonly required: "after_issuance";
}, {
    readonly excelHeader: "Number of Shares Purchased";
    readonly field: "numberOfSharesPurchased";
    readonly target: "future subscription / share ownership quantity";
    readonly required: true;
}, {
    readonly excelHeader: "Par Value Per Share";
    readonly field: "parValuePerShare";
    readonly target: "share_class.par_value or subscription snapshot";
    readonly required: true;
}, {
    readonly excelHeader: "Total Investment Amount";
    readonly field: "totalInvestmentAmount";
    readonly target: "shareholder_payment_profiles.total_investment_amount";
    readonly required: true;
}, {
    readonly excelHeader: "Date of Purchase";
    readonly field: "dateOfPurchase";
    readonly target: "future subscription / ownership effective date";
    readonly required: true;
}, {
    readonly excelHeader: "Payment Method";
    readonly field: "paymentMethod";
    readonly target: "shareholder_payment_profiles.payment_method";
    readonly required: true;
}, {
    readonly excelHeader: "Source of Funds Declaration";
    readonly field: "sourceOfFundsDeclaration";
    readonly target: "shareholder.source_of_funds_declaration";
    readonly required: true;
}, {
    readonly excelHeader: "CDD Completed";
    readonly field: "cddCompleted";
    readonly target: "shareholder_kyc_profiles.cdd_completed";
    readonly required: true;
}, {
    readonly excelHeader: "PEP Status";
    readonly field: "pepStatus";
    readonly target: "shareholder_kyc_profiles.pep_status";
    readonly required: true;
}, {
    readonly excelHeader: "Sanction Screening Result";
    readonly field: "sanctionScreeningResult";
    readonly target: "shareholder_kyc_profiles.sanction_screening_result";
    readonly required: true;
}, {
    readonly excelHeader: "Adverse Media Screening Result";
    readonly field: "adverseMediaScreeningResult";
    readonly target: "shareholder_kyc_profiles.adverse_media_screening_result";
    readonly required: true;
}, {
    readonly excelHeader: "Risk Rating";
    readonly field: "riskRating";
    readonly target: "shareholder_kyc_profiles.risk_rating";
    readonly required: true;
}, {
    readonly excelHeader: "AML Officer Approval";
    readonly field: "amlOfficerApprovalStatus";
    readonly target: "shareholder_kyc_profiles.aml_officer_approval_status";
    readonly required: true;
}];
export declare function validateShareholderImportDryRun(rawRows: RawImportRow[], existingIndex: ExistingShareholderImportIndex): ShareholderImportDryRunResult;
export {};
//# sourceMappingURL=shareholderImportDryRun.d.ts.map