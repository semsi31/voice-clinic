/**
 * Site images are served from Cloudflare R2 public CDN.
 * Base URL comes from CLOUDFLARE_R2_PUBLIC_BASE_URL (no trailing slash).
 */

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

/** Public CDN origin, e.g. https://cdn.example.com or https://pub-xxx.r2.dev */
export function getR2PublicBaseUrl(): string {
  const configured = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim();
  if (!configured) {
    return "";
  }

  return stripTrailingSlash(configured);
}

/**
 * Resolve a site image path to a CDN absolute URL.
 * - `/images/foo.jpg` → `${CLOUDFLARE_R2_PUBLIC_BASE_URL}/images/foo.jpg`
 * - Absolute http(s) URLs are returned unchanged.
 * - When the CDN base is unset (local/misconfig), returns the local path so
 *   `public/images` can still serve during setup.
 */
export function cdnImageSrc(src: string): string {
  if (!src) {
    return src;
  }

  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  const path = src.startsWith("/") ? src : `/${src}`;
  const base = getR2PublicBaseUrl();

  if (!base) {
    return path;
  }

  return `${base}${path}`;
}

/** @deprecated Prefer cdnImageSrc — local mtime cache-busting is unused on R2. */
export function getVersionedPublicImageSrc(src: string): string {
  return cdnImageSrc(src);
}
