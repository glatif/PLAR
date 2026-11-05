// API checks against a target: is it reachable, and does row-level security behave for each role?
// Usage: npm run check (hosted dev) · npm run check:local (local stack, includes signed-in role checks)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PASSWORD, demoUserCount, demoUsers } from "./fixtures.js";
import { assert, Report } from "./lib/report.js";
import { resolveTarget, targetFromArgs, type Target } from "./lib/targets.js";

const PERMISSION_DENIED = "42501";

function client(target: Target): SupabaseClient {
  return createClient(target.url, target.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedIn(target: Target, email: string) {
  const c = client(target);
  const { data, error } = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error || !data.user) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return { c, userId: data.user.id };
}

async function main() {
  const target = await resolveTarget(targetFromArgs());
  const report = new Report(`PLAR Supabase checks · ${target.name} · ${target.url}`);

  report.section("Reachability");
  await report.check("Auth service responds", async () => {
    const res = await fetch(`${target.url}/auth/v1/health`, { headers: { apikey: target.publishableKey } });
    assert(res.ok, `HTTP ${res.status}`);
  });
  await report.check("Database API responds", async () => {
    const { error } = await client(target).from("profiles").select("id").limit(1);
    assert(!error || error.code === PERMISSION_DENIED, error?.message ?? "");
  });

  report.section("Signed-out visitors");
  for (const table of ["profiles", "role_assignments"] as const) {
    await report.check(`cannot read ${table}`, async () => {
      const { data, error } = await client(target).from(table).select("*").limit(1);
      assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : `returned ${data?.length ?? 0} rows`);
    });
  }
  await report.check("cannot reach the private schema", async () => {
    const { error } = await client(target).schema("private").rpc("has_role", { check_role: "admin" });
    assert(error, "the private schema answered");
    return error.code;
  });

  report.section("Signed-in roles");
  if (!target.hasDemoUsers) {
    report.record("skip", "Role checks need the seeded demo users", "run `npm run check:local` with the local stack");
    report.finish();
    return;
  }

  const student = await signedIn(target, demoUsers.student.email).catch((e: Error) => e);
  if (student instanceof Error) {
    report.record("fail", "Demo student can sign in", student.message);
  } else {
    report.record("pass", "Demo student can sign in");
    await report.check("student sees only their own profile", async () => {
      const { data, error } = await student.c.from("profiles").select("id, full_name");
      assert(!error, error?.message ?? "");
      assert(data.length === 1 && data[0].id === student.userId, `saw ${data.length} profiles`);
    });
    await report.check("student sees only their own roles", async () => {
      const { data, error } = await student.c.from("role_assignments").select("role");
      assert(!error, error?.message ?? "");
      assert(data.length === 1 && data[0].role === "student", JSON.stringify(data));
    });
    await report.check("student cannot grant themselves a role", async () => {
      const { error } = await student.c.from("role_assignments").insert({ user_id: student.userId, role: "admin" });
      assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : "insert succeeded");
    });
    await report.check("student cannot change their email", async () => {
      const { error } = await student.c.from("profiles").update({ email: "changed@example.test" }).eq("id", student.userId);
      assert(error?.code === PERMISSION_DENIED, error ? `unexpected error ${error.code}` : "update succeeded");
    });
    await report.check("student can change their preferred name", async () => {
      const { error } = await student.c.from("profiles").update({ preferred_name: "Alex" }).eq("id", student.userId);
      assert(!error, error?.message ?? "");
      await student.c.from("profiles").update({ preferred_name: null }).eq("id", student.userId);
    });
  }

  const admin = await signedIn(target, demoUsers.admin.email).catch((e: Error) => e);
  if (admin instanceof Error) {
    report.record("fail", "Demo admin can sign in", admin.message);
  } else {
    await report.check("admin sees every profile", async () => {
      const { count, error } = await admin.c.from("profiles").select("*", { count: "exact", head: true });
      assert(!error, error?.message ?? "");
      assert(count === demoUserCount, `saw ${count}, expected ${demoUserCount}`);
    });
  }

  report.finish();
}

main().catch((error) => {
  console.error(`\n  ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
});
