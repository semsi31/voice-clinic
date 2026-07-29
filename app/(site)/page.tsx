import { HomeHeroSlider } from "@/components/site/home-hero-slider";
import { JsonLd } from "@/components/site/json-ld";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { Reveal } from "@/components/site/motion/reveal";
import { StatsSection } from "@/components/site/stats-section";
import { IconBadge, SiteIcon, type SiteIconName } from "@/components/site/site-icon";
import { cdnImageSrc } from "@/lib/cdn-image";
import {
  buildLocalBusinessJsonLd,
  createPageMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/site-seo";
import {
  getTrustStaggerDelay,
  sectionHeadingDelays,
  SPLIT_TEXT_DELAY_MS,
} from "@/lib/site-motion";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

const serviceCards = [
  {
    title: "İşitme Testi ve Değerlendirme",
    description: "İşitme durumunuzu profesyonel testlerle değerlendiriyor, doğru çözüm yolunu birlikte planlıyoruz.",
    image: cdnImageSrc("/images/service-hearing-test.jpg"),
  },
  {
    title: "İşitme Cihazı Uygulaması",
    description: "Kişiye özel cihaz uygulaması, ayarlama ve kullanım sürecinde anlaşılır destek sunuyoruz.",
    image: cdnImageSrc("/images/service-hearing-aid-fitting.jpg"),
  },
  {
    title: "İşitme Cihazı Satışı",
    description: "İhtiyacınıza ve yaşam tarzınıza uygun modern işitme cihazı seçeneklerini sunuyoruz.",
    image: cdnImageSrc("/images/service-hearing-aid-sales.jpg"),
  },
] satisfies {
  title: string;
  description: string;
  image: string;
}[];

const CTA_RANDEVU_IMAGE = cdnImageSrc("/images/cta-randevu.jpg");

const reasons = [
  "Uzman ve deneyimli kadro",
  "Kişiye özel çözümler",
  "Modern teknoloji ve ekipman",
  "Güvenilir ve kaliteli hizmet anlayışı",
  "Satış sonrası kesintisiz destek",
] as const;

const appointmentBenefits = [
  {
    title: "Hızlı Randevu",
    description: "Kolay iletişim ve hızlı planlama.",
    icon: "calendar",
  },
  {
    title: "Uzman Görüşü",
    description: "Alanında deneyimli ekip desteği.",
    icon: "users",
  },
  {
    title: "Size Özel Çözümler",
    description: "İhtiyacınıza uygun cihaz ve destek önerileri.",
    icon: "shield-check",
  },
  {
    title: "Satış Sonrası Takip",
    description: "Kullanım sürecinde sürdürülebilir destek.",
    icon: "headset",
  },
] satisfies { title: string; description: string; icon: SiteIconName }[];

const stats = [
  { end: 1000, suffix: "+", label: "Mutlu Danışan", icon: "users" },
  { end: 15, suffix: "+", label: "Yıllık Deneyim", icon: "award" },
  { end: 2, label: "Şube", icon: "building" },
  { end: 7, suffix: "/24", label: "Destek", icon: "clock" },
] satisfies { end: number; suffix?: string; label: string; icon: SiteIconName }[];

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd data={buildLocalBusinessJsonLd()} />
      <HomeHeroSlider />

      <section className="px-4 py-10 sm:px-6 md:pt-14 md:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold-dark)]">
                    HİZMETLERİMİZ
                  </p>
                </Reveal>
                <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
                  <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-primary md:text-[38px]">
                    İşitme Sağlığınız İçin Kapsamlı Çözümler
                  </h2>
                </Reveal>
              </div>
              <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.action}>
                <Link
                  href="/hizmetlerimiz"
                  className="site-btn-motion site-link-arrow-motion inline-flex h-10 items-center justify-center gap-2 self-start rounded-md border border-[#d9c699] bg-white px-4 text-xs font-bold uppercase tracking-[0.04em] text-primary shadow-sm hover:border-[#D4AF37] hover:bg-[#fffaf0] hover:text-[#B88A28] sm:self-center"
                >
                  Tüm Hizmetler
                  <SiteIcon name="arrow-right" className="site-link-arrow size-4" />
                </Link>
              </Reveal>
            </div>

            <MotionGrid className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCards.map((card, index) => (
                <MotionCard
                  key={card.title}
                  index={index}
                  className="group min-w-0 w-full overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] hover:border-[#D4AF37]/45 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]"
                >
                  <div
                    className="relative min-h-[210px] overflow-hidden bg-[#f6eddf]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 18% 20%, rgba(212,175,55,0.28), transparent 30%), linear-gradient(135deg, #fffaf0 0%, #ead8b8 52%, #102A43 100%)",
                    }}
                  >
                    <MotionCardImage
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${card.image}')`,
                      }}
                    />
                  </div>

                  <div className="flex min-h-[180px] flex-col p-6">
                    <h3 className="font-serif text-2xl font-bold leading-tight text-primary">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </MotionCard>
              ))}
            </MotionGrid>
          </div>
        </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={CTA_RANDEVU_IMAGE}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#1e4a7a]/58" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(30,74,122,0.88)_0%,rgba(47,107,168,0.70)_48%,rgba(212,175,55,0.26)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(212,175,55,0.16),transparent_40%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 text-white sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:px-8 lg:py-24">
          <Reveal variant="slide-left" delay={sectionHeadingDelays.eyebrow} className="relative">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--site-gold)]">
                NEDEN BİZ?
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight md:text-[38px]">
                Neden Voice İşitme Merkezi?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74">
                İşitme sağlığı sürecinizde doğru yönlendirme, kişiye özel çözüm ve
                satış sonrası destek anlayışıyla yanınızdayız.
              </p>
              <ul className="mt-6 space-y-3">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-3 text-sm font-semibold">
                    <SiteIcon name="check-circle" className="size-4 shrink-0 text-[#D4AF37]" />
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3 pb-2 sm:flex-row sm:pb-0">
                <Link
                  href="/iletisim#randevu-talebi"
                  className="site-btn-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C49A3A] px-5 text-sm font-bold text-white shadow-lg shadow-[#D4AF37]/20 hover:bg-[#B88A28] sm:h-11 sm:w-auto sm:rounded-md"
                >
                  <SiteIcon name="calendar" className="size-4" />
                  Randevu Al
                </Link>
                <Link
                  href="/iletisim"
                  className="site-btn-motion site-btn-outline-on-dark inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-5 text-sm font-bold sm:h-11 sm:w-auto sm:rounded-md"
                >
                  <SiteIcon name="phone" className="size-4" />
                  Bizi Arayın
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="relative hidden grid-cols-2 gap-3 md:grid">
            {appointmentBenefits.map((item, index) => (
              <Reveal
                key={item.title}
                asChild
                variant="fade-up-card"
                delay={SPLIT_TEXT_DELAY_MS + getTrustStaggerDelay(index)}
              >
                <div className="rounded-2xl border border-white/12 bg-white/8 p-5 shadow-lg shadow-black/5 backdrop-blur">
                  <IconBadge
                    name={item.icon}
                    variant="gold"
                    size="sm"
                    className="mb-4 inline-flex bg-[#D4AF37] text-primary"
                  />
                  <h3 className="text-base font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <StatsSection stats={stats} />
    </main>
  );
}
