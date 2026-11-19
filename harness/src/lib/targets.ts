import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot, supabase } from "./shell.js";

// A target is one Supabase environment the harness can talk to.
//   local: the CLI stack on this machine (supabase/ folder, seeded with synthetic demo users)
//   server: PLAR's own Supabase on the OVH project server (https://plar-api.airl.ca). The default since
//           2026-11-19: the one database the app uses, with the synthetic demo accounts.
//   dev:    the earlier cloud project in Canada (Central), kept for now but no longer used by the app
//   local:  the CLI stack on this machine (supabase/ folder, seeded with synthetic demo users)

export type TargetName = "server" | "local" | "dev";

export type Target = {
  name: TargetName;
  url: string;
  publishableKey: string;
  projectRef?: string;
  /** Seeded demo accounts exist only on the local stack. */
  hasDemoUsers: boolean;
};

export const DEV_PROJECT_REF = "dxnurogvpdxtbaocallr";

const envFile = resolve(repoRoot, "harness/.env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

export function targetFromArgs(argv = process.argv): TargetName {
  const i = argv.indexOf("--target");
  const value = i >= 0 ? argv[i + 1] : "server";
  if (value !== "server" && value !== "local" && value !== "dev") throw new Error(`Unknown target "${value}". Use --target server, dev or local.`);
  return value;
}

export async function resolveTarget(name: TargetName): Promise<Target> {
  if (name === "server") {
    const url = process.env.PLAR_SERVER_URL || "https://plar-api.airl.ca";
    const publishableKey = process.env.PLAR_SERVER_PUBLISHABLE_KEY ?? "";
    if (!publishableKey) throw new Error("PLAR_SERVER_PUBLISHABLE_KEY is not set. Get it with `server/plar-api.sh anon-key`.");
    return { name, url, publishableKey, hasDemoUsers: true };
  }
  if (name === "dev") {
    const url = process.env.PLAR_DEV_URL || `https://${DEV_PROJECT_REF}.supabase.co`;
    const publishableKey = process.env.PLAR_DEV_PUBLISHABLE_KEY ?? "";
    if (!publishableKey) throw new Error("PLAR_DEV_PUBLISHABLE_KEY is not set. Copy harness/.env.example to harness/.env.local.");
    return { name, url, publishableKey, projectRef: DEV_PROJECT_REF, hasDemoUsers: false };
  }

  const status = await supabase(["status", "-o", "json"]);
  if (!status.ok) throw new Error("The local stack isn't running. Start it with `npm run local:start`.");
  const json = JSON.parse(status.stdout.slice(status.stdout.indexOf("{"))) as Record<string, string>;
  const url = json.API_URL;
  const publishableKey = json.PUBLISHABLE_KEY || json.ANON_KEY;
  if (!url || !publishableKey) throw new Error("Couldn't read the local API URL and key from `supabase status`.");
  return { name, url, publishableKey, hasDemoUsers: true };
}
