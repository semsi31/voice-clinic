"use client";

import { useState, type ReactNode } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { ActionModal } from "@/components/panel/action-modal";
import { ConfirmModal } from "@/components/panel/confirm-modal";
import { PanelLink } from "@/components/panel/panel-link";

export const rowActionButtonClassName =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100";

type ModalContent = {
  title: string;
  description?: string;
  content: ReactNode;
  primaryLabel?: string;
};

type DeleteContent = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type RowActionsProps = {
  viewHref?: string;
  editHref?: string;
  showView?: boolean;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  viewModal?: ModalContent;
  editModal?: ModalContent;
  deleteConfirm?: DeleteContent;
};

export function RowActions({
  viewHref,
  editHref,
  showView = true,
  viewLabel = "Görüntüle",
  editLabel = "Düzenle",
  deleteLabel = "Sil",
  viewModal,
  editModal,
  deleteConfirm,
}: Readonly<RowActionsProps>) {
  const [activeModal, setActiveModal] = useState<
    "view" | "edit" | "delete" | null
  >(null);

  return (
    <>
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {showView ? (
          viewHref ? (
            <PanelLink
              href={viewHref}
              className={rowActionButtonClassName}
              aria-label={viewLabel}
              title={viewLabel}
            >
              <Eye className="size-4" aria-hidden="true" />
            </PanelLink>
          ) : viewModal ? (
            <button
              type="button"
              className={rowActionButtonClassName}
              aria-label={viewLabel}
              title={viewLabel}
              onClick={() => setActiveModal("view")}
            >
              <Eye className="size-4" aria-hidden="true" />
            </button>
          ) : null
        ) : null}

        {editHref ? (
          <PanelLink
            href={editHref}
            className={rowActionButtonClassName}
            aria-label={editLabel}
            title={editLabel}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </PanelLink>
        ) : editModal ? (
          <button
            type="button"
            className={rowActionButtonClassName}
            aria-label={editLabel}
            title={editLabel}
            onClick={() => setActiveModal("edit")}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        {deleteConfirm ? (
          <button
            type="button"
            className={`${rowActionButtonClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700`}
            aria-label={deleteLabel}
            title={deleteLabel}
            onClick={() => setActiveModal("delete")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {activeModal === "view" && viewModal ? (
        <ActionModal
          title={viewModal.title}
          description={viewModal.description}
          onClose={() => setActiveModal(null)}
          showPrimary={false}
        >
          {viewModal.content}
        </ActionModal>
      ) : null}

      {activeModal === "edit" && editModal ? (
        <ActionModal
          title={editModal.title}
          description={editModal.description}
          primaryLabel={editModal.primaryLabel ?? "Kaydet"}
          onClose={() => setActiveModal(null)}
        >
          {editModal.content}
        </ActionModal>
      ) : null}

      {activeModal === "delete" && deleteConfirm ? (
        <ConfirmModal
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          confirmLabel={deleteConfirm.confirmLabel}
          onClose={() => setActiveModal(null)}
        />
      ) : null}
    </>
  );
}
