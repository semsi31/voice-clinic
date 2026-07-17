import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "@/lib/supabase/config";

/**
 * Browser (Client Component) için Supabase istemcisi.
 * Sadece "use client" bileşenlerinde kullanılmalıdır.
 */
export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
