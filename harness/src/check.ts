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

  report.finish();
}

main().catch((error) => {
  console.error(`\n  ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
