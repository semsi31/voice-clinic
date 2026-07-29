import type { Metadata } from "next";
import { cdnImageSrc } from "@/lib/cdn-image";

export const SITE_NAME = "Voice Klinik İşitme Merkezi";
export const SITE_NAME_SHORT = "Voice Klinik";

export const SITE_DESCRIPTION =
  "Voice Klinik İşitme Merkezi; işitme testi, cihaz uygulaması, satış ve teknik servis hizmetleriyle Antakya / Hatay’da yanınızda.";

export const SITE_BUSINESS = {
  name: SITE_NAME,
  legalName: SITE_NAME,
  telephoneDisplay: "0 532 217 31 58",
  telephoneE164: "+905322173158",
  telephoneSchema: "+90 532 217 31 58",
  email: "gdeniz5831@gmail.com",
  streetAddress:
    "Akasya Mh. 186. Sk. A Blok No:4 İç Kapı 6, Akıllı Plaza, Adliye yanı Kuponpark üzeri",
  addressLocality: "Antakya",
  addressRegion: "Hatay",
  addressCountry: "TR",
  openingHoursLabel: "Pazartesi - Cumartesi 09:00 - 18:00",
  openingDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const,
  opens: "09:00",
  closes: "18:00",
  sameAs: [
    "https://www.instagram.com/voiceclinicisitmemerkezi/",
    "https://wa.me/905322173158",
  ],
} as const;

export const DEFAULT_OG_IMAGE = "/images/hero-hearing-care..jpg";
export const SITE_LOGO = "/images/voice-logo.png";

const LOCALHOST_PATTERN = /localhost|127\.0\.0\.1/i;

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string) {
  return LOCALHOST_PATTERN.test(url);
}

/** Accept only absolute http(s) URLs; reject env-name paste mistakes etc. */
function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Production metadata, sitemap and canonicals must never emit localhost.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to Vercel production host when needed.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured && isValidHttpUrl(configured)) {
    const normalized = stripTrailingSlash(configured);
    if (!isLocalhostUrl(normalized)) {
      return normalized;
    }

    if (process.env.NODE_ENV !== "production") {
      return normalized;
    }
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (vercelHost && !isLocalhostUrl(vercelHost)) {
    const host = stripTrailingSlash(vercelHost.replace(/^https?:\/\//, ""));
    const candidate = `https://${host}`;
    if (isValidHttpUrl(candidate)) {
      return candidate;
    }
  }

  // Local development (and local production builds without a public URL).
  // Deployed environments should set NEXT_PUBLIC_SITE_URL so sitemap/canonical
  // never ship with localhost.
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") {
    return base;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute image URL for OG/JSON-LD — prefers R2 CDN when configured. */
export function absoluteImageUrl(path = DEFAULT_OG_IMAGE): string {
  const resolved = cdnImageSrc(path);
  if (/^https?:\/\//i.test(resolved)) {
    return resolved;
  }

  return absoluteUrl(resolved);
}

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** When true, title is used as-is (no `%s | Voice Klinik` template). */
  absoluteTitle?: boolean;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteImageUrl(image);
  const ogTitle = absoluteTitle ? title : `${title} | ${SITE_NAME_SHORT}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "tr_TR",
      type,
      images: [
        {
          url: ogImage,
          alt: ogTitle,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

const TURKISH_MONTHS: Record<string, string> = {
  Ocak: "01",
  Şubat: "02",
  Mart: "03",
  Nisan: "04",
  Mayıs: "05",
  Haziran: "06",
  Temmuz: "07",
  Ağustos: "08",
  Eylül: "09",
  Ekim: "10",
  Kasım: "11",
  Aralık: "12",
};

/** Converts display dates like "12 Haziran 2026" to ISO `YYYY-MM-DD` when possible. */
export function parseTurkishDisplayDate(date: string): string | undefined {
  const match = date.trim().match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})$/);
  if (!match) {
    return undefined;
  }

  const [, dayRaw, monthName, year] = match;
  const month = TURKISH_MONTHS[monthName];
  if (!month) {
    return undefined;
  }

  const day = dayRaw.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type BreadcrumbJsonLdItem = {
  name: string;
  path?: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? {
            item: absoluteUrl(item.path),
          }
        : {}),
    })),
  };
}

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${absoluteUrl("/")}/#localbusiness`,
    name: SITE_BUSINESS.name,
    legalName: SITE_BUSINESS.legalName,
    url: absoluteUrl("/"),
    telephone: SITE_BUSINESS.telephoneSchema,
    email: SITE_BUSINESS.email,
    image: absoluteImageUrl(DEFAULT_OG_IMAGE),
    logo: absoluteImageUrl(SITE_LOGO),
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_BUSINESS.streetAddress,
      addressLocality: SITE_BUSINESS.addressLocality,
      addressRegion: SITE_BUSINESS.addressRegion,
      addressCountry: SITE_BUSINESS.addressCountry,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...SITE_BUSINESS.openingDays],
      opens: SITE_BUSINESS.opens,
      closes: SITE_BUSINESS.closes,
    },
    sameAs: [...SITE_BUSINESS.sameAs],
  };
}

export function buildBlogPostingJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    image: [absoluteImageUrl(input.image)],
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteImageUrl(SITE_LOGO),
      },
    },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified
      ? { dateModified: input.dateModified }
      : input.datePublished
        ? { dateModified: input.datePublished }
        : {}),
    inLanguage: "tr-TR",
  };
}
