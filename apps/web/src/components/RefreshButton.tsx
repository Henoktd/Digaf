"use client";

import { useRouter } from "next/navigation";
import { buttonClasses } from "@/src/components/ui/Button";

export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={buttonClasses("danger", "sm")}
    >
      {label}
    </button>
  );
}
