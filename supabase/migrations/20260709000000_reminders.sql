-- Voice Klinik — Hatırlatıcılar (8. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  reminder_date date not null default current_date,
  reminder_time time,
  title text not null,
  patient_name text,
  related_record text,
  responsible_person text,
  status text not null default 'pending',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_status_check
    check (status in ('pending', 'completed', 'delayed', 'cancelled'))
);

comment on table public.reminders is
  'Takip ve görev hatırlatıcıları. Klinik şubesi alanı içermez.';

create index if not exists reminders_reminder_date_idx
  on public.reminders (reminder_date desc, created_at desc);

create index if not exists reminders_status_idx
  on public.reminders (status, reminder_date desc);

drop trigger if exists reminders_set_updated_at on public.reminders;

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row
  execute function public.set_updated_at();

alter table public.reminders enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

drop policy if exists "Reminders: authenticated full access" on public.reminders;

create policy "Reminders: authenticated full access"
  on public.reminders
  for all
  to authenticated
  using (true)
  with check (true);
