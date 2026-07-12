"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  panelPrimaryButtonClassName,
  panelSecondaryButtonClassName,
} from "@/components/panel/panel-styles";

export const formInputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export const formTextareaClassName =
  "min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:text-sm";

export function FormField({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function DetailRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: ReactNode;
}>) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

type ActionModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  showPrimary?: boolean;
  showFooter?: boolean;
};

export function ActionModal({
  title,
  description,
  children,
  onClose,
  primaryLabel = "Kaydet",
  onPrimary,
  showPrimary = true,
  showFooter = true,
}: Readonly<ActionModalProps>) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handlePrimary = () => {
    if (onPrimary) {
      onPrimary();
    }
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        aria-label="Modalı kapat"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-[110] flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-950">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>

        {showFooter ? (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
            <button
              type="button"
              onClick={onClose}
              className={`${panelSecondaryButtonClassName} w-full sm:w-auto`}
            >
              {showPrimary ? "İptal" : "Kapat"}
            </button>
            {showPrimary ? (
              <button
                type="button"
                onClick={handlePrimary}
                className={`${panelPrimaryButtonClassName} w-full sm:w-auto`}
              >
                {primaryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modal, document.body);
}
