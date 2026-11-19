import type { NextRequest } from "next/server";
import { isUnlocked } from "@/lib/verification/access";
import { guard, notAvailable } from "@/lib/verification/api";
import { processIdPhoto } from "@/lib/verification/process";
import { getSession, updateSession } from "@/lib/verification/storage";

/** Runs ID straightening again (for testing changes to the detector). Waits for the result. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]/artifacts/[artifactId]/reprocess">) {
  const blocked = guard();
  if (blocked) return blocked;
  if (!(await isUnlocked())) return Response.json({ error: "Unlock the identity checks page first." }, { status: 403 });
  const { id, artifactId } = await ctx.params;
  const artifact = (await getSession(id).catch(() => null))?.artifacts.find((a) => a.id === artifactId);
  if (!artifact || (artifact.kind !== "id-front" && artifact.kind !== "id-back")) return notAvailable();
  await updateSession(id, (s) => {
    const a = s.artifacts.find((x) => x.id === artifactId);
    if (a) a.straightening = "pending";
  });
  await processIdPhoto(id, artifactId);
  return Response.json({ session: await getSession(id) });
}
