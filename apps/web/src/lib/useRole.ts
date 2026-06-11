"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

export type GovernanceRole =
  | "maker"
  | "checker_1"
  | "checker_2"
  | "governance_admin"
  | "compliance_officer"
  | "viewer";

export function useRole(): { role: GovernanceRole | null; isLoading: boolean } {
  const [role, setRole] = useState<GovernanceRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setRole((data.session?.user?.app_metadata?.role as GovernanceRole) ?? null);
      setIsLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setRole((session?.user?.app_metadata?.role as GovernanceRole) ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { role, isLoading };
}

export function canMake(role: GovernanceRole | null): boolean {
  return role === "maker" || role === "governance_admin";
}

export function canApproveChecker1(role: GovernanceRole | null): boolean {
  return role === "checker_1" || role === "governance_admin";
}

export function canApproveChecker2(role: GovernanceRole | null): boolean {
  return role === "checker_2" || role === "governance_admin";
}

export function canReject(role: GovernanceRole | null): boolean {
  return (
    role === "checker_1" ||
    role === "checker_2" ||
    role === "governance_admin"
  );
}

export function isAdmin(role: GovernanceRole | null): boolean {
  return role === "governance_admin";
}
