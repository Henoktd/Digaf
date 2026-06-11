import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getToken(): Promise<string> {
  const session = await requireAuth();
  return session.access_token;
}
