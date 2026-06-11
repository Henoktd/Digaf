"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function CertificatePrintButton({
  certificateId,
  label = "Print Preview",
  className = "inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50",
}: {
  certificateId: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const url = token
        ? `${API_BASE_URL}/api/certificates/${certificateId}/print-preview?token=${encodeURIComponent(token)}`
        : `${API_BASE_URL}/api/certificates/${certificateId}/print-preview`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={loading}
      className={className}
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
