import type { ReactNode } from "react";
import { Reveal } from "@/components/site/motion/reveal";
import { getGridCardDelay, sectionHeadingDelays } from "@/lib/site-motion";
import { cn } from "@/lib/utils";
import { IconBadge, type SiteIconName } from "@/components/site/site-icon";

export type ContentSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  items?: string[];
  twoColumns?: boolean;
  children?: ReactNode;
  className?: string;
};

export function ContentSection({
  eyebrow,
  title,
  description,
  items,
  twoColumns = false,
  children,
  className,
}: ContentSectionProps) {
  const hasSideContent = Boolean(items?.length || children);
  const itemIcons: SiteIconName[] = [
    "shield-check",
    "clipboard-check",
    "check-circle",
    "headset",
  ];

  return (
    <section className={cn("bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-12", className)}>
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-[1.75rem] border border-[#eadfca] bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-7 lg:p-8",
            twoColumns && hasSideContent
              ? "grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"
              : "space-y-8",
          )}
        >
          <div className="max-w-3xl">
            {eyebrow ? (
              <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold-dark)]">
                  {eyebrow}
                </p>
              </Reveal>
            ) : null}
            <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-primary sm:text-[38px]">
                {title}
              </h2>
            </Reveal>
            <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.description}>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {description}
              </p>
            </Reveal>
          </div>

          {hasSideContent ? (
            <div className="space-y-5">
              {items?.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {items.map((item, index) => (
                    <Reveal
                      key={item}
                      asChild
                      variant="fade-up-card"
                      delay={sectionHeadingDelays.content + getGridCardDelay(index)}
                    >
                      <li className="rounded-2xl border border-[#eadfca] bg-[#fffdf8] p-4 text-sm font-semibold leading-6 text-primary shadow-sm shadow-slate-950/5">
                        <IconBadge
                          name={itemIcons[index % itemIcons.length]}
                          variant="light"
                          size="sm"
                          className="mb-4"
                        />
                        <span>{item}</span>
                      </li>
                    </Reveal>
                  ))}
                </ul>
              ) : null}
              {children}
            </div>
          ) : null}
        </div>
      </section>
  );
}
