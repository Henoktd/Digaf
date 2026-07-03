"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/src/components/ui/Button";
import { fieldClass } from "@/src/components/ui/field";

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
  const confirmClass =
    variant === "danger" ? buttonClasses("danger") : buttonClasses("warning");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-modal-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        {requireReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason..."
            aria-label="Reason"
            className={`mt-4 ${fieldClass}`}
            rows={3}
          />
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setReason("");
              onCancel();
            }}
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            onClick={() => {
              onConfirm(requireReason ? reason.trim() : undefined);
              setReason("");
            }}
            disabled={confirmDisabled}
            className={confirmClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
