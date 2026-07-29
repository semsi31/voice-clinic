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

const r2PublicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") || "";

function getR2RemotePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  if (!r2PublicBaseUrl) {
    return [];
  }

  try {
    const url = new URL(r2PublicBaseUrl);
    const protocol = url.protocol === "http:" ? "http" : "https";

    return [
      {
        protocol,
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Expose the same server env name to client bundles (header/logo, CSS backgrounds).
  env: {
    CLOUDFLARE_R2_PUBLIC_BASE_URL: r2PublicBaseUrl,
  },
  images: {
    remotePatterns: getR2RemotePatterns(),
  },
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
