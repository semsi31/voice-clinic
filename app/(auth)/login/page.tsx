import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  getMissingSupabasePublicEnvKeys,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Yönetim Paneli Girişi",
  description: "Voice Klinik yönetim paneli giriş sayfası.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/panel/dashboard");
    }
  }

  const missingEnv = getMissingSupabasePublicEnvKeys();
  const showConfigError =
    params.error === "config" || missingEnv.length > 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10 sm:px-6 sm:py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#071225] text-sm font-bold text-white shadow-sm">
            VK
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Voice Klinik
            </p>
            <h1 className="text-lg font-bold text-slate-950">
              Yönetim Paneli Girişi
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Panele erişmek için admin e-posta ve şifrenizle giriş yapın.
        </p>

        {showConfigError ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            Supabase ortam değişkenleri eksik
            {missingEnv.length > 0 ? `: ${missingEnv.join(", ")}` : ""}.
            Vercel → Project Settings → Environment Variables içinde Production
            için tanımlayıp yeniden deploy edin.
          </div>
        ) : null}

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
