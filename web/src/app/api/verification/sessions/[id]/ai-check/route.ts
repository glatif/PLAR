import type { NextRequest } from "next/server";
import { badRequest, guard, notAvailable } from "@/lib/verification/api";
import { aiEnabled, checkInputs, runAiCheck } from "@/lib/verification/ai-check";
import { getSession } from "@/lib/verification/storage";

/** Runs (or reruns) the AI face match and ID reading for a session and waits for the result. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]/ai-check">) {
  const blocked = guard();
  if (blocked) return blocked;
  if (!aiEnabled()) return badRequest("The AI check is off. Set OPENROUTER_API_KEY in web/.env.local.");
  const { id } = await ctx.params;
  const session = await getSession(id).catch(() => null);
  if (!session) return notAvailable();
  if (!checkInputs(session)) return badRequest("The face photo and both ID sides are needed first.");
  return Response.json({ session: await runAiCheck(id, { force: true }) });
}
