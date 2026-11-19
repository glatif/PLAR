import "server-only";

import sharp from "sharp";
import { detectCard, straightenCard } from "@/lib/verification/card-detect";
import { verificationConfig as config } from "@/lib/verification/config";
import type { Quad, Rect } from "@/lib/verification/geometry";
import { imageToMat, loadOpenCv, matToJpeg } from "@/lib/verification/opencv-node";
import { getSession, newId, putFile, readArtifact, removeFiles, updateSession, type Artifact } from "@/lib/verification/storage";
import type { Straightening } from "@/lib/verification/states";

/** The on-screen frame grown by a quarter on each side: where the card should be. */
export function searchArea(guide: Rect, width: number, height: number): Rect {
  const x = Math.max(0, guide.x - guide.w * 0.25);
  const y = Math.max(0, guide.y - guide.h * 0.25);
  return { x, y, w: Math.min(width, guide.x + guide.w * 1.25) - x, h: Math.min(height, guide.y + guide.h * 1.25) - y };
}

/**
 * Finds the card's corners in an ID photo and writes a straightened, sharpened copy. When no corners
 * are found it falls back to cropping the on-screen frame, so the reviewer still gets a tidy image.
 */
export async function straightenImage(input: Buffer, guide?: Rect, liveQuad?: Quad | null) {
  const cv = await loadOpenCv();
  const image = await imageToMat(cv, input);
  try {
    const roi = guide ? searchArea(guide, image.cols, image.rows) : undefined;
    // The live preview's outline (when it found one) is checked alongside the server's own candidates.
    const found = detectCard(cv, image, roi, { guide, hints: [liveQuad] }) ?? (roi ? detectCard(cv, image) : null);
    if (found) {
      const flat = straightenCard(cv, image, found.quad);
      const jpeg = await matToJpeg(flat, Math.round(config.card.jpegQuality * 100));
      const result = { jpeg, quad: found.quad, method: found.method, score: found.score, width: flat.cols, height: flat.rows, outcome: "corrected" as Straightening };
      flat.delete();
      return result;
    }
    if (guide) {
      const left = Math.max(0, Math.round(guide.x));
      const top = Math.max(0, Math.round(guide.y));
      const width = Math.min(image.cols - left, Math.round(guide.w));
      const height = Math.min(image.rows - top, Math.round(guide.h));
      const jpeg = await sharp(input).rotate().extract({ left, top, width, height }).jpeg({ quality: 92 }).toBuffer();
      return { jpeg, quad: null, method: null, score: 0, width, height, outcome: "cropped" as Straightening };
    }
    return null;
  } finally {
    image.delete();
  }
}

/** Background job: straightens one saved ID photo and records the result on the session. */
export async function processIdPhoto(sessionId: string, artifactId: string) {
  const session = await getSession(sessionId);
  const original = session?.artifacts.find((a) => a.id === artifactId);
  if (!session || !original) return;
  const started = Date.now();
  try {
    const result = await straightenImage(await readArtifact(sessionId, original), original.guide, original.liveQuad);
    if (!result) {
      await updateSession(sessionId, (s) => {
        const a = s.artifacts.find((x) => x.id === artifactId);
        if (a) a.straightening = "failed";
      });
      return;
    }
    const kind = original.kind === "id-front" ? "id-front-straightened" : "id-back-straightened";
    const id = newId(`${kind}-`).slice(0, 64);
    const file = `${id}.jpg`;
    await putFile(sessionId, file, result.jpeg);
    const derived: Artifact = {
      id,
      kind,
      file,
      mime: "image/jpeg",
      bytes: result.jpeg.length,
      createdAt: new Date().toISOString(),
      width: result.width,
      height: result.height,
      quad: result.quad,
      straightening: result.outcome,
      sourceId: artifactId,
      metrics: { method: result.method, score: Number(result.score.toFixed(3)), processingMs: Date.now() - started },
    };
    let kept = false;
    let previous: Artifact | undefined;
    await updateSession(sessionId, (s) => {
      const a = s.artifacts.find((x) => x.id === artifactId);
      // The original may have been retaken or deleted while this ran: then drop the result.
      if (!a) return;
      previous = s.artifacts.find((x) => x.id === a.derivedId);
      s.artifacts = s.artifacts.filter((x) => x !== previous);
      a.straightening = result.outcome;
      a.derivedId = id;
      s.artifacts.push(derived);
      kept = true;
    });
    const unused = [...(kept ? [] : [file]), ...(previous ? [previous.file] : [])];
    if (unused.length) await removeFiles(sessionId, unused);
  } catch (error) {
    console.error("ID straightening failed", error);
    await updateSession(sessionId, (s) => {
      const a = s.artifacts.find((x) => x.id === artifactId);
      if (a) a.straightening = "failed";
    });
  }
}
