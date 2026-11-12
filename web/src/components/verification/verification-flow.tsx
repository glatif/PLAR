"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cameraCount, keepAwake, type Facing } from "@/lib/verification/camera";
import type { Straightening, SessionStatus, StepKey, StepOutcome } from "@/lib/verification/states";
import { fetchSession, fileUrl, patchSession, startSession, uploadArtifact } from "@/components/verification/client-api";
import { useCamera, useElementSize, useFaceTracker, warmCardDetector } from "@/components/verification/hooks";
import { FaceStep, type StillCapture } from "@/components/verification/face-step";
import { HeadTurnStep, type MovementRecording } from "@/components/verification/head-turn-step";
import { IdStep, type IdCapture } from "@/components/verification/id-step";
import { ReviewSheet } from "@/components/verification/review-sheet";
import { BlockedScreen, DoneScreen, IntroScreen, SkippedScreen, type TestFiles, type UploadState } from "@/components/verification/screens";
import { StageTopBar } from "@/components/verification/stage";
import { cn } from "@/lib/cn";

type Phase = "intro" | "face" | "head" | "id-front" | "id-back" | "done" | "skipped";
type CameraPhase = Extract<Phase, "face" | "head" | "id-front" | "id-back">;

const cameraPhases: CameraPhase[] = ["face", "head", "id-front", "id-back"];
const titleOf: Record<CameraPhase, string> = { face: "Face photo", head: "Head movement", "id-front": "ID · front", "id-back": "ID · back" };
const kindOf = { face: "face", headTurn: "head-turn", idFront: "id-front", idBack: "id-back" } as const;

type Pending = { blob: Blob; meta: Parameters<typeof uploadArtifact>[3]; outcome: StepOutcome; metrics: Record<string, number | string | boolean | null> };

/** The identity verification flow: intro → face → head movement → ID front → ID back → done. */
export function VerificationFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [testFiles, setTestFiles] = useState<TestFiles>({});
  const [facingFlip, setFacingFlip] = useState<{ selfie: boolean; document: boolean }>({ selfie: false, document: false });
  const [review, setReview] = useState<{ step: "face" | "idFront" | "idBack"; capture: StillCapture | IdCapture } | null>(null);
  const [outcomes, setOutcomes] = useState<Partial<Record<StepKey, StepOutcome>>>({});
  const [uploads, setUploads] = useState<Partial<Record<StepKey, UploadState>>>({});
  const [previews, setPreviews] = useState<Partial<Record<StepKey | "idFrontStraight" | "idBackStraight", string>>>({});
  const [straightening, setStraightening] = useState<Partial<Record<"idFront" | "idBack", Straightening>>>({});
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [cameras, setCameras] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<Partial<Record<StepKey, Pending>>>({});

  const isCamera = (cameraPhases as Phase[]).includes(phase);
  const selfie = phase === "face" || phase === "head";
  const baseFacing: Facing = selfie ? "user" : "environment";
  const flipped = selfie ? facingFlip.selfie : facingFlip.document;
  const facing: Facing | null = isCamera ? (flipped ? (baseFacing === "user" ? "environment" : "user") : baseFacing) : null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const testFile = (selfie ? testFiles.face : phase === "id-front" ? testFiles.idFront : phase === "id-back" ? testFiles.idBack : undefined) ?? null;
  const camera = useCamera(videoRef, facing, selfie ? "face" : "document", testFile);
  const tracker = useFaceTracker(phase !== "intro");
  const [stageRef, stage] = useElementSize<HTMLDivElement>();

  useEffect(() => {
    if (camera.status === "live" && !testFile) cameraCount().then(setCameras);
  }, [camera.status, testFile]);

  useEffect(() => {
    if (!isCamera) return;
    let release: (() => void) | undefined;
    keepAwake().then((r) => (release = r));
    return () => release?.();
  }, [isCamera]);

  async function start(files: TestFiles) {
    setStarting(true);
    setStartError(null);
    try {
      const session = await startSession();
      setSessionId(session.id);
      setTestFiles(files);
      warmCardDetector();
      setPhase("face");
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Couldn't start. Is the dev server running?");
    } finally {
      setStarting(false);
    }
  }

  const save = useCallback(
    async (step: StepKey) => {
      const item = pending.current[step];
      if (!item || !sessionId) return;
      setUploads((u) => ({ ...u, [step]: "uploading" }));
      try {
        await uploadArtifact(sessionId, kindOf[step], item.blob, item.meta);
        await patchSession(sessionId, { steps: { [step]: { outcome: item.outcome, metrics: item.metrics } } });
        delete pending.current[step];
        setUploads((u) => ({ ...u, [step]: "saved" }));
      } catch {
        setUploads((u) => ({ ...u, [step]: "failed" }));
      }
    },
    [sessionId],
  );

  function record(step: StepKey, item: Pending, preview: string, next: Phase) {
    pending.current[step] = item;
    setOutcomes((o) => ({ ...o, [step]: item.outcome }));
    setPreviews((p) => ({ ...p, [step]: preview }));
    if (step === "idFront" || step === "idBack") setStraightening((s) => ({ ...s, [step]: "pending" }));
    void save(step);
    setTorchOn(false);
    setPhase(next);
  }

  function confirmReview() {
    if (!review) return;
    const { step, capture } = review;
    setReview(null);
    if (step === "face") {
      record(step, { blob: capture.blob, meta: { width: capture.width, height: capture.height, metrics: capture.metrics }, outcome: capture.outcome, metrics: capture.metrics }, capture.url, "head");
    } else {
      const id = capture as IdCapture;
      record(
        step,
        { blob: id.blob, meta: { width: id.width, height: id.height, guide: id.guide, liveQuad: id.liveQuad, metrics: id.metrics }, outcome: id.outcome, metrics: id.metrics },
        id.url,
        step === "idFront" ? "id-back" : "done",
      );
    }
  }

  function movementDone(rec: MovementRecording) {
    record("headTurn", { blob: rec.blob, meta: { durationMs: rec.durationMs, metrics: rec.metrics }, outcome: rec.outcome, metrics: rec.metrics }, rec.url, "id-front");
  }

  // On the finish screen, follow the background work (uploads, then ID straightening) until it settles.
  useEffect(() => {
    if (phase !== "done" || !sessionId) return;
    let stop = false;
    let tries = 0;
    const poll = async () => {
      while (!stop && tries++ < 40) {
        const s = await fetchSession(sessionId).catch(() => null);
        if (s) {
          setStatus(s.status);
          const next: Partial<Record<"idFront" | "idBack", Straightening>> = {};
          for (const [kind, key] of [["id-front", "idFront"], ["id-back", "idBack"]] as const) {
            const original = s.artifacts.find((a) => a.kind === kind);
            if (original?.straightening) next[key] = original.straightening;
            const derived = s.artifacts.find((a) => a.id === original?.derivedId);
            if (derived) setPreviews((p) => ({ ...p, [`${key}Straight`]: fileUrl(s.id, derived.file) }));
          }
          setStraightening((prev) => ({ ...prev, ...next }));
          const allSaved = Object.keys(kindOf).every((k) => s.steps[k as StepKey]);
          const processing = Object.values(next).includes("pending");
          if (allSaved && !processing) break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    void poll();
    return () => {
      stop = true;
    };
  }, [phase, sessionId, uploads]);

  async function leave() {
    if (sessionId) await patchSession(sessionId, { status: "abandoned" }).catch(() => undefined);
    location.reload();
  }

  async function skipCamera() {
    if (sessionId) await patchSession(sessionId, { status: "blocked", blockedReason: camera.error ?? "unknown" }).catch(() => undefined);
    setPhase("skipped");
  }

  if (phase === "intro") return <IntroScreen onStart={start} starting={starting} error={startError} />;
  // Camera failures (permission, no device, busy) show the "camera unavailable" screen.
  if (isCamera && camera.status === "error") return <BlockedScreen code={camera.error ?? "unknown"} onRetry={camera.retry} onSkip={skipCamera} />;
  if (phase === "skipped") return <SkippedScreen />;
  if (phase === "done")
    return (
      <DoneScreen
        status={status}
        outcomes={outcomes}
        uploads={uploads}
        straightening={straightening}
        previews={previews}
        onRetryUploads={() => (Object.keys(pending.current) as StepKey[]).forEach((k) => void save(k))}
      />
    );

  const cameraPhase = phase as CameraPhase;
  const stepIndex = cameraPhases.indexOf(cameraPhase);
  const live = camera.status === "live" && camera.videoSize && stage.width > 0;

  return (
    <div ref={stageRef} className="fixed inset-0 overflow-hidden overscroll-none bg-[#0b0b0d] text-white">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", live ? "opacity-100" : "opacity-0")}
        style={camera.handle?.mirrored ? { transform: "scaleX(-1)" } : undefined}
      />
      {!live ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
          <span className="size-8 animate-spin rounded-full border-[3px] border-white/70 border-r-transparent" />
          <p className="text-[15px] font-medium">Starting the camera…</p>
        </div>
      ) : null}

      {live ? (
        <>
          {cameraPhase === "face" ? <FaceStep camera={camera} videoRef={videoRef} stage={stage} tracker={tracker} onCapture={(c) => setReview({ step: "face", capture: c })} /> : null}
          {cameraPhase === "head" ? <HeadTurnStep camera={camera} videoRef={videoRef} stage={stage} tracker={tracker} onComplete={movementDone} /> : null}
          {cameraPhase === "id-front" || cameraPhase === "id-back" ? (
            <IdStep
              key={cameraPhase}
              side={cameraPhase === "id-front" ? "front" : "back"}
              camera={camera}
              videoRef={videoRef}
              stage={stage}
              onCapture={(c) => setReview({ step: cameraPhase === "id-front" ? "idFront" : "idBack", capture: c })}
            />
          ) : null}
        </>
      ) : null}

      <StageTopBar
        step={stepIndex}
        title={titleOf[cameraPhase]}
        onClose={() => setLeaving(true)}
        onSwitchCamera={cameras > 1 ? () => setFacingFlip((f) => (selfie ? { ...f, selfie: !f.selfie } : { ...f, document: !f.document })) : undefined}
        torch={
          camera.handle?.canTorch
            ? {
                on: torchOn,
                toggle: () => {
                  const next = !torchOn;
                  setTorchOn(next);
                  void camera.handle?.setTorch(next);
                },
              }
            : null
        }
      />

      {review ? (
        <ReviewSheet
          kind={review.step === "face" ? "face" : "id"}
          title={review.step === "face" ? "Check your photo" : review.step === "idFront" ? "Check the front of your ID" : "Check the back of your ID"}
          imageUrl={review.capture.url}
          flagged={
            review.capture.outcome === "manual"
              ? review.step === "face"
                ? "Your face wasn't confirmed in the oval. That's OK if it looks right to you: a reviewer will check."
                : "The card wasn't detected in the frame. Make sure all four corners and the text are visible."
              : null
          }
          onRetake={() => {
            URL.revokeObjectURL(review.capture.url);
            setReview(null);
          }}
          onConfirm={confirmReview}
        />
      ) : null}

      {leaving ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 text-label shadow-3">
            <h2 id="leave-title" className="text-[20px] font-semibold tracking-[-0.015em]">Stop verifying?</h2>
            <p className="mt-2 text-[15px] leading-[22px] text-label-2">Photos you&rsquo;ve already saved stay in the testing gallery. You can start again any time.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setLeaving(false)} className="h-11 rounded-full bg-fill-1 text-[15px] font-semibold hover:bg-fill-2">
                Keep going
              </button>
              <button type="button" onClick={leave} className="h-11 rounded-full bg-accent text-[15px] font-semibold text-on-accent hover:bg-accent-hover">
                Stop
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
