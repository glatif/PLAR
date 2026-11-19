"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string };

/** The signed-in person sets their own password, then stops being asked to change it. */
export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Choose a password you haven't used here before." };
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Try a longer one." };
    return { error: "Your password couldn't be changed. Sign in again and try once more." };
  }
  await supabase.rpc("complete_password_change");
  // Refresh the session so the "must change password" flag is gone from it too.
  await supabase.auth.refreshSession();
  redirect("/workspace");
}
