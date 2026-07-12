-- Voice Klinik — Gelir / Gider Takibi (5. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.
-- Hasta işlem ödemeleri ile otomatik bağlanmaz; yalnızca manuel kayıtlar.

create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null default current_date,
  type text not null,
  payment_method text not null,
  amount numeric(12, 2) not null,
  responsible_person text,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_records_type_check
    check (type in ('income', 'expense')),
  constraint finance_records_payment_method_check
    check (payment_method in ('cash', 'credit_card', 'bank_transfer', 'other')),
  constraint finance_records_amount_check
    check (amount > 0)
);

comment on table public.finance_records is
  'Manuel gelir ve gider kayıtları. Hasta işlem tahsilatlarından bağımsızdır.';

create index if not exists finance_records_record_date_idx
  on public.finance_records (record_date desc, created_at desc);

create index if not exists finance_records_type_idx
  on public.finance_records (type, record_date desc);

drop trigger if exists finance_records_set_updated_at on public.finance_records;

create trigger finance_records_set_updated_at
  before update on public.finance_records
  for each row
  execute function public.set_updated_at();

alter table public.finance_records enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.finance_records to authenticated;

drop policy if exists "Finance records: authenticated full access" on public.finance_records;

create policy "Finance records: authenticated full access"
  on public.finance_records
  for all
  to authenticated
  using (true)
  with check (true);
