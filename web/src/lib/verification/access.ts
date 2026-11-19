import "server-only";

import { cookies } from "next/headers";
import { encryptionOn, sameText, sign, verify } from "@/lib/verification/crypto";

// Who may see identity-verification captures (photos, video, ID details):
//   - the person who made them, in the same browser (a signed cookie naming their sessions), and
//   - a reviewer who has unlocked the identity checks page with the password, for 30 minutes.
// Everyone else sees only the list: the name, the date, the AI's match percentage and the decision.
// Both cookies are httpOnly and signed, so a page script can't read or forge them.

const UNLOCK = "plar_lab_unlock";
const OWN = "plar_lab_own";
export const UNLOCK_MINUTES = 30;

const secure = process.env.NODE_ENV === "production";

/** The password that unlocks the captures: the demo password for now (set VERIFICATION_VIEW_PASSWORD to change it). */
function unlockPassword() {
  return process.env.VERIFICATION_VIEW_PASSWORD || process.env.DEMO_LOGIN_PASSWORD || "";
}

export async function unlockedUntil(): Promise<number | null> {
  const value = verify((await cookies()).get(UNLOCK)?.value);
  const until = value?.startsWith("unlock:") ? Number(value.slice(7)) : NaN;
  return Number.isFinite(until) && until > Date.now() ? until : null;
}

export async function isUnlocked() {
  return (await unlockedUntil()) !== null;
}

async function ownedIds(): Promise<string[]> {
  const value = verify((await cookies()).get(OWN)?.value);
  return value?.startsWith("own:") ? value.slice(4).split(",").filter(Boolean) : [];
}

export async function ownsSession(id: string) {
  return (await ownedIds()).includes(id);
}

/** True for the person who made the session, or an unlocked reviewer. */
export async function canSeeSession(id: string) {
  return (await isUnlocked()) || (await ownsSession(id));
}

/** Remembers that this browser made the session (the last few are kept). */
export async function rememberOwnSession(id: string) {
  const ids = [id, ...(await ownedIds()).filter((x) => x !== id)].slice(0, 5);
  (await cookies()).set(OWN, sign(`own:${ids.join(",")}`), { httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: 60 * 60 * 24 });
}

// A few wrong passwords in a row from one address wait a minute before the next try.
const attempts = new Map<string, { count: number; until: number }>();

export type UnlockResult = { ok: true; until: number } | { ok: false; error: string; status: number };

export async function unlock(password: string, client: string): Promise<UnlockResult> {
  if (process.env.NODE_ENV === "production" && !encryptionOn()) {
    return { ok: false, error: "The identity checks aren't set up for unlocking on this server.", status: 503 };
  }
  const now = Date.now();
  const a = attempts.get(client);
  if (a && a.until > now) return { ok: false, error: "Too many tries. Wait a minute and try again.", status: 429 };
  const expected = unlockPassword();
  if (!expected || !sameText(password, expected)) {
    const count = (a && a.until > now - 60_000 ? a.count : 0) + 1;
    attempts.set(client, { count, until: count >= 5 ? now + 60_000 : 0 });
    return { ok: false, error: "That password isn't right.", status: 401 };
  }
  attempts.delete(client);
  const until = now + UNLOCK_MINUTES * 60_000;
  (await cookies()).set(UNLOCK, sign(`unlock:${until}`), { httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: UNLOCK_MINUTES * 60 });
  return { ok: true, until };
}

export async function lock() {
  (await cookies()).delete(UNLOCK);
}
