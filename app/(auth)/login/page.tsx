import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
