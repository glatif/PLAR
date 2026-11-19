import type { NextRequest } from "next/server";
import { canSeeSession, isUnlocked } from "@/lib/verification/access";
import { badRequest, guard, notAvailable } from "@/lib/verification/api";
import { deleteItems, getSession, updateSession, type StepRecord } from "@/lib/verification/storage";
import type { ReviewDecision, StepKey, StepOutcome } from "@/lib/verification/states";

const STEPS: StepKey[] = ["face", "headTurn", "idFront", "idBack"];
const OUTCOMES: StepOutcome[] = ["passed", "manual", "partial", "missing"];
const DECISIONS: ReviewDecision[] = ["verified", "not_verified", "retry"];

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]">) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  if (!(await canSeeSession(id).catch(() => false))) return notAvailable();
  const session = await getSession(id).catch(() => null);
  return session ? Response.json({ session }) : notAvailable();
}

/**
 * Records progress. Body (all optional):
 *   steps:  { face: { outcome, metrics } , … }
 *   status: "blocked" | "abandoned" (with blockedReason)
 *   review: { decision: "verified" | "not_verified" | "retry", note } or null to clear
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]">) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    steps?: Partial<Record<StepKey, { outcome: StepOutcome; metrics?: StepRecord["metrics"] }>>;
    status?: "blocked" | "abandoned";
    blockedReason?: string;
    review?: { decision: ReviewDecision; note?: string } | null;
  } | null;
  if (!body) return badRequest("JSON body required");
  // The person verifying records their own steps; only an unlocked reviewer records a decision.
  if (!(await canSeeSession(id).catch(() => false))) return notAvailable();
  if (body.review !== undefined && !(await isUnlocked())) return Response.json({ error: "Unlock the identity checks page first." }, { status: 403 });

  for (const [key, value] of Object.entries(body.steps ?? {})) {
    if (!STEPS.includes(key as StepKey) || !OUTCOMES.includes(value?.outcome)) return badRequest(`Invalid step ${key}`);
  }
  if (body.status && body.status !== "blocked" && body.status !== "abandoned") return badRequest("Invalid status");
  if (body.review && !DECISIONS.includes(body.review.decision)) return badRequest("Invalid review decision");

  const session = await updateSession(id, (s) => {
    for (const [key, value] of Object.entries(body.steps ?? {})) {
      s.steps[key as StepKey] = { outcome: value!.outcome, metrics: value!.metrics, at: new Date().toISOString() };
    }
    if (body.status) {
      s.status = body.status;
      s.blockedReason = body.blockedReason?.slice(0, 200);
    }
    if (body.review === null) delete s.review;
    else if (body.review) s.review = { decision: body.review.decision, note: body.review.note?.slice(0, 1000), at: new Date().toISOString() };
  }).catch(() => null);
  return session ? Response.json({ session }) : notAvailable();
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]">) {
  const blocked = guard();
  if (blocked) return blocked;
  if (!(await isUnlocked())) return Response.json({ error: "Unlock the identity checks page first." }, { status: 403 });
  const { id } = await ctx.params;
  const result = await deleteItems({ sessions: [id] }).catch(() => null);
  return result ? Response.json(result) : notAvailable();
}
