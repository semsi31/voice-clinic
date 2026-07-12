import Link from "next/link";
import { Reveal } from "@/components/site/motion/reveal";
import { cn } from "@/lib/utils";
import { sectionHeadingDelays } from "@/lib/site-motion";
import { SiteIcon } from "@/components/site/site-icon";

export type ContactCtaProps = {
  title: string;
  description: string;
  appointmentHref?: string;
  appointmentLabel?: string;
  phoneHref?: string;
  phoneLabel?: string;
  className?: string;
};

export function ContactCta({
  title,
  description,
  appointmentHref = "/iletisim#randevu-talebi",
  appointmentLabel = "Randevu Al",
  phoneHref = "/iletisim",
  phoneLabel = "Bizi Arayın",
  className,
}: ContactCtaProps) {
  return (
    <section className={cn("bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-12", className)}>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#071225] p-6 text-white shadow-2xl shadow-slate-950/12 sm:p-7 md:p-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(212,175,55,0.22),transparent_26%),linear-gradient(135deg,#071225_0%,#102A43_62%,#071225_100%)]" />
          <div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-[color:var(--site-gold)]/15 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold)]">
                  Randevu
                </p>
              </Reveal>
              <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
                <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-[38px]">
                  {title}
                </h2>
              </Reveal>
              <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.description}>
                <p className="mt-3 text-base leading-7 text-white/72">
                  {description}
                </p>
              </Reveal>
            </div>

            <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.content}>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href={appointmentHref}
                  className="site-btn-motion inline-flex items-center justify-center gap-2 rounded-md bg-[#C49A3A] px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A28]"
                >
                  <SiteIcon name="calendar" className="size-4" />
                  {appointmentLabel}
                </Link>
                <Link
                  href={phoneHref}
                  className="site-btn-motion site-btn-solid-light-on-dark inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-center text-sm font-semibold"
                >
                  <SiteIcon name="phone" className="size-4" />
                  {phoneLabel}
                </Link>
              </div>
            </Reveal>
          </div>
      </div>
    </section>
  );
}
