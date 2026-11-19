import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where Microsoft (through Supabase) sends people back after they sign in. Only used when
// MICROSOFT_SIGN_IN=entra. It swaps the one-time code for a session cookie, then opens the workspace.
export async function GET(request: NextRequest) {
  // Behind the server's proxy, the public address is in the forwarded headers.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const origin = `${request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")}://${host}`;

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/workspace`);
  }
  return NextResponse.redirect(`${origin}/sign-in?microsoft=failed`);
}
