import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnv } from "@/lib/supabase/config";

/**
 * Server Component / Server Action / Route Handler için Supabase istemcisi.
 * Her çağrıda yeni bir istemci oluşturulur (Next.js App Router önerisi).
 */
export async function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component içinden çağrıldıysa yok sayılabilir;
          // oturum proxy/middleware tarafından zaten yenileniyor.
        }
      },
    },
  });
}
