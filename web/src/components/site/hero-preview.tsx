import { Check, ShieldCheck } from "lucide-react";
import { AiBadge, Badge } from "@/components/ui/badge";

const steps = ["Readiness", "Portfolio", "Feedback", "Interview", "Decision", "Credit"];
const current = 4; // "Decision"

const ratings = [
  { competency: "Communication", rating: "S" },
  { competency: "Teamwork & Leadership", rating: "O" },
  { competency: "Numeracy", rating: "I" },
] as const;

// Rating chips follow design system §3.4: "I" is neutral grey, never red.
const chip: Record<"I" | "S" | "O", string> = {
  O: "bg-teal-600 text-white",
  S: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
  I: "bg-[#e8e8ed] text-[#3a3a3c] dark:bg-white/10 dark:text-label-2",
};

/** Illustrative product preview for the homepage. Synthetic data only. */
export function HeroPreview() {
  return (
    <div className="relative" aria-label="Illustrative preview of a student case" role="img">
      <div className="card overflow-hidden shadow-3">
        <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-label-2">Case · Synthetic example</p>
            <p className="text-[17px] font-semibold tracking-[-0.01em]">Jordan Rivera · BGS</p>
          </div>
          <Badge tone="accent">Assessment in progress</Badge>
        </div>

        <ol className="grid grid-cols-6 gap-1 px-5 pt-5">
          {steps.map((step, i) => (
            <li key={step} className="flex flex-col items-center gap-2 text-center">
              <span
                className={
                  i < current
                    ? "flex size-6 items-center justify-center rounded-full bg-accent text-on-accent"
                    : i === current
                      ? "size-6 rounded-full border-2 border-accent bg-accent-subtle"
                      : "size-6 rounded-full border border-border-strong"
                }
              >
                {i < current ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={i === current ? "text-[11px] font-semibold text-label" : "text-[11px] text-label-2"}>{step}</span>
            </li>
          ))}
        </ol>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="rounded-sm bg-surface-2 p-4 shadow-[0_0_0_1px_var(--separator)]">
            <p className="mb-3 text-[13px] font-semibold">Consensus ratings · Upper level</p>
            <ul className="space-y-2.5">
              {ratings.map((r) => (
                <li key={r.competency} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-label-2">{r.competency}</span>
                  <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-[6px] px-1.5 text-[12px] font-semibold ${chip[r.rating]}`}>
                    {r.rating}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border border-dashed border-teal-200 bg-accent-subtle p-4 dark:border-teal-800">
            <div className="mb-2"><AiBadge>AI draft</AiBadge></div>
            <p className="text-[13px] leading-[19px] text-label">
              &ldquo;Threaded through the portfolio and discussion was a clear theme of collaboration&hellip;&rdquo;
            </p>
            <p className="mt-3 text-[12px] font-medium text-accent-ink">Writer review pending</p>
          </div>
        </div>
      </div>

      <div className="glass-thick absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-full py-2.5 pl-3 pr-5 sm:flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent">
          <ShieldCheck aria-hidden className="size-4" />
        </span>
        <span className="text-[13px] font-medium">Identity verified by advisor</span>
      </div>
    </div>
  );
}
