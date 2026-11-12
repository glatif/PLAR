"use client";

// Camera access for the verification flow: opening a camera (or a test file posing as one), turning
// failures into plain-language states, grabbing still frames and picking a recording format.

export type Facing = "user" | "environment";

export type CameraErrorCode = "insecure" | "unsupported" | "denied" | "not_found" | "in_use" | "unknown";

export class CameraError extends Error {
  constructor(public code: CameraErrorCode, message: string) {
    super(message);
  }
}

export const cameraErrorText: Record<CameraErrorCode, { title: string; body: string }> = {
  insecure: {
    title: "This page needs a secure connection",
    body: "Browsers only allow the camera on https:// pages (or localhost). Open the secure link to continue.",
  },
  unsupported: {
    title: "This browser can't use the camera",
    body: "Try the latest Safari, Chrome, Edge or Firefox.",
  },
  denied: {
    title: "Camera access is turned off",
    body: "Allow camera access for this site, then try again. On iPhone: Settings › Safari › Camera. In Chrome: the camera icon in the address bar.",
  },
  not_found: {
    title: "No camera found",
    body: "Connect a camera, or continue on a phone.",
  },
  in_use: {
    title: "The camera is busy",
    body: "Another app or tab is using the camera. Close it, then try again.",
  },
  unknown: {
    title: "The camera didn't start",
    body: "Try again. If it keeps happening, restart your browser.",
  },
};

function toCameraError(error: unknown): CameraError {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return new CameraError("denied", String(error));
  if (name === "NotFoundError" || name === "OverconstrainedError") return new CameraError("not_found", String(error));
  if (name === "NotReadableError" || name === "AbortError") return new CameraError("in_use", String(error));
  return new CameraError("unknown", String(error));
}

export type CameraHandle = {
  stream: MediaStream;
  /** True when the preview should be mirrored (front camera, or a test file standing in for one). */
  mirrored: boolean;
  facing: Facing;
  canTorch: boolean;
  setTorch: (on: boolean) => Promise<void>;
  stop: () => void;
};

/** Opens the camera. `quality` picks a higher resolution for document photos. */
export async function openCamera(facing: Facing, quality: "face" | "document"): Promise<CameraHandle> {
  if (typeof window !== "undefined" && !window.isSecureContext) throw new CameraError("insecure", "Insecure context");
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError("unsupported", "getUserMedia missing");

  const size = quality === "document" ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1280 }, height: { ideal: 720 } };
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, ...size } });
  } catch (error) {
    // Some laptops reject the size hints; retry with the plainest request before giving up.
    if ((error as { name?: string })?.name === "OverconstrainedError") {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      } catch (retry) {
        throw toCameraError(retry);
      }
    } else {
      throw toCameraError(error);
    }
  }

  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  // Laptops report no facing mode: their webcam faces the person, so treat it as a front camera.
  const mobile = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
  const actualFacing: Facing =
    settings.facingMode === "environment" || settings.facingMode === "user"
      ? (settings.facingMode as Facing)
      : mobile && facing === "environment"
        ? "environment"
        : "user";
  const capabilities = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };

  return {
    stream,
    mirrored: actualFacing === "user",
    facing: actualFacing,
    canTorch: Boolean(capabilities.torch),
    setTorch: async (on) => {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => undefined);
    },
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}

/**
 * Uses an image or video file as the camera, for testing without one. The file is drawn onto a canvas
 * and the canvas is streamed, so the rest of the flow can't tell the difference.
 */
export async function openTestSource(file: File, facing: Facing): Promise<CameraHandle> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");
  const media = isVideo ? document.createElement("video") : new Image();
  if (media instanceof HTMLVideoElement) {
    media.src = url;
    media.muted = true;
    media.loop = true;
    media.playsInline = true;
    await media.play();
  } else {
    media.src = url;
    await media.decode();
  }
  const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  let raf = 0;
  const draw = () => {
    ctx.drawImage(media, 0, 0, width, height);
    raf = requestAnimationFrame(draw);
  };
  draw();
  const stream = canvas.captureStream(24);
  return {
    stream,
    mirrored: facing === "user",
    facing,
    canTorch: false,
    setTorch: async () => undefined,
    stop: () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      if (media instanceof HTMLVideoElement) media.pause();
      URL.revokeObjectURL(url);
    },
  };
}

export async function cameraCount() {
  try {
    return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").length;
  } catch {
    return 0;
  }
}

/** A full-resolution still from the live video, never mirrored. */
export async function captureStill(video: HTMLVideoElement, quality = 0.92) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", quality));
  return { blob, width: canvas.width, height: canvas.height };
}

/** The best recording format this browser supports: MP4 where possible (plays everywhere), else WebM. */
export function recordingMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/**
 * Maps between the video's own pixels and the on-screen stage, for a video shown with
 * `object-fit: cover` (cropped to fill) and optionally mirrored.
 */
export function coverTransform(videoW: number, videoH: number, stageW: number, stageH: number, mirrored: boolean) {
  const scale = Math.max(stageW / videoW, stageH / videoH);
  const ox = (stageW - videoW * scale) / 2;
  const oy = (stageH - videoH * scale) / 2;
  return {
    scale,
    toStage: (x: number, y: number) => ({ x: mirrored ? stageW - (x * scale + ox) : x * scale + ox, y: y * scale + oy }),
    toVideo: (x: number, y: number) => ({ x: ((mirrored ? stageW - x : x) - ox) / scale, y: (y - oy) / scale }),
  };
}

export function deviceInfo() {
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    touch: navigator.maxTouchPoints > 0,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

/** Keeps the screen awake during capture where the browser allows it. */
export async function keepAwake() {
  try {
    const lock = await (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen");
    return () => void lock?.release().catch(() => undefined);
  } catch {
    return () => undefined;
  }
}

export function vibrate(ms = 25) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not available on iOS; silent is fine.
  }
}
