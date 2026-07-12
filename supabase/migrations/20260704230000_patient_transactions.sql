-- Voice Klinik — Hasta / İşlem Takibi + Ödeme Geçmişi (3. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.

create sequence if not exists public.patient_transaction_no_seq;

create table if not exists public.patient_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  transaction_no text unique,
  patient_name text not null,
  patient_phone text,
  description text,
  branch text,
  transaction_date date not null,
  hospital text,
  doctor_name text,
  reference_source text,
  operation_description text not null,
  staff_name text,
  brand text,
  model text,
  serial_no text,
  ear_side text,
  sale_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  remaining_debt numeric(12,2) not null default 0,
  payment_status text not null default 'unpaid',
  stock_deduct_enabled boolean not null default false,
  stock_product_label text,
  stock_quantity integer,
  notes text,
  constraint patient_transactions_payment_status_check
    check (payment_status in ('paid', 'partial', 'unpaid')),
  constraint patient_transactions_sale_amount_check
    check (sale_amount >= 0),
  constraint patient_transactions_paid_amount_check
    check (paid_amount >= 0),
  constraint patient_transactions_stock_quantity_check
    check (stock_quantity is null or stock_quantity > 0)
);

create table if not exists public.transaction_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  transaction_id uuid not null references public.patient_transactions (id) on delete cascade,
  payment_date date not null,
  payment_method text not null,
  amount numeric(12,2) not null,
  description text,
  received_by text,
  constraint transaction_payments_payment_method_check
    check (payment_method in ('cash', 'credit_card', 'bank_transfer')),
  constraint transaction_payments_amount_check
    check (amount > 0)
);

comment on table public.patient_transactions is
  'Hasta / İşlem Takibi kayıtları. Tek işletme; tenant/organization alanı yoktur.';

comment on table public.transaction_payments is
  'Hasta işlem kayıtlarına bağlı ödeme geçmişi.';

create index if not exists patient_transactions_date_idx
  on public.patient_transactions (transaction_date desc, created_at desc);

create index if not exists transaction_payments_transaction_id_idx
  on public.transaction_payments (transaction_id, payment_date desc, created_at desc);

create or replace function public.set_patient_transaction_no()
returns trigger
language plpgsql
as $$
begin
  if new.transaction_no is null or btrim(new.transaction_no) = '' then
    new.transaction_no :=
      'VK-' ||
      to_char(coalesce(new.transaction_date, current_date), 'YYYY') ||
      '-' ||
      lpad(nextval('public.patient_transaction_no_seq')::text, 4, '0');
  end if;

  return new;
end;
$$;

drop trigger if exists patient_transactions_set_transaction_no on public.patient_transactions;

create trigger patient_transactions_set_transaction_no
  before insert on public.patient_transactions
  for each row
  execute function public.set_patient_transaction_no();

create or replace function public.recalculate_patient_transaction_totals(
  target_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid numeric(12,2);
  current_sale_amount numeric(12,2);
begin
  select coalesce(sum(amount), 0)
    into total_paid
  from public.transaction_payments
  where transaction_id = target_transaction_id;

  select sale_amount
    into current_sale_amount
  from public.patient_transactions
  where id = target_transaction_id;

  if current_sale_amount is null then
    return;
  end if;

  update public.patient_transactions
  set
    paid_amount = total_paid,
    remaining_debt = current_sale_amount - total_paid,
    payment_status = case
      when total_paid <= 0 then 'unpaid'
      when total_paid >= current_sale_amount then 'paid'
      else 'partial'
    end,
    updated_at = now()
  where id = target_transaction_id;
end;
$$;

create or replace function public.set_patient_transactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patient_transactions_set_updated_at on public.patient_transactions;

create trigger patient_transactions_set_updated_at
  before update on public.patient_transactions
  for each row
  execute function public.set_patient_transactions_updated_at();

create or replace function public.set_transaction_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transaction_payments_set_updated_at on public.transaction_payments;

create trigger transaction_payments_set_updated_at
  before update on public.transaction_payments
  for each row
  execute function public.set_transaction_payments_updated_at();

create or replace function public.recalculate_after_payment_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_patient_transaction_totals(old.transaction_id);
    return old;
  end if;

  perform public.recalculate_patient_transaction_totals(new.transaction_id);

  if tg_op = 'UPDATE' and old.transaction_id is distinct from new.transaction_id then
    perform public.recalculate_patient_transaction_totals(old.transaction_id);
  end if;

  return new;
end;
$$;

drop trigger if exists transaction_payments_recalculate_totals on public.transaction_payments;

create trigger transaction_payments_recalculate_totals
  after insert or update or delete on public.transaction_payments
  for each row
  execute function public.recalculate_after_payment_change();

create or replace function public.recalculate_after_transaction_sale_change()
returns trigger
language plpgsql
as $$
begin
  perform public.recalculate_patient_transaction_totals(new.id);
  return new;
end;
$$;

drop trigger if exists patient_transactions_recalculate_on_sale_change on public.patient_transactions;

create trigger patient_transactions_recalculate_on_sale_change
  after insert or update of sale_amount on public.patient_transactions
  for each row
  execute function public.recalculate_after_transaction_sale_change();

alter table public.patient_transactions enable row level security;
alter table public.transaction_payments enable row level security;

grant usage on schema public to authenticated;
grant usage, select on sequence public.patient_transaction_no_seq to authenticated;
grant select, insert, update, delete on public.patient_transactions to authenticated;
grant select, insert, update, delete on public.transaction_payments to authenticated;

drop policy if exists "Patient transactions: authenticated full access" on public.patient_transactions;

create policy "Patient transactions: authenticated full access"
  on public.patient_transactions
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Transaction payments: authenticated full access" on public.transaction_payments;

create policy "Transaction payments: authenticated full access"
  on public.transaction_payments
  for all
  to authenticated
  using (true)
  with check (true);
