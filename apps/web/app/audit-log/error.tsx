"use client";
import { SectionError } from "@/src/components/SectionError";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError error={error} reset={reset} title="Failed to load audit log" />;
}
