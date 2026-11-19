import type { NextRequest } from "next/server";
import { canSeeSession } from "@/lib/verification/access";
import { guard, notAvailable } from "@/lib/verification/api";
import { assertSafeId, readFileData } from "@/lib/verification/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", webm: "video/webm", mp4: "video/mp4" };

/**
 * Serves one capture, decrypted on the server. Only for the person who made it (same browser) or a
 * reviewer who has unlocked the identity checks page; anyone else gets 404. Supports Range requests,
 * which Safari needs to play and seek videos.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/verification/files/[id]/[file]">) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id, file } = await ctx.params;
  try {
    assertSafeId(id);
  } catch {
    return notAvailable();
  }
  if (!(await canSeeSession(id))) return notAvailable();
  const data = await readFileData(id, file).catch(() => null);
  if (!data) return notAvailable();

  const headers = new Headers({
    "Content-Type": TYPES[file.split(".").pop() ?? ""] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (request.nextUrl.searchParams.has("download")) headers.set("Content-Disposition", `attachment; filename="${file}"`);

  const size = data.length;
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers });
  }
  headers.set("Content-Length", String(size));
  return new Response(new Uint8Array(data), { headers });
}
