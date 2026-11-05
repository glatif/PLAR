// Small console reporter: one line per check, a summary, and a non-zero exit code on failure.

const colour = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: string, text: string) => (colour ? `\x1b[${code}m${text}\x1b[0m` : text);

export const fmt = {
  pass: (t: string) => paint("32", t),
  fail: (t: string) => paint("31", t),
  warn: (t: string) => paint("33", t),
  dim: (t: string) => paint("2", t),
  bold: (t: string) => paint("1", t),
};

export type Outcome = "pass" | "fail" | "warn" | "skip";

export class Report {
  private counts: Record<Outcome, number> = { pass: 0, fail: 0, warn: 0, skip: 0 };

  constructor(title: string) {
    console.log(`\n${fmt.bold(title)}`);
  }

  section(name: string) {
    console.log(`\n  ${fmt.bold(name)}`);
  }

  record(outcome: Outcome, label: string, detail?: string) {
    this.counts[outcome]++;
    const mark = { pass: fmt.pass("✓"), fail: fmt.fail("✗"), warn: fmt.warn("!"), skip: fmt.dim("–") }[outcome];
    console.log(`    ${mark} ${label}${detail ? fmt.dim(`  ${detail}`) : ""}`);
  }

  /** Runs one check. Returning a string adds detail; throwing marks it failed. */
  async check(label: string, fn: () => Promise<string | void> | string | void) {
    try {
      const detail = await fn();
      this.record("pass", label, detail || undefined);
    } catch (error) {
      this.record("fail", label, error instanceof Error ? error.message : String(error));
    }
  }

  finish() {
    const { pass, fail, warn, skip } = this.counts;
    const parts = [fmt.pass(`${pass} passed`), fail ? fmt.fail(`${fail} failed`) : "", warn ? fmt.warn(`${warn} warnings`) : "", skip ? fmt.dim(`${skip} skipped`) : ""];
    console.log(`\n  ${parts.filter(Boolean).join(" · ")}\n`);
    process.exitCode = fail ? 1 : 0;
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
