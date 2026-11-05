import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot, supabase } from "./shell.js";

// A target is one Supabase environment the harness can talk to.
//   local: the CLI stack on this machine (supabase/ folder, seeded with synthetic demo users)
//   dev:   the hosted development project in Canada (Central), migrations only, no seed users

export type TargetName = "local" | "dev";

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
  const value = i >= 0 ? argv[i + 1] : "dev";
  if (value !== "local" && value !== "dev") throw new Error(`Unknown target "${value}". Use --target local or --target dev.`);
  return value;
}

export async function resolveTarget(name: TargetName): Promise<Target> {
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
