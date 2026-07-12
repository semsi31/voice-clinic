"use client";

import { ActionModal } from "@/components/panel/action-modal";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Sil",
  onClose,
}: Readonly<ConfirmModalProps>) {
  return (
    <ActionModal
      title={title}
      primaryLabel={confirmLabel}
      onClose={onClose}
      onPrimary={onClose}
    >
      <p className="text-sm leading-6 text-slate-700">{message}</p>
    </ActionModal>
  );
}
