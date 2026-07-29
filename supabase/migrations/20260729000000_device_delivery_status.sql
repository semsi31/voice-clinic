-- Voice Klinik — Cihaz teslim durumu
-- Mevcut kayıtlar default ile pending kalır; veri silinmez.

alter table public.patient_transactions
  add column if not exists device_delivery_status text not null default 'pending',
  add column if not exists device_delivered_at timestamptz;

alter table public.patient_transactions
  drop constraint if exists patient_transactions_device_delivery_status_check;

alter table public.patient_transactions
  add constraint patient_transactions_device_delivery_status_check
    check (device_delivery_status in ('pending', 'delivered'));

create index if not exists patient_transactions_device_delivery_status_idx
  on public.patient_transactions (device_delivery_status);
