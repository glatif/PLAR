import type { NextRequest } from "next/server";
import { lock, unlock } from "@/lib/verification/access";
import { badRequest, guard } from "@/lib/verification/api";

/** Unlocks the identity checks page's photos, video and ID details for 30 minutes. Body: { password }. */
export async function POST(request: NextRequest) {
  const blocked = guard();
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || !body.password) return badRequest("Enter the password");
  const client = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const result = await unlock(body.password.slice(0, 200), client);
  return result.ok ? Response.json({ until: result.until }) : Response.json({ error: result.error }, { status: result.status });
}

/** Locks them again. */
export async function DELETE() {
  const blocked = guard();
  if (blocked) return blocked;
  await lock();
  return Response.json({ locked: true });
}
