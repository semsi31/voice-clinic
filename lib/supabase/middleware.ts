import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getMissingSupabasePublicEnvKeys,
  getSupabasePublicEnv,
} from "@/lib/supabase/config";

const PANEL_PREFIX = "/panel";
const LOGIN_PATH = "/login";
const DEFAULT_PANEL_PATH = "/panel/dashboard";

function redirectToLogin(request: NextRequest, reason?: "config") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = LOGIN_PATH;
  redirectUrl.search = "";

  if (reason) {
    redirectUrl.searchParams.set("error", reason);
  }

  return NextResponse.redirect(redirectUrl);
}

/**
 * Her istekte Supabase oturumunu yeniler ve /panel rotalarını korur.
 * Production'da env yoksa fail-closed: panel → login.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPanelRoute =
    pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
  const isLoginRoute = pathname === LOGIN_PATH;
  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    const missing = getMissingSupabasePublicEnvKeys().join(", ");
    console.warn(
      `@/lib/supabase/middleware: missing env (${missing}); panel auth fail-closed.`,
    );

    if (isPanelRoute) {
      return redirectToLogin(request, "config");
    }

    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validate the session with the Auth server (do not trust cookie presence alone).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isPanelRoute) {
    return redirectToLogin(request);
  }

  if (user && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = DEFAULT_PANEL_PATH;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
