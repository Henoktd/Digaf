"use client";

import { useState } from "react";
import { StatusBadge } from "@/src/components/StatusBadge";
import { formatDate } from "@/src/lib/dateUtils";

type DocumentReference = {
  id: string;
  entity_id: string;
  entity_name: string;
  file_url: string;
  library: string;
  document_type: string;
  retention_category: string | null;
  legal_hold_id: string | null;
  legal_hold_status: string | null;
  authority_reference: string | null;
  related_entity: string | null;
  related_id: string | null;
  created_at: string;
};

export function DocumentsTable({ documents }: { documents: DocumentReference[] }) {
  const [searchQ, setSearchQ] = useState("");

  const filtered = documents.filter(
    (d) =>
      !searchQ ||
      d.document_type.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.library.toLowerCase().includes(searchQ.toLowerCase()) ||
      d.entity_name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by type, library, or entity…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <span className="text-xs text-slate-500">
          {filtered.length} of {documents.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {filtered.length > 0 ? (
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Document Type</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Library</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Retention</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Legal Hold</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Authority Ref.</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">File URL</th>
                <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {doc.document_type.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{doc.library}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.entity_name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {doc.retention_category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {doc.legal_hold_status ? (
                      <StatusBadge status={doc.legal_hold_status} />
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {doc.authority_reference ?? "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {doc.file_url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(doc.created_at, { style: "date" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            {documents.length === 0
              ? "No documents found."
              : "No documents match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
