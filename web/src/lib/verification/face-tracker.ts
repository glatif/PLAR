"use client";

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FaceBox, HeadPose } from "@/lib/verification/geometry";

// Face tracking with MediaPipe Face Landmarker, served from /vendor/mediapipe (no CDN at runtime).
// Returns each face's box in video pixels and a head direction from where the nose sits on the face.

export type FaceObservation = { box: FaceBox; pose: HeadPose };

let tracker: Promise<FaceLandmarker> | null = null;

/** Loads the tracker once. Tries the GPU first and falls back to the CPU (older phones, some laptops). */
export function loadFaceTracker() {
  tracker ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
    const options = (delegate: "GPU" | "CPU") => ({
      baseOptions: { modelAssetPath: "/vendor/mediapipe/face_landmarker.task", delegate },
      runningMode: "VIDEO" as const,
      numFaces: 2,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    try {
      return await FaceLandmarker.createFromOptions(files, options("GPU"));
    } catch {
      return await FaceLandmarker.createFromOptions(files, options("CPU"));
    }
  })();
  tracker.catch(() => {
    tracker = null;
  });
  return tracker;
}

// Landmark indices in MediaPipe's 478-point face mesh.
const NOSE_TIP = 1;
const LEFT_EDGE = 234;
const RIGHT_EDGE = 454;
const FOREHEAD = 10;
const CHIN = 152;

let lastTimestamp = 0;

/** Faces in the current video frame, in video pixels. */
export function trackFaces(landmarker: FaceLandmarker, video: HTMLVideoElement): FaceObservation[] {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return [];
  // Timestamps must strictly increase for VIDEO mode.
  const now = Math.max(performance.now(), lastTimestamp + 1);
  lastTimestamp = now;
  const result = landmarker.detectForVideo(video, now);

  return result.faceLandmarks.map((points) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const px = (i: number) => ({ x: points[i].x * vw, y: points[i].y * vh });
    const nose = px(NOSE_TIP);
    const left = px(LEFT_EDGE);
    const right = px(RIGHT_EDGE);
    const top = px(FOREHEAD);
    const chin = px(CHIN);
    const faceW = Math.hypot(right.x - left.x, right.y - left.y) || 1;
    const faceH = Math.hypot(chin.x - top.x, chin.y - top.y) || 1;
    return {
      box: { cx: ((minX + maxX) / 2) * vw, cy: ((minY + maxY) / 2) * vh, w: (maxX - minX) * vw, h: (maxY - minY) * vh },
      // Positive x: nose towards the image's right. Positive y: nose below the face's middle.
      pose: { x: (nose.x - (left.x + right.x) / 2) / faceW, y: (nose.y - (top.y + chin.y) / 2) / faceH },
    };
  });
}

/** Average brightness (0–255) of the frame, from a tiny sample. */
export function frameBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const size = 24;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !video.videoWidth) return undefined;
  ctx.drawImage(video, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  return sum / (size * size);
}
