import type { NextConfig } from "next";

const legacyServiceRedirects = [
  "isitme-testi-ve-degerlendirme",
  "isitme-cihazi-uygulamasi",
  "isitme-cihazi-satisi",
  "cihaz-bakim-ve-kontrol",
  "yedek-parca-ve-aksesuar",
  "satis-sonrasi-destek",
].map((slug) => ({
  source: `/hizmetlerimiz/${slug}`,
  destination: "/hizmetlerimiz",
  permanent: true,
}));

const legacyDeviceRedirects = [
  "modeller",
  "kulak-arkasi",
  "kulak-ici",
  "sarjli-cihazlar",
  "bluetooth-cihazlar",
  "cihaz-secim-rehberi",
].map((slug) => ({
  source: `/isitme-cihazlari/${slug}`,
  destination: "/isitme-cihazlari",
  permanent: true,
}));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/kurumsal/hakkimizda",
        destination: "/kurumsal",
        permanent: true,
      },
      ...legacyServiceRedirects,
      ...legacyDeviceRedirects,
    ];
  },
};

export default nextConfig;
