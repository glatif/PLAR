import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { detectCard, measureCard, straightenCard, straightenedSize, type CV } from "@/lib/verification/card-detect";
import { verificationConfig } from "@/lib/verification/config";
import { cardGuide, quadError, type Rect } from "@/lib/verification/geometry";
import { loadOpenCv } from "@/lib/verification/opencv-node";
import { backgrounds, CARD_H, CARD_W, makeBackground, makeCard, placeCard } from "./synthetic-card";

// Detection accuracy on synthetic photos with known corners. A corner counts as found when it lands
// within 3% of the card's diagonal of the true position.

let cv: CV;

/** The frame expanded by 25% on each side, clamped to the image: where the app looks for the card. */
function searchArea(guide: Rect, width: number, height: number): Rect {
  const x = Math.max(0, guide.x - guide.w * 0.25);
  const y = Math.max(0, guide.y - guide.h * 0.25);
  return { x, y, w: Math.min(width, guide.x + guide.w * 1.25) - x, h: Math.min(height, guide.y + guide.h * 1.25) - y };
}
beforeAll(async () => {
  cv = await loadOpenCv();
});

type Result = { seed: number; background: string; error: number | null };
const results: Result[] = [];

afterAll(() => {
  const misses = results.filter((r) => r.error === null || r.error > 0.03);
  if (misses.length) console.log("Missed or imprecise:", misses);
});

describe("card detection on synthetic photos", () => {
  const cases = Array.from({ length: 40 }, (_, i) => ({ seed: 100 + i, background: backgrounds[i % backgrounds.length] }));

  it("finds the card's four corners in at least 85% of whole photos", async () => {
    for (const { seed, background } of cases) {
      const card = await makeCard(cv, seed, seed % 3 === 0 ? "back" : "front");
      const portrait = seed % 4 === 0;
      const bg = makeBackground(cv, portrait ? 720 : 1280, portrait ? 1280 : 720, background, seed);
      const scene = placeCard(cv, card, bg, seed);
      const found = detectCard(cv, scene.image);
      results.push({ seed, background, error: found ? quadError(found.quad, scene.quad) : null });
      [card, bg, scene.image].forEach((m) => m.delete());
    }
    const hits = results.filter((r) => r.error !== null && r.error <= 0.03).length;
    const errors = results.map((r) => r.error ?? 1).sort((a, b) => a - b);
    console.log(`Corner detection: ${hits}/${results.length} within 3% · median error ${(errors[Math.floor(errors.length / 2)] * 100).toFixed(2)}%`);
    expect(hits / results.length).toBeGreaterThanOrEqual(0.85);
  });

  it("finds the corners in at least 90% of photos when searching around the on-screen frame", async () => {
    // The app searches the area around the card frame (expanded by 25%), as it does for real captures.
    let hits = 0;
    const errors: number[] = [];
    for (const { seed, background } of cases) {
      const card = await makeCard(cv, seed, seed % 3 === 0 ? "back" : "front");
      const portrait = seed % 4 === 0;
      const bg = makeBackground(cv, portrait ? 720 : 1280, portrait ? 1280 : 720, background, seed);
      // Held up to the frame: about frame-sized and roughly lined up with it.
      const guide = cardGuide(bg.cols, bg.rows);
      const relative = guide.w / Math.min(bg.cols, bg.rows * 1.4);
      const scene = placeCard(cv, card, bg, seed, { minScale: relative * 0.7, maxScale: relative * 1.0, maxRotation: 8, maxOffset: 0.06 });
      const found = detectCard(cv, scene.image, searchArea(guide, bg.cols, bg.rows), { guide });
      const error = found ? quadError(found.quad, scene.quad) : 1;
      errors.push(error);
      if (error <= 0.03) hits++;
      else console.log("frame miss", seed, background, found ? error.toFixed(3) : "none");
      [card, bg, scene.image].forEach((m) => m.delete());
    }
    errors.sort((a, b) => a - b);
    console.log(`Corner detection around the frame: ${hits}/${cases.length} within 3% · median error ${(errors[Math.floor(errors.length / 2)] * 100).toFixed(2)}%`);
    expect(hits / cases.length).toBeGreaterThanOrEqual(0.9);
  });

  it("reports accuracy on harder photos (strong tilt, small cards)", async () => {
    let hits = 0;
    const total = 30;
    for (let i = 0; i < total; i++) {
      const seed = 500 + i;
      const card = await makeCard(cv, seed);
      const bg = makeBackground(cv, 1280, 720, backgrounds[i % backgrounds.length], seed);
      const scene = placeCard(cv, card, bg, seed, { minScale: 0.3, maxScale: 0.8, maxRotation: 35, maxTilt: 0.07 });
      const found = detectCard(cv, scene.image);
      if (found && quadError(found.quad, scene.quad) <= 0.03) hits++;
      [card, bg, scene.image].forEach((m) => m.delete());
    }
    console.log(`Hard photos: ${hits}/${total} within 3%`);
    // Informational: the live flow keeps people out of these conditions. Guard against regressions only.
    expect(hits / total).toBeGreaterThanOrEqual(0.6);
  });

  it("finds the card held in a hand, with fingers over its edges", async () => {
    // Fingers and a thumb (skin-coloured, round-ended bars) cross one or two sides of the card, as when
    // it's held up to the camera. The detector has to rely on the edges it can still see.
    let hits = 0;
    const total = 30;
    const skins = [[224, 172, 140], [198, 134, 98], [141, 85, 54], [236, 196, 170]];
    for (let i = 0; i < total; i++) {
      const seed = 300 + i;
      const card = await makeCard(cv, seed, seed % 3 === 0 ? "back" : "front");
      const portrait = seed % 4 === 0;
      const bg = makeBackground(cv, portrait ? 720 : 1280, portrait ? 1280 : 720, backgrounds[i % backgrounds.length], seed);
      const guide = cardGuide(bg.cols, bg.rows);
      const relative = guide.w / Math.min(bg.cols, bg.rows * 1.4);
      const scene = placeCard(cv, card, bg, seed, { minScale: relative * 0.7, maxScale: relative, maxRotation: 8, maxOffset: 0.06 });
      const q = scene.quad;
      const skin = new cv.Scalar(...skins[i % skins.length], 255);
      const thickness = Math.round(guide.h * 0.11);
      const along = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      const centre = { x: (q[0].x + q[2].x) / 2, y: (q[0].y + q[2].y) / 2 };
      // Side 0 = top, 1 = right, 2 = bottom, 3 = left; one or two sides get fingers.
      const sides = i % 2 ? [i % 4] : [i % 4, (i + 1) % 4];
      for (const side of sides) {
        const fingers = side % 2 === 0 ? 3 : 1;
        for (let f = 0; f < fingers; f++) {
          const edge = along(q[side], q[(side + 1) % 4], 0.45 + f * 0.13 + (i % 3) * 0.05);
          const inward = along(edge, centre, 0.3);
          const outward = along(edge, centre, -0.6);
          cv.line(scene.image, new cv.Point(outward.x, outward.y), new cv.Point(inward.x, inward.y), skin, thickness, cv.LINE_AA);
        }
      }
      const found = detectCard(cv, scene.image, searchArea(guide, bg.cols, bg.rows), { guide });
      const error = found ? quadError(found.quad, q) : 1;
      if (error <= 0.03) hits++;
      else console.log("hand miss", seed, backgrounds[i % backgrounds.length], found ? error.toFixed(3) : "none");
      [card, bg, scene.image].forEach((m) => m.delete());
    }
    console.log(`Held in a hand: ${hits}/${total} within 3%`);
    // About 80% today; the misses are mostly the checked "cloth" background, whose pattern has straight
    // edges everywhere. Guards against regressions.
    expect(hits / total).toBeGreaterThanOrEqual(0.75);
  });

  it("returns nothing for a photo with no card", () => {
    const empty = makeBackground(cv, 1280, 720, "dark", 7);
    expect(detectCard(cv, empty)).toBeNull();
    empty.delete();
  });
});

describe("photo quality hints", () => {
  it("flags a glare hotspot but not a card that's simply bright", async () => {
    const card = await makeCard(cv, 3);
    const bg = makeBackground(cv, 1280, 720, "dark", 3);
    const scene = placeCard(cv, card, bg, 3, { maxRotation: 5 });
    const found = detectCard(cv, scene.image)!;
    expect(measureCard(cv, scene.image, found.quad).glare).toBeLessThanOrEqual(verificationConfig.card.maxGlare);

    // A blown-out reflection across part of the card.
    const c = { x: (found.quad[0].x + found.quad[2].x) / 2, y: (found.quad[0].y + found.quad[2].y) / 2 };
    cv.circle(scene.image, new cv.Point(c.x, c.y), 70, new cv.Scalar(255, 255, 255, 255), -1);
    expect(measureCard(cv, scene.image, found.quad).glare).toBeGreaterThan(verificationConfig.card.maxGlare);
    [card, bg, scene.image].forEach((m) => m.delete());
  });
});

describe("straightening", () => {
  it("produces an ID-1 shaped image that matches the original card", async () => {
    const card = await makeCard(cv, 5);
    const bg = makeBackground(cv, 1280, 720, "wood", 5);
    const scene = placeCard(cv, card, bg, 5, { maxRotation: 15, maxTilt: 0.05 });
    const found = detectCard(cv, scene.image);
    expect(found).not.toBeNull();

    const flat = straightenCard(cv, scene.image, found!.quad, CARD_W);
    expect(flat.cols).toBe(CARD_W);
    expect(Math.abs(flat.cols / flat.rows - verificationConfig.card.aspect)).toBeLessThan(0.01);

    // Compare with the source card, both grey and downsized: they should line up closely.
    const a = new cv.Mat();
    const b = new cv.Mat();
    cv.cvtColor(flat, a, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(card, b, cv.COLOR_RGBA2GRAY);
    cv.resize(a, a, new cv.Size(214, 135));
    cv.resize(b, b, new cv.Size(214, 135));
    const result = new cv.Mat();
    cv.matchTemplate(a, b, result, cv.TM_CCOEFF_NORMED);
    const similarity = result.data32F[0];
    console.log(`Straightened card similarity: ${similarity.toFixed(3)}`);
    expect(similarity).toBeGreaterThan(0.8);

    [card, bg, scene.image, flat, a, b, result].forEach((m) => m.delete());
  });

  it("keeps a portrait card portrait", () => {
    const size = straightenedSize([
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 476 },
      { x: 0, y: 476 },
    ]);
    expect(size.height).toBeGreaterThan(size.width);
    expect(CARD_H).toBeLessThan(CARD_W);
  });
});
