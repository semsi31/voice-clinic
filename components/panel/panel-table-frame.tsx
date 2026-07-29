import type { ReactNode } from "react";
import {
  panelTableDesktopClassName,
  panelTableScrollClassName,
  panelTableZoomInnerClassName,
} from "@/components/panel/panel-styles";
import { cn } from "@/lib/utils";

type PanelTableFrameProps = {
  children: ReactNode;
  /** When false, skip `hidden lg:block` (caller already gated). Default true. */
  desktopOnly?: boolean;
  className?: string;
};

/**
 * Table chrome: always fits width — no horizontal scroll.
 * Laptop density via CSS zoom on the table only.
 */
export function PanelTableFrame({
  children,
  desktopOnly = true,
  className,
}: Readonly<PanelTableFrameProps>) {
  return (
    <div
      className={cn(
        panelTableScrollClassName,
        desktopOnly && panelTableDesktopClassName,
        className,
      )}
    >
      <div className={panelTableZoomInnerClassName}>{children}</div>
    </div>
  );
}
