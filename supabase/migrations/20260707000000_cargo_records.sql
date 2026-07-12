-- Voice Klinik — Kargo Yönetimi (6. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.
-- cargo_branch kargo firması şubesidir; klinik şubesi değildir.

create table if not exists public.cargo_records (
  id uuid primary key default gen_random_uuid(),
  cargo_date date not null default current_date,
  sender_name text not null,
  process_description text not null,
  cargo_company text not null,
  cargo_branch text,
  tracking_number text,
  status text not null default 'prepared',
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cargo_records_status_check
    check (status in ('prepared', 'shipped', 'delivered', 'returned', 'problem'))
);

comment on table public.cargo_records is
  'Kargo gönderim kayıtları. Klinik şubesi alanı içermez.';

create index if not exists cargo_records_cargo_date_idx
  on public.cargo_records (cargo_date desc, created_at desc);

create index if not exists cargo_records_status_idx
  on public.cargo_records (status, cargo_date desc);

drop trigger if exists cargo_records_set_updated_at on public.cargo_records;

create trigger cargo_records_set_updated_at
  before update on public.cargo_records
  for each row
  execute function public.set_updated_at();

alter table public.cargo_records enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.cargo_records to authenticated;

drop policy if exists "Cargo records: authenticated full access" on public.cargo_records;

create policy "Cargo records: authenticated full access"
  on public.cargo_records
  for all
  to authenticated
  using (true)
  with check (true);
