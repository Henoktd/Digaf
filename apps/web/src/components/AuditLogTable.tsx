"use client";

import { useState } from "react";
import { formatDate } from "@/src/lib/dateUtils";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type AuditLog = {
  id: string;
  entity_id: string;
  entity_name: string;
  actor_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value_json: JsonValue | null;
  new_value_json: JsonValue | null;
  timestamp_utc: string;
  source_ip: string | null;
};

function summarize(value: JsonValue | null) {
  if (value === null) return "None";
  const s = JSON.stringify(value);
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const [searchQ, setSearchQ] = useState("");

  const filtered = logs.filter(
    (l) =>
      !searchQ ||
      l.actor_id.toLowerCase().includes(searchQ.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQ.toLowerCase()) ||
      l.table_name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by actor, action, or table…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <span className="text-xs text-slate-500">
          {filtered.length} of {logs.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        {filtered.length > 0 ? (
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">Actor</th>
                <th className="border-b border-slate-200 px-4 py-3">Action</th>
                <th className="border-b border-slate-200 px-4 py-3">Table</th>
                <th className="border-b border-slate-200 px-4 py-3">Record ID</th>
                <th className="border-b border-slate-200 px-4 py-3">Timestamp</th>
                <th className="border-b border-slate-200 px-4 py-3">Old Value</th>
                <th className="border-b border-slate-200 px-4 py-3">New Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{log.actor_id}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">
                    {log.action.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.table_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {log.record_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(log.timestamp_utc)}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-500">
                    {summarize(log.old_value_json)}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-500">
                    {summarize(log.new_value_json)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-slate-400">
            {logs.length === 0 ? "No audit logs found." : "No logs match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
