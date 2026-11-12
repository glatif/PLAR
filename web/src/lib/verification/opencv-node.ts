import "server-only";

import { createRequire } from "node:module";
import sharp from "sharp";
import type { CV } from "@/lib/verification/card-detect";

// OpenCV.js in Node, loaded once per server process, plus JPEG <-> Mat helpers built on sharp.

let ready: Promise<CV> | null = null;

export function loadOpenCv(): Promise<CV> {
  ready ??= (async () => {
    // Loaded with require: the package exposes a thenable that ESM interop would try to await.
    const mod = createRequire(import.meta.url)("@techstark/opencv-js") as CV | Promise<CV>;
    if (mod instanceof Promise) return mod;
    if (!(mod as CV).Mat) await new Promise<void>((resolve) => ((mod as unknown as { onRuntimeInitialized: () => void }).onRuntimeInitialized = resolve));
    return mod as CV;
  })();
  return ready;
}

/** Decodes an image (JPEG, PNG, WebP…) into an RGBA Mat, honouring EXIF rotation. */
export async function imageToMat(cv: CV, input: Buffer) {
  const { data, info } = await sharp(input).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mat = new cv.Mat(info.height, info.width, cv.CV_8UC4);
  mat.data.set(data);
  return mat;
}

export async function matToJpeg(mat: InstanceType<CV["Mat"]>, quality = 92) {
  return sharp(Buffer.from(mat.data), { raw: { width: mat.cols, height: mat.rows, channels: mat.channels() as 3 | 4 } })
    .removeAlpha()
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
