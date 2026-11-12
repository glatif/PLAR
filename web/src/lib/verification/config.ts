// Tunable settings for identity verification. Change behaviour here, not inside components.

export const verificationConfig = {
  face: {
    /** Face width as a fraction of the oval's width that counts as "just right". */
    minFill: 0.62,
    maxFill: 1.08,
    /** How far the face centre may drift from the oval centre, as a fraction of the oval size. */
    maxOffset: 0.16,
    /** Head turned or tilted beyond this (normalised units) reads as "look straight ahead". */
    maxTurn: 0.14,
    /** Average brightness (0–255) below this reads as "too dark". */
    minBrightness: 60,
    /** The face must stay aligned this long before the button turns into "Capture". */
    steadyMs: 600,
    /** After this long without a detected face, offer the manual route more prominently. */
    manualHintMs: 6000,
    jpegQuality: 0.92,
  },
  headTurn: {
    /** Number of tick marks around the ring. */
    segments: 36,
    /** Head offset from the neutral pose (normalised) that lights up the tick it points at. */
    threshold: 0.09,
    /** Nodding moves the nose less than turning, so vertical movement is amplified by this. */
    pitchGain: 1.6,
    /** Fraction of ticks needed to finish. */
    completeAt: 0.88,
    /** Frames averaged for the neutral pose before tracking starts. */
    baselineFrames: 12,
    /** Recording stops after this, finished or not. */
    maxDurationMs: 25_000,
    /** Without face tracking, a fixed recording of this length is made instead. */
    fallbackDurationMs: 7_000,
  },
  card: {
    /** ISO/IEC 7810 ID-1 (driver's licence, student and health cards): 85.60 × 53.98 mm. */
    aspect: 85.6 / 53.98,
    /** Card frame width as a fraction of the preview, landscape and portrait screens. */
    guideWidthLandscape: 0.62,
    guideWidthPortrait: 0.88,
    /** The detected card should cover this share of the frame. */
    minFill: 0.5,
    maxFill: 1.12,
    /** Opposite sides must be at least this similar in length (a flat, face-on card). */
    minSideRatio: 0.82,
    /** Laplacian variance below this reads as blurry (on the downscaled frame). */
    minSharpness: 40,
    /** Share of near-white pixels on the card that reads as glare. */
    maxGlare: 0.04,
    /** Detections that must agree in a row before the frame turns green. */
    stableFrames: 3,
    /** Straightened output: long side in pixels. */
    outputLongSide: 1280,
    jpegQuality: 0.94,
  },
} as const;
