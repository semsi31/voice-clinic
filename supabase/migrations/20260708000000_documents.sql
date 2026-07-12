-- Voice Klinik — Hazır Belgeler (7. aşama)
-- Bu proje SaaS değildir: tenant/organization/company/subscription/billing alanı yoktur.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_type text not null,
  file_size text,
  file_path text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_file_type_check
    check (
      file_type in (
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'png',
        'jpg',
        'jpeg',
        'other'
      )
    )
);

comment on table public.documents is
  'Hazır belge arşivi. Dosyalar Supabase Storage documents bucket içinde tutulur.';

create index if not exists documents_created_at_idx
  on public.documents (created_at desc);

create index if not exists documents_file_type_idx
  on public.documents (file_type);

drop trigger if exists documents_set_updated_at on public.documents;

create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

alter table public.documents enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

drop policy if exists "Documents: authenticated full access" on public.documents;

create policy "Documents: authenticated full access"
  on public.documents
  for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "Documents storage: authenticated insert" on storage.objects;
drop policy if exists "Documents storage: authenticated select" on storage.objects;
drop policy if exists "Documents storage: authenticated delete" on storage.objects;

create policy "Documents storage: authenticated insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Documents storage: authenticated select"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'documents');

create policy "Documents storage: authenticated delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'documents');
