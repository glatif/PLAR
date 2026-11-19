import { connection } from "next/server";
import { isUnlocked, rememberOwnSession } from "@/lib/verification/access";
import { badRequest, guard } from "@/lib/verification/api";
import { createSession, listSessions, redactSession } from "@/lib/verification/storage";

/** Every session: in full for an unlocked reviewer, otherwise only what the list shows. */
export async function GET() {
  await connection();
  const blocked = guard();
  if (blocked) return blocked;
  const sessions = await listSessions();
  return Response.json({ sessions: (await isUnlocked()) ? sessions : sessions.map(redactSession), locked: !(await isUnlocked()) });
}

/** Starts a verification attempt. Body: { device: { userAgent, viewport, touch, pixelRatio } }. */
export async function POST(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as { device?: Record<string, unknown> } | null;
  const d = body?.device;
  if (!d) return badRequest("device is required");
  const viewport = (d.viewport ?? {}) as { width?: number; height?: number };
  const session = await createSession({
    userAgent: String(d.userAgent ?? "").slice(0, 400),
    viewport: { width: Number(viewport.width) || 0, height: Number(viewport.height) || 0 },
    touch: Boolean(d.touch),
    pixelRatio: Number(d.pixelRatio) || 1,
  });
  // This browser may now add captures to the session and see them (for its own review screen).
  await rememberOwnSession(session.id);
  return Response.json({ session }, { status: 201 });
}
