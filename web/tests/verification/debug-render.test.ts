import { it } from "vitest";
import sharp from "sharp";
import { detectCard } from "@/lib/verification/card-detect";
import { cardGuide, quadError } from "@/lib/verification/geometry";
import { loadOpenCv } from "@/lib/verification/opencv-node";
import { backgrounds, makeBackground, makeCard, placeCard } from "./synthetic-card";

// Debug helper: DEBUG_OUT=<folder> DEBUG_SEEDS=136,120 npx vitest run tests/verification/debug-render.test.ts
const OUT = process.env.DEBUG_OUT;
it.skipIf(!OUT)("renders detections for inspection", async () => {
  const cv = await loadOpenCv();
  for (const seed of (process.env.DEBUG_SEEDS ?? "136").split(",").map(Number)) {
    const background = backgrounds[(seed - 100) % backgrounds.length];
    const card = await makeCard(cv, seed, seed % 3 === 0 ? "back" : "front");
    const portrait = seed % 4 === 0;
    const bg = makeBackground(cv, portrait ? 720 : 1280, portrait ? 1280 : 720, background, seed);
    const guide = cardGuide(bg.cols, bg.rows);
    const relative = guide.w / Math.min(bg.cols, bg.rows * 1.4);
    const scene = placeCard(cv, card, bg, seed, { minScale: relative * 0.7, maxScale: relative, maxRotation: 8, maxOffset: 0.06 });
    const x = Math.max(0, guide.x - guide.w * 0.25);
    const y = Math.max(0, guide.y - guide.h * 0.25);
    const roi = { x, y, w: Math.min(bg.cols, guide.x + guide.w * 1.25) - x, h: Math.min(bg.rows, guide.y + guide.h * 1.25) - y };
    const found = detectCard(cv, scene.image, roi);
    const draw = (q: { x: number; y: number }[], color: number[]) => {
      for (let i = 0; i < 4; i++) cv.line(scene.image, new cv.Point(q[i].x, q[i].y), new cv.Point(q[(i + 1) % 4].x, q[(i + 1) % 4].y), new cv.Scalar(...color), 3);
    };
    cv.rectangle(scene.image, new cv.Point(roi.x, roi.y), new cv.Point(roi.x + roi.w, roi.y + roi.h), new cv.Scalar(255, 255, 0, 255), 2);
    draw(scene.quad, [0, 255, 0, 255]);
    if (found) draw(found.quad, [255, 0, 0, 255]);
    await sharp(Buffer.from(scene.image.data), { raw: { width: scene.image.cols, height: scene.image.rows, channels: 4 } }).resize(640).jpeg().toFile(`${OUT}/frame-${seed}.jpg`);
    console.log(seed, background, found ? quadError(found.quad, scene.quad).toFixed(3) : "none");
  }
});
