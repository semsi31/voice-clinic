import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PANEL_PREFIX = "/panel";
const LOGIN_PATH = "/login";
const DEFAULT_PANEL_PATH = "/panel/dashboard";

/**
 * Her istekte Supabase oturumunu yeniler ve /panel rotalarını korur.
 * SaaS mantığı yok; tek işletmeye ait tek oturum türü kontrol edilir.
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // .env.local henüz oluşturulmadıysa panel koruması pasif kalır;
    // kurumsal site ve panel mock sayfaları çökmeden çalışmaya devam eder.
    console.warn(
      "@/lib/supabase/middleware: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY tanımlı değil, panel koruması devre dışı.",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPanelRoute = pathname.startsWith(PANEL_PREFIX);
  const isLoginRoute = pathname === LOGIN_PATH;

  if (!user && isPanelRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = DEFAULT_PANEL_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
