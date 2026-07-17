import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { PageImageHero } from "@/components/site/page-image-hero";
import { Reveal } from "@/components/site/motion/reveal";
import { SiteIcon } from "@/components/site/site-icon";
import {
  buildBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/site-seo";
import {
  getTrustStaggerDelay,
  SPLIT_TEXT_DELAY_MS,
} from "@/lib/site-motion";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Kurumsal",
  description:
    "Voice Klinik İşitme Merkezi hakkında kurumsal bilgilendirme, hizmet yaklaşımı ve profesyonel uygulama anlayışı.",
  path: "/kurumsal",
  image: "/images/about-clinic.jpg",
});

const serviceValues = [
  "Kişiye özel değerlendirme",
  "Şeffaf bilgilendirme",
  "Profesyonel cihaz uygulaması",
  "Satış sonrası takip",
] as const;

const hasAboutImage = existsSync(join(process.cwd(), "public/images/about-clinic.jpg"));

export default function CorporatePage() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "Kurumsal", path: "/kurumsal" },
        ])}
      />
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Kurumsal" },
        ]}
        eyebrow="KURUMSAL"
        title="Doğru bilgilendirme ve profesyonel uygulama"
        imageSrc={hasAboutImage ? "/images/about-clinic.jpg" : "/images/hero-hearing-care..jpg"}
        imageAlt="Voice Klinik İşitme Merkezi kurumsal bilgilendirme"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal variant="slide-right" delay={SPLIT_TEXT_DELAY_MS}>
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B88A28]">
                Hakkımızda
              </p>
              <div
                aria-hidden="true"
                className="site-reveal-line mt-2 h-px w-10 bg-[#B88A28]/55"
              />

              <div className="mt-5 space-y-4 text-sm leading-8 text-[#102A43] sm:text-[0.9375rem]">
                    <p>
                      Voice Klinik İşitme Merkezi, işitme sağlığı alanında
                      danışanlarına doğru bilgilendirme, ihtiyaçlara uygun cihaz
                      seçimi, profesyonel uygulama ve satış sonrası destek sunmayı
                      amaçlar.
                    </p>
                    <p>
                      Her danışanın işitme ihtiyacı, yaşam tarzı ve beklentisi
                      farklıdır. Bu nedenle değerlendirme sürecinden cihaz
                      kullanımına kadar her adımda anlaşılır, takip edilebilir ve
                      kişiye özel bir yaklaşım benimsenir.
                    </p>
                    <p>
                      Voice Klinik, işitme cihazı danışmanlığı, cihaz uygulaması,
                      cihaz bakımı, teknik servis ve satış sonrası destek alanlarında
                      hizmet verir.
                    </p>
                  </div>
                </div>
              </Reveal>

          <ul className="mt-10 grid grid-cols-1 gap-y-5 border-t border-[#eadfca] pt-9 sm:grid-cols-2 sm:gap-x-6 lg:mt-12 lg:grid-cols-4 lg:gap-0 lg:pt-10">
              {serviceValues.map((title, index) => (
                <Reveal
                  key={title}
                  asChild
                  variant="fade-up-compact"
                  delay={getTrustStaggerDelay(index, { mobile: true })}
                >
                  <li
                    className={cn(
                      "flex items-start gap-2.5 lg:px-6",
                      index === 0 && "lg:pl-0",
                      index > 0 && "lg:border-l lg:border-[#eadfca]/65",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.5rem] h-px w-3 shrink-0 bg-[#B88A28]"
                    />
                    <span className="text-sm font-semibold leading-snug text-[#071225]">
                      {title}
                    </span>
                  </li>
                </Reveal>
              ))}
          </ul>

          <Reveal variant="fade-up-compact" delay={120}>
            <div className="mt-10 flex flex-col gap-3 border-t border-[#eadfca] pt-8 sm:flex-row sm:items-center lg:mt-8 lg:pt-8">
              <Link
                href="/iletisim#randevu-talebi"
                className="site-btn-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C49A3A] px-6 text-sm font-bold text-white shadow-md shadow-[#C49A3A]/20 hover:bg-[#B88A28] sm:h-11 sm:w-auto sm:rounded-lg sm:px-6"
              >
                <SiteIcon name="calendar" className="size-4" />
                Randevu Al
              </Link>
              <Link
                href="tel:+905322173158"
                className="site-btn-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#D4AF37]/35 bg-white px-6 text-sm font-bold text-[#071225] shadow-sm hover:border-[#B88A28] hover:text-[#B88A28] sm:h-11 sm:w-auto sm:rounded-lg sm:px-6"
              >
                <SiteIcon name="phone" className="size-4" />
                Bizi Arayın
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
