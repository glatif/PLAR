import { isUnlocked } from "@/lib/verification/access";
import { badRequest, guard } from "@/lib/verification/api";
import { assertSafeId, deleteItems } from "@/lib/verification/storage";

/**
 * Permanently deletes captures. Body: { sessions?: string[], artifacts?: { sessionId, artifactId }[] }.
 * Deleting an ID photo also deletes its straightened copy.
 */
export async function POST(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  if (!(await isUnlocked())) return Response.json({ error: "Unlock the identity checks page first." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    sessions?: string[];
    artifacts?: { sessionId: string; artifactId: string }[];
  } | null;
  if (!body || (!body.sessions?.length && !body.artifacts?.length)) return badRequest("Nothing to delete");
  try {
    body.sessions?.forEach(assertSafeId);
    body.artifacts?.forEach((a) => assertSafeId(a.sessionId));
  } catch {
    return badRequest("Invalid id");
  }
  return Response.json(await deleteItems(body));
}
