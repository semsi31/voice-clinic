"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { login, type LoginActionState } from "@/app/(auth)/login/actions";
import { panelPrimaryButtonClassName } from "@/components/panel/panel-styles";

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${panelPrimaryButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="grid gap-2">
        <span className="text-sm font-bold text-slate-700">E-posta</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ornek@voiceklinik.com"
          className={inputClassName}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold text-slate-700">Şifre</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClassName}
        />
      </label>

      {state?.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
