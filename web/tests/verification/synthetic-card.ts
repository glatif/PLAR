// Generates synthetic "SPECIMEN" ID card photos with known corner positions, for testing card
// detection and straightening. Every card is fictional: no real IDs, people or numbers.

import sharp from "sharp";
import type { CV } from "@/lib/verification/card-detect";
import type { Quad } from "@/lib/verification/geometry";

type Mat = InstanceType<CV["Mat"]>;

export const CARD_W = 856;
export const CARD_H = 540;

/** Small seeded random generator so every run produces the same images. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const palettes = [
  { body: "#f4f1ea", band: "#1d4e89", accent: "#c2550a", ink: "#1d1d1f" },
  { body: "#e8f1f8", band: "#0f8c82", accent: "#5e5ce6", ink: "#1d1d1f" },
  { body: "#fff7ef", band: "#8a3b0f", accent: "#0f8c82", ink: "#2b2b2b" },
  { body: "#dfe6ee", band: "#2f3a4a", accent: "#e2477f", ink: "#111111" },
  { body: "#2a3342", band: "#c2550a", accent: "#ffd3aa", ink: "#f4f4f4" },
];

/** Renders a fictional card front or back as an RGBA Mat (856 × 540, rounded corners). */
export async function makeCard(cv: CV, seed: number, side: "front" | "back" = "front"): Promise<Mat> {
  const r = rng(seed);
  const p = palettes[Math.floor(r() * palettes.length)];
  const lines = Array.from({ length: 5 }, (_, i) => 200 + i * 52);
  const front = `
    <rect x="0" y="0" width="${CARD_W}" height="96" fill="${p.band}"/>
    <text x="40" y="62" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">SPECIMEN · DEMO ID</text>
    <rect x="40" y="130" width="230" height="290" rx="14" fill="${p.accent}" opacity="0.85"/>
    <circle cx="155" cy="235" r="62" fill="#ffffff" opacity="0.7"/>
    <rect x="85" y="310" width="140" height="90" rx="45" fill="#ffffff" opacity="0.7"/>
    ${lines.map((y, i) => `<text x="310" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${i === 0 ? 34 : 26}" font-weight="${i === 0 ? 700 : 400}" fill="${p.ink}">${["NOT A REAL ID", "Name: Sample Person", "No. 0000 0000 0000", "Born: 01 Jan 2000", "Expires: 31 Dec 2099"][i]}</text>`).join("")}
    <rect x="40" y="455" width="${CARD_W - 80}" height="44" rx="6" fill="${p.ink}" opacity="0.12"/>`;
  const back = `
    <rect x="0" y="70" width="${CARD_W}" height="110" fill="#1d1d1f"/>
    ${[230, 280, 330, 380].map((y) => `<rect x="40" y="${y}" width="${CARD_W - 80 - r() * 260}" height="22" rx="4" fill="${p.ink}" opacity="0.35"/>`).join("")}
    <text x="40" y="470" font-family="Courier, monospace" font-size="30" fill="${p.ink}">ID&lt;&lt;SPECIMEN&lt;&lt;DEMO&lt;&lt;&lt;&lt;&lt;&lt;</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
    <defs><clipPath id="c"><rect width="${CARD_W}" height="${CARD_H}" rx="34"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="${CARD_W}" height="${CARD_H}" fill="${p.body}"/>${side === "front" ? front : back}</g></svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mat = new cv.Mat(info.height, info.width, cv.CV_8UC4);
  mat.data.set(data);
  return mat;
}

export type Background = "wood" | "dark" | "light" | "cloth" | "gradient";
export const backgrounds: Background[] = ["wood", "dark", "light", "cloth", "gradient"];

/** A textured surface to place the card on. */
export function makeBackground(cv: CV, width: number, height: number, kind: Background, seed: number): Mat {
  const r = rng(seed * 7 + 3);
  const mat = new cv.Mat(height, width, cv.CV_8UC4);
  const d = mat.data;
  const base = { wood: [150, 105, 70], dark: [38, 40, 46], light: [214, 210, 202], cloth: [86, 104, 128], gradient: [120, 120, 120] }[kind];
  const phase = r() * 10;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      if (kind === "wood") v = 22 * Math.sin((y + 8 * Math.sin(x / 90 + phase)) / 7) + 10 * Math.sin(x / 31);
      if (kind === "cloth") v = ((x >> 3) + (y >> 3)) % 2 ? 12 : -12;
      if (kind === "gradient") v = (x / width) * 90 - 45 + (y / height) * 40;
      const noise = (r() - 0.5) * 18;
      const i = (y * width + x) * 4;
      d[i] = Math.max(0, Math.min(255, base[0] + v + noise));
      d[i + 1] = Math.max(0, Math.min(255, base[1] + v + noise));
      d[i + 2] = Math.max(0, Math.min(255, base[2] + v + noise));
      d[i + 3] = 255;
    }
  }
  return mat;
}

export type Scene = { image: Mat; quad: Quad };

/**
 * Places a card on a background with a random position, size, rotation and perspective tilt,
 * then adds light blur and noise like a phone camera. Returns the image and the true corners.
 */
export function placeCard(cv: CV, card: Mat, bg: Mat, seed: number, options: { minScale?: number; maxScale?: number; maxRotation?: number; maxTilt?: number; maxOffset?: number } = {}): Scene {
  const r = rng(seed * 13 + 1);
  const { minScale = 0.45, maxScale = 0.72, maxRotation = 22, maxTilt = 0.035, maxOffset = 0.18 } = options;
  const W = bg.cols;
  const H = bg.rows;
  // Like the real flow, the whole card is in view: retry placements until every corner has a margin.
  for (let attempt = 0; attempt < 50; attempt++) {
    const scene = tryPlace();
    if (scene.quad.every((p) => p.x > W * 0.03 && p.x < W * 0.97 && p.y > H * 0.03 && p.y < H * 0.97)) return finish(scene.quad);
  }
  return finish(tryPlace().quad);

  function tryPlace() {
  const w = Math.min(W, H * 1.4) * (minScale + r() * (maxScale - minScale));
  const h = (w * CARD_H) / CARD_W;
  const angle = ((r() * 2 - 1) * maxRotation * Math.PI) / 180;
  const cx = W / 2 + (r() - 0.5) * W * maxOffset;
  const cy = H / 2 + (r() - 0.5) * H * maxOffset;
  const jitter = () => (r() * 2 - 1) * maxTilt * w;
  const corners = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([x, y]) => ({
    x: cx + x * Math.cos(angle) - y * Math.sin(angle) + jitter(),
    y: cy + x * Math.sin(angle) + y * Math.cos(angle) + jitter(),
  })) as Quad;
  return { quad: corners };
  }

  function finish(corners: Quad): Scene {
  const src = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, CARD_W, 0, CARD_W, CARD_H, 0, CARD_H]);
  const dst = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flatMap((p) => [p.x, p.y]));
  const m = cv.getPerspectiveTransform(src, dst);
  const warped = new cv.Mat();
  cv.warpPerspective(card, warped, m, new cv.Size(W, H), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));
  const channels = new cv.MatVector();
  cv.split(warped, channels);
  const alpha = channels.get(3);
  const image = bg.clone();
  warped.copyTo(image, alpha);

  // Camera softness, sensor noise and exposure.
  cv.GaussianBlur(image, image, new cv.Size(0, 0), 0.6 + r() * 0.8);
  const gain = 0.85 + r() * 0.3;
  image.convertTo(image, -1, gain, (r() - 0.5) * 20);

  [src, dst, m, warped, alpha, channels].forEach((x) => x.delete());
  return { image, quad: corners };
  }
}
