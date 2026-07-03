"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { createCertificate, fetchShareholderCertificateDefaults } from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";

type Shareholder = { shareholder_id: string; legal_name: string };

type EntityCapitals = {
  entity_id: string;
  authorized_capital: string | null;
  subscribed_capital: string | null;
  paid_up_capital: string | null;
  default_par_value: string | null;
};

function generateSerial() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `DIGAF-CERT-${year}-${rand}`;
}

export function CreateCertificateForm({
  shareholders,
  entityCapitals,
}: {
  shareholders: Shareholder[];
  entityCapitals?: EntityCapitals | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [shareholderId, setShareholderId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityAutoFilled, setQuantityAutoFilled] = useState(false);
  const [serialNumber, setSerialNumber] = useState(generateSerial());
  const [authorizedCapital, setAuthorizedCapital] = useState(entityCapitals?.authorized_capital ?? "");
  const [subscribedCapital, setSubscribedCapital] = useState(entityCapitals?.subscribed_capital ?? "");
  const [paidUpCapital, setPaidUpCapital] = useState(entityCapitals?.paid_up_capital ?? "");
  const [parValue, setParValue] = useState(entityCapitals?.default_par_value ?? "");
  const [parValueAutoFilled, setParValueAutoFilled] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShareholderChange(id: string) {
    setShareholderId(id);
    setQuantityAutoFilled(false);
    setParValueAutoFilled(false);
    if (!id) return;

    setLoadingDefaults(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const result = await fetchShareholderCertificateDefaults(id, token);
      const defaults = result?.data;
      if (defaults) {
        if (defaults.quantity != null && Number(defaults.quantity) > 0) {
          setQuantity(String(Number(defaults.quantity)));
          setQuantityAutoFilled(true);
        }
        if (defaults.par_value != null) {
          setParValue(String(Number(defaults.par_value)));
          setParValueAutoFilled(true);
        }
      }
    } catch {
      // Non-fatal — user can fill manually
    } finally {
      setLoadingDefaults(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shareholderId || !quantity || !serialNumber) {
      setError("Shareholder, number of shares, and serial number are required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await createCertificate(
        {
          shareholder_id: shareholderId,
          quantity: Number(quantity),
          serial_number: serialNumber,
          authorized_capital: authorizedCapital ? Number(authorizedCapital) : undefined,
          subscribed_capital: subscribedCapital ? Number(subscribedCapital) : undefined,
          paid_up_capital: paidUpCapital ? Number(paidUpCapital) : undefined,
          par_value: parValue ? Number(parValue) : undefined,
        },
        token
      );
      toast("Certificate created successfully", "success");
      router.refresh();
      setShareholderId("");
      setQuantity("");
      setQuantityAutoFilled(false);
      setParValueAutoFilled(false);
      setSerialNumber(generateSerial());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create certificate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Shareholder</label>
          <select
            value={shareholderId}
            onChange={(e) => handleShareholderChange(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Select shareholder…</option>
            {shareholders.map((s) => (
              <option key={s.shareholder_id} value={s.shareholder_id}>
                {s.legal_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
            Number of Shares
            {loadingDefaults && <span className="text-xs font-normal text-slate-500">Loading…</span>}
            {quantityAutoFilled && !loadingDefaults && (
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-normal text-indigo-600">Auto-filled</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); setQuantityAutoFilled(false); }}
            required
            placeholder="e.g. 1000"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Serial Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              type="button"
              onClick={() => setSerialNumber(generateSerial())}
              className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              New
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Capital Structure (Birr) — as of this certificate&apos;s issuance
          {entityCapitals && (
            <span className="ml-2 font-normal normal-case text-indigo-500">Pre-filled from entity settings</span>
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Authorized Capital</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={authorizedCapital}
              onChange={(e) => setAuthorizedCapital(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subscribed Capital</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={subscribedCapital}
              onChange={(e) => setSubscribedCapital(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Paid-up Capital</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidUpCapital}
              onChange={(e) => setPaidUpCapital(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              Par Value (Birr)
              {parValueAutoFilled && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-normal text-indigo-600">Auto-filled</span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={parValue}
              onChange={(e) => { setParValue(e.target.value); setParValueAutoFilled(false); }}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Certificate"}
        </button>
      </div>
    </form>
  );
}
