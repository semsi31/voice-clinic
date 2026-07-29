/**
 * Site images are served from Cloudflare R2 public CDN.
 * Prefer `@/lib/cdn-image` (`cdnImageSrc`).
 *
 * @deprecated Use cdnImageSrc from `@/lib/cdn-image`.
 */
export { cdnImageSrc, getR2PublicBaseUrl, getVersionedPublicImageSrc } from "@/lib/cdn-image";
