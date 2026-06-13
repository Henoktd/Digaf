"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markDividendPaid } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

export function MarkDividendPaidButton({ dividendId }: { dividendId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Mark all entitlements as paid? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      await markDividendPaid(dividendId, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Mark All Paid"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
