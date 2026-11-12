import { after, type NextRequest } from "next/server";
import { badRequest, guard, notAvailable } from "@/lib/verification/api";
import type { Quad, Rect } from "@/lib/verification/geometry";
import { runAiCheck } from "@/lib/verification/ai-check";
import { processIdPhoto } from "@/lib/verification/process";
import { addArtifact, getSession, type Artifact } from "@/lib/verification/storage";
import type { ArtifactKind } from "@/lib/verification/states";

const UPLOADABLE: ArtifactKind[] = ["face", "head-turn", "id-front", "id-back"];
const MIME = /^(image\/(jpeg|png|webp)|video\/(webm|mp4))(;.*)?$/;
const MAX_BYTES = 60 * 1024 * 1024;

/**
 * Saves one capture. multipart/form-data: `file`, `kind`, and optional `meta` JSON
 * ({ width, height, durationMs, guide, liveQuad, metrics }). ID photos are straightened in the background.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/verification/sessions/[id]/artifacts">) {
  const blocked = guard();
  if (blocked) return blocked;
  const { id } = await ctx.params;
  if (!(await getSession(id).catch(() => null))) return notAvailable();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") as ArtifactKind | null;
  if (!(file instanceof Blob) || !kind || !UPLOADABLE.includes(kind)) return badRequest("file and a valid kind are required");
  if (!MIME.test(file.type)) return badRequest(`Unsupported file type ${file.type}`);
  if (file.size > MAX_BYTES) return badRequest("File too large");

  let meta: { width?: number; height?: number; durationMs?: number; guide?: Rect; liveQuad?: Quad | null; metrics?: Artifact["metrics"] } = {};
  try {
    meta = JSON.parse(String(form?.get("meta") ?? "{}"));
  } catch {
    return badRequest("meta must be JSON");
  }

  const isId = kind === "id-front" || kind === "id-back";
  const { artifact, session } = await addArtifact(
    id,
    {
      kind,
      mime: file.type.split(";")[0],
      width: meta.width,
      height: meta.height,
      durationMs: meta.durationMs,
      guide: meta.guide,
      liveQuad: meta.liveQuad,
      metrics: meta.metrics,
      straightening: isId ? "pending" : undefined,
    },
    Buffer.from(await file.arrayBuffer()),
  );

  // After the response is sent (the person moves on straight away): straighten ID photos, and once the
  // face and both ID sides are in, ask the AI for its suggestion (a no-op when the lab AI is off or
  // nothing changed). The AI gets the original photos, so it doesn't wait for straightening.
  after(async () => {
    if (isId) await processIdPhoto(id, artifact.id);
    if (isId || kind === "face") await runAiCheck(id);
  });
  return Response.json({ artifact, session }, { status: 201 });
}
