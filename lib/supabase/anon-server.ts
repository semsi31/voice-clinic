import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv } from "@/lib/supabase/config";

/**
 * Kurumsal site formları gibi herkese açık uç noktalar için anon istemci.
 * Oturum çerezleri kullanılmaz; authenticated rolüne düşülmez.
 */
export function createAnonServerClient() {
  const { url, anonKey } = requireSupabasePublicEnv();

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
