-- Stok ürün tipine "Diğer" seçeneği ekle

alter table public.stock_products
  drop constraint stock_products_product_type_check;

alter table public.stock_products
  add constraint stock_products_product_type_check
    check (product_type in ('device', 'battery', 'accessory', 'spare_part', 'service', 'other'));
