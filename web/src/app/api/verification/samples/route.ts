import { readdir } from "node:fs/promises";
import { connection } from "next/server";
import { join } from "node:path";
import { guard } from "@/lib/verification/api";

const ROOT = join(process.cwd(), "test-assets");

/** Lists the sample photos in web/test-assets, for testing the flow without a camera. */
export async function GET() {
  await connection();
  const blocked = guard();
  if (blocked) return blocked;
  const list = async (dir: string) => (await readdir(join(ROOT, dir)).catch(() => [])).filter((f) => /\.(jpe?g|png|webp|mp4|webm)$/i.test(f)).map((f) => `${dir}--${f}`);
  return Response.json({ faces: await list("faces"), ids: await list("id-cards") });
}
