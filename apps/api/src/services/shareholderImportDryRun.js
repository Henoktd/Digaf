"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digafShareholderImportFieldMapping = void 0;
exports.validateShareholderImportDryRun = validateShareholderImportDryRun;
const allowedShareholderTypes = new Set(["individual", "institution", "corporate"]);
const allowedStatuses = new Set([
    "draft",
    "pending",
    "pending_review",
    "active",
    "suspended",
    "closed",
]);
const allowedRiskRatings = new Set(["low", "medium", "high"]);
const allowedScreeningResults = new Set([
    "clear",
    "match",
    "potential_match",
    "pending",
    "not_screened",
    "approved",
    "rejected",
]);
const allowedAmlApprovalStatuses = new Set([
    "approved",
    "pending",
    "rejected",
    "not_reviewed",
]);
exports.digafShareholderImportFieldMapping = [
    {
        excelHeader: "Shareholder ID",
        field: "shareholderCode",
        target: "shareholder.shareholder_code",
        required: false,
    },
    {
        excelHeader: "Full Name",
        field: "legalName",
        target: "shareholder.legal_name",
        required: true,
    },
    {
        excelHeader: "Gender",
        field: "gender",
        target: "shareholder.gender",
        required: "individual",
    },
    {
        excelHeader: "Date of Birth",
        field: "dateOfBirth",
        target: "shareholder.date_of_birth",
        required: "individual",
    },
    {
        excelHeader: "Nationality",
        field: "nationality",
        target: "shareholder.nationality",
        required: true,
    },
    {
        excelHeader: "Occupation",
        field: "occupation",
        target: "shareholder.occupation",
        required: "individual",
    },
    {
        excelHeader: "TIN Number",
        field: "tinNumber",
        target: "shareholder.tin_number",
        required: true,
    },
    {
        excelHeader: "National ID / Passport Number",
        field: "primaryIdNumber",
        target: "shareholder.primary_id_number",
        required: true,
    },
    {
        excelHeader: "Mobile Number",
        field: "mobileNumber",
        target: "shareholder.mobile_number",
        required: true,
    },
    {
        excelHeader: "Email Address",
        field: "emailAddress",
        target: "shareholder.email_address",
        required: true,
    },
    {
        excelHeader: "Physical Address",
        field: "physicalAddress",
        target: "shareholder.physical_address",
        required: true,
    },
    {
        excelHeader: "Share Certificate Number",
        field: "shareCertificateNumber",
        target: "share_certificate.serial_number",
        required: "after_issuance",
    },
    {
        excelHeader: "Number of Shares Purchased",
        field: "numberOfSharesPurchased",
        target: "future subscription / share ownership quantity",
        required: true,
    },
    {
        excelHeader: "Par Value Per Share",
        field: "parValuePerShare",
        target: "share_class.par_value or subscription snapshot",
        required: true,
    },
    {
        excelHeader: "Total Investment Amount",
        field: "totalInvestmentAmount",
        target: "shareholder_payment_profiles.total_investment_amount",
        required: true,
    },
    {
        excelHeader: "Date of Purchase",
        field: "dateOfPurchase",
        target: "future subscription / ownership effective date",
        required: true,
    },
    {
        excelHeader: "Payment Method",
        field: "paymentMethod",
        target: "shareholder_payment_profiles.payment_method",
        required: true,
    },
    {
        excelHeader: "Source of Funds Declaration",
        field: "sourceOfFundsDeclaration",
        target: "shareholder.source_of_funds_declaration",
        required: true,
    },
    {
        excelHeader: "CDD Completed",
        field: "cddCompleted",
        target: "shareholder_kyc_profiles.cdd_completed",
        required: true,
    },
    {
        excelHeader: "PEP Status",
        field: "pepStatus",
        target: "shareholder_kyc_profiles.pep_status",
        required: true,
    },
    {
        excelHeader: "Sanction Screening Result",
        field: "sanctionScreeningResult",
        target: "shareholder_kyc_profiles.sanction_screening_result",
        required: true,
    },
    {
        excelHeader: "Adverse Media Screening Result",
        field: "adverseMediaScreeningResult",
        target: "shareholder_kyc_profiles.adverse_media_screening_result",
        required: true,
    },
    {
        excelHeader: "Risk Rating",
        field: "riskRating",
        target: "shareholder_kyc_profiles.risk_rating",
        required: true,
    },
    {
        excelHeader: "AML Officer Approval",
        field: "amlOfficerApprovalStatus",
        target: "shareholder_kyc_profiles.aml_officer_approval_status",
        required: true,
    },
];
function toKey(value) {
    return value?.trim().toLowerCase() || null;
}
function readOptionalString(row, field) {
    const value = row[field];
    if (value === undefined || value === null) {
        return null;
    }
    return String(value).trim() || null;
}
function readOptionalNumber(row, field) {
    const value = row[field];
    if (value === undefined || value === null || value === "") {
        return null;
    }
    const numericValue = typeof value === "number" ? value : Number(String(value).trim());
    return Number.isFinite(numericValue) ? numericValue : Number.NaN;
}
function readOptionalBoolean(row, field) {
    const value = row[field];
    if (value === undefined || value === null || value === "") {
        return null;
    }
    if (typeof value === "boolean") {
        return value;
    }
    const normalized = String(value).trim().toLowerCase();
    if (["yes", "y", "true", "1", "completed"].includes(normalized)) {
        return true;
    }
    if (["no", "n", "false", "0", "not completed"].includes(normalized)) {
        return false;
    }
    return null;
}
function readRowNumber(row, index) {
    const rowNumber = row.rowNumber;
    if (typeof rowNumber === "number" && Number.isInteger(rowNumber) && rowNumber > 0) {
        return rowNumber;
    }
    return index + 2;
}
function isValidDateString(value) {
    if (!value) {
        return true;
    }
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value);
}
function isFutureDate(value) {
    if (!value || !isValidDateString(value)) {
        return false;
    }
    const inputDate = new Date(`${value}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return inputDate > today;
}
function addMessage(messages, rowNumber, input) {
    messages.push({
        rowNumber,
        ...input,
    });
}
function addRequiredError(messages, rowNumber, field, label) {
    addMessage(messages, rowNumber, {
        field,
        severity: "error",
        code: "required_field_missing",
        message: `${label} is required for Digaf import dry-run validation.`,
        suggestedAction: `Capture ${label} in the source row before import commit.`,
        responsibleRole: "Maker",
    });
}
function normalizeRow(row, index) {
    const normalizedType = readOptionalString(row, "type")?.toLowerCase() ?? "individual";
    return {
        rowNumber: readRowNumber(row, index),
        shareholderCode: readOptionalString(row, "shareholderCode"),
        legalName: readOptionalString(row, "legalName"),
        type: normalizedType,
        gender: readOptionalString(row, "gender"),
        dateOfBirth: readOptionalString(row, "dateOfBirth"),
        nationality: readOptionalString(row, "nationality"),
        occupation: readOptionalString(row, "occupation"),
        tinNumber: readOptionalString(row, "tinNumber"),
        primaryIdNumber: readOptionalString(row, "primaryIdNumber"),
        mobileNumber: readOptionalString(row, "mobileNumber"),
        emailAddress: readOptionalString(row, "emailAddress")?.toLowerCase() ?? null,
        physicalAddress: readOptionalString(row, "physicalAddress"),
        shareCertificateNumber: readOptionalString(row, "shareCertificateNumber"),
        numberOfSharesPurchased: readOptionalNumber(row, "numberOfSharesPurchased"),
        parValuePerShare: readOptionalNumber(row, "parValuePerShare"),
        totalInvestmentAmount: readOptionalNumber(row, "totalInvestmentAmount"),
        dateOfPurchase: readOptionalString(row, "dateOfPurchase"),
        paymentMethod: readOptionalString(row, "paymentMethod"),
        sourceOfFundsDeclaration: readOptionalString(row, "sourceOfFundsDeclaration"),
        status: readOptionalString(row, "status")?.toLowerCase() ?? null,
        cddCompleted: readOptionalBoolean(row, "cddCompleted"),
        pepStatus: readOptionalString(row, "pepStatus")?.toLowerCase() ?? null,
        sanctionScreeningResult: readOptionalString(row, "sanctionScreeningResult")?.toLowerCase() ?? null,
        adverseMediaScreeningResult: readOptionalString(row, "adverseMediaScreeningResult")?.toLowerCase() ??
            null,
        riskRating: readOptionalString(row, "riskRating")?.toLowerCase() ?? null,
        amlOfficerApprovalStatus: readOptionalString(row, "amlOfficerApprovalStatus")?.toLowerCase() ?? null,
    };
}
function validateRowShape(normalized, messages) {
    const { rowNumber } = normalized;
    if (!normalized.legalName)
        addRequiredError(messages, rowNumber, "legalName", "Full name");
    if (!normalized.nationality)
        addRequiredError(messages, rowNumber, "nationality", "Nationality");
    if (!normalized.tinNumber)
        addRequiredError(messages, rowNumber, "tinNumber", "TIN number");
    if (!normalized.primaryIdNumber)
        addRequiredError(messages, rowNumber, "primaryIdNumber", "National ID / passport number");
    if (!normalized.mobileNumber)
        addRequiredError(messages, rowNumber, "mobileNumber", "Mobile number");
    if (!normalized.emailAddress)
        addRequiredError(messages, rowNumber, "emailAddress", "Email address");
    if (!normalized.physicalAddress)
        addRequiredError(messages, rowNumber, "physicalAddress", "Physical address");
    if (!normalized.paymentMethod)
        addRequiredError(messages, rowNumber, "paymentMethod", "Payment method");
    if (!normalized.sourceOfFundsDeclaration)
        addRequiredError(messages, rowNumber, "sourceOfFundsDeclaration", "Source of funds declaration");
    if (!normalized.pepStatus)
        addRequiredError(messages, rowNumber, "pepStatus", "PEP status");
    if (!normalized.sanctionScreeningResult)
        addRequiredError(messages, rowNumber, "sanctionScreeningResult", "Sanction screening result");
    if (!normalized.adverseMediaScreeningResult)
        addRequiredError(messages, rowNumber, "adverseMediaScreeningResult", "Adverse media screening result");
    if (!normalized.riskRating)
        addRequiredError(messages, rowNumber, "riskRating", "Risk rating");
    if (!normalized.amlOfficerApprovalStatus)
        addRequiredError(messages, rowNumber, "amlOfficerApprovalStatus", "AML Officer approval");
    if (normalized.cddCompleted === null) {
        addRequiredError(messages, rowNumber, "cddCompleted", "CDD completed");
    }
    if (normalized.type && !allowedShareholderTypes.has(normalized.type)) {
        addMessage(messages, rowNumber, {
            field: "type",
            severity: "error",
            code: "invalid_value",
            message: "Shareholder type must be individual, institution, or corporate.",
            suggestedAction: "Map the Excel value to an approved shareholder type.",
            responsibleRole: "Maker",
        });
    }
    if (normalized.type === "individual") {
        if (!normalized.gender)
            addRequiredError(messages, rowNumber, "gender", "Gender");
        if (!normalized.dateOfBirth)
            addRequiredError(messages, rowNumber, "dateOfBirth", "Date of birth");
        if (!normalized.occupation)
            addRequiredError(messages, rowNumber, "occupation", "Occupation");
    }
    if (!isValidDateString(normalized.dateOfBirth)) {
        addMessage(messages, rowNumber, {
            field: "dateOfBirth",
            severity: "error",
            code: "invalid_date",
            message: "Date of birth must use YYYY-MM-DD format.",
            suggestedAction: "Correct the source date before import commit.",
            responsibleRole: "Maker",
        });
    }
    if (isFutureDate(normalized.dateOfBirth)) {
        addMessage(messages, rowNumber, {
            field: "dateOfBirth",
            severity: "error",
            code: "future_date",
            message: "Date of birth cannot be in the future.",
            suggestedAction: "Correct the source date before import commit.",
            responsibleRole: "Maker",
        });
    }
    if (!isValidDateString(normalized.dateOfPurchase)) {
        addMessage(messages, rowNumber, {
            field: "dateOfPurchase",
            severity: "error",
            code: "invalid_date",
            message: "Date of purchase must use YYYY-MM-DD format.",
            suggestedAction: "Correct the source date before import commit.",
            responsibleRole: "Maker",
        });
    }
    if (isFutureDate(normalized.dateOfPurchase)) {
        addMessage(messages, rowNumber, {
            field: "dateOfPurchase",
            severity: "warning",
            code: "future_purchase_date",
            message: "Date of purchase is in the future.",
            suggestedAction: "Confirm whether this is a planned subscription or a source-data error.",
            responsibleRole: "Governance",
        });
    }
    if (normalized.emailAddress &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.emailAddress)) {
        addMessage(messages, rowNumber, {
            field: "emailAddress",
            severity: "error",
            code: "invalid_email",
            message: "Email address is not valid.",
            suggestedAction: "Correct the email address in the source row.",
            responsibleRole: "Maker",
        });
    }
    if (normalized.mobileNumber && normalized.mobileNumber.length < 7) {
        addMessage(messages, rowNumber, {
            field: "mobileNumber",
            severity: "error",
            code: "invalid_mobile_number",
            message: "Mobile number must be at least 7 characters.",
            suggestedAction: "Correct the mobile number in the source row.",
            responsibleRole: "Maker",
        });
    }
    validatePositiveNumber(normalized, messages, "numberOfSharesPurchased", "Number of shares purchased");
    validatePositiveNumber(normalized, messages, "parValuePerShare", "Par value per share");
    validateNonNegativeNumber(normalized, messages, "totalInvestmentAmount", "Total investment amount");
    if (normalized.numberOfSharesPurchased !== null &&
        Number.isFinite(normalized.numberOfSharesPurchased) &&
        normalized.parValuePerShare !== null &&
        Number.isFinite(normalized.parValuePerShare) &&
        normalized.totalInvestmentAmount !== null &&
        Number.isFinite(normalized.totalInvestmentAmount)) {
        const nominalValue = normalized.numberOfSharesPurchased * normalized.parValuePerShare;
        const difference = Math.abs(nominalValue - normalized.totalInvestmentAmount);
        if (difference > 0.01) {
            addMessage(messages, rowNumber, {
                field: "totalInvestmentAmount",
                severity: "warning",
                code: "investment_amount_reconciliation",
                message: "Total investment amount does not equal shares purchased multiplied by par value.",
                suggestedAction: "Finance should confirm whether a share premium, discount, or source-data correction applies.",
                responsibleRole: "Finance",
            });
        }
    }
    if (normalized.status && !allowedStatuses.has(normalized.status)) {
        addMessage(messages, rowNumber, {
            field: "status",
            severity: "warning",
            code: "unmapped_status",
            message: "Status is not in the current pilot status list.",
            suggestedAction: "Governance should map this value before import commit.",
            responsibleRole: "Governance",
        });
    }
    if (normalized.riskRating && !allowedRiskRatings.has(normalized.riskRating)) {
        addMessage(messages, rowNumber, {
            field: "riskRating",
            severity: "error",
            code: "invalid_risk_rating",
            message: "Risk rating must be low, medium, or high.",
            suggestedAction: "Compliance should map the source value to the approved risk scale.",
            responsibleRole: "Compliance",
        });
    }
    validateScreeningValue(normalized, messages, "pepStatus", "PEP status");
    validateScreeningValue(normalized, messages, "sanctionScreeningResult", "Sanction screening result");
    validateScreeningValue(normalized, messages, "adverseMediaScreeningResult", "Adverse media screening result");
    if (normalized.amlOfficerApprovalStatus &&
        !allowedAmlApprovalStatuses.has(normalized.amlOfficerApprovalStatus)) {
        addMessage(messages, rowNumber, {
            field: "amlOfficerApprovalStatus",
            severity: "error",
            code: "invalid_aml_approval_status",
            message: "AML Officer approval must be approved, pending, rejected, or not_reviewed.",
            suggestedAction: "Compliance should map the source approval status.",
            responsibleRole: "Compliance",
        });
    }
}
function validatePositiveNumber(normalized, messages, field, label) {
    const value = normalized[field];
    if (value === null) {
        addRequiredError(messages, normalized.rowNumber, field, label);
        return;
    }
    if (!Number.isFinite(value) || value <= 0) {
        addMessage(messages, normalized.rowNumber, {
            field,
            severity: "error",
            code: "invalid_number",
            message: `${label} must be greater than zero.`,
            suggestedAction: "Correct the numeric source value before import commit.",
            responsibleRole: "Maker",
        });
    }
}
function validateNonNegativeNumber(normalized, messages, field, label) {
    const value = normalized[field];
    if (value === null) {
        addRequiredError(messages, normalized.rowNumber, field, label);
        return;
    }
    if (!Number.isFinite(value) || value < 0) {
        addMessage(messages, normalized.rowNumber, {
            field,
            severity: "error",
            code: "invalid_number",
            message: `${label} must be zero or greater.`,
            suggestedAction: "Correct the numeric source value before import commit.",
            responsibleRole: "Maker",
        });
    }
}
function validateScreeningValue(normalized, messages, field, label) {
    const value = normalized[field];
    if (value && !allowedScreeningResults.has(value)) {
        addMessage(messages, normalized.rowNumber, {
            field,
            severity: "warning",
            code: "unmapped_screening_result",
            message: `${label} is not in the current pilot screening value list.`,
            suggestedAction: "Compliance should confirm source vocabulary before import commit.",
            responsibleRole: "Compliance",
        });
    }
}
function addDuplicateMessages(rows, existingIndex) {
    const batchIndexes = {
        shareholderCode: new Map(),
        tinNumber: new Map(),
        primaryIdNumber: new Map(),
        emailAddress: new Map(),
        mobileNumber: new Map(),
        shareCertificateNumber: new Map(),
    };
    for (const row of rows) {
        indexBatchValue(batchIndexes.shareholderCode, row.normalized.shareholderCode, row.rowNumber);
        indexBatchValue(batchIndexes.tinNumber, row.normalized.tinNumber, row.rowNumber);
        indexBatchValue(batchIndexes.primaryIdNumber, row.normalized.primaryIdNumber, row.rowNumber);
        indexBatchValue(batchIndexes.emailAddress, row.normalized.emailAddress, row.rowNumber);
        indexBatchValue(batchIndexes.mobileNumber, row.normalized.mobileNumber, row.rowNumber);
        indexBatchValue(batchIndexes.shareCertificateNumber, row.normalized.shareCertificateNumber, row.rowNumber);
        checkExistingDuplicate(row, existingIndex);
    }
    for (const row of rows) {
        checkBatchDuplicate(row, batchIndexes.shareholderCode, "shareholderCode", "Shareholder code", "error");
        checkBatchDuplicate(row, batchIndexes.tinNumber, "tinNumber", "TIN number", "warning");
        checkBatchDuplicate(row, batchIndexes.primaryIdNumber, "primaryIdNumber", "Primary ID number", "warning");
        checkBatchDuplicate(row, batchIndexes.emailAddress, "emailAddress", "Email address", "warning");
        checkBatchDuplicate(row, batchIndexes.mobileNumber, "mobileNumber", "Mobile number", "warning");
        checkBatchDuplicate(row, batchIndexes.shareCertificateNumber, "shareCertificateNumber", "Share certificate number", "error");
    }
}
function indexBatchValue(index, value, rowNumber) {
    const key = toKey(value);
    if (!key) {
        return;
    }
    const rows = index.get(key) ?? [];
    rows.push(rowNumber);
    index.set(key, rows);
}
function checkExistingDuplicate(row, existingIndex) {
    const { normalized } = row;
    const rowNumber = row.rowNumber;
    if (toKey(normalized.shareholderCode) && existingIndex.shareholderCodes.has(toKey(normalized.shareholderCode))) {
        addMessage(row.messages, rowNumber, {
            field: "shareholderCode",
            severity: "error",
            code: "existing_shareholder_code",
            message: "Shareholder code already exists in the current registry.",
            suggestedAction: "Use update/reconciliation mode or correct the source shareholder ID.",
            responsibleRole: "Governance",
        });
    }
    if (toKey(normalized.shareCertificateNumber) && existingIndex.certificateNumbers.has(toKey(normalized.shareCertificateNumber))) {
        addMessage(row.messages, rowNumber, {
            field: "shareCertificateNumber",
            severity: "error",
            code: "existing_certificate_number",
            message: "Share certificate number already exists.",
            suggestedAction: "Use certificate migration/reconciliation mode or correct the certificate number.",
            responsibleRole: "Governance",
        });
    }
    if (toKey(normalized.tinNumber) && existingIndex.tinNumbers.has(toKey(normalized.tinNumber))) {
        addDuplicateWarning(row, "tinNumber", "TIN number already exists in the current registry.");
    }
    if (toKey(normalized.primaryIdNumber) && existingIndex.primaryIdNumbers.has(toKey(normalized.primaryIdNumber))) {
        addDuplicateWarning(row, "primaryIdNumber", "Primary ID number already exists in the current registry.");
    }
    if (toKey(normalized.emailAddress) && existingIndex.emailAddresses.has(toKey(normalized.emailAddress))) {
        addDuplicateWarning(row, "emailAddress", "Email address already exists in the current registry.");
    }
    if (toKey(normalized.mobileNumber) && existingIndex.mobileNumbers.has(toKey(normalized.mobileNumber))) {
        addDuplicateWarning(row, "mobileNumber", "Mobile number already exists in the current registry.");
    }
}
function addDuplicateWarning(row, field, message) {
    addMessage(row.messages, row.rowNumber, {
        field,
        severity: "warning",
        code: "duplicate_candidate",
        message,
        suggestedAction: "Compliance or Governance should confirm whether this is the same shareholder before import commit.",
        responsibleRole: "Compliance",
    });
}
function checkBatchDuplicate(row, index, field, label, severity) {
    const value = row.normalized[field];
    const key = typeof value === "string" ? toKey(value) : null;
    if (!key) {
        return;
    }
    const matchingRows = index.get(key) ?? [];
    if (matchingRows.length <= 1) {
        return;
    }
    addMessage(row.messages, row.rowNumber, {
        field,
        severity,
        code: severity === "error" ? "batch_duplicate_blocker" : "duplicate_candidate",
        message: `${label} appears on multiple import rows: ${matchingRows.join(", ")}.`,
        suggestedAction: severity === "error"
            ? "Resolve the duplicate before import commit."
            : "Confirm whether the duplicate indicates the same shareholder or shared contact data.",
        responsibleRole: severity === "error" ? "Governance" : "Compliance",
    });
}
function summarize(rows) {
    const summary = rows.reduce((current, row) => {
        const errorCount = row.messages.filter((message) => message.severity === "error").length;
        const warningCount = row.messages.filter((message) => message.severity === "warning").length;
        return {
            totalRows: current.totalRows + 1,
            readyRows: current.readyRows +
                (errorCount === 0 && warningCount === 0 ? 1 : 0),
            warningRows: current.warningRows +
                (errorCount === 0 && warningCount > 0 ? 1 : 0),
            blockedRows: current.blockedRows + (errorCount > 0 ? 1 : 0),
            errorCount: current.errorCount + errorCount,
            warningCount: current.warningCount + warningCount,
            duplicateCandidateCount: current.duplicateCandidateCount +
                row.messages.filter((message) => message.code.includes("duplicate")).length,
        };
    }, {
        totalRows: 0,
        readyRows: 0,
        warningRows: 0,
        blockedRows: 0,
        errorCount: 0,
        warningCount: 0,
        duplicateCandidateCount: 0,
    });
    return summary;
}
function validateShareholderImportDryRun(rawRows, existingIndex) {
    const rows = rawRows.map((row, index) => {
        const normalized = normalizeRow(row, index);
        const messages = [];
        validateRowShape(normalized, messages);
        return {
            rowNumber: normalized.rowNumber,
            status: "ready",
            normalized,
            messages,
        };
    });
    addDuplicateMessages(rows, existingIndex);
    const finalizedRows = rows.map((row) => {
        const errorCount = row.messages.filter((message) => message.severity === "error").length;
        const warningCount = row.messages.filter((message) => message.severity === "warning").length;
        return {
            ...row,
            status: errorCount > 0
                ? "blocked"
                : warningCount > 0
                    ? "ready_with_warnings"
                    : "ready",
        };
    });
    return {
        dryRunOnly: true,
        mappingVersion: "digaf-shareholder-registration-v1",
        generatedAtUtc: new Date().toISOString(),
        summary: summarize(finalizedRows),
        rows: finalizedRows,
        fieldMapping: exports.digafShareholderImportFieldMapping,
    };
}
//# sourceMappingURL=shareholderImportDryRun.js.map