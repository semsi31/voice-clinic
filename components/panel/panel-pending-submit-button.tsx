"use client";

import { useFormStatus } from "react-dom";
import { panelPrimaryButtonClassName } from "@/components/panel/panel-styles";

export function PanelPendingSubmitButton({
  idleLabel,
  pendingLabel,
  className = panelPrimaryButtonClassName,
}: Readonly<{
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
