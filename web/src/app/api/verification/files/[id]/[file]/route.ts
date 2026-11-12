import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { guard, notAvailable } from "@/lib/verification/api";
import { fileInfo } from "@/lib/verification/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", webm: "video/webm", mp4: "video/mp4" };

/** Serves a capture. Supports Range requests, which Safari needs to play and seek videos. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/verification/files/[id]/[file]">) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id, file } = await ctx.params;
  const info = await fileInfo(id, file).catch(() => null);
  if (!info) return notAvailable();

  const headers = new Headers({
    "Content-Type": TYPES[file.split(".").pop() ?? ""] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (request.nextUrl.searchParams.has("download")) headers.set("Content-Disposition", `attachment; filename="${file}"`);

  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(Readable.toWeb(createReadStream(info.path, { start, end })) as ReadableStream, { status: 206, headers });
  }
  headers.set("Content-Length", String(info.size));
  return new Response(Readable.toWeb(createReadStream(info.path)) as ReadableStream, { headers });
}
