-- Voice Klinik — Admin auth altyapısı (1. aşama)
-- Bu proje SaaS değildir: tenant/organization/company alanı yoktur.
-- Tek işletmeye ait admin kullanıcı profilleri.

-- 1. profiles tablosu
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Voice Klinik admin panel kullanıcı profilleri. Tek işletme; tenant/organization alanı yoktur.';

-- 2. updated_at otomatik güncelleme
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 3. auth.users insert sonrası otomatik profile oluşturma
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.email
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 4. Row Level Security
alter table public.profiles enable row level security;

-- RLS politikaları yalnızca satır bazlı erişimi filtreler; PostgREST rolünün
-- tablo üzerinde temel SELECT/UPDATE hakkı olması da gerekir.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;

drop policy if exists "Profiles: kullanıcı kendi profilini okuyabilir" on public.profiles;

create policy "Profiles: kullanıcı kendi profilini okuyabilir"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Profiles: kullanıcı kendi profilini güncelleyebilir" on public.profiles;

create policy "Profiles: kullanıcı kendi profilini güncelleyebilir"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Not: is_active = false kontrolü panel guard (app/(panel)/layout.tsx) içinde
-- server-side yapılır; RLS burada erişimi engellemez çünkü kullanıcı kendi
-- profilini okuyabilmelidir (is_active durumunu görebilmek için).
