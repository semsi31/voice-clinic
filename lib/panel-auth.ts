import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type PanelProfile = {
  id: string;
  full_name: string | null;
  is_active: boolean;
};

export type ActivePanelUser = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  profile: PanelProfile;
  userId: string;
  email: string | null;
};

type PanelAuthErrorCode = "invalid_session" | "missing_profile" | "inactive";

const panelAuthMessages: Record<PanelAuthErrorCode, string> = {
  invalid_session: "Oturumunuz geçersiz. Lütfen tekrar giriş yapın.",
  missing_profile: "Bu işlem için yetkiniz yok.",
  inactive: "Kullanıcı hesabınız pasif durumda.",
};

export class PanelAuthError extends Error {
  readonly code: PanelAuthErrorCode;
  readonly userMessage: string;

  constructor(code: PanelAuthErrorCode) {
    super(panelAuthMessages[code]);
    this.name = "PanelAuthError";
    this.code = code;
    this.userMessage = panelAuthMessages[code];
  }
}

export function getPanelAuthErrorMessage(error: unknown) {
  if (error instanceof PanelAuthError) {
    return error.userMessage;
  }

  return "Bu işlem için yetkiniz yok.";
}

type PanelAuthState =
  | { ok: true; value: ActivePanelUser }
  | { ok: false; code: PanelAuthErrorCode };

const resolvePanelAuth = cache(async (): Promise<PanelAuthState> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "invalid_session" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    console.error("Active panel user profile check failed", {
      userId: user.id,
      error,
      hasProfile: Boolean(profile),
    });
    return { ok: false, code: "missing_profile" };
  }

  if (profile.is_active !== true) {
    return { ok: false, code: "inactive" };
  }

  return {
    ok: true,
    value: {
      supabase,
      user,
      profile: profile as PanelProfile,
      userId: user.id,
      email: user.email ?? null,
    },
  };
});

export async function getActivePanelUser(): Promise<ActivePanelUser | null> {
  const state = await resolvePanelAuth();
  return state.ok ? state.value : null;
}

export async function requireActivePanelUser(): Promise<ActivePanelUser> {
  const state = await resolvePanelAuth();

  if (!state.ok) {
    throw new PanelAuthError(state.code);
  }

  return state.value;
}
