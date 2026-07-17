import { HomeHeroSlider } from "@/components/site/home-hero-slider";
import { JsonLd } from "@/components/site/json-ld";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { Reveal } from "@/components/site/motion/reveal";
import { StatsSection } from "@/components/site/stats-section";
import { IconBadge, SiteIcon, type SiteIconName } from "@/components/site/site-icon";
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

const trustItems = [
  {
    title: "Uzman Kadro",
    description: "Alanında deneyimli uzmanlarla güvenilir değerlendirme.",
    icon: "users",
  },
  {
    title: "Kaliteli Hizmet",
    description: "Kişiye özel çözümler ve modern teknoloji.",
    icon: "award",
  },
  {
    title: "Müşteri Memnuniyeti",
    description: "Her zaman yanınızda, her adımda destek.",
    icon: "heart",
  },
] satisfies { title: string; description: string; icon: SiteIconName }[];

const serviceCards = [
  {
    title: "İşitme Testi ve Değerlendirme",
    description: "İşitme durumunuzu profesyonel testlerle değerlendiriyor, doğru çözüm yolunu birlikte planlıyoruz.",
    image: "/images/service-hearing-test.jpg",
  },
  {
    title: "İşitme Cihazı Uygulaması",
    description: "Kişiye özel cihaz uygulaması, ayarlama ve kullanım sürecinde anlaşılır destek sunuyoruz.",
    image: "/images/service-hearing-aid-fitting.jpg",
  },
  {
    title: "İşitme Cihazı Satışı",
    description: "İhtiyacınıza ve yaşam tarzınıza uygun modern işitme cihazı seçeneklerini sunuyoruz.",
    image: "/images/service-hearing-aid-sales.jpg",
  },
] satisfies {
  title: string;
  description: string;
  image: string;
}[];

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

      <section className="relative z-10 mt-0 px-4 pb-4 sm:-mt-9 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-3">
            {trustItems.map((item, index) => (
              <Reveal
                key={item.title}
                asChild
                variant="fade-up-compact"
                delay={getTrustStaggerDelay(index)}
              >
                <div className="flex items-center gap-3 rounded-2xl border border-[#e7d6ad] bg-white/98 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur">
                  <IconBadge
                    name={item.icon}
                    variant="light"
                    size="sm"
                    className="size-10 rounded-xl border-[#D4AF37]/45 bg-[#071225] text-[#D4AF37] shadow-md shadow-[#071225]/15"
                  />
                  <div>
                    <p className="text-sm font-bold text-primary">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
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
                  className="group overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] hover:border-[#D4AF37]/45 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]"
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

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="relative mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[1.75rem] border border-[#D4AF37]/20 bg-primary p-6 text-white shadow-2xl shadow-slate-950/10 sm:p-7 md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(212,175,55,0.16),transparent_28%),linear-gradient(135deg,#071225_0%,#102A43_62%,#071225_100%)]" />
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

            <Reveal variant="slide-right" delay={SPLIT_TEXT_DELAY_MS} className="relative mt-2 lg:mt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                {appointmentBenefits.map((item, index) => (
                  <Reveal
                    key={item.title}
                    asChild
                    variant="fade-up-card"
                    delay={sectionHeadingDelays.content + getTrustStaggerDelay(index)}
                  >
                    <div className="rounded-2xl border border-white/12 bg-white/8 p-5 shadow-lg shadow-black/5 backdrop-blur">
                      <IconBadge
                        name={item.icon}
                        variant="gold"
                        size="sm"
                        className="mb-4 bg-[#D4AF37] text-primary"
                      />
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/68">
                        {item.description}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

      <StatsSection stats={stats} />
    </main>
  );
}
