// Puts the face-tracking runtime and model (public/vendor/mediapipe) and OpenCV.js (public/vendor/opencv)
// where the app serves them, so the verification flow never loads code or models from a CDN at runtime.
// Runs after `npm install`; safe to run again.

import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasmSource = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const target = join(root, "public/vendor/mediapipe");
const model = {
  url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  file: join(target, "face_landmarker.task"),
  bytes: 3_758_596,
};

await mkdir(join(target, "wasm"), { recursive: true });
for (const name of await readdir(wasmSource)) {
  await copyFile(join(wasmSource, name), join(target, "wasm", name));
}
console.log("✓ MediaPipe runtime copied to public/vendor/mediapipe/wasm");

// OpenCV.js for the live ID card detector (loaded inside a Web Worker).
await mkdir(join(root, "public/vendor/opencv"), { recursive: true });
await copyFile(join(root, "node_modules/@techstark/opencv-js/dist/opencv.js"), join(root, "public/vendor/opencv/opencv.js"));
console.log("✓ OpenCV.js copied to public/vendor/opencv");

const have = existsSync(model.file) && (await stat(model.file)).size === model.bytes;
if (have) {
  console.log("✓ Face model already present");
} else {
  try {
    const res = await fetch(model.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(model.file, Buffer.from(await res.arrayBuffer()));
    console.log("✓ Face model downloaded to public/vendor/mediapipe/face_landmarker.task");
  } catch (error) {
    console.warn(`! Couldn't download the face model (${error.message}). Face checks fall back to manual capture until you rerun: npm run setup:verification`);
  }
}
