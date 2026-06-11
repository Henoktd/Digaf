"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { excludeShareholderImportRow } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Not authenticated");
  return data.session.access_token;
}

type ImportRowExcludeButtonProps = {
  rowId: string;
};

export function ImportRowExcludeButton({ rowId }: ImportRowExcludeButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExclude() {
    setIsPending(true);
    setError(null);
    try {
      const token = await getAccessToken();
      await excludeShareholderImportRow(rowId, {}, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to exclude row");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleExclude}
        disabled={isPending}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        {isPending ? "Excluding..." : "Exclude"}
      </button>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
