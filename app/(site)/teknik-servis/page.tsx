import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { ContactCta } from "@/components/site/contact-cta";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { PageImageHero } from "@/components/site/page-image-hero";
import { Reveal } from "@/components/site/motion/reveal";
import {
  getProcessStaggerDelay,
  sectionHeadingDelays,
} from "@/lib/site-motion";

export const metadata: Metadata = {
  title: "Teknik Servis | Voice Klinik İşitme Merkezi",
  description:
    "İşitme cihazı bakım, kontrol, arıza tespit ve teknik servis süreçleri için Voice Klinik destek hizmetleri.",
};

const serviceItems = [
  {
    title: "İşitme Cihazı Tamiri",
    description:
      "Cihazınızda yaşanan kullanım sorunlarını değerlendiriyor, gerekli servis yönlendirmesi ve takip süreci için destek sağlıyoruz.",
    image: "/images/service-repair.jpg",
  },
  {
    title: "Cihaz Bakımı",
    description:
      "Düzenli temizlik, kontrol ve bakım adımlarıyla cihazınızın daha verimli ve konforlu çalışmasına yardımcı oluyoruz.",
    image: "/images/service-device-care.jpg",
  },
  {
    title: "Arıza Tespit",
    description:
      "Ses azalması, bağlantı problemi veya kullanım sırasında fark edilen sorunlar için ön değerlendirme süreci yürütüyoruz.",
    image: "/images/service-fault-detection.jpg",
  },
  {
    title: "Garanti ve Servis Süreci",
    description:
      "Garanti kapsamı, servis yönlendirmesi, teslim ve takip süreçlerinde kullanıcıya anlaşılır bilgilendirme sunuyoruz.",
    image: "/images/service-warranty.jpg",
  },
];

const serviceSteps = [
  "Cihaz teslim alınır",
  "Ön değerlendirme yapılır",
  "Bakım veya servis yönlendirmesi planlanır",
  "Kullanıcıya süreç hakkında bilgi verilir",
  "Cihaz teslim ve takip süreci tamamlanır",
];

function publicImageExists(src: string) {
  return existsSync(join(process.cwd(), "public", src.replace(/^\//, "")));
}

export default function TechnicalServicePage() {
  return (
    <main className="bg-[#faf8f3] text-foreground">
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Teknik Servis" },
        ]}
        eyebrow="TEKNİK SERVİS"
        title="İşitme cihazınız için güvenilir teknik destek"
        imageSrc="/images/blog-hearing-aid-care.jpg"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <MotionGrid className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {serviceItems.map((service, index) => {
              const hasImage = publicImageExists(service.image);

              return (
                <MotionCard
                  key={service.title}
                  index={index}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] hover:border-[#D4AF37]/45 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]"
                >
                  <div className="relative h-48 overflow-hidden bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)]">
                    {hasImage ? (
                      <MotionCardImage className="absolute inset-0">
                        <Image
                          src={service.image}
                          alt={service.title}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </MotionCardImage>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-2xl font-bold leading-tight text-[#071225] transition-colors group-hover:text-[#B88A28]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {service.description}
                    </p>
                  </div>
                </MotionCard>
              );
            })}
          </MotionGrid>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl border border-[#eadfca] bg-white/82 p-6 shadow-lg shadow-slate-950/5 md:p-8">
            <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#B88A28]">
                  Servis Akışı
                </p>
              </div>
            </Reveal>
            <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#071225]">
                Teknik servis süreci nasıl ilerler?
              </h2>
            </Reveal>

            <ol className="mt-7 grid gap-4 md:grid-cols-5">
              {serviceSteps.map((step, index) => (
                <Reveal
                  key={step}
                  asChild
                  variant="fade-up-card"
                  delay={sectionHeadingDelays.content + getProcessStaggerDelay(index)}
                >
                  <li className="relative rounded-2xl border border-[#eadfca] bg-[#fffdf8] p-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-[#C49A3A] text-sm font-bold text-white shadow-lg shadow-[#D4AF37]/20">
                      {index + 1}
                    </span>
                    <p className="mt-4 text-sm font-semibold leading-6 text-[#071225]">
                      {step}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

      <ContactCta
        title="Cihazınız için en uygun bakım ve servis adımını birlikte planlayalım."
        description="İşitme cihazınızın durumu hakkında bilgi almak ve teknik servis sürecini başlatmak için Voice Klinik ekibiyle iletişime geçebilirsiniz."
      />
    </main>
  );
}
