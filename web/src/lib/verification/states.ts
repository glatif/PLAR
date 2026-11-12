// Identity verification outcomes. The platform never decides on its own that someone is verified:
// checks produce evidence and flags, and a person makes the call (see the "Review" states).

export type ArtifactKind = "face" | "head-turn" | "id-front" | "id-back" | "id-front-straightened" | "id-back-straightened";
export type StepKey = "face" | "headTurn" | "idFront" | "idBack";

/** How one capture step ended. */
export type StepOutcome =
  /** Captured with automatic checks passing (face aligned, head circle completed, card detected in the frame). */
  | "passed"
  /** Captured, but the automatic checks weren't satisfied or weren't available. Usable, flagged for the reviewer. */
  | "manual"
  /** Head movement recorded but not completed (ran out of time or the person stopped early). Flagged. */
  | "partial"
  /** Not done. */
  | "missing";

/** Background processing of an ID photo. */
export type Straightening = "pending" | "corrected" | "cropped" | "failed";

/** Where a whole verification attempt stands, from the person's side. */
export type SessionStatus =
  /** Started, not all steps captured yet. */
  | "in_progress"
  /** Every step captured with every automatic check passing. Waiting for a person to review. */
  | "submitted"
  /** Every step captured, with at least one flag (manual capture, partial movement, card not found). */
  | "submitted_flagged"
  /** Couldn't continue: no camera, camera blocked or unsupported browser. Falls back to a check by the advisor. */
  | "blocked"
  /** Left before finishing. */
  | "abandoned";

/** A person's decision. Only a reviewer sets this; it is the actual success or failure of verification. */
export type ReviewDecision = "verified" | "not_verified" | "retry";

export const stepLabels: Record<StepKey, string> = {
  face: "Face photo",
  headTurn: "Head movement",
  idFront: "ID front",
  idBack: "ID back",
};

export const outcomeMeta: Record<StepOutcome, { label: string; tone: "success" | "warning" | "neutral"; description: string }> = {
  passed: { label: "Passed", tone: "success", description: "Captured with the automatic checks passing" },
  manual: { label: "Manual", tone: "warning", description: "Captured without the automatic checks: review closely" },
  partial: { label: "Partial", tone: "warning", description: "Movement recorded but not completed" },
  missing: { label: "Missing", tone: "neutral", description: "Not captured" },
};

export const statusMeta: Record<SessionStatus, { label: string; tone: "success" | "warning" | "neutral" | "info" | "danger"; description: string }> = {
  in_progress: { label: "In progress", tone: "info", description: "Not every step is captured yet" },
  submitted: { label: "Ready for review", tone: "success", description: "Every check passed. A person confirms the identity" },
  submitted_flagged: { label: "Ready for review · flagged", tone: "warning", description: "Complete, with items a reviewer should look at closely" },
  blocked: { label: "Camera unavailable", tone: "neutral", description: "The advisor confirms identity another way" },
  abandoned: { label: "Not finished", tone: "neutral", description: "Left before the last step" },
};

export const reviewMeta: Record<ReviewDecision, { label: string; tone: "success" | "neutral" | "warning"; description: string }> = {
  verified: { label: "Verified", tone: "success", description: "A reviewer confirmed the face matches the ID" },
  not_verified: { label: "Not verified", tone: "neutral", description: "A reviewer could not confirm the identity. Follow up with the student" },
  retry: { label: "Retry requested", tone: "warning", description: "The student is asked to try again (for example, a blurry ID)" },
};

export const straighteningMeta: Record<Straightening, { label: string; description: string }> = {
  pending: { label: "Straightening…", description: "Finding the card's corners" },
  corrected: { label: "Straightened", description: "Corners found and perspective corrected" },
  cropped: { label: "Cropped to frame", description: "Corners not found; cropped to the on-screen frame instead" },
  failed: { label: "Not processed", description: "Processing failed; the original photo is kept" },
};

/** The overall status once capture has ended, from the step outcomes. */
export function summarise(steps: Partial<Record<StepKey, StepOutcome>>, straightening: Straightening[] = []): SessionStatus {
  const outcomes = (["face", "headTurn", "idFront", "idBack"] as StepKey[]).map((k) => steps[k] ?? "missing");
  if (outcomes.includes("missing")) return "in_progress";
  const flagged = outcomes.some((o) => o !== "passed") || straightening.some((s) => s === "cropped" || s === "failed");
  return flagged ? "submitted_flagged" : "submitted";
}

/** Plain-language reasons a reviewer should look closely. */
export function flagsFor(steps: Partial<Record<StepKey, StepOutcome>>, straightening: Partial<Record<"idFront" | "idBack", Straightening>> = {}) {
  const flags: string[] = [];
  if (steps.face === "manual") flags.push("Face photo taken without automatic alignment");
  if (steps.headTurn === "partial") flags.push("Head movement not completed");
  if (steps.headTurn === "manual") flags.push("Head movement recorded without face tracking");
  if (steps.idFront === "manual") flags.push("ID front taken without the card being detected");
  if (steps.idBack === "manual") flags.push("ID back taken without the card being detected");
  for (const side of ["idFront", "idBack"] as const) {
    if (straightening[side] === "cropped") flags.push(`${stepLabels[side]}: corners not found, cropped to the frame`);
    if (straightening[side] === "failed") flags.push(`${stepLabels[side]}: straightening failed`);
  }
  return flags;
}
