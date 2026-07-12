-- Voice Klinik — Sınırlı eski faaliyet aktarımı
-- Bu migration yalnızca hasta işlem listesinde geçmiş faaliyet kaydı tutmak içindir.

alter table public.patient_transactions
  add column if not exists source_type text not null default 'manual',
  add column if not exists legacy_sheet_name text,
  add column if not exists legacy_row_number integer;

alter table public.patient_transactions
  drop constraint if exists patient_transactions_source_type_check;

alter table public.patient_transactions
  add constraint patient_transactions_source_type_check
    check (source_type in ('manual', 'legacy_excel'));

create unique index if not exists patient_transactions_legacy_excel_row_uidx
  on public.patient_transactions (legacy_sheet_name, legacy_row_number)
  where source_type = 'legacy_excel'
    and legacy_sheet_name is not null
    and legacy_row_number is not null;

create index if not exists patient_transactions_source_type_date_idx
  on public.patient_transactions (source_type, transaction_date desc, created_at desc);

create index if not exists patient_transactions_legacy_sheet_idx
  on public.patient_transactions (legacy_sheet_name, legacy_row_number)
  where source_type = 'legacy_excel';
