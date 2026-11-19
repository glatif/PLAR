import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Runs before every page: refreshes the Supabase session cookie, sends signed-out visitors away from
 * the workspace, and sends signed-in people past the sign-in page.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user && (pathname.startsWith("/workspace") || pathname.startsWith("/account"))) return redirectTo("/sign-in");
  // Someone with a temporary password (new account or admin reset) chooses their own before anything else.
  if (user?.app_metadata?.must_change_password === true && pathname.startsWith("/workspace")) return redirectTo("/account/password");
  if (user && pathname === "/sign-in") return redirectTo("/workspace");
  return response;
}

export const config = {
  matcher: ["/workspace/:path*", "/account/:path*", "/sign-in"],
};
