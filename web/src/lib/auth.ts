import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { RoleSlug } from "@/lib/roles";

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Viewer = {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  /** The workspaces this person may open, in order of preference. */
  workspaces: RoleSlug[];
};

// Each role opens its own workspace. The order is the order a person with several roles sees them in.
const workspaceOrder: RoleSlug[] = ["admin", "director", "manager", "assessor", "advisor", "student"];

export const roleLabels: Record<AppRole, string> = {
  student: "Student",
  advisor: "Advisor",
  assessor: "Assessor",
  manager: "PLAR Manager",
  director: "PLAR Director",
  admin: "Admin",
};

/** The signed-in person, their profile and roles. Cached for the length of one request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, preferred_name, email").eq("id", user.id).single(),
    supabase.from("role_assignments").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role);
  const workspaces = workspaceOrder.filter((slug) => roles.includes(slug));

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.preferred_name || profile?.full_name || user.email || "",
    roles,
    workspaces,
  };
});
