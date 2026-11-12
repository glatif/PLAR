import { readFile } from "node:fs/promises";
import { it } from "vitest";
import sharp from "sharp";
import { detectCard } from "@/lib/verification/card-detect";
import { imageToMat, loadOpenCv } from "@/lib/verification/opencv-node";
import { cardGuide } from "@/lib/verification/geometry";
import { searchArea } from "@/lib/verification/process";

// Debug helper for a local photo (never committed): DEBUG_IMAGE=<jpg> DEBUG_GUIDE=x,y,w,h DEBUG_OUT=<folder>
const IMAGE = process.env.DEBUG_IMAGE;
it.skipIf(!IMAGE)("renders candidates on a local photo", async () => {
  const cv = await loadOpenCv();
  const image = await imageToMat(cv, await readFile(IMAGE!));
  const [x, y, w, h] = (process.env.DEBUG_GUIDE ?? "").split(",").map(Number);
  const guide = process.env.DEBUG_GUIDE === "auto" ? cardGuide(image.cols, image.rows) : w ? { x, y, w, h } : undefined;
  const roi = guide ? searchArea(guide, image.cols, image.rows) : undefined;
  const draw = (q: { x: number; y: number }[], color: number[], t = 3) => {
    for (let i = 0; i < 4; i++) cv.line(image, new cv.Point(q[i].x, q[i].y), new cv.Point(q[(i + 1) % 4].x, q[(i + 1) % 4].y), new cv.Scalar(...color), t);
  };
  const found = detectCard(cv, image, roi, { guide });
  if (guide) cv.rectangle(image, new cv.Point(guide.x, guide.y), new cv.Point(guide.x + guide.w, guide.y + guide.h), new cv.Scalar(0, 200, 255, 255), 2);
  if (found) draw(found.quad, [255, 0, 0, 255], 5);
  console.log("chosen", found && found.score.toFixed(3), found?.quad.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(" "));
  const name = IMAGE!.split("/").pop();
  await sharp(Buffer.from(image.data), { raw: { width: image.cols, height: image.rows, channels: image.channels() as 3 | 4 } }).resize(960).jpeg().toFile(`${process.env.DEBUG_OUT}/dbg-${name}`);
  image.delete();
});
