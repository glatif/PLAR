import "server-only";

import { randomBytes } from "node:crypto";
import { blobStore } from "@/lib/verification/blob-store";
import { decrypt, encrypt } from "@/lib/verification/crypto";
import type { Quad, Rect } from "@/lib/verification/geometry";
import type { AiCheck } from "@/lib/verification/ai-check";
import {
  summarise,
  type ArtifactKind,
  type ReviewDecision,
  type SessionStatus,
  type StepKey,
  type StepOutcome,
  type Straightening,
} from "@/lib/verification/states";

// Verification sessions and their captures. On the live server they're in the private "verification"
// bucket of PLAR's own Supabase; in development, in web/.verification-data (see blob-store.ts).
// Everything is encrypted before it's stored (see crypto.ts) and decrypted only on the server, for
// the person who made the capture or a reviewer who has unlocked the identity checks page.
// Deleting removes the files for good.

/** The verification lab (the /verify demo and /testing) runs in development, or when explicitly enabled. */
export function labEnabled() {
  return process.env.NODE_ENV === "development" || process.env.VERIFICATION_LAB === "true";
}

export type Artifact = {
  id: string;
  kind: ArtifactKind;
  file: string;
  mime: string;
  bytes: number;
  createdAt: string;
  width?: number;
  height?: number;
  durationMs?: number;
  /** For ID photos: the on-screen frame in image pixels, and the live detection at capture time. */
  guide?: Rect;
  liveQuad?: Quad | null;
  /** For straightened images: the corners used, and how they were found. */
  quad?: Quad | null;
  straightening?: Straightening;
  /** The straightened copy made from this original. */
  derivedId?: string;
  sourceId?: string;
  metrics?: Record<string, number | string | boolean | null>;
};

export type StepRecord = { outcome: StepOutcome; at: string; metrics?: Record<string, number | string | boolean | null> };

export type VerificationSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  device: { userAgent: string; viewport: { width: number; height: number }; touch: boolean; pixelRatio: number };
  steps: Partial<Record<StepKey, StepRecord>>;
  blockedReason?: string;
  review?: { decision: ReviewDecision; note?: string; at: string };
  /** AI-assisted face match and ID reading (lab only). A suggestion for the reviewer. */
  aiCheck?: AiCheck;
  artifacts: Artifact[];
};

const SAFE_ID = /^[a-z0-9-]{8,64}$/;

export function assertSafeId(id: string) {
  if (!SAFE_ID.test(id)) throw new Error("Invalid id");
}

const sessionPath = (id: string, name = "") => {
  assertSafeId(id);
  return `sessions/${id}/${name}`;
};

export function newId(prefix = "") {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `${prefix}${stamp}-${randomBytes(4).toString("hex")}`;
}

// Writes to one session are queued, so a background job and a request never overwrite each other.
const queues = new Map<string, Promise<unknown>>();
function withSession<T>(id: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(id) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(id, next);
  next.finally(() => queues.get(id) === next && queues.delete(id)).catch(() => undefined);
  return next;
}

async function readSession(id: string): Promise<VerificationSession | null> {
  try {
    const data = await blobStore().get(sessionPath(id, "session.json"));
    return data ? (JSON.parse(decrypt(data).toString("utf8")) as VerificationSession) : null;
  } catch {
    return null;
  }
}

async function writeSession(session: VerificationSession) {
  session.updatedAt = new Date().toISOString();
  await blobStore().put(sessionPath(session.id, "session.json"), encrypt(Buffer.from(JSON.stringify(session))));
}

export async function createSession(device: VerificationSession["device"]) {
  const id = newId();
  const now = new Date().toISOString();
  const session: VerificationSession = { id, createdAt: now, updatedAt: now, status: "in_progress", device, steps: {}, artifacts: [] };
  await writeSession(session);
  return session;
}

export const getSession = (id: string) => readSession(id);

export async function listSessions() {
  const ids = (await blobStore().list("sessions").catch(() => [] as string[])).filter((d) => SAFE_ID.test(d));
  const sessions = (await Promise.all(ids.map(readSession))).filter((s): s is VerificationSession => s !== null);
  return sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Recomputes the overall status from the steps and the ID straightening results. */
function refreshStatus(session: VerificationSession) {
  if (session.status === "blocked" || session.status === "abandoned") return;
  const outcomes = Object.fromEntries(Object.entries(session.steps).map(([k, v]) => [k, v?.outcome])) as Partial<Record<StepKey, StepOutcome>>;
  const straightening = session.artifacts.filter((a) => a.kind === "id-front" || a.kind === "id-back").map((a) => a.straightening ?? "pending");
  session.status = summarise(outcomes, straightening);
}

export function updateSession(id: string, change: (session: VerificationSession) => void) {
  return withSession(id, async () => {
    const session = await readSession(id);
    if (!session) return null;
    change(session);
    refreshStatus(session);
    await writeSession(session);
    return session;
  });
}

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/webm": "webm", "video/mp4": "mp4" };

export function extensionFor(mime: string) {
  return extensions[mime.split(";")[0].trim()] ?? "bin";
}

/** Saves a file into a session and records it. Replaces an earlier capture of the same kind (a retake). */
export async function addArtifact(sessionId: string, input: Omit<Artifact, "id" | "file" | "bytes" | "createdAt">, data: Buffer) {
  const id = newId(`${input.kind}-`).slice(0, 64);
  const file = `${id}.${extensionFor(input.mime)}`;
  await putFile(sessionId, file, data);
  const artifact: Artifact = { ...input, id, file, bytes: data.length, createdAt: new Date().toISOString() };
  let replaced: Artifact[] = [];
  const session = await updateSession(sessionId, (s) => {
    replaced = s.artifacts.filter((a) => a.kind === input.kind || (a.sourceId && s.artifacts.find((o) => o.id === a.sourceId)?.kind === input.kind));
    s.artifacts = s.artifacts.filter((a) => !replaced.includes(a));
    s.artifacts.push(artifact);
  });
  await removeFiles(sessionId, replaced.map((a) => a.file));
  return { artifact, session };
}

const SAFE_FILE = /^[a-z0-9-]+\.(jpg|png|webp|webm|mp4)$/;
const filePath = (sessionId: string, file: string) => {
  if (!SAFE_FILE.test(file)) throw new Error("Invalid file");
  return sessionPath(sessionId, file);
};

/** Stores one capture file, encrypted. */
export async function putFile(sessionId: string, file: string, data: Buffer) {
  await blobStore().put(filePath(sessionId, file), encrypt(data));
}

export async function removeFiles(sessionId: string, files: string[]) {
  await blobStore().remove(files.map((f) => filePath(sessionId, f)));
}

/** One capture, decrypted, or null when it doesn't exist. */
export async function readFileData(sessionId: string, file: string) {
  const data = await blobStore().get(filePath(sessionId, file));
  return data ? decrypt(data) : null;
}

/** Deletes whole sessions and/or single files, permanently. Straightened copies go with their originals. */
export async function deleteItems(items: { sessions?: string[]; artifacts?: { sessionId: string; artifactId: string }[] }) {
  let files = 0;
  for (const id of items.sessions ?? []) {
    const session = await readSession(id);
    if (!session) continue;
    files += session.artifacts.length;
    const names = await blobStore().list(sessionPath(id)).catch(() => [] as string[]);
    await blobStore().remove([...new Set([...names, "session.json"])].map((n) => sessionPath(id, n)));
  }
  const bySession = new Map<string, string[]>();
  for (const { sessionId, artifactId } of items.artifacts ?? []) {
    if ((items.sessions ?? []).includes(sessionId)) continue;
    bySession.set(sessionId, [...(bySession.get(sessionId) ?? []), artifactId]);
  }
  for (const [sessionId, ids] of bySession) {
    let removed: Artifact[] = [];
    await updateSession(sessionId, (s) => {
      const doomed = new Set(ids);
      for (const a of s.artifacts) if (a.sourceId && doomed.has(a.sourceId)) doomed.add(a.id);
      removed = s.artifacts.filter((a) => doomed.has(a.id));
      s.artifacts = s.artifacts.filter((a) => !doomed.has(a.id));
      for (const a of s.artifacts) if (a.derivedId && doomed.has(a.derivedId)) delete a.derivedId;
    });
    await removeFiles(sessionId, removed.map((a) => a.file));
    files += removed.length;
  }
  return { files };
}

export async function readArtifact(sessionId: string, artifact: Artifact) {
  const data = await readFileData(sessionId, artifact.file);
  if (!data) throw new Error(`Missing capture ${artifact.file}`);
  return data;
}

/**
 * What the identity checks list shows before it's unlocked: the name read from the ID, the AI's
 * match percentage and verdict, the decision and which steps were done. No ID details (date of birth,
 * number, address, machine-readable text), no AI reasons and no review notes. The capture records stay
 * (so the list knows what was captured), but their files can't be fetched without unlocking.
 */
export function redactSession(session: VerificationSession): VerificationSession {
  const r = session.aiCheck?.result;
  const blank = { document_type: "", issuing_authority: "", date_of_birth: "", sex: "", document_number: "", issue_date: "", expiry_date: "", address: "", other_fields: [] };
  return {
    ...session,
    review: session.review ? { decision: session.review.decision, at: session.review.at } : undefined,
    blockedReason: session.blockedReason ? "Camera unavailable" : undefined,
    aiCheck: session.aiCheck
      ? {
          ...session.aiCheck,
          error: session.aiCheck.error ? "The AI check failed" : undefined,
          usage: undefined,
          result: r
            ? {
                face_match: { probability_same_person: r.face_match.probability_same_person, verdict: r.face_match.verdict, reasons: [] },
                id_front: { ...blank, full_name: r.id_front.full_name, given_names: r.id_front.given_names, surname: r.id_front.surname },
                id_back: { summary: "", fields: [], machine_readable_text: "" },
                image_quality: [],
                concerns: [],
              }
            : undefined,
        }
      : undefined,
    artifacts: session.artifacts.map((a) => ({ ...a, metrics: undefined, quad: undefined, liveQuad: undefined, guide: undefined })),
  };
}
