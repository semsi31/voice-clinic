/**
 * Supabase public env helpers.
 * Never log secret values — only missing-variable names.
 */

export const SUPABASE_PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const SITE_URL_ENV_KEY = "NEXT_PUBLIC_SITE_URL";

/** Not used by this codebase; listed so deploy checklists stay accurate. */
export const SUPABASE_SERVICE_ROLE_ENV_KEY = "SUPABASE_SERVICE_ROLE_KEY";

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getMissingSupabasePublicEnvKeys(): string[] {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return missing;
}

export function isSupabaseConfigured(): boolean {
  return getMissingSupabasePublicEnvKeys().length === 0;
}

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

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
