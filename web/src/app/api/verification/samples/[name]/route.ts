import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { guard, notAvailable } from "@/lib/verification/api";

const ROOT = join(process.cwd(), "test-assets");
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm" };

/** Serves one sample from web/test-assets. Names look like "id-cards--front-wood-landscape.jpg". */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/verification/samples/[name]">) {
  const blocked = guard();
  if (blocked) return blocked;
  const match = (await ctx.params).name.match(/^(faces|id-cards)--([a-z0-9-]+\.(jpe?g|png|webp|mp4|webm))$/i);
  if (!match) return notAvailable();
  const data = await readFile(join(ROOT, match[1], match[2])).catch(() => null);
  if (!data) return notAvailable();
  return new Response(new Uint8Array(data), { headers: { "Content-Type": TYPES[match[3].toLowerCase()], "Cache-Control": "no-store" } });
}
