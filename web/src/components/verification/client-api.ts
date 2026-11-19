"use client";

import type { Artifact, StepRecord, VerificationSession } from "@/lib/verification/storage";
import type { ArtifactKind, ReviewDecision, StepKey, StepOutcome } from "@/lib/verification/states";
import { deviceInfo } from "@/lib/verification/camera";

// Calls to the verification API from the browser.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export async function startSession() {
  const res = await fetch("/api/verification/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device: deviceInfo() }),
  });
  return (await json<{ session: VerificationSession }>(res)).session;
}

export async function fetchSession(id: string) {
  return (await json<{ session: VerificationSession }>(await fetch(`/api/verification/sessions/${id}`, { cache: "no-store" }))).session;
}

export async function patchSession(
  id: string,
  body: {
    steps?: Partial<Record<StepKey, { outcome: StepOutcome; metrics?: StepRecord["metrics"] }>>;
    status?: "blocked" | "abandoned";
    blockedReason?: string;
    review?: { decision: ReviewDecision; note?: string } | null;
  },
) {
  const res = await fetch(`/api/verification/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await json<{ session: VerificationSession }>(res)).session;
}

export async function uploadArtifact(
  id: string,
  kind: ArtifactKind,
  blob: Blob,
  meta: Pick<Artifact, "width" | "height" | "durationMs" | "guide" | "liveQuad" | "metrics">,
) {
  const form = new FormData();
  const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "jpg";
  form.append("file", blob, `${kind}.${ext}`);
  form.append("kind", kind);
  form.append("meta", JSON.stringify(meta));
  const res = await fetch(`/api/verification/sessions/${id}/artifacts`, { method: "POST", body: form });
  return json<{ artifact: Artifact; session: VerificationSession }>(res);
}

export async function deleteCaptures(body: { sessions?: string[]; artifacts?: { sessionId: string; artifactId: string }[] }) {
  const res = await fetch("/api/verification/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json<{ files: number }>(res);
}

export async function reprocess(sessionId: string, artifactId: string) {
  const res = await fetch(`/api/verification/sessions/${sessionId}/artifacts/${artifactId}/reprocess`, { method: "POST" });
  return (await json<{ session: VerificationSession }>(res)).session;
}

export async function runAiCheck(sessionId: string) {
  const res = await fetch(`/api/verification/sessions/${sessionId}/ai-check`, { method: "POST" });
  return (await json<{ session: VerificationSession }>(res)).session;
}

export const fileUrl = (sessionId: string, file: string) => `/api/verification/files/${sessionId}/${file}`;

/** Unlocks photos, video and ID details on the identity checks page for 30 minutes. */
export async function unlockCaptures(password: string) {
  const res = await fetch("/api/verification/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
  return json<{ until: number }>(res);
}

export async function lockCaptures() {
  return json<{ locked: boolean }>(await fetch("/api/verification/unlock", { method: "DELETE" }));
}
