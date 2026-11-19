import "server-only";

import { connection } from "next/server";

// "Sign in with Microsoft". For now it's a demo: it opens a picker of the synthetic demo accounts.
// When TRU's Microsoft Entra ID is connected (Supabase's Azure provider, with the app registered in
// TRU's tenant), set MICROSOFT_SIGN_IN=entra and the same button goes to Microsoft instead.
//   MICROSOFT_SIGN_IN=entra  → real Microsoft sign-in through Supabase
//   MICROSOFT_SIGN_IN=demo   → the demo picker (needs DEMO_LOGIN_PASSWORD)
//   unset                    → demo when DEMO_LOGIN_PASSWORD is set, otherwise the button is hidden

export type MicrosoftMode = "entra" | "demo" | "off";

/** Read at request time, so the live server's settings apply without a rebuild. */
export async function microsoftMode(): Promise<MicrosoftMode> {
  await connection();
  const setting = process.env.MICROSOFT_SIGN_IN;
  if (setting === "entra") return "entra";
  if (setting === "off") return "off";
  return process.env.DEMO_LOGIN_PASSWORD ? "demo" : "off";
}

/** True when one-click demo sign-in works. Read at request time. */
export async function demoSignInEnabled(): Promise<boolean> {
  await connection();
  return Boolean(process.env.DEMO_LOGIN_PASSWORD);
}
