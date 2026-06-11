"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  requireReason?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  requireReason = false,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const confirmDisabled = requireReason && reason.trim() === "";
  const confirmBg =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
      : "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            rows={3}
          />
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setReason("");
              onCancel();
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(requireReason ? reason.trim() : undefined);
              setReason("");
            }}
            disabled={confirmDisabled}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
