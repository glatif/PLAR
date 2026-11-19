"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth";

// Admin people management. Each action calls a database function that checks the caller is an
// admin and writes the change to the audit log, so nothing here needs a secret key.

export type PeopleResult = { ok: true; password?: string } | { ok: false; error: string };

const ROLES: AppRole[] = ["student", "advisor", "assessor", "manager", "director", "admin"];

/** A temporary password that's easy to read out: no 0/O or 1/l/I. */
function temporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

function rolesFrom(formData: FormData) {
  return formData.getAll("roles").map(String).filter((r): r is AppRole => (ROLES as string[]).includes(r));
}

const friendly: Record<string, string> = {
  "42501": "Only an admin can do this.",
  P0002: "That person doesn't exist any more.",
};

async function call(fn: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: { code: string; message: string } | null }>, password?: string): Promise<PeopleResult> {
  const supabase = await createClient();
  const { error } = await fn(supabase);
  if (error) {
    // The database's own messages are written for people ("Choose at least one role"); codes without one get a plain fallback.
    const ownMessage = ["22023", "23505", "23503", "42501"].includes(error.code) && error.message && !error.message.startsWith("permission denied");
    return { ok: false, error: ownMessage ? error.message : (friendly[error.code] ?? "That didn't work. Try again.") };
  }
  refresh();
  return { ok: true, password };
}

export async function addPerson(formData: FormData): Promise<PeopleResult> {
  const password = temporaryPassword();
  return call(
    (s) =>
      s.rpc("admin_create_person", {
        p_email: String(formData.get("email") ?? ""),
        p_full_name: String(formData.get("name") ?? ""),
        p_roles: rolesFrom(formData),
        p_password: password,
      }),
    password,
  );
}

export async function setRoles(formData: FormData): Promise<PeopleResult> {
  return call((s) => s.rpc("admin_set_roles", { p_user: String(formData.get("id")), p_roles: rolesFrom(formData) }));
}

export async function resetPassword(formData: FormData): Promise<PeopleResult> {
  const password = temporaryPassword();
  return call((s) => s.rpc("admin_reset_password", { p_user: String(formData.get("id")), p_password: password }), password);
}

export async function setActive(formData: FormData): Promise<PeopleResult> {
  return call((s) => s.rpc("admin_set_active", { p_user: String(formData.get("id")), p_active: formData.get("active") === "true" }));
}

export async function signOutEverywhere(formData: FormData): Promise<PeopleResult> {
  return call((s) => s.rpc("admin_sign_out_everywhere", { p_user: String(formData.get("id")) }));
}

export async function updatePerson(formData: FormData): Promise<PeopleResult> {
  return call((s) =>
    s.rpc("admin_update_person", {
      p_user: String(formData.get("id")),
      p_full_name: String(formData.get("name") ?? ""),
      p_email: String(formData.get("email") ?? ""),
    }),
  );
}

export async function deletePerson(formData: FormData): Promise<PeopleResult> {
  return call((s) => s.rpc("admin_delete_person", { p_user: String(formData.get("id")) }));
}
