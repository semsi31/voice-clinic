import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

/** Appends `?v=mtime` so replaced public assets bust browser/CDN cache. */
export function getVersionedPublicImageSrc(src: string): string {
  const imagePath = join(process.cwd(), "public", src.replace(/^\//, ""));

  if (!existsSync(imagePath)) {
    return src;
  }

  return `${src}?v=${Math.round(statSync(imagePath).mtimeMs)}`;
}
