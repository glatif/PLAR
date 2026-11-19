// API checks against a target: is it reachable, and does row-level security behave for each demo role?
// Usage: npm run check (hosted dev) · npm run check:local (local stack)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PASSWORD, demoUsers, TOTAL_PROFILES } from "./fixtures.js";
import { assert, Report } from "./lib/report.js";
import { resolveTarget, targetFromArgs, type Target } from "./lib/targets.js";

const PERMISSION_DENIED = "42501";
const TABLES = ["profiles", "role_assignments", "programs", "cases", "case_assessors", "case_events", "tasks", "interviews"] as const;

function client(target: Target): SupabaseClient {
  return createClient(target.url, target.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signIn(target: Target, email: string) {
  const c = client(target);
  const { data, error } = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error || !data.user) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return { c, userId: data.user.id };
}

async function count(c: SupabaseClient, table: string) {
  const { count: n, error } = await c.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return n ?? 0;
}

async function main() {
  const target = await resolveTarget(targetFromArgs());
  const report = new Report(`PLAR Supabase checks · ${target.name} · ${target.url}`);

  report.section("Reachability");
  await report.check("Auth service responds", async () => {
    const res = await fetch(`${target.url}/auth/v1/health`, { headers: { apikey: target.publishableKey } });
    assert(res.ok, `HTTP ${res.status}`);
  });

  report.section("Signed-out visitors");
  await report.check(`cannot read any of the ${TABLES.length} tables`, async () => {
    const leaks: string[] = [];
    for (const table of TABLES) {
      const { data, error } = await client(target).from(table).select("*").limit(1);
      if (error?.code !== PERMISSION_DENIED) leaks.push(`${table} (${error ? error.code : `${data?.length ?? 0} rows`})`);
    }
    assert(!leaks.length, `not denied: ${leaks.join(", ")}`);
  });
  await report.check("cannot reach the private schema", async () => {
    const { error } = await client(target).schema("private").rpc("has_role", { check_role: "admin" });
    assert(error, "the private schema answered");
    return error.code;
  });

  report.section("Each demo account sees the right cases and tasks");
  for (const [key, user] of Object.entries(demoUsers)) {
    await report.check(`${user.name} (${key})`, async () => {
      const { c } = await signIn(target, user.email);
      const [cases, tasks] = await Promise.all([count(c, "cases"), count(c, "tasks")]);
      assert(cases === user.cases, `sees ${cases} cases, expected ${user.cases}`);
      assert(tasks === user.tasks, `sees ${tasks} tasks, expected ${user.tasks}`);
      const { data: roles } = await c.from("role_assignments").select("role");
      assert(roles?.some((r) => r.role === user.role), `missing role ${user.role}`);
      return `${cases} cases · ${tasks} tasks`;
    });
  }

  report.section("What people can change");
  const student = await signIn(target, demoUsers.student.email);
  await report.check("student sees only themselves and their advisor", async () => {
    const n = await count(student.c, "profiles");
    assert(n === 2, `sees ${n} profiles`);
  });
  await report.check("student cannot grant themselves a role", async () => {
    const { error } = await student.c.from("role_assignments").insert({ user_id: student.userId, role: "admin" });
    assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : "insert succeeded");
  });
  await report.check("student cannot change their email", async () => {
    const { error } = await student.c.from("profiles").update({ email: "changed@example.test" }).eq("id", student.userId);
    assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : "update succeeded");
  });
  await report.check("student cannot edit their case", async () => {
    const { error } = await student.c.from("cases").update({ stage: "credit" }).eq("student_id", student.userId);
    assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : "update succeeded");
  });
  await report.check("student can update the status of their own task", async () => {
    const { data: task } = await student.c.from("tasks").select("id, status").eq("assignee_id", student.userId).limit(1).single();
    assert(task, "no task found");
    const { data, error } = await student.c.from("tasks").update({ status: "done" }).eq("id", task.id).select("status");
    assert(!error && data?.[0]?.status === "done", error?.message ?? "status not changed");
    await student.c.from("tasks").update({ status: task.status }).eq("id", task.id);
  });
  await report.check("advisor cannot change a student's task", async () => {
    const advisor = await signIn(target, demoUsers.advisor.email);
    const { data: task } = await advisor.c.from("tasks").select("id").eq("assignee_id", student.userId).limit(1).single();
    assert(task, "advisor can't see the student's tasks");
    const { data } = await advisor.c.from("tasks").update({ status: "done" }).eq("id", task.id).select("id");
    assert(!data?.length, "update went through");
  });
  await report.check("admin sees every profile", async () => {
    const admin = await signIn(target, demoUsers.admin.email);
    const n = await count(admin.c, "profiles");
    assert(n === TOTAL_PROFILES, `sees ${n}, expected ${TOTAL_PROFILES}`);
  });

  // People management end to end, through the real auth service. Uses a throwaway synthetic person
  // and deletes it at the end, so the demo data is unchanged.
  report.section("Admin manages people");
  const admin = await signIn(target, demoUsers.admin.email);
  const email = `harness-${Date.now()}@example.test`;
  const temp = `Temp-${Math.random().toString(36).slice(2, 10)}`;
  let personId = "";
  const passwordWorks = async (password: string) => {
    const { data, error } = await client(target).auth.signInWithPassword({ email, password });
    return { ok: !error && Boolean(data.user), user: data.user, error };
  };
  try {
    await report.check("non-admins can't list or add people", async () => {
      const { error: listError } = await student.c.rpc("admin_list_people");
      const { error: addError } = await student.c.rpc("admin_create_person", { p_email: email, p_full_name: "X", p_roles: ["admin"], p_password: temp });
      assert(listError?.code === PERMISSION_DENIED && addError?.code === PERMISSION_DENIED, `got ${listError?.code} / ${addError?.code}`);
    });
    await report.check("admin adds a person who can sign in, and must choose a password", async () => {
      const { data, error } = await admin.c.rpc("admin_create_person", { p_email: email, p_full_name: "Harness Person", p_roles: ["assessor"], p_password: temp });
      assert(!error && data, error?.message ?? "no id");
      personId = data as string;
      const signedIn = await passwordWorks(temp);
      assert(signedIn.ok, `sign-in failed: ${signedIn.error?.message}`);
      assert(signedIn.user?.app_metadata?.must_change_password === true, "must_change_password not set");
    });
    await report.check("admin promotes them", async () => {
      const { error } = await admin.c.rpc("admin_set_roles", { p_user: personId, p_roles: ["assessor", "manager"] });
      assert(!error, error?.message ?? "");
      const { data } = await admin.c.from("role_assignments").select("role").eq("user_id", personId);
      assert(data?.length === 2, `has ${data?.length} roles`);
    });
    await report.check("admin resets their password: the old one stops working", async () => {
      const next = `${temp}-2`;
      const { error } = await admin.c.rpc("admin_reset_password", { p_user: personId, p_password: next });
      assert(!error, error?.message ?? "");
      assert(!(await passwordWorks(temp)).ok, "old password still works");
      assert((await passwordWorks(next)).ok, "new password doesn't work");
    });
    await report.check("admin deactivates them: they can't sign in, then reactivates", async () => {
      const next = `${temp}-2`;
      await admin.c.rpc("admin_set_active", { p_user: personId, p_active: false });
      const blocked = await passwordWorks(next);
      assert(!blocked.ok, "a deactivated person signed in");
      await admin.c.rpc("admin_set_active", { p_user: personId, p_active: true });
      assert((await passwordWorks(next)).ok, "reactivated person can't sign in");
      return blocked.error?.message;
    });
    await report.check("every change is in the audit log", async () => {
      const { data } = await admin.c.from("admin_events").select("action").eq("target_id", personId);
      assert((data?.length ?? 0) >= 5, `${data?.length} events`);
    });
  } finally {
    if (personId) {
      await report.check("admin deletes the test person", async () => {
        const { error } = await admin.c.rpc("admin_delete_person", { p_user: personId });
        assert(!error, error?.message ?? "");
      });
    }
  }

  report.finish();
}

main().catch((error) => {
  console.error(`\n  ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
