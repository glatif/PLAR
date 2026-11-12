// Finds a physical ID card in a photo and straightens it. Works with OpenCV.js in the browser
// (Web Worker) and in Node (background processing), so it only imports OpenCV's types.

import type * as OpenCV from "@techstark/opencv-js";
import { verificationConfig as config } from "@/lib/verification/config";
import { orderQuad, polygonArea, quadAspect, quadSides, type Point, type Quad, type Rect } from "@/lib/verification/geometry";

export type CV = typeof OpenCV;
type Mat = OpenCV.Mat;

export type CardDetection = {
  quad: Quad;
  /** 0–1 confidence-like score (area, card shape, how well the outline fills the shape). */
  score: number;
  /** "contour" found four clean corners; "rect" fitted a rectangle to a rougher outline. */
  method: "contour" | "rect";
};

export type CardMeasures = { sharpness: number; glare: number; brightness: number };

const ANALYSIS_SIDE = 640;

/** Works on a grey copy of the image (or of `roi` within it), scaled so the long side is ~640 px. */
function prepareGray(cv: CV, rgba: Mat, roi?: Rect) {
  const rect = roi
    ? new cv.Rect(Math.max(0, Math.round(roi.x)), Math.max(0, Math.round(roi.y)), 0, 0)
    : new cv.Rect(0, 0, rgba.cols, rgba.rows);
  if (roi) {
    rect.width = Math.min(rgba.cols - rect.x, Math.round(roi.w));
    rect.height = Math.min(rgba.rows - rect.y, Math.round(roi.h));
  }
  const cropped = rgba.roi(rect);
  const scale = Math.min(1, ANALYSIS_SIDE / Math.max(rect.width, rect.height));
  const small = new cv.Mat();
  cv.resize(cropped, small, new cv.Size(Math.round(rect.width * scale), Math.round(rect.height * scale)), 0, 0, cv.INTER_AREA);
  cropped.delete();
  const gray = new cv.Mat();
  cv.cvtColor(small, gray, small.channels() === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY);
  const color = new cv.Mat();
  if (small.channels() === 4) cv.cvtColor(small, color, cv.COLOR_RGBA2RGB);
  else small.copyTo(color);
  small.delete();
  return { gray, color, scale, offset: { x: rect.x, y: rect.y } };
}

function median(gray: Mat) {
  const hist = new Array<number>(256).fill(0);
  const data = gray.data;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
  const half = Math.ceil(data.length / 4) / 2;
  let sum = 0;
  for (let v = 0; v < 256; v++) {
    sum += hist[v];
    if (sum >= half) return v;
  }
  return 128;
}

/** Edge and threshold maps that each tend to outline a card against a different kind of background. */
function binaryMaps(cv: CV, gray: Mat, color: Mat): Mat[] {
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  // A median filter wipes out fine texture (fabric, wood grain) while keeping the card's straight edges.
  const smoothed = new cv.Mat();
  cv.medianBlur(gray, smoothed, 7);
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const maps: Mat[] = [];
  const close = (m: Mat) => {
    cv.dilate(m, m, kernel, new cv.Point(-1, -1), 2);
    cv.erode(m, m, kernel, new cv.Point(-1, -1), 1);
    maps.push(m);
  };

  const m = median(blurred);
  for (const [source, lo, hi] of [
    [blurred, Math.max(10, 0.66 * m), Math.min(255, 1.33 * m)],
    [blurred, 30, 90],
    [smoothed, 20, 60],
    [smoothed, 50, 140],
  ] as const) {
    const edges = new cv.Mat();
    cv.Canny(source, edges, lo, hi);
    close(edges);
  }

  // Colour edges: a card can match the background in brightness but not in colour.
  const colorSmooth = new cv.Mat();
  cv.medianBlur(color, colorSmooth, 5);
  const channels = new cv.MatVector();
  cv.split(colorSmooth, channels);
  const combined = cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
  for (let i = 0; i < 3; i++) {
    const ch = channels.get(i);
    const edges = new cv.Mat();
    cv.Canny(ch, edges, 25, 75);
    cv.bitwise_or(combined, edges, combined);
    ch.delete();
    edges.delete();
  }
  close(combined);

  // Colour-only edges (brightness removed): wood grain, shadows and fabric weave are mostly light and
  // dark variation, while a card usually differs from the surface in colour.
  const ycrcb = new cv.Mat();
  cv.cvtColor(colorSmooth, ycrcb, cv.COLOR_RGB2YCrCb);
  const chroma = new cv.MatVector();
  cv.split(ycrcb, chroma);
  const chromaEdges = cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
  for (const i of [1, 2]) {
    const ch = chroma.get(i);
    cv.medianBlur(ch, ch, 5);
    const edges = new cv.Mat();
    cv.Canny(ch, edges, 6, 18);
    cv.bitwise_or(chromaEdges, edges, chromaEdges);
    ch.delete();
    edges.delete();
  }
  close(chromaEdges);
  [ycrcb, chroma].forEach((x) => x.delete());

  // Low-resolution colour edges: shrinking wipes out wood grain and fabric weave but keeps the card's
  // outline. Line fitting on the outline restores the precision afterwards.
  const tiny = new cv.Mat();
  cv.resize(color, tiny, new cv.Size(Math.round(color.cols / 3), Math.round(color.rows / 3)), 0, 0, cv.INTER_AREA);
  cv.medianBlur(tiny, tiny, 5);
  const tinyChannels = new cv.MatVector();
  cv.split(tiny, tinyChannels);
  const tinyEdges = cv.Mat.zeros(tiny.rows, tiny.cols, cv.CV_8UC1);
  for (let i = 0; i < 3; i++) {
    const ch = tinyChannels.get(i);
    const edges = new cv.Mat();
    cv.Canny(ch, edges, 18, 54);
    cv.bitwise_or(tinyEdges, edges, tinyEdges);
    ch.delete();
    edges.delete();
  }
  const upscaled = new cv.Mat();
  cv.resize(tinyEdges, upscaled, new cv.Size(gray.cols, gray.rows), 0, 0, cv.INTER_NEAREST);
  close(upscaled);
  [tiny, tinyChannels, tinyEdges].forEach((x) => x.delete());

  // A light card on a dark surface (or the other way round) separates cleanly by brightness.
  const otsu = new cv.Mat();
  cv.threshold(smoothed, otsu, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  cv.morphologyEx(otsu, otsu, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 3);
  const inverted = new cv.Mat();
  cv.bitwise_not(otsu, inverted);
  maps.push(otsu, inverted);

  [blurred, smoothed, colorSmooth, channels, kernel].forEach((x) => x.delete());
  return maps;
}

function matToPoints(mat: Mat): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < mat.rows; i++) pts.push({ x: mat.data32S[i * 2], y: mat.data32S[i * 2 + 1] });
  return pts;
}

function rotatedRectPoints(rect: OpenCV.RotatedRect): Point[] {
  const { center, size } = rect;
  const a = (rect.angle * Math.PI) / 180;
  const cos = Math.cos(a) / 2;
  const sin = Math.sin(a) / 2;
  return [
    { x: center.x - sin * size.height - cos * size.width, y: center.y + cos * size.height - sin * size.width },
    { x: center.x + sin * size.height - cos * size.width, y: center.y - cos * size.height - sin * size.width },
    { x: center.x + sin * size.height + cos * size.width, y: center.y - cos * size.height + sin * size.width },
    { x: center.x - sin * size.height + cos * size.width, y: center.y + cos * size.height + sin * size.width },
  ];
}

/** Least-squares line through points: a point on it and its direction. */
function fitLine(points: Point[]) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { x: mx, y: my, dx: Math.cos(angle), dy: Math.sin(angle) };
}

function intersect(a: ReturnType<typeof fitLine>, b: ReturnType<typeof fitLine>): Point | null {
  const det = a.dx * b.dy - a.dy * b.dx;
  if (Math.abs(det) < 1e-6) return null;
  const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / det;
  return { x: a.x + t * a.dx, y: a.y + t * a.dy };
}

/**
 * Sharpens a rough quad by fitting a straight line to the outline points along each side and
 * intersecting neighbouring sides. Handles rounded card corners and fingers over an edge.
 */
function refineQuad(quad: Quad, outline: Point[]): Quad {
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const near = outline.filter((p) => {
      const t = ((p.x - a.x) * ux + (p.y - a.y) * uy) / len;
      const d = Math.abs((p.x - a.x) * uy - (p.y - a.y) * ux);
      return t > 0.12 && t < 0.88 && d < Math.max(3, len * 0.03);
    });
    if (near.length < 6) return quad;
    lines.push(fitLine(near));
  }
  const corners: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const p = intersect(lines[(i + 3) % 4], lines[i]);
    if (!p) return quad;
    corners.push(p);
  }
  // Refinement should nudge, not jump: fall back if a corner moved implausibly far.
  const diag = Math.hypot(quad[2].x - quad[0].x, quad[2].y - quad[0].y);
  if (corners.some((p, i) => Math.hypot(p.x - quad[i].x, p.y - quad[i].y) > diag * 0.12)) return quad;
  return orderQuad(corners);
}

/** A candidate outline from one of the finders, in analysis pixels. */
type Candidate = { quad: Quad; method: CardDetection["method"] };

function quadsIn(cv: CV, binary: Mat, minArea: number): Candidate[] {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(binary, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  const candidates: { index: number; area: number }[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i);
    const area = cv.contourArea(c);
    if (area > minArea) candidates.push({ index: i, area });
    c.delete();
  }
  candidates.sort((a, b) => b.area - a.area);

  const found: Candidate[] = [];
  for (const { index } of candidates.slice(0, 10)) {
    const contour = contours.get(index);
    const hull = new cv.Mat();
    cv.convexHull(contour, hull, false, true);
    const perimeter = cv.arcLength(hull, true);

    let quad: Quad | null = null;
    let method: CardDetection["method"] = "contour";
    for (const k of [0.015, 0.02, 0.03, 0.04, 0.05]) {
      const approx = new cv.Mat();
      cv.approxPolyDP(hull, approx, k * perimeter, true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) quad = orderQuad(matToPoints(approx));
      approx.delete();
      if (quad) break;
    }
    if (!quad) {
      quad = orderQuad(rotatedRectPoints(cv.minAreaRect(hull)));
      method = "rect";
    }
    found.push({ quad: refineQuad(quad, matToPoints(contour)), method });
    hull.delete();
    contour.delete();
  }
  contours.delete();
  hierarchy.delete();
  return found;
}

/**
 * Colour gradients: for each pixel, the x and y gradient of whichever colour channel changes most.
 * A card's edge is a strong, straight run of gradients pointing across it.
 */
type Gradients = { gx: Float32Array; gy: Float32Array; mag: Float32Array; width: number; height: number };

function colourGradients(cv: CV, color: Mat): Gradients {
  const blurred = new cv.Mat();
  cv.GaussianBlur(color, blurred, new cv.Size(5, 5), 0);
  const channels = new cv.MatVector();
  cv.split(blurred, channels);
  const width = color.cols;
  const height = color.rows;
  const n = width * height;
  const gx = new Float32Array(n);
  const gy = new Float32Array(n);
  const mag = new Float32Array(n);
  const dx = new cv.Mat();
  const dy = new cv.Mat();
  for (let c = 0; c < 3; c++) {
    const ch = channels.get(c);
    cv.Sobel(ch, dx, cv.CV_32F, 1, 0, 3);
    cv.Sobel(ch, dy, cv.CV_32F, 0, 1, 3);
    const x = dx.data32F;
    const y = dy.data32F;
    for (let i = 0; i < n; i++) {
      const m = x[i] * x[i] + y[i] * y[i];
      if (m > mag[i]) {
        mag[i] = m;
        gx[i] = x[i];
        gy[i] = y[i];
      }
    }
    ch.delete();
  }
  for (let i = 0; i < n; i++) mag[i] = Math.sqrt(mag[i]);
  [blurred, channels, dx, dy].forEach((m) => m.delete());
  return { gx, gy, mag, width, height };
}

/** Gradient strength that counts as an edge: a step of about 8 grey levels after blurring. */
const EDGE_STRENGTH = 26;

/**
 * Share of a side that runs along a real edge: sample points along it, and for each look a few
 * pixels either side for a strong gradient pointing across the side. Texture (fabric, wood grain,
 * text) has gradients in every direction, so it rarely lines up with a long straight side. A card's
 * edge mostly keeps one direction of change along its length (card lighter than the surface, or
 * darker), while a pattern such as a check flips back and forth, so the minority direction counts half.
 */
function sideSupport(g: Gradients, a: Point, b: Point, reach: number, stride = 2) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 4) return { support: 0, points: [] as Point[] };
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const steps = Math.max(10, Math.round(len / stride));
  const rising: Point[] = [];
  const falling: Point[] = [];
  for (let s = 0; s <= steps; s++) {
    const t = 0.05 + (0.9 * s) / steps;
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    let bestMag = 0;
    let best: Point | null = null;
    let sign = 0;
    for (let d = -reach; d <= reach; d++) {
      const x = Math.round(px + nx * d);
      const y = Math.round(py + ny * d);
      if (x < 1 || y < 1 || x >= g.width - 1 || y >= g.height - 1) continue;
      const i = y * g.width + x;
      const m = g.mag[i];
      if (m < EDGE_STRENGTH || m <= bestMag) continue;
      // Across the side means parallel to its normal.
      const across = (g.gx[i] * nx + g.gy[i] * ny) / m;
      if (Math.abs(across) < 0.9) continue;
      bestMag = m;
      best = { x, y };
      sign = Math.sign(across);
    }
    if (best) (sign > 0 ? rising : falling).push(best);
  }
  const [major, minor] = rising.length >= falling.length ? [rising, falling] : [falling, rising];
  return { support: (major.length + minor.length * 0.5) / (steps + 1), points: [...major, ...minor] };
}

function quadSupport(g: Gradients, q: Quad, reach: number, stride = 2) {
  const sides = [0, 1, 2, 3].map((i) => sideSupport(g, q[i], q[(i + 1) % 4], reach, stride));
  const lengths = [0, 1, 2, 3].map((i) => Math.hypot(q[(i + 1) % 4].x - q[i].x, q[(i + 1) % 4].y - q[i].y));
  const total = lengths.reduce((a, b) => a + b, 0);
  const mean = sides.reduce((sum, s, i) => sum + s.support * lengths[i], 0) / total;
  return { mean, min: Math.min(...sides.map((s) => s.support)), sides };
}

/** A line through points that ignores strays (a finger's outline, a printed line close to the edge). */
function robustLine(points: Point[]) {
  let line = fitLine(points);
  let kept = points;
  for (let pass = 0; pass < 2; pass++) {
    const residual = (p: Point) => Math.abs((p.x - line.x) * line.dy - (p.y - line.y) * line.dx);
    const sorted = kept.map(residual).sort((a, b) => a - b);
    const limit = Math.max(1, sorted[Math.floor(sorted.length / 2)] * 2.5);
    const inliers = kept.filter((p) => residual(p) <= limit);
    if (inliers.length < 8) break;
    kept = inliers;
    line = fitLine(kept);
  }
  return line;
}

/** Moves each side onto the edge points that support it, then re-intersects the corners. */
function snapToEdges(q: Quad, sides: { support: number; points: Point[] }[]): Quad {
  const lines = sides.map((s) => (s.points.length >= 8 && s.support > 0.35 ? robustLine(s.points) : null));
  const fallback = [0, 1, 2, 3].map((i) => {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: a.x, y: a.y, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len };
  });
  const use = lines.map((l, i) => l ?? fallback[i]);
  const corners: Point[] = [];
  for (let i = 0; i < 4; i++) {
    const p = intersect(use[(i + 3) % 4], use[i]);
    if (!p) return q;
    corners.push(p);
  }
  const diag = Math.hypot(q[2].x - q[0].x, q[2].y - q[0].y);
  if (corners.some((p, i) => Math.hypot(p.x - q[i].x, p.y - q[i].y) > diag * 0.05)) return q;
  return orderQuad(corners);
}

/** One straight edge found by the line finder: y = slope·x + offset (rows) or x = slope·y + offset (columns). */
type EdgeLine = { slope: number; offset: number; length: number };

/**
 * Finds long straight edges and pairs them into card outlines. This copes with what the outline
 * finders can't: fingers over an edge, a corner off the shot, or a card that blends into the
 * background along one side, because it only needs a straight run along each of the four sides.
 */
function lineCandidates(cv: CV, gray: Mat, color: Mat, minSide: number, guide?: Rect): Candidate[] {
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 20, 60);
  const colorEdges = new cv.Mat();
  const colorSmooth = new cv.Mat();
  cv.GaussianBlur(color, colorSmooth, new cv.Size(5, 5), 0);
  const channels = new cv.MatVector();
  cv.split(colorSmooth, channels);
  for (let i = 0; i < 3; i++) {
    const ch = channels.get(i);
    cv.Canny(ch, colorEdges, 25, 75);
    cv.bitwise_or(edges, colorEdges, edges);
    ch.delete();
  }
  const segments = new cv.Mat();
  cv.HoughLinesP(edges, segments, 1, Math.PI / 180, 25, minSide * 0.12, minSide * 0.04);
  const width = gray.cols;
  const height = gray.rows;
  [blurred, edges, colorEdges, colorSmooth, channels].forEach((m) => m.delete());

  const rows: EdgeLine[] = [];
  const cols: EdgeLine[] = [];
  const tolerance = Math.tan((3 * Math.PI) / 180);
  const add = (list: EdgeLine[], slope: number, offset: number, length: number, centre: number, gap: number) => {
    // Merge with an existing line when it's nearly the same line (a long edge broken into pieces).
    const same = list.find((l) => Math.abs(l.slope - slope) < tolerance && Math.abs(l.slope * centre + l.offset - (slope * centre + offset)) < gap);
    if (!same) return list.push({ slope, offset, length });
    const total = same.length + length;
    same.slope = (same.slope * same.length + slope * length) / total;
    same.offset = (same.offset * same.length + offset * length) / total;
    same.length = total;
  };
  // OpenCV.js returns the segments as one row of four-int cells (1 × n) or one column (n × 1).
  const count = Math.min(segments.data32S.length / 4, 400);
  for (let i = 0; i < count; i++) {
    const [x1, y1, x2, y2] = segments.data32S.slice(i * 4, i * 4 + 4);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (Math.abs(dy) <= Math.abs(dx) * Math.tan((40 * Math.PI) / 180)) {
      const slope = dy / dx;
      add(rows, slope, y1 - slope * x1, length, width / 2, height * 0.012);
    } else if (Math.abs(dx) <= Math.abs(dy) * Math.tan((40 * Math.PI) / 180)) {
      const slope = dx / dy;
      add(cols, slope, x1 - slope * y1, length, height / 2, width * 0.012);
    }
  }
  segments.delete();

  const at = (l: EdgeLine, t: number) => l.slope * t + l.offset;
  const longest = (list: EdgeLine[], n: number) => [...list].sort((a, b) => b.length - a.length).slice(0, n);
  // With a frame, look for each side near the frame's matching side: printed lines on the card
  // (text rows, the photo's border) are often longer than the card's own edge.
  let pairsH: [EdgeLine[], EdgeLine[]];
  let pairsV: [EdgeLine[], EdgeLine[]];
  if (guide) {
    const cx = guide.x + guide.w / 2;
    const cy = guide.y + guide.h / 2;
    const band = (list: EdgeLine[], centre: number, from: number, to: number) => longest(list.filter((l) => at(l, centre) >= from && at(l, centre) <= to), 8);
    pairsH = [band(rows, cx, guide.y - guide.h * 0.4, guide.y + guide.h * 0.3), band(rows, cx, guide.y + guide.h * 0.7, guide.y + guide.h * 1.4)];
    pairsV = [band(cols, cy, guide.x - guide.w * 0.4, guide.x + guide.w * 0.3), band(cols, cy, guide.x + guide.w * 0.7, guide.x + guide.w * 1.4)];
  } else {
    const hs = longest(rows, 10);
    const vs = longest(cols, 10);
    pairsH = [hs, hs];
    pairsV = [vs, vs];
  }
  const found: Candidate[] = [];
  const meet = (h: EdgeLine, v: EdgeLine): Point | null => {
    const det = 1 - h.slope * v.slope;
    if (Math.abs(det) < 1e-6) return null;
    const y = (h.slope * v.offset + h.offset) / det;
    return { x: v.slope * y + v.offset, y };
  };
  for (const t of pairsH[0])
    for (const b of pairsH[1]) {
      if (at(t, width / 2) >= at(b, width / 2) - minSide * 0.3) continue;
      for (const l of pairsV[0])
        for (const r of pairsV[1]) {
          if (at(l, height / 2) >= at(r, height / 2) - minSide * 0.3) continue;
          const corners = [meet(t, l), meet(t, r), meet(b, r), meet(b, l)];
          if (corners.some((p) => !p)) continue;
          found.push({ quad: corners as Quad, method: "contour" });
        }
    }
  return found;
}

function insideQuad(p: Point, q: Quad, tolerance: number) {
  // Inside a convex quad (clockwise on screen) when on the inner side of every edge, with a little slack.
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (cross < -tolerance * Math.hypot(b.x - a.x, b.y - a.y)) return false;
  }
  return true;
}

function isConvex(q: Quad) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-6) return false;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}

/** Corner angles in degrees. A card, even tilted towards the camera, keeps them near 90°. */
function cornerAngles(q: Quad) {
  return [0, 1, 2, 3].map((i) => {
    const p = q[i];
    const a = q[(i + 3) % 4];
    const b = q[(i + 1) % 4];
    const v1 = { x: a.x - p.x, y: a.y - p.y };
    const v2 = { x: b.x - p.x, y: b.y - p.y };
    const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  });
}

/**
 * Card-shaped enough to be an ID card: four corners near 90°, ID-1 proportions (allowing for tilt),
 * opposite sides of similar length, inside the picture, and a sensible size. Returns 0 when it
 * isn't, otherwise how much the shape and size favour it.
 */
function shapeScore(q: Quad, width: number, height: number, guide?: Rect) {
  if (!isConvex(q)) return 0;
  const margin = Math.max(width, height) * 0.006;
  if (q.some((p) => p.x < margin || p.y < margin || p.x > width - margin || p.y > height - margin)) return 0;
  if (cornerAngles(q).some((a) => a < 62 || a > 118)) return 0;
  const aspect = quadAspect(q);
  if (aspect < 1.3 || aspect > 2.05) return 0;
  const s = quadSides(q);
  const sideRatio = Math.min(s.top / s.bottom, s.bottom / s.top, s.left / s.right, s.right / s.left);
  if (sideRatio < 0.65) return 0;
  const aspectScore = Math.exp(-Math.abs(aspect - config.card.aspect) * 2.2);
  const area = polygonArea(q);
  let sizeScore: number;
  if (guide) {
    // Held up to the frame: about the frame's size. Much smaller is a rectangle on the card (the photo,
    // a text block); much bigger is something behind it.
    const r = area / (guide.w * guide.h);
    if (r < 0.3 || r > 2.1) return 0;
    sizeScore = Math.sqrt(Math.min(1, r / 0.8)) * (r > 1.35 ? 1.35 / r : 1);
  } else {
    const r = area / (width * height);
    if (r < 0.04 || r > 0.985) return 0;
    sizeScore = Math.sqrt(r);
  }
  return aspectScore * sideRatio * sizeScore;
}

export type DetectOptions = {
  /** The on-screen card frame, in image pixels: the card should be about this size and place. */
  guide?: Rect;
  /** Outlines found elsewhere (the live preview), in image pixels: checked alongside the others. */
  hints?: (Quad | null | undefined)[];
};

/**
 * Finds the most card-like quadrilateral in an RGBA (or RGB) image. Coordinates are in the full image.
 * Pass `roi` to look only around the on-screen frame, which ignores clutter elsewhere in the shot.
 *
 * Candidates come from two finders (closed outlines, and pairs of long straight edges). Each is
 * checked for a card's shape and then scored on how much of its outline runs along a real edge in
 * the photo. The best-supported outline wins, and the larger one when two are close (the card's
 * edge rather than a rectangle printed on it).
 */
export function detectCard(cv: CV, rgba: Mat, roi?: Rect, options: DetectOptions = {}): CardDetection | null {
  const { gray, color, scale, offset } = prepareGray(cv, rgba, roi);
  const width = gray.cols;
  const height = gray.rows;
  const toLocal = (p: Point) => ({ x: (p.x - offset.x) * scale, y: (p.y - offset.y) * scale });
  const guide = options.guide
    ? { x: (options.guide.x - offset.x) * scale, y: (options.guide.y - offset.y) * scale, w: options.guide.w * scale, h: options.guide.h * scale }
    : undefined;
  const minSide = guide ? Math.min(guide.w, guide.h) : Math.min(width, height) * 0.4;

  const candidates: Candidate[] = [];
  const maps = binaryMaps(cv, gray, color);
  for (const map of maps) {
    candidates.push(...quadsIn(cv, map, width * height * 0.04));
    map.delete();
  }
  candidates.push(...lineCandidates(cv, gray, color, minSide, guide));
  for (const hint of options.hints ?? []) if (hint) candidates.push({ quad: orderQuad(hint.map(toLocal)), method: "contour" });

  const gradients = colourGradients(cv, color);
  gray.delete();
  color.delete();
  const reach = Math.max(2, Math.round(Math.min(width, height) * 0.006));

  type Rated = { quad: Quad; method: CardDetection["method"]; support: number; minSupport: number; shape: number; rank: number; area: number };
  // Coarse pass on every card-shaped outline (a sample every 6 px), then a full pass on the best few.
  const shaped: { quad: Quad; method: CardDetection["method"]; shape: number; coarse: number }[] = [];
  for (const c of candidates) {
    const quad = orderQuad(c.quad);
    const shape = shapeScore(quad, width, height, guide);
    if (!shape) continue;
    const coarse = quadSupport(gradients, quad, reach, 6);
    if (coarse.mean < 0.3 || coarse.min < 0.08) continue;
    shaped.push({ quad, method: c.method, shape, coarse: coarse.mean ** 2 * shape });
  }
  shaped.sort((a, b) => b.coarse - a.coarse);
  const rated: Rated[] = [];
  for (const { quad, method, shape } of shaped.slice(0, 25)) {
    const support = quadSupport(gradients, quad, reach);
    // Every side should show some edge (a finger may cover part of one, never most of all four).
    if (support.mean < 0.4 || support.min < 0.12) continue;
    rated.push({ quad, method, support: support.mean, minSupport: support.min, shape, rank: support.mean ** 2 * shape * (method === "rect" ? 0.9 : 1), area: polygonArea(quad) });
  }
  if (!rated.length) return null;
  let best = rated.reduce((a, b) => (b.rank > a.rank ? b : a));
  // An ID has rectangles printed on it (a header band, the photo) but never one around it: when a
  // well-supported outline encloses the winner, the tightest such outline is the card's edge.
  const tolerance = Math.sqrt(best.area) * 0.02;
  const enclosing = rated.filter(
    (c) =>
      c.support >= Math.max(0.6, best.support * 0.93) &&
      c.minSupport >= 0.5 &&
      // As card-shaped as the winner: a background line paired with three card edges isn't.
      c.shape >= best.shape * 0.7 &&
      c.area > best.area * 1.05 &&
      c.area < best.area * 1.8 &&
      best.quad.every((p) => insideQuad(p, c.quad, tolerance)),
  );
  if (enclosing.length) best = enclosing.reduce((a, b) => (b.area < a.area || (b.area < a.area * 1.02 && b.rank > a.rank) ? b : a));

  // Snap the winner onto the edge pixels along each side for sub-pixel-ish corners.
  let quad = best.quad;
  for (let pass = 0; pass < 2; pass++) quad = snapToEdges(quad, quadSupport(gradients, quad, reach).sides);
  return {
    quad: quad.map((p) => ({ x: p.x / scale + offset.x, y: p.y / scale + offset.y })) as Quad,
    score: Number(best.support.toFixed(3)),
    method: best.method,
  };
}

/** Sharpness (Laplacian variance), glare share and mean brightness inside a quad. For live hints. */
export function measureCard(cv: CV, rgba: Mat, quad: Quad): CardMeasures {
  const xs = quad.map((p) => p.x);
  const ys = quad.map((p) => p.y);
  const roi: Rect = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  const { gray, color } = prepareGray(cv, rgba, roi);
  color.delete();
  const lap = new cv.Mat();
  cv.Laplacian(gray, lap, cv.CV_64F);
  const mean = new cv.Mat();
  const std = new cv.Mat();
  cv.meanStdDev(lap, mean, std);
  const sharpness = std.data64F[0] ** 2;
  // Glare is a blown-out hotspot on an otherwise normally lit card. A card that's bright all over
  // (white plastic, strong light) isn't glare, so blown-out pixels only count when the median is lower.
  const hist = new Array<number>(256).fill(0);
  let sum = 0;
  for (let i = 0; i < gray.data.length; i++) {
    hist[gray.data[i]]++;
    sum += gray.data[i];
  }
  let seen = 0;
  let median = 0;
  while (median < 255 && (seen += hist[median]) < gray.data.length / 2) median++;
  let blown = 0;
  for (let v = 250; v < 256; v++) blown += hist[v];
  const glare = median < 235 ? blown / gray.data.length : 0;
  const result = { sharpness, glare, brightness: sum / gray.data.length };
  [gray, lap, mean, std].forEach((m) => m.delete());
  return result;
}

/** Output size for a straightened card: ID-1 proportions when the photo is close to them, otherwise as measured. */
export function straightenedSize(quad: Quad, longSide: number = config.card.outputLongSide) {
  const { width, height } = quadSides(quad);
  const landscape = width >= height;
  const measured = quadAspect(quad);
  const aspect = Math.abs(measured - config.card.aspect) / config.card.aspect < 0.18 ? config.card.aspect : measured;
  const long = longSide;
  const short = Math.round(long / aspect);
  return landscape ? { width: long, height: short } : { width: short, height: long };
}

/**
 * Warps the card to a flat, face-on rectangle and sharpens it slightly. Returns a new RGBA Mat;
 * the caller deletes it.
 */
export function straightenCard(cv: CV, rgba: Mat, quad: Quad, longSide?: number): Mat {
  const { width, height } = straightenedSize(quad, longSide);
  const src = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flatMap((p) => [p.x, p.y]));
  const dst = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, width, height, 0, height]);
  const transform = cv.getPerspectiveTransform(src, dst);
  const warped = new cv.Mat();
  cv.warpPerspective(rgba, warped, transform, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_REPLICATE);

  // Gentle unsharp mask: crisper text without halos.
  const blurred = new cv.Mat();
  cv.GaussianBlur(warped, blurred, new cv.Size(0, 0), 1.4);
  const enhanced = new cv.Mat();
  cv.addWeighted(warped, 1.45, blurred, -0.45, 0, enhanced);

  [src, dst, transform, warped, blurred].forEach((m) => m.delete());
  return enhanced;
}
