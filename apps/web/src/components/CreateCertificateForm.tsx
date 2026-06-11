"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { createCertificate } from "@/src/lib/api";
import { useToast } from "@/src/components/Toast";

type Shareholder = { shareholder_id: string; legal_name: string };
type ShareClass = { share_class_id: string; class_name: string };

function generateSerial() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `DIGAF-CERT-${year}-${rand}`;
}

export function CreateCertificateForm({
  shareholders,
  shareClasses,
}: {
  shareholders: Shareholder[];
  shareClasses: ShareClass[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [shareholderId, setShareholderId] = useState("");
  const [shareClassId, setShareClassId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [serialNumber, setSerialNumber] = useState(generateSerial());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!shareholderId || !shareClassId || !quantity || !serialNumber) {
      setError("All fields are required.");
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
          share_class_id: shareClassId,
          quantity: Number(quantity),
          serial_number: serialNumber,
        },
        token
      );
      toast("Certificate created successfully", "success");
      router.refresh();
      setShareholderId("");
      setShareClassId("");
      setQuantity("");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Shareholder
          </label>
          <select
            value={shareholderId}
            onChange={(e) => setShareholderId(e.target.value)}
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Share Class
          </label>
          <select
            value={shareClassId}
            onChange={(e) => setShareClassId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">Select share class…</option>
            {shareClasses.map((sc) => (
              <option key={sc.share_class_id} value={sc.share_class_id}>
                {sc.class_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Number of Shares
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            placeholder="e.g. 1000"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Serial Number
          </label>
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
              Regenerate
            </button>
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
