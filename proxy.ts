import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Sadece panel ve login rotalarında çalışır; kurumsal site sayfalarına
  // (ve statik varlıklara) dokunmaz.
  matcher: ["/panel/:path*", "/login"],
};
