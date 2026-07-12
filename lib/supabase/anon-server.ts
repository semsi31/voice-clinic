import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Kurumsal site formları gibi herkese açık uç noktalar için anon istemci.
 * Oturum çerezleri kullanılmaz; authenticated rolüne düşülmez.
 */
export function createAnonServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
