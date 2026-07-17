import Link from "next/link";
import type { ComponentProps } from "react";

type PanelLinkProps = Omit<ComponentProps<typeof Link>, "prefetch"> & {
  /** Panel routes default to no prefetch to avoid production GET storms. */
  prefetch?: boolean;
};

/**
 * Panel-scoped Link with prefetch disabled by default.
 * Production Next.js prefetches viewport Links; dense tables/cards must not.
 */
export function PanelLink({ prefetch = false, ...props }: PanelLinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}
