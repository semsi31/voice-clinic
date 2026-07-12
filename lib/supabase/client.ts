import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser (Client Component) için Supabase istemcisi.
 * Sadece "use client" bileşenlerinde kullanılmalıdır.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
