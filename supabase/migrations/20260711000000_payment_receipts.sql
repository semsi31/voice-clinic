-- Voice Klinik — Tahsilat makbuzu belge ilişkisi

alter table public.transaction_payments
  add column if not exists receipt_document_id uuid
    references public.documents (id) on delete set null,
  add column if not exists receipt_generated_at timestamptz;

create index if not exists transaction_payments_receipt_document_id_idx
  on public.transaction_payments (receipt_document_id);

alter table public.documents
  add column if not exists file_name text,
  add column if not exists created_by uuid references auth.users (id) on delete set null;

create index if not exists documents_created_by_idx
  on public.documents (created_by);
