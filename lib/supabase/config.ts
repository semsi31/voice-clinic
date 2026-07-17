/**
 * Supabase public env helpers.
 * Never log secret values — only missing-variable names.
 *
 * Accepts either the classic anon key or the newer publishable key
 * from the Supabase dashboard connect snippet.
 */

export const SITE_URL_ENV_KEY = "NEXT_PUBLIC_SITE_URL";

/** Not used by this codebase; listed so deploy checklists stay accurate. */
export const SUPABASE_SERVICE_ROLE_ENV_KEY = "SUPABASE_SERVICE_ROLE_KEY";

export type SupabasePublicEnv = {
  url: string;
  /** Anon or publishable public API key */
  anonKey: string;
};

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function getMissingSupabasePublicEnvKeys(): string[] {
  const missing: string[] = [];

  if (!getSupabaseUrl()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!getSupabasePublicKey()) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  return missing;
}

export function isSupabaseConfigured(): boolean {
  return getMissingSupabasePublicEnvKeys().length === 0;
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabasePublicKey();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/**
 * Throws a clear, non-secret configuration error when public Supabase env is missing.
 * Use at client creation boundaries so production never surfaces cryptic SDK errors.
 */
export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const env = getSupabasePublicEnv();

  if (!env) {
    const missing = getMissingSupabasePublicEnvKeys().join(", ");
    throw new Error(
      `Supabase yapılandırması eksik (${missing}). Vercel Project Settings → Environment Variables içinde bu değişkenleri Production için tanımlayın.`,
    );
  }

  return env;
}

/**
 * Local-only mock panel when Supabase is not configured.
 * Production always fails closed (no mock admin session).
 */
export function allowUnauthenticatedPanelMock(): boolean {
  return process.env.NODE_ENV !== "production" && !isSupabaseConfigured();
}
