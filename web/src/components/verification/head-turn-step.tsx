"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { verificationConfig as config } from "@/lib/verification/config";
import { recordingMime, vibrate } from "@/lib/verification/camera";
import { trackFaces } from "@/lib/verification/face-tracker";
import { faceGuide, fillRing, ringProgress, ringSegment, type Ellipse } from "@/lib/verification/geometry";
import type { CameraState } from "@/components/verification/hooks";
import { FaceOval } from "@/components/verification/face-step";
import { HintPill, StageFooter, StageLink } from "@/components/verification/stage";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export type MovementRecording = {
  blob: Blob;
  url: string;
  mime: string;
  durationMs: number;
  outcome: "passed" | "partial" | "manual";
  metrics: Record<string, number | string | boolean | null>;
};

const N = config.headTurn.segments;

/** Tick marks around the oval that fill as the head points at them, plus a dot for the current direction. */
function Ring({ guide, filled, pointer }: { guide: Ellipse; filled: boolean[]; pointer: number | null }) {
  const gap = Math.max(10, guide.rx * 0.08);
  const len = Math.max(12, guide.rx * 0.11);
  const at = (angle: number, extra: number) => ({
    x: guide.cx + (guide.rx + extra) * Math.sin(angle),
    y: guide.cy - (guide.ry + extra) * Math.cos(angle),
  });
  return (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
      {filled.map((on, i) => {
        const angle = ((i + 0.5) / N) * Math.PI * 2;
        const a = at(angle, gap);
        const b = at(angle, gap + len);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            strokeLinecap="round"
            strokeWidth={on ? 5 : 3.5}
            stroke={on ? "#4cd58a" : "rgba(255,255,255,0.45)"}
            className="transition-[stroke,stroke-width] duration-150"
          />
        );
      })}
      {pointer !== null ? (
        <circle {...(() => {
          const p = at(((pointer + 0.5) / N) * Math.PI * 2, gap + len + 12);
          return { cx: p.x, cy: p.y };
        })()} r={6} fill="white" className="drop-shadow" />
      ) : null}
    </svg>
  );
}

export function HeadTurnStep({
  camera,
  videoRef,
  stage,
  tracker,
  onComplete,
}: {
  camera: CameraState;
  videoRef: RefObject<HTMLVideoElement | null>;
  stage: { width: number; height: number };
  tracker: { status: "loading" | "ready" | "unavailable"; landmarker: FaceLandmarker | null };
  onComplete: (recording: MovementRecording) => void;
}) {
  const [phase, setPhase] = useState<"ready" | "recording" | "partial" | "passed">("ready");
  const [filled, setFilled] = useState<boolean[]>(() => Array(N).fill(false));
  const [pointer, setPointer] = useState<number | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [noFace, setNoFace] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recording = useRef<{ recorder: MediaRecorder; chunks: Blob[]; started: number; mime: string } | null>(null);
  const result = useRef<MovementRecording | null>(null);
  const guide = useMemo(() => faceGuide(stage.width, stage.height), [stage.width, stage.height]);
  const manual = tracker.status === "unavailable";
  const progress = ringProgress(filled);

  function start() {
    const stream = camera.handle?.stream;
    const mime = recordingMime();
    if (!stream || mime === null) return;
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start(250);
    recording.current = { recorder, chunks, started: performance.now(), mime: recorder.mimeType || mime || "video/webm" };
    setFilled(Array(N).fill(false));
    setElapsed(0);
    setCalibrating(!manual);
    setPhase("recording");
  }

  function finish(outcome: MovementRecording["outcome"], coverage: number) {
    const r = recording.current;
    if (!r) return;
    recording.current = null;
    const durationMs = Math.round(performance.now() - r.started);
    r.recorder.onstop = () => {
      const blob = new Blob(r.chunks, { type: r.mime.split(";")[0] });
      result.current = {
        blob,
        url: URL.createObjectURL(blob),
        mime: blob.type,
        durationMs,
        outcome,
        metrics: { coverage: Number(coverage.toFixed(2)), segments: N, trackerAvailable: !manual, durationMs, format: r.mime },
      };
      if (outcome === "partial") setPhase("partial");
      else {
        setPhase("passed");
        vibrate(40);
        setTimeout(() => result.current && onComplete(result.current), 900);
      }
    };
    r.recorder.stop();
  }

  // Tracking loop while recording.
  useEffect(() => {
    if (phase !== "recording") return;
    const video = videoRef.current;
    const handle = camera.handle;
    if (!video || !handle) return;
    let raf = 0;
    let last = 0;
    let ring: boolean[] = Array(N).fill(false);
    let previous = -1;
    const baseline: { x: number; y: number }[] = [];

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const r = recording.current;
      if (!r || now - last < 60) return;
      last = now;
      const ms = now - r.started;
      setElapsed(ms);

      if (manual || !tracker.landmarker) {
        // No tracking: fill the ring with time so the person can see how long is left.
        const share = Math.min(1, ms / config.headTurn.fallbackDurationMs);
        ring = ring.map((_, i) => i < Math.floor(share * N));
        setFilled(ring);
        if (share >= 1) finish("manual", 1);
        return;
      }

      const faces = trackFaces(tracker.landmarker, video);
      setNoFace(faces.length === 0);
      if (faces.length === 1) {
        const pose = { x: handle.mirrored ? -faces[0].pose.x : faces[0].pose.x, y: faces[0].pose.y };
        if (baseline.length < config.headTurn.baselineFrames) {
          baseline.push(pose);
          if (baseline.length === config.headTurn.baselineFrames) setCalibrating(false);
        } else {
          const base = { x: baseline.reduce((s, p) => s + p.x, 0) / baseline.length, y: baseline.reduce((s, p) => s + p.y, 0) / baseline.length };
          const relative = { x: pose.x - base.x, y: (pose.y - base.y) * config.headTurn.pitchGain };
          const segment = ringSegment(relative, N, config.headTurn.threshold);
          setPointer(segment >= 0 ? segment : null);
          const next = fillRing(ring, segment, previous);
          if (segment >= 0) previous = segment;
          if (next.filter(Boolean).length !== ring.filter(Boolean).length) {
            ring = next;
            setFilled(next);
          }
          if (ringProgress(ring) >= config.headTurn.completeAt) {
            setFilled(Array(N).fill(true));
            return finish("passed", ringProgress(ring));
          }
        }
      }
      if (ms > config.headTurn.maxDurationMs) finish("partial", ringProgress(ring));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // finish is stable for the life of a recording.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, videoRef, camera.handle, tracker.landmarker, manual]);

  // Stop a recording if the step unmounts mid-way.
  useEffect(() => () => recording.current?.recorder.state === "recording" ? recording.current.recorder.stop() : undefined, []);

  const secondsLeft = Math.max(0, Math.ceil(((manual ? config.headTurn.fallbackDurationMs : config.headTurn.maxDurationMs) - elapsed) / 1000));
  let text = "Slowly move your head in a circle";
  if (phase === "ready") text = manual ? "Face tracking is off. You'll record a short clip while moving your head in a slow circle" : "Fit your face in the oval, then start. Move your head in one slow circle";
  if (phase === "recording") text = manual ? `Keep moving your head in a slow circle · ${secondsLeft}s` : calibrating ? "Hold still for a moment…" : noFace ? "Keep your face in view" : progress > 0.6 ? "Nearly there. Keep going" : "Slowly move your head in a circle";
  if (phase === "passed") text = "Done. Thank you";
  if (phase === "partial") text = "We didn't catch the whole circle";

  return (
    <>
      <FaceOval guide={guide} width={stage.width} height={stage.height} state={phase === "passed" ? "good" : "searching"} />
      <Ring guide={guide} filled={filled} pointer={phase === "recording" && !manual ? pointer : null} />
      {phase === "recording" ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(calc(env(safe-area-inset-top)+72px),84px)] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-xl">
          <span className="size-2.5 animate-pulse rounded-full bg-[#ff453a]" />
          Recording · {Math.round(progress * 100)}%
        </div>
      ) : null}
      <StageFooter>
        <HintPill text={text} tone={phase === "passed" ? "good" : phase === "partial" || noFace ? "warn" : "neutral"} />
        {phase === "ready" ? (
          <button
            type="button"
            onClick={start}
            disabled={!camera.handle || tracker.status === "loading"}
            className="h-[52px] min-w-[220px] rounded-full bg-white px-8 text-[17px] font-semibold text-label shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {tracker.status === "loading" ? "Getting ready…" : "Start recording"}
          </button>
        ) : null}
        {phase === "recording" ? (
          <StageLink onClick={() => finish(progress >= config.headTurn.completeAt ? "passed" : manual ? "manual" : "partial", progress)}>Stop recording</StageLink>
        ) : null}
        {phase === "partial" ? (
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={start} className="h-[52px] rounded-full bg-white px-7 text-[16px] font-semibold text-label active:scale-[0.97]">
              Try again
            </button>
            <button
              type="button"
              onClick={() => result.current && onComplete(result.current)}
              className="h-[52px] rounded-full border border-white/30 bg-white/15 px-7 text-[16px] font-semibold text-white backdrop-blur-xl active:scale-[0.97]"
            >
              Continue anyway
            </button>
          </div>
        ) : null}
        <div className="min-h-2" />
      </StageFooter>
    </>
  );
}
