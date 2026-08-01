-- Speed up transaction delete: index stock lookups by transaction_id,
-- and collapse multi-roundtrip cleanup into one SECURITY INVOKER RPC.
-- payments cascade from patient_transactions; receipt documents do not.

create index if not exists stock_movements_transaction_id_idx
  on public.stock_movements (transaction_id)
  where transaction_id is not null;

create index if not exists stock_movements_transaction_type_idx
  on public.stock_movements (transaction_id, movement_type)
  where transaction_id is not null;

create or replace function public.delete_patient_transaction(
  p_id uuid,
  p_staff_name text default 'Panel'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_exists boolean;
  v_has_return boolean;
  v_touched_stock boolean := false;
  v_receipt_ids uuid[];
  v_file_paths text[];
  v_inserted int := 0;
begin
  select exists(
    select 1 from public.patient_transactions where id = p_id
  ) into v_exists;

  if not v_exists then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Collect receipt document ids before payments cascade-delete.
  select coalesce(array_agg(distinct receipt_document_id), '{}'::uuid[])
  into v_receipt_ids
  from public.transaction_payments
  where transaction_id = p_id
    and receipt_document_id is not null;

  select exists(
    select 1
    from public.stock_movements
    where transaction_id = p_id
      and movement_type = 'return'
  ) into v_has_return;

  if not v_has_return then
    insert into public.stock_movements (
      stock_product_id,
      movement_type,
      quantity_change,
      transaction_id,
      staff_name,
      note
    )
    select
      sm.stock_product_id,
      'return',
      abs(sm.quantity_change),
      p_id,
      coalesce(nullif(trim(p_staff_name), ''), 'Panel'),
      'İşlem silindiği için stok iadesi'
    from public.stock_movements sm
    where sm.transaction_id = p_id
      and sm.movement_type in ('sale', 'out')
      and sm.quantity_change < 0;

    get diagnostics v_inserted = row_count;
    v_touched_stock := v_inserted > 0;
  end if;

  -- Cascades transaction_payments. stock_movements.transaction_id becomes null.
  delete from public.patient_transactions where id = p_id;

  if coalesce(array_length(v_receipt_ids, 1), 0) > 0 then
    -- Collect R2 keys for these docs, then delete rows.
    -- Only return keys that no remaining documents row still references
    -- (stable receipt keys can be shared across recreate cycles).
    select coalesce(array_agg(d.file_path) filter (where d.file_path is not null), '{}'::text[])
    into v_file_paths
    from public.documents d
    where d.id = any(v_receipt_ids);

    delete from public.documents where id = any(v_receipt_ids);

    select coalesce(array_agg(path), '{}'::text[])
    into v_file_paths
    from unnest(coalesce(v_file_paths, '{}'::text[])) as path
    where path is not null
      and not exists (
        select 1 from public.documents d2 where d2.file_path = path
      );
  else
    v_file_paths := '{}'::text[];
  end if;

  return jsonb_build_object(
    'ok', true,
    'touched_stock', v_touched_stock,
    'receipt_count', coalesce(array_length(v_receipt_ids, 1), 0),
    'file_paths', to_jsonb(coalesce(v_file_paths, '{}'::text[]))
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'delete_failed',
      'message', SQLERRM
    );
end;
$$;

comment on function public.delete_patient_transaction(uuid, text) is
  'Atomically return stock, delete patient transaction (cascade payments), and remove receipt documents. R2 cleanup stays in the app after().';

grant execute on function public.delete_patient_transaction(uuid, text) to authenticated;
