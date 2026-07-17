select 'patient_transactions' as table_name, count(*)::bigint as row_count from public.patient_transactions
union all select 'patient_transactions.legacy_excel', count(*) from public.patient_transactions where source_type = 'legacy_excel'
union all select 'transaction_payments', count(*) from public.transaction_payments
union all select 'import_batches', count(*) from public.import_batches
union all select 'import_rows', count(*) from public.import_rows
union all select 'stock_products', count(*) from public.stock_products
union all select 'stock_movements', count(*) from public.stock_movements
union all select 'cargo_records', count(*) from public.cargo_records
union all select 'reminders', count(*) from public.reminders
union all select 'finance_records', count(*) from public.finance_records
union all select 'documents', count(*) from public.documents
union all select 'web_requests', count(*) from public.web_requests
union all select 'profiles', count(*) from public.profiles
order by 1;
