"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

// Handles both PKCE code-based flow (?code=...) and hash-based flow (#access_token=...)
// Supabase invite links and password resets may use either depending on project settings.
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/";

    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.replace(next);
        } else {
          router.replace("/login?error=link-expired");
        }
      });
      return;
    }

    // No code — Supabase may have put tokens in the URL hash (hash/implicit flow).
    // The browser Supabase client fires onAuthStateChange when it detects hash tokens.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY")) {
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // Fallback: if nothing fires within 3s, check for an existing session or give up
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.replace(next);
        } else {
          router.replace("/login?error=link-expired");
        }
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-400">Verifying your link…</p>
    </div>
  );
}
