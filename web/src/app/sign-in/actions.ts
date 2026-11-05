"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { demoAccounts } from "@/lib/demo-accounts";

export type SignInState = { error?: string; email?: string };

/** Email and password sign-in. */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Check them and try again.", email };

  redirect("/workspace");
}

/** One-click sign-in for a synthetic demo account. Only works when DEMO_LOGIN_PASSWORD is set. */
export async function demoSignIn(formData: FormData) {
  const account = demoAccounts.find((a) => a.key === formData.get("account"));
  const password = process.env.DEMO_LOGIN_PASSWORD;
  if (!account || !password) redirect("/sign-in");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: account.email, password });
  if (error) redirect("/sign-in?demo=failed");

  redirect("/workspace");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
