import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Panel + login only; public marketing routes are untouched.
  matcher: ["/panel", "/panel/:path*", "/login"],
};
