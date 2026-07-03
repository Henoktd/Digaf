"use client";

import { useState } from "react";
import { StatusBadge } from "@/src/components/StatusBadge";
import { CertificateActions } from "@/src/components/CertificateActions";
import { CertificatePrintButton } from "@/src/components/CertificatePrintButton";

type Certificate = {
  certificate_id: string;
  serial_number: string;
  shareholder_name: string;
  quantity: string;
  issue_date: string | null;
  status: string;
  hash_algorithm: string | null;
  revocation_status: string | null;
};

function getPublicVerificationPageUrl(serialNumber: string) {
  return `/qr?serialNumber=${encodeURIComponent(serialNumber)}`;
}

function getQrSvgUrl(certificateId: string) {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return `${base}/api/certificates/${certificateId}/qr.svg`;
}

export function CertificatesTable({ certificates }: { certificates: Certificate[] }) {
  const [searchQ, setSearchQ] = useState("");

  const filtered = certificates.filter(
    (c) =>
      !searchQ ||
      c.serial_number.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.shareholder_name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by serial number or shareholder…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <span className="text-xs text-slate-500">
          {filtered.length} of {certificates.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {filtered.length > 0 ? (
          <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Serial Number</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Shareholder</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Hash</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Revocation</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">QR Verification</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Certificate</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert) => (
                <tr key={cert.certificate_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{cert.serial_number}</td>
                  <td className="px-4 py-3 text-slate-700">{cert.shareholder_name}</td>
                  <td className="px-4 py-3 text-slate-600">{cert.quantity}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={cert.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {cert.hash_algorithm || "Not generated"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={cert.revocation_status}
                      label={cert.revocation_status || "None"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[200px] items-center gap-3">
                      <img
                        src={getQrSvgUrl(cert.certificate_id)}
                        alt={`QR code for ${cert.serial_number}`}
                        className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white p-1"
                      />
                      <a
                        href={getPublicVerificationPageUrl(cert.serial_number)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Verify
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CertificatePrintButton certificateId={cert.certificate_id} />
                  </td>
                  <td className="px-4 py-3">
                    <CertificateActions
                      certificateId={cert.certificate_id}
                      serialNumber={cert.serial_number}
                      status={cert.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {certificates.length === 0
              ? "No certificates found."
              : "No certificates match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
