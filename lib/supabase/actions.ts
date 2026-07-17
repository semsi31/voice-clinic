"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Oturumu kapatır ve giriş sayfasına yönlendirir.
 * Panel topbar'ındaki çıkış butonu tarafından kullanılır.
 * createClient / signOut hataları asla 500 ekranına dönüşmez.
 */
export async function signOut() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error(
        "signOut failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  redirect("/login");
}
