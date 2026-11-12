import { connection } from "next/server";
import { badRequest, guard } from "@/lib/verification/api";
import { createSession, listSessions } from "@/lib/verification/storage";

export async function GET() {
  await connection();
  return guard() ?? Response.json({ sessions: await listSessions() });
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
  return Response.json({ session }, { status: 201 });
}
