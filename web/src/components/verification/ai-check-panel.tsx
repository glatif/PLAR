"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AiBadge } from "@/components/ui/badge";
import { AlertFilled } from "@/components/ui/filled-icons";
import { runAiCheck } from "@/components/verification/client-api";
import { cn } from "@/lib/cn";
import type { AiCheck, IdField } from "@/lib/verification/ai-check";

// The AI's suggestion inside an open row: why it thinks the face does or doesn't match, and what it
// read from the ID. The match percentage itself is shown on the row. Staff-facing; a person decides.

const verdictText = {
  likely_same: "Likely the same person",
  uncertain: "Not sure it's the same person",
  likely_different: "Likely different people",
};

const frontLabels: [keyof NonNullable<AiCheck["result"]>["id_front"], string][] = [
  ["full_name", "Name"],
  ["date_of_birth", "Date of birth"],
  ["document_type", "Document"],
  ["issuing_authority", "Issued by"],
  ["document_number", "Number"],
  ["issue_date", "Issued"],
  ["expiry_date", "Expires"],
  ["sex", "Sex"],
  ["address", "Address"],
];

function Fields({ rows }: { rows: IdField[] }) {
  const shown = rows.filter((r) => r.value?.trim());
  if (!shown.length) return <p className="text-[13.5px] text-label-2">Nothing readable.</p>;
  return (
    <dl className="grid grid-cols-[minmax(92px,auto)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13.5px] leading-[19px]">
      {shown.map((r, i) => (
        <div key={`${r.label}-${i}`} className="contents">
          <dt className="text-label-2">{r.label}</dt>
          <dd className="break-words font-medium">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AiCheckPanel({ sessionId, check, eligible, onChanged }: { sessionId: string; check?: AiCheck; eligible: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = busy || check?.status === "running";

  async function rerun() {
    setBusy(true);
    setError(null);
    try {
      await runAiCheck(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The AI check failed");
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  if (!check && !eligible) return null;
  const r = check?.status === "done" ? check.result : undefined;
  const cantCompare = r?.face_match.verdict === "uncertain" && r.face_match.probability_same_person === 0;
  const front = r ? [...frontLabels.map(([key, label]) => ({ label, value: String(r.id_front[key] ?? "") })), ...r.id_front.other_fields] : [];

  return (
    <section className="border-t border-separator bg-ai-subtle/50 px-4 py-4 sm:px-5" aria-label="AI suggestion">
      <div className="flex flex-wrap items-center gap-2">
        <AiBadge>AI suggestion</AiBadge>
        {r ? <span className="text-[14px] font-semibold">{cantCompare ? "Couldn't compare the faces" : verdictText[r.face_match.verdict]}</span> : null}
        <span className="flex-1" />
        <button type="button" onClick={rerun} disabled={running} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-semibold shadow-1 disabled:opacity-60">
          <RefreshCw className={cn("size-3.5", running && "animate-spin")} />
          {running ? "Checking…" : check ? "Run again" : "Run AI check"}
        </button>
      </div>

      {running && !r ? <p className="mt-3 text-[14px] text-label-2">Comparing the face with the ID and reading its details…</p> : null}
      {check?.status === "error" || error ? (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-danger-subtle px-3 py-2.5 text-[13.5px] text-danger">
          <AlertFilled className="mt-0.5 size-4 shrink-0" />
          {error ?? check?.error}
        </p>
      ) : null}

      {r ? (
        <>
          {r.face_match.reasons.length ? (
            <ul className="mt-2.5 space-y-1 text-[13.5px] leading-[19px] text-label-2">
              {r.face_match.reasons.map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          ) : null}

          {r.concerns.length ? (
            <div className="mt-3 space-y-1.5">
              {r.concerns.map((c) => (
                <p key={c} className="flex items-start gap-2 text-[13.5px] text-warning">
                  <AlertFilled className="mt-0.5 size-4 shrink-0" />
                  {c}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">Read from the ID front</p>
              <Fields rows={front} />
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">Read from the ID back</p>
              <Fields rows={r.id_back.fields} />
              {r.id_back.machine_readable_text ? (
                <pre className="mt-2 overflow-x-auto rounded-[10px] bg-surface px-3 py-2 font-mono text-[12px] leading-[17px]">{r.id_back.machine_readable_text}</pre>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

    </section>
  );
}
