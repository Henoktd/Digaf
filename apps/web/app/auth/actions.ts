"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../src/lib/supabase/server";

export async function login(
  _prevState: { error: string | null },
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "Sign-in succeeded but no session was created. Ensure your email is confirmed in the Supabase dashboard and that email auth is enabled." };
  }

  // The onAuthStateChange cookie-write callback runs asynchronously.
  // Yielding microtasks here ensures cookieStore.set() completes before
  // the redirect response is committed.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
