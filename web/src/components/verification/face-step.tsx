"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { verificationConfig as config } from "@/lib/verification/config";
import { captureStill, coverTransform, vibrate } from "@/lib/verification/camera";
import { frameBrightness, trackFaces } from "@/lib/verification/face-tracker";
import { checkFace, faceGuide, faceHintText, type Ellipse, type FaceHint } from "@/lib/verification/geometry";
import type { CameraState } from "@/components/verification/hooks";
import { Flash, HintPill, Shutter, StageFooter, StageLink } from "@/components/verification/stage";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export type StillCapture = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  outcome: "passed" | "manual";
  metrics: Record<string, number | string | boolean | null>;
};

/** The face oval, with everything outside it dimmed. Shared by the face and head movement steps. */
export function FaceOval({ guide, width, height, state }: { guide: Ellipse; width: number; height: number; state: "idle" | "searching" | "good" }) {
  return (
    <>
      {/* The dimming is a huge shadow around an oval: robust over live video and cheap to animate. */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-10 rounded-[50%] shadow-[0_0_0_200vmax_rgba(10,10,12,0.58)]"
        style={{ left: guide.cx - guide.rx, top: guide.cy - guide.ry, width: guide.rx * 2, height: guide.ry * 2 }}
      />
      <svg className="pointer-events-none absolute inset-0 z-10" width={width} height={height} aria-hidden>
        <ellipse
          cx={guide.cx}
          cy={guide.cy}
          rx={guide.rx}
          ry={guide.ry}
          fill="none"
          strokeWidth={state === "good" ? 5 : 3}
          className="transition-[stroke,stroke-width] duration-200"
          stroke={state === "good" ? "#4cd58a" : state === "searching" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)"}
          strokeDasharray={state === "idle" ? "6 10" : undefined}
        />
      </svg>
    </>
  );
}

export function FaceStep({
  camera,
  videoRef,
  stage,
  tracker,
  onCapture,
}: {
  camera: CameraState;
  videoRef: RefObject<HTMLVideoElement | null>;
  stage: { width: number; height: number };
  tracker: { status: "loading" | "ready" | "unavailable"; landmarker: FaceLandmarker | null };
  onCapture: (capture: StillCapture) => void;
}) {
  const [hint, setHint] = useState<FaceHint | "loading">("loading");
  const [ready, setReady] = useState(false);
  const [waitedLong, setWaitedLong] = useState(false);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef<{ hint: FaceHint | "loading"; ready: boolean; faces: number; fill: number | null; pose: { x: number; y: number } | null }>({
    hint: "loading",
    ready: false,
    faces: 0,
    fill: null,
    pose: null,
  });
  const guide = useMemo(() => faceGuide(stage.width, stage.height), [stage.width, stage.height]);
  const handle = camera.handle;

  // Offer the manual route after a while without a good alignment, or straight away without tracking.
  useEffect(() => {
    const timer = setTimeout(() => setWaitedLong(true), config.face.manualHintMs);
    return () => clearTimeout(timer);
  }, []);
  const showManual = waitedLong || tracker.status === "unavailable";

  useEffect(() => {
    const video = videoRef.current;
    const landmarker = tracker.landmarker;
    if (!video || !landmarker || !camera.videoSize || !handle || !stage.width) return;
    const sample = document.createElement("canvas");
    const history: { x: number; y: number }[] = [];
    let goodSince = 0;
    let brightness: number | undefined;
    let lastBrightness = 0;
    let lastRun = 0;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastRun < 70 || video.readyState < 2) return;
      lastRun = now;
      if (now - lastBrightness > 500) {
        brightness = frameBrightness(video, sample);
        lastBrightness = now;
      }
      const t = coverTransform(video.videoWidth, video.videoHeight, stage.width, stage.height, handle.mirrored);
      const faces = trackFaces(landmarker, video).map((f) => {
        const c = t.toStage(f.box.cx, f.box.cy);
        return { box: { cx: c.x, cy: c.y, w: f.box.w * t.scale, h: f.box.h * t.scale }, pose: { x: handle.mirrored ? -f.pose.x : f.pose.x, y: f.pose.y } };
      });
      if (faces.length === 1) {
        history.push({ x: faces[0].box.cx, y: faces[0].box.cy });
        if (history.length > 5) history.shift();
      } else history.length = 0;
      const steady = history.length >= 3 && Math.max(...history.map((p) => Math.hypot(p.x - history[0].x, p.y - history[0].y))) < guide.rx * 0.08;
      const result = checkFace(faces, guide, { brightness, steady });
      if (result.ok) goodSince ||= now;
      else goodSince = 0;
      const isReady = result.ok && now - goodSince >= config.face.steadyMs;

      if (isReady && !latest.current.ready) vibrate();
      latest.current = { hint: result.hint, ready: isReady, faces: faces.length, fill: faces[0] ? faces[0].box.w / (guide.rx * 2) : null, pose: faces[0]?.pose ?? null };
      setHint(result.hint);
      setReady(isReady);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, camera.videoSize, handle, tracker.landmarker, stage.width, stage.height, guide]);

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    setBusy(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    // Busy only while this photo is being taken: after a retake the shutter must work again.
    try {
      const still = await captureStill(video, config.face.jpegQuality);
      const l = latest.current;
      onCapture({
        ...still,
        url: URL.createObjectURL(still.blob),
        outcome: l.ready ? "passed" : "manual",
        metrics: {
          trackerAvailable: tracker.status === "ready",
          hintAtCapture: l.hint,
          facesInView: l.faces,
          fillOfOval: l.fill === null ? null : Number(l.fill.toFixed(2)),
          headTurn: l.pose ? Number(l.pose.x.toFixed(3)) : null,
          headTilt: l.pose ? Number(l.pose.y.toFixed(3)) : null,
        },
      });
    } finally {
      setBusy(false);
    }
  }

  const text =
    tracker.status === "unavailable"
      ? "Fit your face inside the oval, then take the photo"
      : hint === "loading" || tracker.status === "loading"
        ? "Getting ready…"
        : ready
          ? faceHintText.good
          : faceHintText[hint === "good" ? "steady" : hint];

  return (
    <>
      <FaceOval guide={guide} width={stage.width} height={stage.height} state={ready ? "good" : hint === "none" || hint === "loading" ? "idle" : "searching"} />
      <Flash show={flash} />
      <StageFooter>
        <HintPill text={text} tone={ready ? "good" : hint === "dark" || hint === "many" ? "warn" : "neutral"} />
        <Shutter onPress={capture} ready={ready} busy={busy} label={ready ? "Take photo" : "Take photo anyway"} />
        <div className="min-h-11">
          {showManual && !ready ? <StageLink onClick={capture}>Not turning green? Take the photo anyway</StageLink> : null}
        </div>
      </StageFooter>
    </>
  );
}
