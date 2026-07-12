"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MotionGridProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

export function MotionGrid({
  children,
  className,
  as: Component = "div",
}: MotionGridProps) {
  return <Component className={cn(className)}>{children}</Component>;
}
