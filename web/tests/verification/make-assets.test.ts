import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { it } from "vitest";
import sharp from "sharp";
import { cardGuide } from "@/lib/verification/geometry";
import { loadOpenCv } from "@/lib/verification/opencv-node";
import { makeBackground, makeCard, placeCard, type Background } from "./synthetic-card";

// Writes sample photos for manual testing: `npm run assets:verification`.
//   test-assets/id-cards/  synthetic SPECIMEN cards (committed; fictional)
//   test-assets/faces/     MediaPipe's public sample portrait (downloaded, not committed)

const OUT = new URL("../../test-assets/", import.meta.url).pathname;

it.skipIf(!process.env.MAKE_ASSETS)("writes verification test assets", async () => {
  const cv = await loadOpenCv();
  await mkdir(`${OUT}id-cards`, { recursive: true });
  await mkdir(`${OUT}faces`, { recursive: true });

  const shots: { name: string; side: "front" | "back"; bg: Background; portrait: boolean; seed: number; hard?: boolean }[] = [
    { name: "front-wood-landscape", side: "front", bg: "wood", portrait: false, seed: 11 },
    { name: "back-wood-landscape", side: "back", bg: "wood", portrait: false, seed: 11 },
    { name: "front-dark-phone", side: "front", bg: "dark", portrait: true, seed: 21 },
    { name: "back-dark-phone", side: "back", bg: "dark", portrait: true, seed: 21 },
    { name: "front-light-landscape", side: "front", bg: "light", portrait: false, seed: 31 },
    { name: "front-cloth-tilted", side: "front", bg: "cloth", portrait: false, seed: 41, hard: true },
  ];

  for (const s of shots) {
    const card = await makeCard(cv, s.seed, s.side);
    const bg = makeBackground(cv, s.portrait ? 1080 : 1920, s.portrait ? 1920 : 1080, s.bg, s.seed);
    const guide = cardGuide(bg.cols, bg.rows);
    const relative = guide.w / Math.min(bg.cols, bg.rows * 1.4);
    const scene = s.hard
      ? placeCard(cv, card, bg, s.seed, { maxRotation: 28, maxTilt: 0.06 })
      : placeCard(cv, card, bg, s.seed, { minScale: relative * 0.8, maxScale: relative * 0.95, maxRotation: 6, maxOffset: 0.04 });
    const jpeg = await sharp(Buffer.from(scene.image.data), { raw: { width: scene.image.cols, height: scene.image.rows, channels: 4 } })
      .removeAlpha()
      .jpeg({ quality: 90 })
      .toBuffer();
    await writeFile(`${OUT}id-cards/${s.name}.jpg`, jpeg);
    [card, bg, scene.image].forEach((m) => m.delete());
  }

  const empty = makeBackground(cv, 1920, 1080, "wood", 99);
  await writeFile(
    `${OUT}id-cards/no-card-wood.jpg`,
    await sharp(Buffer.from(empty.data), { raw: { width: 1920, height: 1080, channels: 4 } }).removeAlpha().jpeg({ quality: 90 }).toBuffer(),
  );
  empty.delete();

  const portrait = `${OUT}faces/portrait.jpg`;
  if (!existsSync(portrait)) {
    const res = await fetch("https://storage.googleapis.com/mediapipe-assets/portrait.jpg");
    await writeFile(portrait, Buffer.from(await res.arrayBuffer()));
  }
  // Re-framed copies with the face where the oval sits, so the "aligned" state can be tested on a
  // wide window (4:3) and a phone screen (390 × 844). The top edge is extended to make room above the head.
  const extended = await sharp(portrait).extend({ top: 260, extendWith: "copy" }).toBuffer();
  await sharp(extended).extract({ left: 0, top: 168, width: 819, height: 614 }).jpeg({ quality: 90 }).toFile(`${OUT}faces/face-centred-wide.jpg`);
  await sharp(extended).extract({ left: 191, top: 70, width: 418, height: 905 }).jpeg({ quality: 90 }).toFile(`${OUT}faces/face-centred-phone.jpg`);
});
