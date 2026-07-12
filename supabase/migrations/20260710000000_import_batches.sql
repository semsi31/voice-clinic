-- Voice Klinik — Excel İçe Aktarım (9. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  status text not null default 'preview',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  failed_rows integer not null default 0,
  success_rows integer not null default 0,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint import_batches_status_check
    check (status in ('preview', 'importing', 'completed', 'failed'))
);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  status text not null,
  error_message text,
  transaction_id uuid references public.patient_transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint import_rows_status_check
    check (status in ('valid', 'invalid', 'imported', 'failed'))
);

comment on table public.import_batches is
  'Excel içe aktarım batch kayıtları.';

comment on table public.import_rows is
  'Excel içe aktarım satır kayıtları ve sonuçları.';

create index if not exists import_batches_created_at_idx
  on public.import_batches (created_at desc);

create index if not exists import_rows_batch_id_idx
  on public.import_rows (batch_id, row_number);

alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.import_batches to authenticated;
grant select, insert, update, delete on public.import_rows to authenticated;

drop policy if exists "Import batches: authenticated full access" on public.import_batches;

create policy "Import batches: authenticated full access"
  on public.import_batches
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Import rows: authenticated full access" on public.import_rows;

create policy "Import rows: authenticated full access"
  on public.import_rows
  for all
  to authenticated
  using (true)
  with check (true);
