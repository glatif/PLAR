import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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

// Test captures live on this machine only, in web/.verification-data (git-ignored). Nothing is sent to
// another service, and deleting removes the files for good.

export const DATA_ROOT = resolve(process.cwd(), ".verification-data", "sessions");

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

const sessionDir = (id: string) => {
  assertSafeId(id);
  return join(DATA_ROOT, id);
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
    return JSON.parse(await readFile(join(sessionDir(id), "session.json"), "utf8")) as VerificationSession;
  } catch {
    return null;
  }
}

async function writeSession(session: VerificationSession) {
  session.updatedAt = new Date().toISOString();
  await writeFile(join(sessionDir(session.id), "session.json"), JSON.stringify(session, null, 2));
}

export async function createSession(device: VerificationSession["device"]) {
  const id = newId();
  await mkdir(sessionDir(id), { recursive: true });
  const now = new Date().toISOString();
  const session: VerificationSession = { id, createdAt: now, updatedAt: now, status: "in_progress", device, steps: {}, artifacts: [] };
  await writeSession(session);
  return session;
}

export const getSession = (id: string) => readSession(id);

export async function listSessions() {
  let ids: string[] = [];
  try {
    ids = (await readdir(DATA_ROOT)).filter((d) => SAFE_ID.test(d));
  } catch {
    return [];
  }
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
  await writeFile(join(sessionDir(sessionId), file), data);
  const artifact: Artifact = { ...input, id, file, bytes: data.length, createdAt: new Date().toISOString() };
  let replaced: Artifact[] = [];
  const session = await updateSession(sessionId, (s) => {
    replaced = s.artifacts.filter((a) => a.kind === input.kind || (a.sourceId && s.artifacts.find((o) => o.id === a.sourceId)?.kind === input.kind));
    s.artifacts = s.artifacts.filter((a) => !replaced.includes(a));
    s.artifacts.push(artifact);
  });
  await Promise.all(replaced.map((a) => rm(join(sessionDir(sessionId), a.file), { force: true })));
  return { artifact, session };
}

export function filePath(sessionId: string, file: string) {
  if (!/^[a-z0-9-]+\.(jpg|png|webp|webm|mp4)$/.test(file)) throw new Error("Invalid file");
  return join(sessionDir(sessionId), file);
}

export async function fileInfo(sessionId: string, file: string) {
  const path = filePath(sessionId, file);
  return { path, size: (await stat(path)).size };
}

/** Deletes whole sessions and/or single files, permanently. Straightened copies go with their originals. */
export async function deleteItems(items: { sessions?: string[]; artifacts?: { sessionId: string; artifactId: string }[] }) {
  let files = 0;
  for (const id of items.sessions ?? []) {
    const session = await readSession(id);
    if (!session) continue;
    files += session.artifacts.length;
    await rm(sessionDir(id), { recursive: true, force: true });
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
    await Promise.all(removed.map((a) => rm(join(sessionDir(sessionId), a.file), { force: true })));
    files += removed.length;
  }
  return { files };
}

export async function readArtifact(sessionId: string, artifact: Artifact) {
  return readFile(join(sessionDir(sessionId), artifact.file));
}
