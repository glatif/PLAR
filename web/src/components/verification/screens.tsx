"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, CameraOff, ExternalLink, RefreshCw } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Badge } from "@/components/ui/badge";
import { CheckCircleFilled, ClockFilled, IdCardFilled, UserFilled, VideoFilled } from "@/components/ui/filled-icons";
import { cameraErrorText, type CameraErrorCode } from "@/lib/verification/camera";
import { outcomeMeta, statusMeta, stepLabels, straighteningMeta, type SessionStatus, type StepKey, type StepOutcome, type Straightening } from "@/lib/verification/states";

// The light, non-camera screens of the flow: start, finish and the "camera unavailable" path.

function Shell({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="hero-glow flex min-h-dvh flex-col items-center px-4 pb-10 pt-[max(env(safe-area-inset-top),20px)]">
      <div className="flex w-full max-w-lg items-center justify-between py-2">
        <BrandMark href="/" />
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent-ink">Verification lab</span>
      </div>
      <div className="mt-4 w-full max-w-lg rounded-xl bg-surface p-6 shadow-2 sm:p-8">{children}</div>
    </main>
  );
}

const steps = [
  { icon: UserFilled, title: "A photo of your face", body: "Fit your face in the oval. It turns green when it's right.", tile: "#F5761A" },
  { icon: VideoFilled, title: "A slow head movement", body: "About 10 seconds of video, moving your head in one circle.", tile: "#5E5CE6" },
  { icon: IdCardFilled, title: "Your photo ID, front and back", body: "Driver's licence, BC Services Card, passport card or TRU card.", tile: "#0F8C82" },
];

export type TestFiles = { face?: File; idFront?: File; idBack?: File };

export function IntroScreen({ onStart, starting, error }: { onStart: (testFiles: TestFiles) => void; starting: boolean; error: string | null }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <Shell>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent-text">Before your interview</p>
      <h1 className="mt-2 font-serif text-[32px] font-semibold leading-[38px] tracking-[-0.022em]">Let&rsquo;s confirm it&rsquo;s you</h1>
      <p className="mt-2 text-[15.5px] leading-[23px] text-label-2">It takes about two minutes. A member of the PLAR team checks the result. Nothing is decided automatically.</p>

      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3.5 rounded-md bg-surface-2 p-3.5 shadow-[inset_0_0_0_1px_var(--separator)]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: s.tile }}>
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold">
                <span className="mr-1.5 font-mono text-[12px] text-label-2">{i + 1}</span>
                {s.title}
              </p>
              <p className="text-[13.5px] leading-[19px] text-label-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#c2550a]" />
        <span className="text-[14.5px] leading-[21px]">I agree to take a photo of my face, a short video and photos of my ID for identity verification.</span>
      </label>

      {error ? <p className="mt-4 rounded-md bg-danger-subtle px-3.5 py-2.5 text-[14px] text-danger">{error}</p> : null}

      <button
        type="button"
        disabled={!agreed || starting}
        onClick={() => onStart({})}
        className="mt-6 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-sm bg-accent text-[17px] font-semibold text-on-accent transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40"
      >
        {starting ? "Starting…" : "Start"}
        {starting ? null : <ArrowRight className="size-4" />}
      </button>
      <p className="mt-3 text-center text-[12.5px] text-label-2">You&rsquo;ll be asked to allow camera access.</p>
    </Shell>
  );
}

export function BlockedScreen({ code, onRetry, onSkip }: { code: CameraErrorCode; onRetry: () => void; onSkip: () => void }) {
  const t = cameraErrorText[code];
  return (
    <Shell>
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-fill-1 text-label-2">
        <CameraOff className="size-6" />
      </span>
      <h1 className="mt-4 font-serif text-[26px] font-semibold leading-[32px] tracking-[-0.02em]">{t.title}</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-label-2">{t.body}</p>
      <div className="mt-6 grid gap-3">
        <button type="button" onClick={onRetry} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-sm bg-accent text-[16px] font-semibold text-on-accent hover:bg-accent-hover">
          <RefreshCw className="size-4" />
          Try again
        </button>
        <button type="button" onClick={onSkip} className="h-[52px] rounded-sm bg-fill-1 text-[16px] font-semibold hover:bg-fill-2">
          Continue without the camera
        </button>
      </div>
      <p className="mt-4 text-[13px] leading-[19px] text-label-2">If you can&rsquo;t use a camera, your advisor will confirm your identity with you another way.</p>
    </Shell>
  );
}

export function SkippedScreen() {
  return (
    <Shell>
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-accent-soft text-accent-text">
        <ClockFilled className="size-6" />
      </span>
      <h1 className="mt-4 font-serif text-[26px] font-semibold leading-[32px] tracking-[-0.02em]">We&rsquo;ll confirm it another way</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-label-2">Your advisor has been told the camera wasn&rsquo;t available. They&rsquo;ll confirm your identity with you before the interview.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/testing" className="inline-flex h-11 items-center gap-2 rounded-full bg-fill-1 px-5 text-[15px] font-semibold hover:bg-fill-2">
          Open the testing gallery
        </Link>
        <button type="button" onClick={() => location.reload()} className="h-11 rounded-full px-4 text-[15px] font-semibold text-accent-text hover:bg-accent-subtle">
          Start again
        </button>
      </div>
    </Shell>
  );
}

export type UploadState = "uploading" | "saved" | "failed";

export function DoneScreen({
  status,
  outcomes,
  uploads,
  straightening,
  previews,
  onRetryUploads,
}: {
  status: SessionStatus | null;
  outcomes: Partial<Record<StepKey, StepOutcome>>;
  uploads: Partial<Record<StepKey, UploadState>>;
  straightening: Partial<Record<"idFront" | "idBack", Straightening>>;
  previews: Partial<Record<StepKey | "idFrontStraight" | "idBackStraight", string>>;
  onRetryUploads: () => void;
}) {
  const saving = Object.values(uploads).some((u) => u === "uploading");
  const failed = Object.values(uploads).some((u) => u === "failed");
  const meta = status ? statusMeta[status] : null;

  return (
    <Shell>
      <span className="flex size-14 items-center justify-center rounded-[16px] bg-success-subtle text-success">
        {saving ? <span className="size-6 animate-spin rounded-full border-[2.5px] border-current border-r-transparent" /> : <CheckCircleFilled className="size-7" />}
      </span>
      <h1 className="mt-4 font-serif text-[28px] font-semibold leading-[34px] tracking-[-0.022em]">{saving ? "Saving your photos…" : failed ? "Some photos didn't save" : "You're all set"}</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-label-2">
        {failed
          ? "Check your connection and try again. Your photos are still here."
          : "A member of the PLAR team will compare your photo with your ID before the interview. You don't need to do anything else."}
      </p>
      {failed ? (
        <button type="button" onClick={onRetryUploads} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent">
          <RefreshCw className="size-4" />
          Try saving again
        </button>
      ) : null}

      {meta ? (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-md bg-surface-2 px-4 py-3 shadow-[inset_0_0_0_1px_var(--separator)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label-2">Status</p>
            <p className="text-[14px] text-label-2">{meta.description}</p>
          </div>
          <Badge tone={meta.tone === "danger" ? "neutral" : meta.tone}>{meta.label}</Badge>
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-separator overflow-hidden rounded-md shadow-1">
        {(Object.keys(stepLabels) as StepKey[]).map((key) => {
          const outcome = outcomes[key] ?? "missing";
          const upload = uploads[key];
          const side = key === "idFront" || key === "idBack" ? key : null;
          const straight = side ? straightening[side] : undefined;
          const thumb = side ? (previews[`${side}Straight`] ?? previews[key]) : previews[key];
          return (
            <li key={key} className="flex items-center gap-3 bg-surface px-3.5 py-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-fill-1">
                {thumb && key !== "headTurn" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local capture preview
                  <img src={thumb} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-label-2">
                    <VideoFilled className="size-5" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{stepLabels[key]}</p>
                <p className="truncate text-[12.5px] text-label-2">
                  {upload === "uploading" ? "Saving…" : upload === "failed" ? "Not saved yet" : outcomeMeta[outcome].description}
                  {straight ? ` · ${straighteningMeta[straight].label}` : ""}
                </p>
              </div>
              <Badge tone={outcomeMeta[outcome].tone}>{outcomeMeta[outcome].label}</Badge>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/testing" className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-on-accent hover:bg-accent-hover">
          Open the testing gallery
          <ExternalLink className="size-4" />
        </Link>
        <button type="button" onClick={() => location.reload()} className="h-11 rounded-full bg-fill-1 px-5 text-[15px] font-semibold hover:bg-fill-2">
          Run another test
        </button>
      </div>
    </Shell>
  );
}
