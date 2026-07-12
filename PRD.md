# Voice Klinik İşitme Merkezi — PRD

## 1. Proje Özeti

Voice Klinik İşitme Merkezi için kurumsal web sitesi ve tek admin panelden yönetilen operasyon takip sistemi geliştirilecektir.

Sistem, işletmenin hâlihazırda Excel üzerinden takip ettiği hasta/işlem kayıtları, ödeme ve borç takibi, gelir-gider yönetimi, stok takibi, kargo süreçleri, hazır belge arşivi, hatırlatıcılar, aylık raporlar ve Excel içe aktarım süreçlerini dijital ortama taşıyacaktır.

Bu proje SaaS değildir. Sadece Voice Klinik’in kendi iç kullanımı için geliştirilecek özel bir web uygulamasıdır. İşletmenin iki fiziksel şubesi vardır; sistemde çoklu firma/tenant yapısı olmayacak, yalnızca kayıtların hangi şubeye ait olduğunu belirtmek için şube bilgisi tutulacaktır.

---

## 2. Proje Kapsamı

### 2.1 Dahil Olanlar

* Kurumsal web sitesi
* Tek admin panel
* Kullanıcı girişi
* Basit rol bazlı yetki sistemi
* 2 şube için kayıt/filtresi
* Dashboard
* Hasta / işlem takibi
* Ödeme ve kalan borç takibi
* Gelir-gider takibi
* Kargo yönetimi
* Stok yönetimi
* Hazır belgeler
* Hatırlatıcılar
* Aylık raporlar
* Excel içe aktarım
* Dosya yükleme/indirme
* Vercel deploy
* Supabase kurulumu
* Cloudflare domain/DNS yapılandırması

### 2.2 Dahil Olmayanlar

Aşağıdaki özellikler bu sürümün kapsamına dahil değildir. İstenirse ayrıca fiyatlandırılır:

* SMS entegrasyonu
* WhatsApp entegrasyonu
* E-fatura / e-arşiv entegrasyonu
* Muhasebe programı entegrasyonu
* Mobil uygulama
* Hasta portalı
* Online randevu takip paneli
* Barkod okuyucu entegrasyonu
* Otomatik PDF sözleşme/form üretimi
* Gelişmiş stok muhasebesi
* Çoklu firma / SaaS yapısı
* Abonelik / ödeme sistemi
* Gelişmiş yetki matrisi
* Gelişmiş blog yönetim paneli

---

## 3. Temel Mimari Kararlar

### 3.1 Sistem Tipi

Sistem tek işletme için geliştirilecektir.

Kullanılmayacak yapılar:

* tenant_id
* organization_id
* company_id
* subscription
* billing
* multi-tenant architecture

Kullanılacak yapı:

* Tek admin panel
* Tek işletme
* 2 fiziksel şube
* Kayıtlarda branch_id kullanımı

---

### 3.2 Teknoloji Stack

Frontend, web sitesi ve admin panel:

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend / servis katmanı:

* Next.js Server Actions veya Route Handlers
* Supabase client/server SDK

Veritabanı:

* Supabase PostgreSQL

Auth:

* Supabase Auth

Dosya depolama:

* Supabase Storage

Deploy:

* Vercel

DNS / güvenlik:

* Cloudflare

Form doğrulama:

* Zod

Tablo / filtreleme:

* TanStack Table veya custom table components

Grafik / rapor:

* Recharts veya basit card/list tabanlı raporlar

---

## 4. Kullanıcı Rolleri

Sistemde basit rol bazlı yetki yapısı olacaktır.

### 4.1 Roller

#### admin

Tüm modüllere erişir. Kullanıcı yönetimi, ayarlar, kayıt silme/düzenleme gibi tüm işlemleri yapabilir.

#### manager

Operasyon kayıtlarını, raporları, hasta işlemlerini, stok ve kargo kayıtlarını görebilir ve düzenleyebilir. Sistem ayarlarına sınırlı erişir.

#### staff

Hasta işlemi, kargo, belge ve hatırlatıcı gibi günlük operasyonları yönetebilir. Finansal raporlara tam erişimi olmayabilir.

#### accounting

Ödeme, kalan borç, gelir-gider ve rapor ekranlarına erişebilir. Hasta işlem detaylarını finansal amaçla görebilir.

#### viewer

Sadece görüntüleme yetkisine sahiptir. Kritik düzenleme veya silme işlemi yapamaz.

---

## 5. Genel UX/UI Kararları

### 5.1 Panel Tasarım Dili

Admin panel sade, temiz ve operasyon odaklı olacaktır.

Tasarım karakteri:

* Profesyonel
* Klinik hissi veren
* Açık ve anlaşılır
* Tablolu veri yönetimine uygun
* Mobil/tablet uyumlu
* Gereksiz animasyondan uzak

Renk paleti:

* Lacivert
* Beyaz
* Açık gri
* Turkuaz / mavi vurgu

Panel layout:

* Sol sidebar
* Üst bar
* Ana içerik alanı
* Kartlar
* Filtreli tablolar
* Modal formlar
* Detay sayfaları
* Toast bildirimleri

---

### 5.2 Web Sitesi Tasarım Dili

Kurumsal web sitesi güven veren, modern ve sade bir yapıda olmalıdır.

Tasarım karakteri:

* Klinik/sağlık sektörüne uygun
* Güvenilir
* Ferah
* Mobil uyumlu
* SEO dostu
* Kurumsal görünümde

Web sitesinde admin panel layout’u kullanılmamalı. Site layout’u ayrı tutulmalıdır.

---

## 6. Klasör Yapısı

Proje klasör yapısı aşağıdaki gibi planlanmalıdır:

```txt
voice-klinik/
  app/
    (site)/
      layout.tsx
      page.tsx
      kurumsal/
        hakkimizda/
        misyon-vizyon/
        kalite-politikamiz/
        kvkk-gizlilik/
      hizmetlerimiz/
        isitme-testi-ve-degerlendirme/
        isitme-cihazi-uygulamasi/
        isitme-cihazi-satisi/
        cihaz-bakim-ve-kontrol/
        yedek-parca-ve-aksesuar/
        satis-sonrasi-destek/
      isitme-cihazlari/
        modeller/
        kulak-arkasi/
        kulak-ici/
        sarjli-cihazlar/
        bluetooth-cihazlar/
        cihaz-secim-rehberi/
      teknik-servis/
        isitme-cihazi-tamiri/
        cihaz-bakimi/
        ariza-tespit/
        garanti-servis-sureci/
      blog/
      iletisim/

    (auth)/
      login/

    (panel)/
      dashboard/
      transactions/
      income-expense/
      cargo/
      stock/
      documents/
      reminders/
      reports/
      imports/
      users/
      settings/

  components/
    ui/
    layout/
    site/
    panel/
    dashboard/
    forms/
    tables/
    charts/

  lib/
    supabase/
    services/
    validations/
    permissions/
    utils/

  types/

  sql/
    migrations/
    seed.sql

  public/
```

---

## 7. Kurumsal Web Sitesi

### 7.1 Ana Menü

Web sitesi ana menüsü aşağıdaki gibi olacaktır:

```txt
Ana Sayfa
Kurumsal
Hizmetlerimiz
İşitme Cihazları
Teknik Servis
Blog
İletişim
Randevu Al
```

Header yapısı:

* Logo solda
* Menü ortada
* Sağda “Randevu Al” butonu
* Mobilde hamburger menü
* CTA butonu görünür olmalı

---

### 7.2 Kurumsal Alt Menüleri

```txt
Kurumsal
  - Hakkımızda
  - Misyon & Vizyon
  - Kalite Politikamız
  - KVKK ve Gizlilik
```

#### Hakkımızda

Voice Klinik’in kim olduğu, hangi alanlarda hizmet verdiği, hasta odaklı yaklaşımı ve iki şubeli yapısı anlatılacaktır.

#### Misyon & Vizyon

Kurumsal yaklaşımı, işitme sağlığına verdiği önem ve uzun vadeli hedefleri anlatılacaktır.

#### Kalite Politikamız

Doğru cihaz seçimi, profesyonel danışmanlık, şeffaf bilgilendirme, satış sonrası destek ve hasta memnuniyeti gibi başlıklar yer alacaktır.

#### KVKK ve Gizlilik

Hasta verisi işlendiği için KVKK ve gizlilik metni web sitesinde bulunmalıdır.

---

### 7.3 Hizmetlerimiz Alt Menüleri

```txt
Hizmetlerimiz
  - İşitme Testi ve Değerlendirme
  - İşitme Cihazı Uygulaması
  - İşitme Cihazı Satışı
  - Cihaz Bakım ve Kontrol
  - Yedek Parça ve Aksesuar
  - Satış Sonrası Destek
```

Her hizmet sayfasında:

* Sayfa başlığı
* Kısa açıklama
* Hizmet kapsamı
* Süreç anlatımı
* Randevu/iletişim çağrısı
* SEO metadata

bulunmalıdır.

---

### 7.4 İşitme Cihazları Alt Menüleri

```txt
İşitme Cihazları
  - İşitme Cihazı Modelleri
  - Kulak Arkası Cihazlar
  - Kulak İçi Cihazlar
  - Şarjlı İşitme Cihazları
  - Bluetooth Özellikli Cihazlar
  - Cihaz Seçim Rehberi
```

Bu bölüm bilgilendirici olmalıdır. Direkt ürün kataloğu gibi değil, danışmanlık odaklı anlatılmalıdır.

---

### 7.5 Teknik Servis Alt Menüleri

```txt
Teknik Servis
  - İşitme Cihazı Tamiri
  - Cihaz Bakımı
  - Arıza Tespit
  - Garanti ve Servis Süreci
```

Teknik servis sayfalarında cihaz teslim süreci, arıza ön değerlendirme, servise gönderim, tamir sonrası teslim ve garanti süreci anlatılmalıdır.

---

### 7.6 Blog

Blog ilk sürümde statik olabilir.

Örnek blog kategorileri:

```txt
İşitme Sağlığı
Cihaz Kullanımı
Bakım ve Temizlik
Sık Sorulan Sorular
```

Örnek blog başlıkları:

* İşitme Cihazı Seçerken Nelere Dikkat Edilmeli?
* İşitme Cihazı Bakımı Nasıl Yapılır?
* Şarjlı İşitme Cihazlarının Avantajları
* İşitme Kaybı Belirtileri Nelerdir?
* İşitme Cihazına Alışma Süreci Nasıl İlerler?

Blog yönetim paneli ilk sürümde zorunlu değildir.

---

### 7.7 İletişim Sayfası

İletişim sayfasında aşağıdakiler yer almalıdır:

* Telefon
* WhatsApp
* E-posta
* 2 şube adresi
* Google Maps alanı
* Çalışma saatleri
* Randevu talep formu

Randevu formu alanları:

```txt
Ad soyad
Telefon
Şube seçimi
Konu
Mesaj
```

İlk sürümde form verileri e-posta olarak gönderilebilir veya admin panele düşürülebilir. Eğer zaman kısıtı oluşursa e-posta gönderimi yeterlidir.

---

### 7.8 Ana Sayfa Bölümleri

Ana sayfa aşağıdaki bölümlerden oluşmalıdır:

1. Hero
2. Kısa güven / istatistik alanı
3. Hizmet kartları
4. İşitme cihazı çözümleri
5. Neden Voice Klinik?
6. Teknik servis ve satış sonrası destek
7. Sık sorulan sorular
8. Randevu / iletişim çağrısı
9. Footer

Hero başlığı:

```txt
İşitme Sağlığınız İçin Güvenilir ve Profesyonel Çözümler
```

Hero açıklaması:

```txt
Voice Klinik İşitme Merkezi olarak işitme cihazı danışmanlığı, cihaz uygulaması, teknik servis ve satış sonrası destek süreçlerinde size özel çözümler sunuyoruz.
```

CTA butonları:

```txt
Randevu Al
Bizi Arayın
Hizmetlerimizi İnceleyin
```

---

## 8. Admin Panel Modülleri

### 8.1 Dashboard

Dashboard panelin ana ekranıdır.

Gösterilecek metrik kartları:

* Bugünkü tahsilat
* Bu ay toplam satış
* Bu ay toplam gider
* Kalan toplam borç
* Bugünkü hatırlatmalar
* Bekleyen kargolar
* Kritik stok uyarıları
* Son işlemler

Dashboard listeleri:

* Bugünkü hatırlatmalar
* Geciken hatırlatmalar
* Son hasta işlemleri
* Kritik stok ürünleri
* Bekleyen kargolar

Filtreler:

* Bugün
* Bu hafta
* Bu ay
* Şube filtresi

---

### 8.2 Hasta / İşlem Takibi

Sistemin ana modülüdür.

#### Alanlar

* Sıra no — otomatik
* Şube adı
* Tarih
* Hastane
* Raporu çıkaran hekim
* Referans
* Hasta adı soyadı
* Telefon
* Yapılan işlem
* Marka
* Model
* Seri no
* Kulak: sağ / sol / çift
* Satış tutarı
* Açıklama
* İlgilenen personel

#### Ödeme Bilgileri

Ödemeler ayrı tabloda tutulacaktır.

Her işleme birden fazla ödeme eklenebilir.

Ödeme yöntemleri:

* Nakit
* Kredi kartı
* Havale

#### Kalan Borç

Kalan borç elle tutulmayacaktır.

Formül:

```txt
Kalan borç = Satış tutarı - Toplam ödemeler
```

#### Liste Özellikleri

* Arama
* Tarih filtresi
* Şube filtresi
* İşlem türü filtresi
* Borç durumu filtresi
* Marka/model filtresi
* Sayfalama
* Detay görüntüleme
* Düzenleme
* Silme veya pasifleştirme

#### Detay Sayfası

Detay ekranında:

* Hasta bilgileri
* İşlem bilgileri
* Cihaz bilgileri
* Ödeme geçmişi
* Yeni ödeme ekleme
* Kalan borç
* Hatırlatıcılar
* Açıklamalar

bulunmalıdır.

---

### 8.3 Ödeme Sistemi

Her hasta işlemine ödeme eklenebilir.

Ödeme alanları:

* İşlem ID
* Ödeme tarihi
* Ödeme yöntemi
* Tutar
* Açıklama
* Ödemeyi alan personel

Ödeme eklenince:

* Kalan borç otomatik azalır
* Dashboard tahsilatına yansır
* Aylık rapora dahil olur
* Ödeme geçmişinde görünür

---

### 8.4 Gelir - Gider Takibi

Gelir-gider modülünde manuel gelir ve gider kayıtları tutulacaktır.

Alanlar:

* Tarih
* Şube
* Kayıt tipi: gelir / gider
* Kategori
* Ödeme yöntemi: nakit / kredi kartı / havale
* Tutar
* İlgilenen personel
* Açıklama

Gelir kategorileri:

* Cihaz satışı dışı gelir
* Yedek parça geliri
* Tamir geliri
* Diğer gelir

Gider kategorileri:

* Ürün alımı
* Kargo gideri
* Personel gideri
* Kira / fatura
* Teknik servis gideri
* Diğer gider

Önemli kural:

Hasta işlem ödemeleri `transaction_payments` tablosunda tutulur. Manuel gelir-gider kayıtları `income_expense_records` tablosunda tutulur. Raporlarda bu veriler birlikte hesaplanırken aynı gelir iki kez sayılmamalıdır.

---

### 8.5 Kargo Yönetimi

Kargo modülü cihaz, ürün veya evrak gönderim süreçlerini takip etmek için kullanılacaktır.

Alanlar:

* Tarih
* Gönderen
* Şube adı
* Yapılan işlem
* Not
* Kargo firması
* Takip numarası
* Durum

Kargo durumları:

* Hazırlandı
* Gönderildi
* Teslim edildi
* İade edildi
* Sorunlu

Liste özellikleri:

* Şube filtresi
* Tarih filtresi
* Durum filtresi
* Kargo firması filtresi
* Arama
* Sayfalama

---

### 8.6 Stok Yönetimi

Stok modülü işitme cihazı, yedek parça, pil, aksesuar ve servis ürünleri için kullanılacaktır.

Ürün alanları:

* Ürün adı
* Ürün tipi
* Marka
* Model
* Seri no
* Şube
* Mevcut adet
* Minimum stok seviyesi
* Alış fiyatı
* Satış fiyatı
* Açıklama

Ürün tipleri:

* İşitme cihazı
* Yedek parça
* Pil
* Aksesuar
* Servis ürünü
* Diğer

Stok hareketleri:

* Stok girişi
* Stok çıkışı
* Satış
* İade
* Transfer
* Fire / kayıp

İlk sürümde stok modülü temel seviyede olacaktır:

* Ürün ekle
* Ürün düzenle
* Adet güncelle
* Kritik stok uyarısı
* Şube bazlı ürün takibi

---

### 8.7 Hazır Belgeler

Kullanıcı sisteme hazır belgeler yükleyip istediği zaman indirebilir veya yazdırabilir.

Alanlar:

* Belge adı
* Kategori
* Dosya
* Yüklenme tarihi
* Açıklama
* Yükleyen kullanıcı

Belge kategorileri:

* KVKK
* Formlar
* Garanti belgeleri
* Satış belgeleri
* Servis formları
* Sözleşmeler
* Diğer

İşlemler:

* Belge yükle
* Belge indir
* Belge yazdır
* Belge sil
* Kategoriye göre filtrele

Desteklenen dosya türleri:

* PDF
* DOC
* DOCX
* XLS
* XLSX
* JPG
* PNG

Maksimum dosya boyutu:

```txt
10 MB
```

Dosyalar Supabase Storage üzerinde private bucket içinde saklanmalıdır.

---

### 8.8 Hatırlatıcılar

Hatırlatıcı sistemi hasta, işlem veya genel görev şeklinde çalışacaktır.

Alanlar:

* Başlık
* Açıklama
* Hatırlatma tarihi
* İlgili hasta
* İlgili işlem
* Şube
* Sorumlu personel
* Durum

Durumlar:

* Bekliyor
* Tamamlandı
* Ertelendi
* İptal

Dashboard’da gösterilecekler:

* Bugünkü hatırlatmalar
* Geciken hatırlatmalar
* Bu haftaki hatırlatmalar

İlk sürümde sadece panel içi hatırlatma olacaktır. SMS, WhatsApp veya e-posta bildirimi yoktur.

---

### 8.9 Raporlar

Aylık genel analiz raporu oluşturulacaktır.

Filtreler:

* Ay
* Yıl
* Şube: tümü / merkez / ikinci şube

Rapor metrikleri:

* Toplam satış
* Toplam tahsilat
* Toplam gider
* Net durum
* Nakit tahsilat
* Kredi kartı tahsilat
* Havale tahsilat
* Kalan toplam borç
* Toplam işlem sayısı
* En çok yapılan işlem
* Şube bazlı satış
* Personel bazlı işlem sayısı
* Kritik stoklar

Çıktılar:

* Ekranda görüntüleme
* PDF indir, zaman uygunsa
* Excel indir, zaman uygunsa

İlk sürümde ekran raporu zorunludur. PDF/Excel çıktı özelliği zaman durumuna göre uygulanacaktır.

---

### 8.10 Excel İçe Aktarım

Eski Excel verilerinin sisteme aktarılması için standart şablon üzerinden import yapılacaktır.

Akış:

1. Excel dosyası yüklenir.
2. Sistem satırları okur.
3. Ön izleme gösterir.
4. Hatalı satırlar işaretlenir.
5. Kullanıcı onaylarsa veriler içe aktarılır.
6. Import sonucu raporlanır.

İlk sürümde gelişmiş sütun eşleştirme sihirbazı yapılmayacaktır. Standart Excel şablonu kullanılacaktır.

Excel kolonları:

* Şube
* Tarih
* Hastane
* Hekim
* Referans
* Hasta Adı Soyadı
* Telefon
* Yapılan İşlem
* Marka
* Model
* Seri No
* Kulak
* Satış Tutarı
* Nakit
* Kredi Kartı
* Havale
* Açıklama
* Hatırlatma Tarihi

Import kayıtları `import_batches` ve `import_rows` tablolarında tutulacaktır.

---

### 8.11 Kullanıcı Yönetimi

Panel kullanıcıları Supabase Auth ile giriş yapacaktır.

Kullanıcı profili alanları:

* Ad soyad
* E-posta
* Rol
* Varsayılan şube
* Aktif / pasif

Kullanıcı işlemleri:

* Kullanıcı listeleme
* Kullanıcı oluşturma
* Rol güncelleme
* Kullanıcı pasifleştirme
* Şifre sıfırlama, mümkünse Supabase Auth üzerinden

---

### 8.12 Ayarlar

Ayarlar sayfasında temel sistem ayarları bulunacaktır.

Ayarlar:

* Şube yönetimi
* Firma adı
* Telefon
* E-posta
* Adres bilgileri
* Çalışma saatleri
* Web sitesi iletişim bilgileri
* Temel sistem tercihleri

---

## 9. Veritabanı Tasarımı

### 9.1 Tablolar

Sistemde aşağıdaki tablolar kullanılacaktır:

* profiles
* branches
* patients
* patient_transactions
* transaction_payments
* income_expense_records
* products
* stock_movements
* cargo_shipments
* documents
* reminders
* import_batches
* import_rows
* audit_logs
* settings

---

### 9.2 profiles

Supabase Auth kullanıcılarına ait profil bilgilerini tutar.

Alanlar:

```txt
id
user_id
full_name
role
default_branch_id
is_active
created_at
updated_at
```

---

### 9.3 branches

Şube bilgilerini tutar.

Alanlar:

```txt
id
name
address
phone
is_active
created_at
updated_at
```

Seed kayıtları:

```txt
Voice Klinik Merkez
Voice Klinik İkinci Şube
```

---

### 9.4 patients

Hasta genel bilgilerini tutar.

Alanlar:

```txt
id
full_name
phone
description
created_at
updated_at
```

Hasta doğrudan şubeye bağlanmayacaktır. İşlem kayıtları şube ile ilişkilendirilecektir.

---

### 9.5 patient_transactions

Hasta işlem kayıtlarını tutar.

Alanlar:

```txt
id
sequence_no
branch_id
patient_id
transaction_date
hospital
doctor_name
reference
operation_type
brand
model
serial_no
ear_side
sale_amount
description
responsible_user_id
created_at
updated_at
```

ear_side değerleri:

```txt
right
left
both
```

operation_type örnekleri:

```txt
cihaz_satisi
yedek_parca
tamir
kontrol
pil_satisi
diger
```

---

### 9.6 transaction_payments

İşlemlere ait ödeme kayıtlarını tutar.

Alanlar:

```txt
id
transaction_id
payment_date
payment_method
amount
description
received_by_user_id
created_at
updated_at
```

payment_method değerleri:

```txt
cash
credit_card
bank_transfer
```

---

### 9.7 income_expense_records

Manuel gelir-gider kayıtlarını tutar.

Alanlar:

```txt
id
branch_id
record_type
category
payment_method
amount
record_date
description
responsible_user_id
created_at
updated_at
```

record_type değerleri:

```txt
income
expense
```

---

### 9.8 products

Stok ürünlerini tutar.

Alanlar:

```txt
id
branch_id
product_type
name
brand
model
serial_no
quantity
min_stock_level
purchase_price
sale_price
description
created_at
updated_at
```

---

### 9.9 stock_movements

Stok hareketlerini tutar.

Alanlar:

```txt
id
product_id
branch_id
movement_type
quantity
description
created_by
created_at
```

movement_type değerleri:

```txt
in
out
sale
return
transfer
loss
```

---

### 9.10 cargo_shipments

Kargo kayıtlarını tutar.

Alanlar:

```txt
id
branch_id
shipment_date
sender
operation_type
cargo_company
tracking_number
status
note
created_by
created_at
updated_at
```

status değerleri:

```txt
prepared
sent
delivered
returned
problematic
```

---

### 9.11 documents

Hazır belge kayıtlarını tutar.

Alanlar:

```txt
id
title
category
file_path
file_name
file_type
description
uploaded_by
created_at
updated_at
```

---

### 9.12 reminders

Hatırlatıcı kayıtlarını tutar.

Alanlar:

```txt
id
branch_id
patient_id
transaction_id
title
description
reminder_date
status
assigned_user_id
created_by
created_at
updated_at
```

status değerleri:

```txt
pending
completed
postponed
cancelled
```

---

### 9.13 import_batches

Excel import işlem gruplarını tutar.

Alanlar:

```txt
id
file_name
file_path
status
total_rows
success_rows
failed_rows
uploaded_by
created_at
updated_at
```

---

### 9.14 import_rows

Excel import satırlarını tutar.

Alanlar:

```txt
id
batch_id
row_number
raw_data
status
error_message
created_at
```

---

### 9.15 audit_logs

Kritik işlemlerin log kayıtlarını tutar.

Alanlar:

```txt
id
user_id
action
table_name
record_id
old_data
new_data
created_at
```

İlk sürümde en azından silme ve kritik düzenleme işlemleri loglanmalıdır.

---

### 9.16 settings

Sistem ayarlarını tutar.

Alanlar:

```txt
id
key
value
created_at
updated_at
```

---

## 10. Veritabanı View ve Hesaplamalar

### 10.1 Kalan Borç View

Kalan borç için veritabanında manuel kolon tutulmamalıdır.

Önerilen view:

```sql
create view transaction_payment_summary as
select
  pt.id as transaction_id,
  pt.sale_amount,
  coalesce(sum(tp.amount), 0) as paid_amount,
  pt.sale_amount - coalesce(sum(tp.amount), 0) as remaining_debt
from patient_transactions pt
left join transaction_payments tp on tp.transaction_id = pt.id
group by pt.id;
```

Bu view üzerinden:

* Satış tutarı
* Ödenen tutar
* Kalan borç

görüntülenir.

---

## 11. Güvenlik Gereksinimleri

Sistem hasta ve finans verisi tuttuğu için güvenlik önceliklidir.

Mutlaka yapılacaklar:

* Admin panel giriş zorunlu olacak
* Anonim kullanıcı admin verilerine erişemeyecek
* Supabase Storage bucket’ları private olacak
* Dosya indirme yetki kontrollü olacak
* Kritik işlemler rol kontrolünden geçecek
* Form validasyonları yapılacak
* Dosya türleri sınırlandırılacak
* Dosya boyutu sınırı uygulanacak
* Silme işlemleri mümkünse soft delete veya yetkili kullanıcıyla sınırlı olacak
* Kritik işlemler audit log’a yazılacak

İlk sürümde RLS basit tutulabilir fakat tablolar public/anonim erişime açılmamalıdır.

---

## 12. Form Validasyon Kuralları

Formlar Zod ile doğrulanmalıdır.

Genel kurallar:

* Zorunlu alanlar boş geçilemez
* Telefon alanı geçerli formatta olmalıdır
* Tutar alanları negatif olamaz
* Tarih alanları geçerli tarih olmalıdır
* Ödeme yöntemi belirlenen enum değerlerinden biri olmalıdır
* Kulak alanı right, left veya both olmalıdır
* Dosya yükleme alanında desteklenen dosya türleri kontrol edilmelidir
* Dosya boyutu 10 MB’ı geçmemelidir

---

## 13. Dashboard Metrik Hesapları

### 13.1 Bugünkü Tahsilat

Bugünün `transaction_payments` toplamı.

### 13.2 Bu Ay Toplam Satış

Bu ay oluşturulan `patient_transactions.sale_amount` toplamı.

### 13.3 Bu Ay Toplam Gider

Bu ay `income_expense_records` içinde `record_type = expense` olan kayıtların toplamı.

### 13.4 Kalan Toplam Borç

Tüm işlemler için:

```txt
sale_amount - toplam ödeme
```

toplamı.

### 13.5 Bekleyen Kargolar

Durumu `prepared` veya `sent` olan kargolar.

### 13.6 Kritik Stok

`products.quantity <= products.min_stock_level` olan ürünler.

### 13.7 Geciken Hatırlatmalar

`reminder_date < bugün` ve `status = pending` olan hatırlatmalar.

---

## 14. Raporlama Kuralları

Rapor ekranı aylık çalışacaktır.

Filtreler:

* Ay
* Yıl
* Şube

Rapor verileri şu kaynaklardan çekilecektir:

* Satış: patient_transactions
* Tahsilat: transaction_payments
* Gider: income_expense_records
* Kalan borç: transaction_payment_summary
* Stok: products
* Kargo: cargo_shipments
* Hatırlatıcı: reminders

Raporlarda aynı gelir iki kez sayılmamalıdır.

---

## 15. Excel İçe Aktarım Kuralları

Excel import standart şablona göre yapılacaktır.

Zorunlu kolonlar:

* Hasta Adı Soyadı
* Telefon
* Tarih
* Yapılan İşlem
* Satış Tutarı

Opsiyonel kolonlar:

* Şube
* Hastane
* Hekim
* Referans
* Marka
* Model
* Seri No
* Kulak
* Nakit
* Kredi Kartı
* Havale
* Açıklama
* Hatırlatma Tarihi

Import sırasında:

* Hatalı satırlar işaretlenir
* Geçerli satırlar ön izlenir
* Kullanıcı onayı olmadan veri kalıcı kaydedilmez
* Import batch kaydı oluşturulur
* Başarılı/hatalı satır sayısı tutulur

---

## 16. Deploy ve Ortam Değişkenleri

### 16.1 Ortamlar

* Development
* Production

### 16.2 Gerekli env değişkenleri

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Service role key sadece server-side kullanılmalıdır. Client tarafına sızdırılmamalıdır.

---

## 17. Performans Gereksinimleri

* Liste ekranlarında sayfalama olmalı
* Büyük tablolar tek seferde tamamen çekilmemeli
* Tarih ve şube filtreleri indexlenmeli
* Dashboard sorguları optimize edilmeli
* Dosya yükleme işlemleri kullanıcıya loading state göstermeli
* Mobil cihazlarda temel işlemler kullanılabilir olmalı

---

## 18. Erişilebilirlik ve Kullanılabilirlik

* Butonlar açık etiketlere sahip olmalı
* Form hataları kullanıcıya anlaşılır gösterilmeli
* Toast bildirimleri kullanılmalı
* Silme işlemlerinde onay modalı olmalı
* Tablolarda boş durum mesajları olmalı
* Yükleniyor durumları gösterilmeli
* Mobilde sidebar hamburger menüye dönüşmeli

---

## 19. Teslim Takvimi

Proje teslim süresi 2 haftadır.

### Gün 1

* Next.js kurulumu
* Tailwind kurulumu
* shadcn/ui kurulumu
* Supabase bağlantısı
* Auth temel kurulumu
* Login sayfası
* Panel layout
* Sidebar

### Gün 2

* Veritabanı tabloları
* Branch seed kayıtları
* Profiles yapısı
* Kullanıcı rolleri
* Temel yetki kontrolleri

### Gün 3-4

* Hasta kayıtları
* Hasta işlem kayıtları
* İşlem listeleme
* İşlem detay ekranı
* İşlem filtreleri

### Gün 5

* Ödeme sistemi
* Kalan borç hesaplama
* Ödeme geçmişi
* Tahsilat görünümü

### Gün 6

* Gelir-gider takibi
* Kategori yapısı
* Şube filtresi
* Personel bilgisi

### Gün 7

* Stok yönetimi
* Ürün kaydı
* Adet takibi
* Kritik stok uyarısı

### Gün 8

* Kargo yönetimi
* Kargo durum takibi
* Kargo filtreleri

### Gün 9

* Hazır belgeler
* Dosya yükleme
* İndirme
* Yazdırma
* Storage entegrasyonu

### Gün 10

* Hatırlatıcılar
* Geciken hatırlatmalar
* Dashboard hatırlatma kartları

### Gün 11

* Aylık rapor ekranı
* Satış/tahsilat/gider/kalan borç hesapları
* Şube filtresi

### Gün 12

* Excel içe aktarım
* Standart şablon
* Ön izleme
* Import işlemi

### Gün 13

* Kurumsal web sitesi
* Ana sayfa
* Hizmet sayfaları
* Kurumsal sayfalar
* İletişim sayfası
* Mobil uyum

### Gün 14

* Test
* Hata düzeltme
* Deploy
* Domain bağlantısı
* Müşteriye kullanım anlatımı

---

## 20. Kabul Kriterleri

Proje teslim edilebilir sayılması için aşağıdaki kriterler sağlanmalıdır:

* Kullanıcı giriş yapabilmeli
* Admin panel yetkisiz kişilere kapalı olmalı
* Hasta işlemi eklenebilmeli
* İşleme ödeme eklenebilmeli
* Kalan borç otomatik hesaplanmalı
* Gelir-gider kaydı eklenebilmeli
* Kargo kaydı eklenebilmeli
* Stok ürünü eklenebilmeli
* Kritik stok uyarısı görülebilmeli
* Belge yüklenip indirilebilmeli
* Hatırlatıcı eklenebilmeli
* Dashboard temel metrikleri göstermeli
* Aylık rapor ekranı çalışmalı
* Excel import temel şablonla çalışmalı
* Web sitesi mobil uyumlu olmalı
* İletişim sayfası çalışmalı
* Sistem Vercel üzerinde yayında olmalı
* Domain Cloudflare üzerinden bağlanmalı

---

## 21. Cursor İçin Genel Geliştirme Kuralları

Cursor bu projede aşağıdaki kurallara göre kod üretmelidir:

* Kod dili TypeScript olmalıdır
* UI dili Türkçe olmalıdır
* Gereksiz SaaS yapısı oluşturulmamalıdır
* tenant_id, organization_id, company_id kullanılmamalıdır
* branch_id sadece şube bilgisi için kullanılmalıdır
* Hasta, işlem ve ödeme ayrı tutulmalıdır
* Kalan borç manuel kolon olarak tutulmamalıdır
* Form validasyonları Zod ile yapılmalıdır
* Tekrarlayan UI parçaları component haline getirilmelidir
* İş mantığı servis dosyalarında tutulmalıdır
* Güvenlik kontrolleri atlanmamalıdır
* Storage bucket public olmamalıdır
* Admin panel ve site layout birbirinden ayrı olmalıdır
* Kod okunabilir, sürdürülebilir ve modüler olmalıdır

---

## 22. İlk Cursor Görevi

Projeye başlarken Cursor’a verilecek ilk görev:

```txt
Next.js App Router + TypeScript + Tailwind + shadcn/ui projesini kur.

Ardından şu yapıları oluştur:
- Supabase client setup
- Auth helper setup
- Login page
- Protected panel layout
- Sidebar navigation
- Dashboard placeholder page
- Turkish UI labels

Sidebar menüleri:
- Ana Sayfa
- Hasta / İşlem Takibi
- Gelir - Gider Takibi
- Kargo Yönetimi
- Stok Yönetimi
- Hazır Belgeler
- Hatırlatıcılar
- Raporlar
- Excel İçe Aktarım
- Kullanıcı Yönetimi
- Ayarlar

Tasarım:
- Sol koyu lacivert sidebar
- Beyaz ana içerik alanı
- Üst bar
- Mobil uyumlu layout
- shadcn/ui componentleri kullan
```

---

## 23. İkinci Cursor Görevi

```txt
Supabase PostgreSQL için Voice Klinik veritabanı SQL migration dosyasını hazırla.

Tablolar:
- profiles
- branches
- patients
- patient_transactions
- transaction_payments
- income_expense_records
- products
- stock_movements
- cargo_shipments
- documents
- reminders
- import_batches
- import_rows
- audit_logs
- settings

Kurallar:
- UUID primary key kullan.
- created_at ve updated_at alanları olsun.
- Gerekli foreign key ilişkilerini kur.
- branch_id ilgili operasyonel tablolarda olsun.
- payment_method için cash, credit_card, bank_transfer değerleri kullanılacak.
- remaining_debt kolonu oluşturma.
- Kalan borç için transaction_payment_summary view oluştur.
- Temel indexes ekle.
- İlk seed olarak 2 branch oluştur.
```

---

## 24. Üçüncü Cursor Görevi

```txt
Hasta / işlem takibi modülünü geliştir.

Sayfalar:
- /panel/transactions
- /panel/transactions/new
- /panel/transactions/[id]

Özellikler:
- Hasta seç veya yeni hasta oluştur
- Şube seç
- Tarih gir
- Hastane
- Raporu çıkaran hekim
- Referans
- Yapılan işlem
- Marka
- Model
- Seri no
- Kulak: sağ, sol, çift
- Satış tutarı
- Açıklama
- İlgilenen personel

Liste ekranında:
- Arama
- Tarih filtresi
- Şube filtresi
- İşlem türü filtresi
- Borç durumu filtresi
- Satış tutarı
- Ödenen tutar
- Kalan borç
- Detay / düzenle butonları

Detay ekranında:
- Hasta bilgileri
- İşlem bilgileri
- Ödeme geçmişi
- Yeni ödeme ekleme
- Kalan borç hesaplama
```

---

## 25. Final Proje Tanımı

Voice Klinik İşitme Merkezi için geliştirilecek sistem; kurumsal web sitesi ve tek panelden yönetilen operasyon takip uygulamasıdır. Sistem, işletmenin iki şubesine ait hasta işlem kayıtlarını, ödeme ve borç takibini, gelir-gider süreçlerini, stok durumunu, kargo hareketlerini, hazır belgeleri, hatırlatıcıları ve aylık analiz raporlarını tek platformda toplamayı amaçlar.

Mevcut Excel verileri standart şablon ile sisteme aktarılabilecek, kullanıcılar güvenli giriş yaparak yetkilerine göre paneli kullanabilecektir.

Bu sistem SaaS değildir. Tek işletme için özel olarak geliştirilecektir.

---

## 26. Proje Son Karar Özeti

```txt
Proje Adı:
Voice Klinik Kurumsal Web Sitesi ve Yönetim Paneli

Proje Tipi:
Kurumsal web sitesi + özel admin panel

Müşteri:
Voice Klinik İşitme Merkezi

Teslim Süresi:
2 hafta

Mimari:
Tek işletme
Tek admin panel
2 şube bilgisi
SaaS değil

Stack:
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Supabase Auth
Supabase PostgreSQL
Supabase Storage
Vercel
Cloudflare

Ana Modüller:
Dashboard
Hasta / işlem takibi
Ödeme / kalan borç takibi
Gelir-gider takibi
Stok yönetimi
Kargo yönetimi
Hazır belgeler
Hatırlatıcılar
Raporlar
Excel içe aktarım
Kullanıcı yönetimi
Ayarlar
Kurumsal web sitesi
```
