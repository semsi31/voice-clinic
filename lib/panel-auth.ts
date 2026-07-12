import "server-only";

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

export async function requireActivePanelUser(): Promise<ActivePanelUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new PanelAuthError("invalid_session");
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
    throw new PanelAuthError("missing_profile");
  }

  if (profile.is_active !== true) {
    throw new PanelAuthError("inactive");
  }

  return {
    supabase,
    user,
    profile: profile as PanelProfile,
    userId: user.id,
    email: user.email ?? null,
  };
}
