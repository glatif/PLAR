import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/** Repository root: the folder that holds supabase/, web/ and harness/. */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export type RunResult = { ok: boolean; stdout: string; stderr: string };

/** Runs a command without a shell and never throws, so checks can report the failure instead. */
export function run(cmd: string, args: string[], opts: { timeoutMs?: number } = {}): Promise<RunResult> {
  return new Promise((done) => {
    execFile(cmd, args, { cwd: repoRoot, timeout: opts.timeoutMs ?? 30_000, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      done({ ok: !error, stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

/** Runs the Supabase CLI against this repository's supabase/ folder. */
export function supabase(args: string[], opts?: { timeoutMs?: number }) {
  return run("supabase", [...args, "--workdir", repoRoot], opts);
}
