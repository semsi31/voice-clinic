"use client";

import { useState, type FormEvent } from "react";
import { SiteIcon } from "@/components/site/site-icon";
import { cn } from "@/lib/utils";

type SubmitState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type FormValues = {
  name: string;
  phone: string;
  email: string;
  preferred_branch: string;
  subject: string;
  message: string;
};

const defaultBranch = "Voice Klinik İşitme Merkezi";

const initialFormValues: FormValues = {
  name: "",
  phone: "",
  email: "",
  preferred_branch: defaultBranch,
  subject: "",
  message: "",
};

const inputClassName =
  "site-form-field h-11 w-full min-w-0 rounded-xl border border-[#eadfca] bg-[#fffdf8] px-4 text-base font-normal text-foreground outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35";

const textareaClassName =
  "site-form-field min-h-28 w-full min-w-0 resize-none rounded-xl border border-[#eadfca] bg-[#fffdf8] px-4 py-3 text-base font-normal text-foreground outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/35";

const labelClassName =
  "site-form-label grid min-w-0 gap-2 text-sm font-semibold text-[#071225]";

export function ContactRequestForm() {
  const [submitState, setSubmitState] = useState<SubmitState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);

  const updateField = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/web-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formValues.name,
          phone: formValues.phone,
          email: formValues.email,
          request_type: "appointment",
          subject: formValues.subject,
          preferred_branch: formValues.preferred_branch,
          message: formValues.message,
          source: "website_contact_page_appointment_form",
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setSubmitState({
          type: "error",
          message:
            result.error ?? "Talebiniz gönderilemedi. Lütfen tekrar deneyin.",
        });
        return;
      }

      setFormValues(initialFormValues);
      setSubmitState({
        type: "success",
        message: "Talebiniz alındı. Ekibimiz en kısa sürede size dönüş yapacak.",
      });
    } catch {
      setSubmitState({
        type: "error",
        message: "Talebiniz gönderilemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Ad Soyad
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className={inputClassName}
            value={formValues.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </label>
        <label className={labelClassName}>
          Telefon
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            className={inputClassName}
            value={formValues.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          E-posta
          <input
            type="email"
            name="email"
            autoComplete="email"
            className={inputClassName}
            value={formValues.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>
        <label className={labelClassName}>
          Şube seçimi
          <select
            name="preferred_branch"
            className={inputClassName}
            value={formValues.preferred_branch}
            onChange={(event) =>
              updateField("preferred_branch", event.target.value)
            }
          >
            <option value={defaultBranch}>{defaultBranch}</option>
          </select>
        </label>
      </div>
      <label className={labelClassName}>
        Konu
        <input
          type="text"
          name="subject"
          className={inputClassName}
          value={formValues.subject}
          onChange={(event) => updateField("subject", event.target.value)}
        />
      </label>
      <label className={labelClassName}>
        Mesaj
        <textarea
          name="message"
          rows={3}
          className={textareaClassName}
          value={formValues.message}
          onChange={(event) => updateField("message", event.target.value)}
        />
      </label>

      {submitState ? (
        <p
          key={submitState.message}
          role="status"
          aria-live="polite"
          className={cn(
            "site-form-message rounded-xl border px-4 py-3 text-sm font-semibold",
            submitState.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {submitState.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="site-btn-motion site-form-submit mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#C49A3A] px-7 text-sm font-bold !text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A28] disabled:cursor-not-allowed disabled:opacity-70"
        aria-busy={isSubmitting}
      >
        <span className="site-form-submit-content">
          {isSubmitting ? (
            <>
              <span className="site-form-spinner" aria-hidden="true" />
              <span>Gönderiliyor...</span>
            </>
          ) : (
            <>
              <SiteIcon name="calendar" className="size-4" />
              <span>Randevu Talebi Gönder</span>
            </>
          )}
        </span>
      </button>
    </form>
  );
}
