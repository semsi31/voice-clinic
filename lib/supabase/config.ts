/**
 * Supabase ortam değişkenleri henüz ayarlanmadığında (örn. .env.local
 * oluşturulmadan önce) uygulamanın ve kurumsal web sitesinin çökmemesi için
 * kullanılan basit bir kontrol.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
