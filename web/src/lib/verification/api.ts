import "server-only";

import { labEnabled } from "@/lib/verification/storage";

// Small helpers shared by the verification API routes.

export function notAvailable() {
  return Response.json({ error: "Not found" }, { status: 404 });
}

/** Returns a 404 response when the verification lab is off, otherwise null. */
export function guard() {
  return labEnabled() ? null : notAvailable();
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}
