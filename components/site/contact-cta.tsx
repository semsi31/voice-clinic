import Link from "next/link";
import { Reveal } from "@/components/site/motion/reveal";
import { cn } from "@/lib/utils";
import { SiteIcon } from "@/components/site/site-icon";
import { cdnImageSrc } from "@/lib/cdn-image";

export type ContactCtaProps = {
  title: string;
  description: string;
  appointmentHref?: string;
  appointmentLabel?: string;
  phoneHref?: string;
  phoneLabel?: string;
  /** Full-bleed background (CDN path `/images/...` or absolute URL). */
  imageSrc?: string;
  className?: string;
};

export function ContactCta({
  title,
  description,
  appointmentHref = "/iletisim#randevu-talebi",
  appointmentLabel = "Randevu Al",
  phoneHref = "/iletisim",
  phoneLabel = "Bizi Arayın",
  imageSrc = "/images/cta-randevu.jpg",
  className,
}: ContactCtaProps) {
  const resolvedImageSrc = cdnImageSrc(imageSrc);
  return (
    <section className={cn("bg-[#faf8f3] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12", className)}>
      <Reveal variant="fade-up" duration={700} className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#eadfca] shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src={resolvedImageSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#1e4a7a]/55" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(30,74,122,0.86)_0%,rgba(47,107,168,0.68)_48%,rgba(212,175,55,0.28)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(212,175,55,0.18),transparent_40%)]" />
          </div>

          <div className="relative grid gap-8 px-5 py-10 text-white sm:px-8 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold)]">
                Randevu
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-[38px]">
                {title}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/78">{description}</p>
            </div>

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
          </div>
        </div>
      </Reveal>
    </section>
  );
}
