"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/src/lib/supabase/client";
import { fetchShareholdersExport } from "@/src/lib/api";

export function ExportExcelButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const result = await fetchShareholdersExport(token) as { data: Record<string, unknown>[] };
      const rows = result.data ?? [];

      const sheetRows = rows.map((s) => ({
        shareholderCode: s.shareholder_code ?? "",
        legalName: s.legal_name ?? "",
        type: s.type ?? "",
        gender: s.gender ?? "",
        dateOfBirth: s.date_of_birth ? String(s.date_of_birth).slice(0, 10) : "",
        nationality: s.nationality ?? "",
        occupation: s.occupation ?? "",
        tinNumber: s.tin_number ?? "",
        nationalIdFayda: "",
        primaryIdNumber: s.primary_id_number ?? "",
        mobileNumber: s.mobile_number ?? "",
        emailAddress: s.email_address ?? "",
        physicalAddress: s.physical_address ?? "",
        shareCertificateNumber: "",
        numberOfSharesPurchased: s.number_of_shares_purchased ?? "",
        parValuePerShare: s.par_value_per_share ?? "",
        totalInvestmentAmount: "",
        dateOfPurchase: s.date_of_purchase ? String(s.date_of_purchase).slice(0, 10) : "",
        paymentMethod: "",
        sourceOfFundsDeclaration: s.source_of_funds_declaration ?? "",
        status: s.status ?? "",
        cddCompleted: "",
        pepStatus: "clear",
        sanctionScreeningResult: "clear",
        adverseMediaScreeningResult: "clear",
        riskRating: s.risk_classification ?? "",
        amlOfficerApprovalStatus: "",
      }));

      const headers = [
        "shareholderCode", "legalName", "type", "gender", "dateOfBirth",
        "nationality", "occupation", "tinNumber", "nationalIdFayda", "primaryIdNumber",
        "mobileNumber", "emailAddress", "physicalAddress", "shareCertificateNumber",
        "numberOfSharesPurchased", "parValuePerShare", "totalInvestmentAmount", "dateOfPurchase",
        "paymentMethod", "sourceOfFundsDeclaration", "status", "cddCompleted",
        "pepStatus", "sanctionScreeningResult", "adverseMediaScreeningResult",
        "riskRating", "amlOfficerApprovalStatus",
      ];

      const ws = XLSX.utils.json_to_sheet(sheetRows, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Shareholders");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `shareholders-export-${date}.xlsx`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? "Exporting…" : "Export Excel"}
    </button>
  );
}
