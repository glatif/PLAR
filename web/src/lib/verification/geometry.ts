// Pure geometry for verification: no browser, camera or OpenCV. Shared by the live UI, the
// background image processing and the tests.

import { verificationConfig as config } from "@/lib/verification/config";

export type Point = { x: number; y: number };
/** Four corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Point, Point, Point, Point];
export type Rect = { x: number; y: number; w: number; h: number };

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function centroid(points: readonly Point[]): Point {
  const n = points.length;
  return { x: points.reduce((s, p) => s + p.x, 0) / n, y: points.reduce((s, p) => s + p.y, 0) / n };
}

/** Polygon area (shoelace), always positive. */
export function polygonArea(points: readonly Point[]) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Orders four points as top-left, top-right, bottom-right, bottom-left, whatever order they arrive in.
 * Sorting by angle around the centre keeps it stable for strongly rotated cards.
 */
export function orderQuad(points: readonly Point[]): Quad {
  if (points.length !== 4) throw new Error("orderQuad needs exactly four points");
  const c = centroid(points);
  const sorted = [...points].sort((a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x));
  // Clockwise in screen space from the top-left-most corner.
  let start = 0;
  for (let i = 1; i < 4; i++) if (sorted[i].x + sorted[i].y < sorted[start].x + sorted[start].y) start = i;
  const ordered = [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]);
  return ordered as Quad;
}

/** Average lengths of the top/bottom and left/right sides. */
export function quadSides(q: Quad) {
  const top = distance(q[0], q[1]);
  const bottom = distance(q[3], q[2]);
  const left = distance(q[0], q[3]);
  const right = distance(q[1], q[2]);
  return { top, bottom, left, right, width: (top + bottom) / 2, height: (left + right) / 2 };
}

/** Long side over short side, so a card reads about 1.586 whichever way round it is. */
export function quadAspect(q: Quad) {
  const { width, height } = quadSides(q);
  return Math.max(width, height) / Math.max(1e-6, Math.min(width, height));
}

/** How evenly the card faces the camera: 1 is perfectly flat, lower means tilted away. */
export function quadSideRatio(q: Quad) {
  const s = quadSides(q);
  return Math.min(s.top / s.bottom, s.bottom / s.top, s.left / s.right, s.right / s.left);
}

export function scaleQuad(q: Quad, sx: number, sy = sx, dx = 0, dy = 0): Quad {
  return q.map((p) => ({ x: p.x * sx + dx, y: p.y * sy + dy })) as Quad;
}

/** Largest gap between matching corners, as a share of the quad's diagonal. */
export function quadError(a: Quad, b: Quad) {
  const diag = distance(b[0], b[2]);
  return Math.max(...a.map((p, i) => distance(p, b[i]))) / diag;
}

// ---------------------------------------------------------------------------
// Card frame: where the user should hold their ID
// ---------------------------------------------------------------------------

/** The card frame for a preview of the given size, in pixels. Landscape card in both orientations. */
export function cardGuide(width: number, height: number): Rect {
  const portrait = height > width;
  let w = width * (portrait ? config.card.guideWidthPortrait : config.card.guideWidthLandscape);
  let h = w / config.card.aspect;
  // Keep it inside short, wide screens too.
  const maxH = height * 0.62;
  if (h > maxH) {
    h = maxH;
    w = h * config.card.aspect;
  }
  return { x: (width - w) / 2, y: (height - h) / 2 - (portrait ? height * 0.04 : 0), w, h };
}

export type CardHint = "none" | "outside" | "closer" | "further" | "tilt" | "blurry" | "glare" | "steady" | "good";

export type CardCheck = {
  hint: CardHint;
  /** 0–1 share of the frame the card covers. */
  fill: number;
  ok: boolean;
};

/**
 * Judges a detected card against the frame. `quad` and `guide` share one coordinate space.
 * `sharpness` and `glare` come from the detector; `stable` is true when recent detections agree.
 */
export function checkCard(
  quad: Quad | null,
  guide: Rect,
  measures: { sharpness?: number; glare?: number; stable?: boolean } = {},
): CardCheck {
  if (!quad) return { hint: "none", fill: 0, ok: false };
  const fill = polygonArea(quad) / (guide.w * guide.h);
  const slackX = guide.w * 0.08;
  const slackY = guide.h * 0.12;
  const inside = quad.every(
    (p) => p.x >= guide.x - slackX && p.x <= guide.x + guide.w + slackX && p.y >= guide.y - slackY && p.y <= guide.y + guide.h + slackY,
  );
  const c = centroid(quad);
  const offCentre = Math.abs(c.x - (guide.x + guide.w / 2)) > guide.w * 0.18 || Math.abs(c.y - (guide.y + guide.h / 2)) > guide.h * 0.22;

  let hint: CardHint = "good";
  if (fill > config.card.maxFill) hint = "further";
  else if (!inside || offCentre) hint = "outside";
  else if (fill < config.card.minFill) hint = "closer";
  else if (quadSideRatio(quad) < config.card.minSideRatio) hint = "tilt";
  else if (measures.glare !== undefined && measures.glare > config.card.maxGlare) hint = "glare";
  else if (measures.sharpness !== undefined && measures.sharpness < config.card.minSharpness) hint = "blurry";
  else if (measures.stable === false) hint = "steady";
  return { hint, fill, ok: hint === "good" };
}

export const cardHintText: Record<CardHint, string> = {
  none: "Hold your ID inside the frame",
  outside: "Move your ID into the frame",
  closer: "Bring your ID a little closer",
  further: "Move your ID a little further away",
  tilt: "Hold your ID flat, facing the camera",
  blurry: "Hold still: the image is blurry",
  glare: "Tilt slightly to reduce glare",
  steady: "Hold still…",
  good: "Looks good. Take the photo",
};

// ---------------------------------------------------------------------------
// Face: fitting the oval and looking straight ahead
// ---------------------------------------------------------------------------

export type Ellipse = { cx: number; cy: number; rx: number; ry: number };

/** The face oval for a preview of the given size, in pixels. */
export function faceGuide(width: number, height: number): Ellipse {
  const portrait = height > width;
  const rx = Math.min(width * (portrait ? 0.36 : 0.2), height * 0.24);
  return { cx: width / 2, cy: height * (portrait ? 0.42 : 0.46), rx, ry: rx * 1.32 };
}

/** A face's bounding box, in the same pixel space as the oval. */
export type FaceBox = { cx: number; cy: number; w: number; h: number };
/** Head direction relative to the face: x is left/right, y is up/down, about ±0.5 at a strong turn. */
export type HeadPose = { x: number; y: number };

export type FaceHint = "none" | "many" | "closer" | "further" | "centre" | "straight" | "dark" | "steady" | "good";

/** Judges a face against the oval. Face boxes and the oval share one pixel space. */
export function checkFace(
  faces: { box: FaceBox; pose: HeadPose }[],
  g: Ellipse,
  measures: { brightness?: number; steady?: boolean } = {},
): { hint: FaceHint; ok: boolean } {
  if (faces.length === 0) return { hint: "none", ok: false };
  if (faces.length > 1) return { hint: "many", ok: false };
  const { box, pose } = faces[0];
  const fill = box.w / (g.rx * 2);
  const offset = Math.max(Math.abs(box.cx - g.cx) / (g.rx * 2), Math.abs(box.cy - g.cy) / (g.ry * 2));

  let hint: FaceHint = "good";
  if (fill > config.face.maxFill) hint = "further";
  else if (offset > config.face.maxOffset) hint = "centre";
  else if (fill < config.face.minFill) hint = "closer";
  else if (Math.abs(pose.x) > config.face.maxTurn || Math.abs(pose.y) > config.face.maxTurn) hint = "straight";
  else if (measures.brightness !== undefined && measures.brightness < config.face.minBrightness) hint = "dark";
  else if (measures.steady === false) hint = "steady";
  return { hint, ok: hint === "good" };
}

export const faceHintText: Record<FaceHint, string> = {
  none: "Position your face inside the oval",
  many: "Make sure only your face is in view",
  closer: "Move a little closer",
  further: "Move back a little",
  centre: "Centre your face in the oval",
  straight: "Look straight at the camera",
  dark: "Find a brighter spot",
  steady: "Hold still…",
  good: "Perfect. Take your photo",
};

// ---------------------------------------------------------------------------
// Head movement ring
// ---------------------------------------------------------------------------

/**
 * Which tick the head is pointing at, or -1 when it's close to the neutral pose.
 * Tick 0 is straight up; ticks go clockwise as seen on screen. `pose` is relative to the neutral pose
 * and already mirrored to match the selfie preview.
 */
export function ringSegment(pose: HeadPose, segments: number, threshold: number) {
  const magnitude = Math.hypot(pose.x, pose.y);
  if (magnitude < threshold) return -1;
  // Screen angle: 0 at the top, increasing clockwise.
  const angle = (Math.atan2(pose.x, -pose.y) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor((angle / (Math.PI * 2)) * segments) % segments;
}

/** Marks the pointed-at tick and its neighbours, so fast movement doesn't leave gaps. */
export function fillRing(filled: boolean[], segment: number, previous: number) {
  if (segment < 0) return filled;
  const next = [...filled];
  next[segment] = true;
  if (previous >= 0 && previous !== segment) {
    const n = filled.length;
    const forward = (segment - previous + n) % n;
    const backward = (previous - segment + n) % n;
    // Fill the short way round between the last tick and this one (fast head movement skips ticks).
    if (Math.min(forward, backward) <= 4) {
      const step = forward <= backward ? 1 : -1;
      for (let i = previous; i !== segment; i = (i + step + n) % n) next[i] = true;
    }
  }
  return next;
}

export const ringProgress = (filled: boolean[]) => filled.filter(Boolean).length / filled.length;
