import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/** Pass-through wrapper — page enter animation disabled for stability. */
export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}
