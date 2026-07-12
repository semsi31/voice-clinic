-- Voice Klinik — Web sitesi talepleri (2. aşama)
-- Bu proje SaaS değildir: tenant/organization/company alanı yoktur.

create table if not exists public.web_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  request_type text not null,
  subject text,
  preferred_branch text,
  message text,
  status text not null default 'new',
  status_note text,
  source text not null default 'website',
  updated_at timestamptz not null default now(),
  constraint web_requests_status_check
    check (status in ('new', 'contacted', 'completed', 'cancelled')),
  constraint web_requests_request_type_check
    check (request_type in ('appointment', 'contact', 'info'))
);

comment on table public.web_requests is
  'Kurumsal web sitesindeki randevu ve iletişim formlarından gelen talepler.';

create or replace function public.set_web_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists web_requests_set_updated_at on public.web_requests;

create trigger web_requests_set_updated_at
  before update on public.web_requests
  for each row
  execute function public.set_web_requests_updated_at();

alter table public.web_requests enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on public.web_requests to anon;
grant select, update, delete on public.web_requests to authenticated;

drop policy if exists "Web requests: site formu talep oluşturabilir" on public.web_requests;

create policy "Web requests: site formu talep oluşturabilir"
  on public.web_requests
  for insert
  to anon
  with check (
    status = 'new'
    and source like 'website%'
    and request_type in ('appointment', 'contact', 'info')
  );

drop policy if exists "Web requests: panel kullanıcısı talepleri okuyabilir" on public.web_requests;

create policy "Web requests: panel kullanıcısı talepleri okuyabilir"
  on public.web_requests
  for select
  to authenticated
  using (true);

drop policy if exists "Web requests: panel kullanıcısı talepleri güncelleyebilir" on public.web_requests;

create policy "Web requests: panel kullanıcısı talepleri güncelleyebilir"
  on public.web_requests
  for update
  to authenticated
  using (true)
  with check (
    status in ('new', 'contacted', 'completed', 'cancelled')
    and request_type in ('appointment', 'contact', 'info')
  );

drop policy if exists "Web requests: panel kullanıcısı talepleri silebilir" on public.web_requests;

create policy "Web requests: panel kullanıcısı talepleri silebilir"
  on public.web_requests
  for delete
  to authenticated
  using (true);
