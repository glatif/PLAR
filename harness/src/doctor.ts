// Checks that this machine and repository are ready to work with Supabase. Safe to run any time.
// Usage: npm run doctor

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { connect } from "node:net";
import { resolve } from "node:path";
import { Report } from "./lib/report.js";
import { repoRoot, run, supabase } from "./lib/shell.js";
import { DEV_PROJECT_REF } from "./lib/targets.js";

const LOCAL_API_PORT = 54421;

function portOpen(port: number, host = "127.0.0.1", timeoutMs = 1500) {
  return new Promise<boolean>((done) => {
    const socket = connect({ port, host });
    const end = (ok: boolean) => { socket.destroy(); done(ok); };
    socket.setTimeout(timeoutMs, () => end(false));
    socket.once("connect", () => end(true));
    socket.once("error", () => end(false));
  });
}

const files = (dir: string, ext: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)) : []);

async function main() {
  const report = new Report("PLAR Supabase doctor");

  report.section("Tools");
  const major = Number(process.versions.node.split(".")[0]);
  report.record(major >= 21 ? "pass" : "fail", `Node.js ${process.versions.node}`, major >= 21 ? undefined : "needs 21 or newer");
  const cli = await supabase(["--version"]);
  report.record(cli.ok ? "pass" : "fail", "Supabase CLI", cli.ok ? cli.stdout.trim().split("\n")[0] : "install with `brew install supabase/tap/supabase`");
  const docker = await run("docker", ["info", "--format", "{{.ServerVersion}}"]);
  report.record(docker.ok ? "pass" : "warn", "Docker", docker.ok ? docker.stdout.trim() : "not running: the local stack needs it");

  report.section("Repository");
  const sb = resolve(repoRoot, "supabase");
  report.record(existsSync(resolve(sb, "config.toml")) ? "pass" : "fail", "supabase/config.toml");
  report.record("pass", "Migrations", `${files(resolve(sb, "migrations"), ".sql").length} in supabase/migrations`);
  report.record(existsSync(resolve(sb, "seed.sql")) ? "pass" : "warn", "Synthetic seed", "supabase/seed.sql");
  report.record("pass", "Database tests", `${files(resolve(sb, "tests/database"), ".test.sql").length} in supabase/tests/database`);

  report.section("Configuration");
  const harnessEnv = resolve(repoRoot, "harness/.env.local");
  report.record(existsSync(harnessEnv) ? "pass" : "fail", "harness/.env.local", existsSync(harnessEnv) ? undefined : "copy harness/.env.example");
  report.record(process.env.PLAR_DEV_PUBLISHABLE_KEY ? "pass" : "fail", "Dev publishable key");
  const webEnv = resolve(repoRoot, "web/.env.local");
  const webEnvText = existsSync(webEnv) ? readFileSync(webEnv, "utf8") : "";
  report.record(webEnvText.includes("NEXT_PUBLIC_SUPABASE_URL") ? "pass" : "fail", "web/.env.local", webEnvText.includes(DEV_PROJECT_REF) ? "points at hosted dev" : webEnvText ? "points at another target" : "copy web/.env.example");
  if (/SERVICE_ROLE|SECRET_KEY|sb_secret_/i.test(webEnvText)) report.record("fail", "web/.env.local holds a secret key", "remove it: the web app uses the publishable key only");
  const loggedIn = process.env.SUPABASE_ACCESS_TOKEN ? true : (await supabase(["projects", "list", "-o", "json"], { timeoutMs: 15_000 })).ok;
  report.record(loggedIn ? "pass" : "warn", "Supabase CLI login", loggedIn ? undefined : "run `supabase login` before dev:link, dev:push or types against dev");

  report.section("Targets");
  await report.check("Hosted dev project responds", async () => {
    const res = await fetch(`https://${DEV_PROJECT_REF}.supabase.co/auth/v1/health`, { headers: { apikey: process.env.PLAR_DEV_PUBLISHABLE_KEY ?? "" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `${DEV_PROJECT_REF} · Canada (Central)`;
  });
  const status = await supabase(["status"], { timeoutMs: 15_000 });
  if (!status.ok) {
    report.record("warn", "Local stack", "not running: `npm run local:start`");
  } else {
    const open = await portOpen(LOCAL_API_PORT);
    report.record(open ? "pass" : "warn", "Local stack", open ? `API on 127.0.0.1:${LOCAL_API_PORT}` : `running, but port ${LOCAL_API_PORT} isn't reachable. With Colima, try \`colima restart\``);
  }

  report.finish();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
