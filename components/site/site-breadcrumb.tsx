import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type SiteBreadcrumbItem = {
  label: string;
  href?: string;
};

export const siteBreadcrumbNavClassName =
  "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground";

export const siteBreadcrumbEyebrowOffsetClassName = "mt-4";

type SiteBreadcrumbProps = {
  items: SiteBreadcrumbItem[];
  className?: string;
};

export function SiteBreadcrumb({ items, className }: SiteBreadcrumbProps) {
  return (
    <nav
      aria-label="Sayfa yolu"
      className={cn(siteBreadcrumbNavClassName, className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="site-text-link inline-flex min-h-11 items-center py-1 hover:text-[#B88A28]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-[#B88A28]" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
