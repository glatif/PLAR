import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where Microsoft (through PLAR's Supabase) sends people back after they sign in. Only used when
// MICROSOFT_SIGN_IN=entra. It swaps the one-time code for a session cookie, then opens the workspace.
// If Supabase refused the sign-in, it says why in the query string; the sign-in page explains it.
export async function GET(request: NextRequest) {
  // Behind the server's proxy, the public address is in the forwarded headers.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const origin = `${request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")}://${host}`;
  const params = request.nextUrl.searchParams;

  const problem = `${params.get("error_code") ?? ""} ${params.get("error_description") ?? ""}`.toLowerCase();
  if (problem.trim()) {
    const reason =
      problem.includes("signup") || problem.includes("not allowed") ? "not-added" : problem.includes("banned") ? "deactivated" : "failed";
    return NextResponse.redirect(`${origin}/sign-in?microsoft=${reason}`);
  }

  const code = params.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/workspace`);
    if (error.code === "user_banned") return NextResponse.redirect(`${origin}/sign-in?microsoft=deactivated`);
  }
  return NextResponse.redirect(`${origin}/sign-in?microsoft=failed`);
}
