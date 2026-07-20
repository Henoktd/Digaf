"use client";

import { useState } from "react";
import { buttonClasses } from "@/src/components/ui/Button";
import { RegisterLienModal } from "@/src/components/RegisterLienModal";

export function RegisterLienButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClasses("primary")}>
        + Register Lien / Pledge
      </button>
      {open && <RegisterLienModal onClose={() => setOpen(false)} />}
    </>
  );
}
