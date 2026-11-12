import { badRequest, guard } from "@/lib/verification/api";
import { straightenImage } from "@/lib/verification/process";

/**
 * Testing tool: runs corner detection and straightening on an uploaded photo without saving anything.
 * multipart/form-data: `file`. Returns the corners found and the straightened image as a data URL.
 */
export async function POST(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || !file.type.startsWith("image/")) return badRequest("An image file is required");

  const started = Date.now();
  const result = await straightenImage(Buffer.from(await file.arrayBuffer()));
  if (!result) return Response.json({ found: false, ms: Date.now() - started });
  return Response.json({
    found: true,
    quad: result.quad,
    method: result.method,
    score: result.score,
    ms: Date.now() - started,
    image: `data:image/jpeg;base64,${result.jpeg.toString("base64")}`,
  });
}
