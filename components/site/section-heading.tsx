import { Reveal } from "@/components/site/motion/reveal";
import { sectionHeadingDelays } from "@/lib/site-motion";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold-dark)]">
            {eyebrow}
          </p>
        </Reveal>
      ) : null}
      <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.description}>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
