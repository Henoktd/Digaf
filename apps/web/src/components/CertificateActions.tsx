"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/src/components/ConfirmModal";
import { issueCertificate, revokeCertificate, reissueCertificate } from "@/src/lib/api";
import { createClient } from "@/src/lib/supabase/client";

type Props = {
  certificateId: string;
  serialNumber: string;
  status: string;
};

async function getToken(): Promise<string | undefined> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export function CertificateActions({ certificateId, serialNumber, status }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showReissueForm, setShowReissueForm] = useState(false);
  const [newSerialNumber, setNewSerialNumber] = useState("");

  async function handleIssue() {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await issueCertificate(certificateId, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevoke(reason?: string) {
    setShowRevokeModal(false);
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await revokeCertificate(certificateId, reason ?? "", token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke certificate");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReissue(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await reissueCertificate(certificateId, newSerialNumber.trim(), token);
      setShowReissueForm(false);
      setNewSerialNumber("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reissue certificate");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button
            type="button"
            onClick={handleIssue}
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Issue
          </button>
        )}

        {status === "issued" && (
          <button
            type="button"
            onClick={() => setShowRevokeModal(true)}
            disabled={isLoading}
            className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Revoke
          </button>
        )}

        {status === "revoked" && !showReissueForm && (
          <button
            type="button"
            onClick={() => setShowReissueForm(true)}
            disabled={isLoading}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Reissue
          </button>
        )}
      </div>

      {showReissueForm && (
        <form onSubmit={handleReissue} className="flex items-center gap-2">
          <input
            required
            value={newSerialNumber}
            onChange={(e) => setNewSerialNumber(e.target.value)}
            placeholder="New serial number"
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => { setShowReissueForm(false); setNewSerialNumber(""); }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </form>
      )}

      <ConfirmModal
        isOpen={showRevokeModal}
        title="Revoke Certificate"
        message={`This will permanently revoke certificate ${serialNumber}. This action cannot be undone.`}
        confirmLabel="Revoke"
        variant="danger"
        requireReason
        onConfirm={handleRevoke}
        onCancel={() => setShowRevokeModal(false)}
      />
    </div>
  );
}
