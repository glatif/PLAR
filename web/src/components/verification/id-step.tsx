"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { verificationConfig as config } from "@/lib/verification/config";
import { captureStill, coverTransform, vibrate } from "@/lib/verification/camera";
import { cardGuide, cardHintText, checkCard, distance, type CardHint, type Quad, type Rect } from "@/lib/verification/geometry";
import type { CameraState } from "@/components/verification/hooks";
import { useCardDetector } from "@/components/verification/hooks";
import { Flash, HintPill, Shutter, StageFooter } from "@/components/verification/stage";

export type IdCapture = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  outcome: "passed" | "manual";
  /** The on-screen frame and the live detection, in photo pixels. Used for straightening. */
  guide: Rect;
  liveQuad: Quad | null;
  metrics: Record<string, number | string | boolean | null>;
};

const ANALYSIS_SIDE = 480;

/**
 * The card frame: dimmed surroundings, rounded frame and corner brackets, which turn green when the
 * card is lined up. The detected outline isn't drawn: it only drives the colour and the hints.
 */
function CardFrame({ guide, width, height, state }: { guide: Rect; width: number; height: number; state: "idle" | "good" }) {
  const r = Math.min(guide.w, guide.h) * 0.07;
  const bracket = Math.min(guide.w, guide.h) * 0.22;
  const color = state === "good" ? "#4cd58a" : "white";
  const { x, y, w, h } = guide;
  const corners = [
    `M${x} ${y + bracket} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + bracket}`,
    `M${x + w - bracket} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + bracket}`,
    `M${x + w} ${y + h - bracket} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + w - bracket}`,
    `M${x + bracket} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + h - bracket}`,
  ];
  return (
    <>
    {/* Dimming outside the frame: a huge shadow around a rounded rectangle (robust over live video). */}
    <div
      aria-hidden
      className="pointer-events-none absolute z-10 shadow-[0_0_0_200vmax_rgba(10,10,12,0.6)]"
      style={{ left: x, top: y, width: w, height: h, borderRadius: r }}
    />
    <svg className="pointer-events-none absolute inset-0 z-10" width={width} height={height} aria-hidden>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={color} strokeOpacity={state === "good" ? 0.9 : 0.35} strokeWidth={state === "good" ? 3 : 1.5} className="transition-[stroke] duration-200" />
      {corners.map((d) => (
        <path key={d} d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" className="transition-[stroke] duration-200" />
      ))}
    </svg>
    </>
  );
}

export function IdStep({
  side,
  camera,
  videoRef,
  stage,
  onCapture,
}: {
  side: "front" | "back";
  camera: CameraState;
  videoRef: RefObject<HTMLVideoElement | null>;
  stage: { width: number; height: number };
  onCapture: (capture: IdCapture) => void;
}) {
  const { detector, status } = useCardDetector();
  const [hint, setHint] = useState<CardHint>("none");
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef<{ ok: boolean; videoQuad: Quad | null; hint: CardHint; fill: number; ms: number | null }>({ ok: false, videoQuad: null, hint: "none", fill: 0, ms: null });
  const guide = useMemo(() => cardGuide(stage.width, stage.height), [stage.width, stage.height]);
  const handle = camera.handle;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !detector || status !== "ready" || !handle || !camera.videoSize || !stage.width) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const recent: Quad[] = [];
    let stop = false;
    let wasOk = false;

    const run = async () => {
      while (!stop) {
        const started = performance.now();
        if (video.readyState >= 2 && video.videoWidth) {
          const t = coverTransform(video.videoWidth, video.videoHeight, stage.width, stage.height, handle.mirrored);
          // The frame in video pixels (min/max, since mirroring swaps left and right).
          const a = t.toVideo(guide.x, guide.y);
          const b = t.toVideo(guide.x + guide.w, guide.y + guide.h);
          const g: Rect = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
          // Look a quarter beyond the frame on each side.
          const sx = Math.max(0, g.x - g.w * 0.25);
          const sy = Math.max(0, g.y - g.h * 0.25);
          const sw = Math.min(video.videoWidth, g.x + g.w * 1.25) - sx;
          const sh = Math.min(video.videoHeight, g.y + g.h * 1.25) - sy;
          const k = Math.min(1, ANALYSIS_SIDE / Math.max(sw, sh));
          canvas.width = Math.round(sw * k);
          canvas.height = Math.round(sh * k);
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          const frame = { x: (g.x - sx) * k, y: (g.y - sy) * k, w: g.w * k, h: g.h * k };
          const result = await detector.detect(ctx.getImageData(0, 0, canvas.width, canvas.height), frame);
          if (stop) break;

          const videoQuad = result?.quad ? (result.quad.map((p) => ({ x: sx + p.x / k, y: sy + p.y / k })) as Quad) : null;
          if (videoQuad) {
            recent.push(videoQuad);
            if (recent.length > config.card.stableFrames) recent.shift();
          } else recent.length = 0;
          const stable =
            recent.length >= config.card.stableFrames &&
            recent.every((q) => q.every((p, i) => distance(p, recent[recent.length - 1][i]) < g.w * 0.025));
          const check = checkCard(videoQuad, g, { sharpness: result?.sharpness, glare: result?.glare, stable });
          if (check.ok && !wasOk) vibrate();
          wasOk = check.ok;
          latest.current = { ok: check.ok, videoQuad, hint: check.hint, fill: check.fill, ms: result?.ms ?? null };
          setHint(check.hint);
        }
        // About six checks a second: responsive without draining the battery.
        await new Promise((r) => setTimeout(r, Math.max(0, 160 - (performance.now() - started))));
      }
    };
    run();
    return () => {
      stop = true;
    };
  }, [detector, status, videoRef, camera.videoSize, handle, stage.width, stage.height, guide]);

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !handle || busy) return;
    setBusy(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    // Busy only while this photo is being taken: after a retake the shutter must work again.
    try {
      const t = coverTransform(video.videoWidth, video.videoHeight, stage.width, stage.height, handle.mirrored);
      const a = t.toVideo(guide.x, guide.y);
      const b = t.toVideo(guide.x + guide.w, guide.y + guide.h);
      const still = await captureStill(video, config.card.jpegQuality);
      const l = latest.current;
      onCapture({
        ...still,
        url: URL.createObjectURL(still.blob),
        outcome: l.ok ? "passed" : "manual",
        guide: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) },
        liveQuad: l.videoQuad,
        metrics: {
          detectorAvailable: status === "ready",
          hintAtCapture: l.hint,
          fillOfFrame: Number(l.fill.toFixed(2)),
          detectionMs: l.ms,
          camera: handle.facing,
        },
      });
    } finally {
      setBusy(false);
    }
  }

  const ok = hint === "good";
  const text =
    status === "loading"
      ? `Hold the ${side} of your ID inside the frame · getting the card check ready…`
      : status === "error"
        ? `Line up the ${side} of your ID with the frame, then take the photo`
        : cardHintText[hint];

  return (
    <>
      <CardFrame guide={guide} width={stage.width} height={stage.height} state={ok ? "good" : "idle"} />
      <div
        className="pointer-events-none absolute inset-x-0 z-20 text-center"
        style={{ top: Math.max(guide.y - 48, 96) }}
      >
        <span className="rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-xl">
          {side === "front" ? "Front of your ID · the side with your photo" : "Back of your ID"}
        </span>
      </div>
      <Flash show={flash} />
      <StageFooter>
        <HintPill text={text} tone={ok ? "good" : hint === "glare" || hint === "blurry" || hint === "tilt" ? "warn" : "neutral"} />
        <Shutter onPress={capture} ready={ok} busy={busy} label={`Take photo of the ${side} of your ID`} />
        <p className="max-w-[340px] text-center text-[12.5px] leading-[17px] text-white/75">
          {handle?.mirrored ? "The preview is mirrored to help you line up. Your photo won't be." : "Lay your ID on a plain, dark surface if your hands are shaky."}
        </p>
      </StageFooter>
    </>
  );
}
