-- Voice Klinik — Stok Yönetimi + işlem kaydından stok düşme (4. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.

create table if not exists public.stock_products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  product_type text not null,
  brand text,
  model text,
  serial_no text,
  branch_unit text,
  quantity integer not null default 0,
  min_stock integer not null default 0,
  description text,
  status text not null default 'normal',
  constraint stock_products_product_type_check
    check (product_type in ('device', 'battery', 'accessory', 'spare_part', 'service')),
  constraint stock_products_status_check
    check (status in ('normal', 'low_stock', 'out_of_stock')),
  constraint stock_products_quantity_check
    check (quantity >= 0),
  constraint stock_products_min_stock_check
    check (min_stock >= 0)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stock_product_id uuid not null references public.stock_products (id) on delete cascade,
  movement_type text not null,
  quantity_change integer not null,
  movement_date date not null default current_date,
  staff_name text,
  transaction_id uuid references public.patient_transactions (id) on delete set null,
  note text,
  constraint stock_movements_movement_type_check
    check (movement_type in ('in', 'out', 'sale', 'return', 'adjustment')),
  constraint stock_movements_quantity_change_check
    check (quantity_change <> 0)
);

alter table public.patient_transactions
  add column if not exists stock_product_id uuid references public.stock_products (id) on delete set null;

comment on table public.stock_products is
  'Voice Klinik stok ürünleri. Fiyat/muhasebe alanı içermez.';

comment on table public.stock_movements is
  'Stok giriş/çıkış/hareket kayıtları.';

create index if not exists stock_products_status_idx
  on public.stock_products (status, product_type);

create index if not exists stock_movements_product_date_idx
  on public.stock_movements (stock_product_id, movement_date desc, created_at desc);

create or replace function public.calculate_stock_status(
  product_quantity integer,
  product_min_stock integer
)
returns text
language sql
immutable
as $$
  select case
    when product_quantity <= 0 then 'out_of_stock'
    when product_quantity <= product_min_stock then 'low_stock'
    else 'normal'
  end;
$$;

create or replace function public.set_stock_product_status_and_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.status := public.calculate_stock_status(new.quantity, new.min_stock);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists stock_products_set_status_and_updated_at on public.stock_products;

create trigger stock_products_set_status_and_updated_at
  before insert or update of quantity, min_stock, name, product_type, brand, model, serial_no, branch_unit, description
  on public.stock_products
  for each row
  execute function public.set_stock_product_status_and_updated_at();

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
as $$
declare
  current_quantity integer;
  next_quantity integer;
begin
  select quantity
    into current_quantity
  from public.stock_products
  where id = new.stock_product_id
  for update;

  if current_quantity is null then
    raise exception 'Stok ürünü bulunamadı.';
  end if;

  next_quantity := current_quantity + new.quantity_change;

  if next_quantity < 0 then
    raise exception 'Yetersiz stok. Mevcut adet: %, istenen değişim: %',
      current_quantity,
      new.quantity_change;
  end if;

  update public.stock_products
  set quantity = next_quantity
  where id = new.stock_product_id;

  return new;
end;
$$;

drop trigger if exists stock_movements_apply_quantity on public.stock_movements;

create trigger stock_movements_apply_quantity
  after insert on public.stock_movements
  for each row
  execute function public.apply_stock_movement();

alter table public.stock_products enable row level security;
alter table public.stock_movements enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.stock_products to authenticated;
grant select, insert on public.stock_movements to authenticated;

drop policy if exists "Stock products: authenticated full access" on public.stock_products;

create policy "Stock products: authenticated full access"
  on public.stock_products
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Stock movements: authenticated select insert" on public.stock_movements;
drop policy if exists "Stock movements: authenticated insert" on public.stock_movements;

create policy "Stock movements: authenticated select insert"
  on public.stock_movements
  for select
  to authenticated
  using (true);

create policy "Stock movements: authenticated insert"
  on public.stock_movements
  for insert
  to authenticated
  with check (true);
