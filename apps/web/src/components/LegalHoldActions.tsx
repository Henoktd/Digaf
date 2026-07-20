"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  approveLegalHold,
  approveLegalHoldLift,
  rejectLegalHold,
  rejectLegalHoldLift,
  requestLegalHoldLift,
} from "@/src/lib/api";
import { useRole } from "@/src/lib/useRole";
import { Button } from "@/src/components/ui/Button";
import { ConfirmModal } from "@/src/components/ConfirmModal";

type Props = {
  holdId: string;
  status: string;
  imposedBy: string;
  releaseRequestedBy: string | null;
};

const PROPOSE_ROLES = new Set(["maker", "compliance_officer", "governance_admin"]);

export function LegalHoldActions({ holdId, status, imposedBy, releaseRequestedBy }: Props) {
  const router = useRouter();
  const { role } = useRole();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"reject" | "reject-lift" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
  }, []);

  async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Not authenticated");
    return data.session.access_token;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const isGovernanceAdmin = role === "governance_admin";
  const canPropose = role ? PROPOSE_ROLES.has(role) : false;

  let content: React.ReactNode = <span className="text-xs text-slate-400">No action available</span>;

  if (status === "pending_approval") {
    if (isGovernanceAdmin && currentUserId !== imposedBy) {
      content = (
        <div className="flex gap-1.5">
          <Button size="sm" disabled={busy} onClick={() => run(async () => approveLegalHold(holdId, await getToken()))}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmAction("reject")}>
            Reject
          </Button>
        </div>
      );
    } else {
      content = <span className="text-xs text-amber-700">Awaiting approval</span>;
    }
  } else if (status === "active") {
    if (canPropose) {
      content = (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(async () => requestLegalHoldLift(holdId, await getToken()))}>
          Request Lift
        </Button>
      );
    }
  } else if (status === "pending_lift") {
    if (isGovernanceAdmin && currentUserId !== releaseRequestedBy) {
      content = (
        <div className="flex gap-1.5">
          <Button size="sm" disabled={busy} onClick={() => run(async () => approveLegalHoldLift(holdId, await getToken()))}>
            Approve Lift
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmAction("reject-lift")}>
            Reject Lift
          </Button>
        </div>
      );
    } else {
      content = <span className="text-xs text-amber-700">Lift pending approval</span>;
    }
  }

  return (
    <div>
      {content}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction === "reject" ? "Reject Legal Hold" : "Reject Lift Request"}
        message="Provide a reason for this decision."
        confirmLabel="Reject"
        variant="danger"
        requireReason
        onCancel={() => setConfirmAction(null)}
        onConfirm={(reason) => {
          const action = confirmAction;
          setConfirmAction(null);
          run(async () => {
            const token = await getToken();
            if (action === "reject") return rejectLegalHold(holdId, reason ?? "", token);
            return rejectLegalHoldLift(holdId, reason ?? "", token);
          });
        }}
      />
    </div>
  );
}
