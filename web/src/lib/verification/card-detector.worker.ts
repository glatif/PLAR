/// <reference lib="webworker" />

// Live ID card detection off the main thread, so the camera preview stays smooth on phones.
// OpenCV.js is a classic script, so it's fetched from /vendor/opencv and evaluated in this worker's scope.

import { detectCard, measureCard, type CV } from "@/lib/verification/card-detect";

declare const self: DedicatedWorkerGlobalScope & { cv?: CV | Promise<CV> };

let ready: Promise<CV> | null = null;

function loadCv(): Promise<CV> {
  ready ??= (async () => {
    const code = await (await fetch("/vendor/opencv/opencv.js")).text();
    // Indirect eval runs the UMD bundle in the worker's global scope, where it defines `cv`.
    (0, eval)(code);
    const loaded = self.cv as CV | Promise<CV> | undefined;
    if (!loaded) throw new Error("OpenCV failed to load");
    // OpenCV 5's browser build hands back a Promise of the library; older builds call onRuntimeInitialized.
    if (loaded instanceof Promise) return await loaded;
    const cv = loaded as CV & { onRuntimeInitialized?: () => void };
    if (!cv.Mat) await new Promise<void>((resolve) => (cv.onRuntimeInitialized = resolve));
    return cv;
  })();
  return ready;
}

/** `guide` is the on-screen card frame in this image's pixels. */
export type DetectRequest = { id: number; width: number; height: number; buffer: ArrayBuffer; guide?: { x: number; y: number; w: number; h: number } };
export type DetectResponse =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "result"; id: number; quad: { x: number; y: number }[] | null; score: number; sharpness?: number; glare?: number; ms: number };

loadCv()
  .then(() => self.postMessage({ type: "ready" } satisfies DetectResponse))
  .catch((error: unknown) => self.postMessage({ type: "error", message: String(error) } satisfies DetectResponse));

self.onmessage = async (event: MessageEvent<DetectRequest>) => {
  const { id, width, height, buffer, guide } = event.data;
  const started = performance.now();
  try {
    const cv = await loadCv();
    const mat = new cv.Mat(height, width, cv.CV_8UC4);
    mat.data.set(new Uint8Array(buffer));
    const found = detectCard(cv, mat, undefined, { guide });
    const measures = found ? measureCard(cv, mat, found.quad) : null;
    mat.delete();
    self.postMessage({
      type: "result",
      id,
      quad: found?.quad ?? null,
      score: found?.score ?? 0,
      sharpness: measures?.sharpness,
      glare: measures?.glare,
      ms: Math.round(performance.now() - started),
    } satisfies DetectResponse);
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) } satisfies DetectResponse);
  }
};
