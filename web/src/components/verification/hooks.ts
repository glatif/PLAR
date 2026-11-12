"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { CameraError, openCamera, openTestSource, type CameraErrorCode, type CameraHandle, type Facing } from "@/lib/verification/camera";
import { loadFaceTracker } from "@/lib/verification/face-tracker";
import type { DetectRequest, DetectResponse } from "@/lib/verification/card-detector.worker";

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export type CameraState = {
  handle: CameraHandle | null;
  status: "idle" | "starting" | "live" | "error";
  error: CameraErrorCode | null;
  videoSize: { width: number; height: number } | null;
  retry: () => void;
};

type Opened = { key: string; handle?: CameraHandle; error?: CameraErrorCode; size?: { width: number; height: number } };

/**
 * Opens the camera (or a test file) for the requested facing into `videoRef`, and reopens when the
 * facing changes. Status is derived from the latest result, so nothing is set while the effect runs.
 */
export function useCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  facing: Facing | null,
  quality: "face" | "document",
  testFile: File | null,
): CameraState {
  const [attempt, setAttempt] = useState(0);
  const [opened, setOpened] = useState<Opened | null>(null);
  const key = facing ? `${facing}|${quality}|${attempt}|${testFile ? `${testFile.name}:${testFile.size}` : "camera"}` : null;

  useEffect(() => {
    if (!facing || !key) return;
    let cancelled = false;
    let handle: CameraHandle | null = null;
    (testFile ? openTestSource(testFile, facing) : openCamera(facing, quality))
      .then(async (h) => {
        if (cancelled) return h.stop();
        handle = h;
        const video = videoRef.current;
        if (video) {
          video.srcObject = h.stream;
          await video.play().catch(() => undefined);
          const measure = () => setOpened((o) => (o?.key === key ? { ...o, size: { width: video.videoWidth, height: video.videoHeight } } : o));
          video.addEventListener("loadedmetadata", measure);
          video.addEventListener("resize", measure);
          setOpened({ key, handle: h, size: video.videoWidth ? { width: video.videoWidth, height: video.videoHeight } : undefined });
        } else {
          setOpened({ key, handle: h });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setOpened({ key, error: e instanceof CameraError ? e.code : "unknown" });
      });
    return () => {
      cancelled = true;
      handle?.stop();
    };
  }, [videoRef, facing, quality, testFile, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = opened && opened.key === key ? opened : null;
  return {
    handle: current?.handle ?? null,
    status: !key ? "idle" : !current ? "starting" : current.error ? "error" : "live",
    error: current?.error ?? null,
    videoSize: current?.size ?? null,
    retry,
  };
}

/** Size of an element, kept up to date (rotation, resizing, mobile address bar). Use the returned callback as `ref`. */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, size] as const;
}

// ---------------------------------------------------------------------------
// Face tracker
// ---------------------------------------------------------------------------

export function useFaceTracker(enabled: boolean) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "unavailable"; landmarker: FaceLandmarker | null }>({ status: "loading", landmarker: null });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadFaceTracker()
      .then((landmarker) => !cancelled && setState({ status: "ready", landmarker }))
      .catch(() => !cancelled && setState({ status: "unavailable", landmarker: null }));
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}

// ---------------------------------------------------------------------------
// Card detector (Web Worker)
// ---------------------------------------------------------------------------

type Result = Extract<DetectResponse, { type: "result" }>;

class CardDetector {
  worker: Worker;
  status: "loading" | "ready" | "error" = "loading";
  private listeners = new Set<() => void>();
  private pending = new Map<number, (r: Result | null) => void>();
  private nextId = 1;

  constructor() {
    this.worker = new Worker(new URL("../../lib/verification/card-detector.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (event: MessageEvent<DetectResponse>) => {
      const msg = event.data;
      if (msg.type === "ready") this.setStatus("ready");
      else if (msg.type === "error") {
        if (this.status === "loading") this.setStatus("error");
        this.pending.forEach((resolve) => resolve(null));
        this.pending.clear();
      } else {
        this.pending.get(msg.id)?.(msg);
        this.pending.delete(msg.id);
      }
    };
    this.worker.onerror = () => this.setStatus("error");
  }

  private setStatus(status: CardDetector["status"]) {
    this.status = status;
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** `guide`: the on-screen card frame in the image's pixels, which steers the search. */
  detect(image: ImageData, guide?: DetectRequest["guide"]): Promise<Result | null> {
    const id = this.nextId++;
    const request: DetectRequest = { id, width: image.width, height: image.height, buffer: image.data.buffer as ArrayBuffer, guide };
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage(request, [request.buffer]);
    });
  }
}

let detector: CardDetector | null = null;

/** Starts the card detector early (it downloads OpenCV), so it's ready by the ID step. */
export function warmCardDetector() {
  if (typeof Worker === "undefined") return null;
  detector ??= new CardDetector();
  return detector;
}

export function useCardDetector() {
  const [, force] = useState(0);
  const d = warmCardDetector();
  useEffect(() => {
    if (!d) return;
    const unsubscribe = d.subscribe(() => force((n) => n + 1));
    return () => {
      unsubscribe();
    };
  }, [d]);
  return { detector: d, status: d?.status ?? "error" };
}
