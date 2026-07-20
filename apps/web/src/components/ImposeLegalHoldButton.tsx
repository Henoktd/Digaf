"use client";

import { useState } from "react";
import { buttonClasses } from "@/src/components/ui/Button";
import { ImposeLegalHoldModal } from "@/src/components/ImposeLegalHoldModal";

export function ImposeLegalHoldButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClasses("primary")}>
        + Impose Legal Hold
      </button>
      {open && <ImposeLegalHoldModal onClose={() => setOpen(false)} />}
    </>
  );
}
