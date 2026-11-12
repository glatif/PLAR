import { describe, expect, it } from "vitest";
import { verificationConfig as config } from "@/lib/verification/config";
import {
  cardGuide,
  checkCard,
  checkFace,
  faceGuide,
  fillRing,
  orderQuad,
  quadAspect,
  ringProgress,
  ringSegment,
  type Quad,
} from "@/lib/verification/geometry";

const g = faceGuide(390, 844);
const goodFace = { box: { cx: g.cx, cy: g.cy, w: g.rx * 2 * 0.8, h: g.ry * 2 * 0.8 }, pose: { x: 0, y: 0 } };

describe("face fit", () => {
  it("accepts a centred, straight face of the right size", () => {
    expect(checkFace([goodFace], g).hint).toBe("good");
  });
  it("asks for one face only", () => {
    expect(checkFace([goodFace, goodFace], g).hint).toBe("many");
  });
  it("asks to come closer or move back", () => {
    expect(checkFace([{ ...goodFace, box: { ...goodFace.box, w: g.rx * 2 * 0.4 } }], g).hint).toBe("closer");
    expect(checkFace([{ ...goodFace, box: { ...goodFace.box, w: g.rx * 2 * 1.3 } }], g).hint).toBe("further");
  });
  it("keeps the oval face-shaped and on screen", () => {
    for (const [w, h] of [[390, 844], [1280, 720], [768, 1024]]) {
      const o = faceGuide(w, h);
      expect(o.ry / o.rx).toBeCloseTo(1.32, 2);
      expect(o.cy - o.ry).toBeGreaterThan(0);
      expect(o.cy + o.ry).toBeLessThan(h);
    }
  });
  it("asks to centre and to look straight", () => {
    expect(checkFace([{ ...goodFace, box: { ...goodFace.box, cx: g.cx + g.rx * 0.8 } }], g).hint).toBe("centre");
    expect(checkFace([{ ...goodFace, pose: { x: 0.3, y: 0 } }], g).hint).toBe("straight");
  });
  it("flags darkness and movement last", () => {
    expect(checkFace([goodFace], g, { brightness: 30 }).hint).toBe("dark");
    expect(checkFace([goodFace], g, { steady: false }).hint).toBe("steady");
  });
});

describe("head movement ring", () => {
  it("maps directions to ticks: up is 0, right is a quarter, down is half", () => {
    expect(ringSegment({ x: 0, y: -0.3 }, 36, 0.1)).toBe(0);
    expect(ringSegment({ x: 0.3, y: 0 }, 36, 0.1)).toBe(9);
    expect(ringSegment({ x: 0, y: 0.3 }, 36, 0.1)).toBe(18);
    expect(ringSegment({ x: -0.3, y: 0 }, 36, 0.1)).toBe(27);
  });
  it("ignores small movements near the neutral pose", () => {
    expect(ringSegment({ x: 0.02, y: 0.03 }, 36, 0.1)).toBe(-1);
  });
  it("fills skipped ticks between fast updates, the short way round", () => {
    const ring = fillRing(fillRing(Array(36).fill(false), 2, -1), 5, 2);
    expect(ring.slice(2, 6)).toEqual([true, true, true, true]);
    const wrap = fillRing(fillRing(Array(36).fill(false), 34, -1), 1, 34);
    expect([wrap[34], wrap[35], wrap[0], wrap[1]]).toEqual([true, true, true, true]);
  });
  it("completes after a full circle in either direction", () => {
    for (const dir of [1, -1]) {
      let ring: boolean[] = Array(36).fill(false);
      let prev = -1;
      for (let step = 0; step <= 72; step++) {
        const a = (dir * step * Math.PI * 2) / 72;
        const seg = ringSegment({ x: 0.2 * Math.sin(a), y: -0.2 * Math.cos(a) }, 36, 0.1);
        ring = fillRing(ring, seg, prev);
        prev = seg;
      }
      expect(ringProgress(ring)).toBe(1);
    }
  });
});

describe("card frame and fit", () => {
  it("draws an ID-shaped frame on phone and desktop screens", () => {
    for (const [w, h] of [[390, 844], [1280, 720], [1024, 600]]) {
      const guide = cardGuide(w, h);
      expect(guide.w / guide.h).toBeCloseTo(config.card.aspect, 2);
      expect(guide.x).toBeGreaterThanOrEqual(0);
      expect(guide.y + guide.h).toBeLessThanOrEqual(h);
    }
  });

  const guide = { x: 100, y: 100, w: 400, h: 400 / config.card.aspect };
  const inset = (k: number): Quad => {
    const dx = (guide.w * (1 - k)) / 2;
    const dy = (guide.h * (1 - k)) / 2;
    return [
      { x: guide.x + dx, y: guide.y + dy },
      { x: guide.x + guide.w - dx, y: guide.y + dy },
      { x: guide.x + guide.w - dx, y: guide.y + guide.h - dy },
      { x: guide.x + dx, y: guide.y + guide.h - dy },
    ];
  };

  it("turns green for a card that fills the frame", () => {
    expect(checkCard(inset(0.95), guide, { sharpness: 200, glare: 0, stable: true }).ok).toBe(true);
  });
  it("asks to come closer, hold flat, cut glare and hold still", () => {
    expect(checkCard(inset(0.5), guide).hint).toBe("closer");
    const skewed = inset(0.95);
    skewed[1] = { x: skewed[1].x, y: skewed[1].y + 60 };
    skewed[2] = { x: skewed[2].x, y: skewed[2].y - 60 };
    expect(checkCard(skewed, guide).hint).toBe("tilt");
    expect(checkCard(inset(0.95), guide, { glare: 0.2 }).hint).toBe("glare");
    expect(checkCard(inset(0.95), guide, { sharpness: 5 }).hint).toBe("blurry");
    expect(checkCard(inset(0.95), guide, { stable: false }).hint).toBe("steady");
  });
  it("orders shuffled corners and measures a card's proportions", () => {
    const q = inset(0.9);
    const shuffled = [q[2], q[0], q[3], q[1]];
    expect(orderQuad(shuffled)).toEqual(q);
    expect(quadAspect(q)).toBeCloseTo(config.card.aspect, 2);
  });
});
