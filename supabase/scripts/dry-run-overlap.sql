-- Dry-run: how many local primary keys already exist on cloud?
-- This file is informational; run against CLOUD after loading local ids is impractical.
-- Instead we compare emptiness + ON CONFLICT strategy.

select 'patient_transactions' as table_name, count(*)::bigint as cloud_rows from public.patient_transactions
union all select 'import_batches', count(*) from public.import_batches
union all select 'import_rows', count(*) from public.import_rows
union all select 'transaction_payments', count(*) from public.transaction_payments
union all select 'reminders', count(*) from public.reminders
union all select 'finance_records', count(*) from public.finance_records
union all select 'documents', count(*) from public.documents
union all select 'web_requests', count(*) from public.web_requests
union all select 'profiles', count(*) from public.profiles
order by 1;
