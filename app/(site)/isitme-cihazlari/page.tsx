import type { Metadata } from "next";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { ContactCta } from "@/components/site/contact-cta";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { PageImageHero } from "@/components/site/page-image-hero";
import { Reveal } from "@/components/site/motion/reveal";
import { sectionHeadingDelays } from "@/lib/site-motion";

export const metadata: Metadata = {
  title: "İşitme Cihazları | Voice Klinik İşitme Merkezi",
  description:
    "İşitme cihazı türleri, kullanım seçenekleri ve doğru cihaz seçimi hakkında Voice Klinik bilgilendirme sayfası.",
};

const deviceTypes = [
  {
    title: "Seçiminizi Renklendirin",
    description:
      "Farklı renk seçenekleriyle işitme cihazınızı kişisel tarzınıza ve kullanım tercihlerinize uygun şekilde seçebilirsiniz.",
    image: "/images/hearing-aid-models.jpg",
  },
  {
    title: "Kulak Arkası Cihazlar",
    description:
      "Güçlü performans, pratik kullanım ve geniş uygulama alanı sunan kulak arkası cihaz seçenekleri günlük kullanımda sık tercih edilir.",
    image: "/images/hearing-aid-behind-ear.jpg",
  },
  {
    title: "Kulak İçi Cihazlar",
    description:
      "Daha kompakt ve kişisel kullanım isteyen danışanlar için kulak içi cihaz seçenekleri değerlendirilebilir.",
    image: "/images/hearing-aid-in-ear.jpg",
  },
  {
    title: "Şarjlı İşitme Cihazları",
    description:
      "Pil değişimiyle uğraşmadan günlük kullanım kolaylığı sağlayan şarjlı cihazlar, pratik bir deneyim sunar.",
    image: "/images/hearing-aid-rechargeable.jpg",
  },
  {
    title: "Bluetooth Özellikli Cihazlar",
    description:
      "Telefon ve uyumlu cihazlarla bağlantı imkânı sunan modeller, iletişim ve kullanım deneyimini destekler.",
    image: "/images/hearing-aid-bluetooth.jpg",
  },
  {
    title: "Bebek ve Çocuklara Özel Renkli İşitme Cihazları",
    description:
      "Bebek ve çocukların kullanım ihtiyaçlarına uygun, renkli ve konforlu kulak arkası işitme cihazı seçenekleri uzman değerlendirmesiyle belirlenebilir.",
    image: "/images/hearing-aid-guide.jpg",
  },
];

function getPublicImageVersion(src: string): string | null {
  const filePath = join(process.cwd(), "public", src.replace(/^\//, ""));

  if (!existsSync(filePath)) {
    return null;
  }

  return String(statSync(filePath).mtimeMs);
}

export default function HearingDevicesPage() {
  return (
    <main className="bg-[#faf8f3] text-foreground">
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "İşitme Cihazları" },
        ]}
        eyebrow="İŞİTME CİHAZLARI"
        title="Yaşam tarzınıza uygun işitme cihazı seçenekleri"
        imageSrc="/images/blog-hearing-aid-selection.jpg"
        imageClassName="object-[center_35%]"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B88A28]">
                Cihaz Türleri
              </p>
            </Reveal>
            <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#071225] sm:text-[38px]">
                İhtiyacınıza uygun işitme cihazı seçenekleri
              </h2>
            </Reveal>
          </div>

          <MotionGrid className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {deviceTypes.map((device, index) => {
              const imageVersion = getPublicImageVersion(device.image);

              return (
                <MotionCard
                  key={device.title}
                  index={index}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] hover:border-[#D4AF37]/45 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]"
                >
                  <div className="relative h-52 overflow-hidden bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)]">
                    {imageVersion ? (
                      <MotionCardImage className="absolute inset-0">
                        <Image
                          key={imageVersion}
                          src={device.image}
                          alt={device.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </MotionCardImage>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-2xl font-bold leading-tight text-[#071225] transition-colors group-hover:text-[#B88A28]">
                      {device.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {device.description}
                    </p>
                  </div>
                </MotionCard>
              );
            })}
          </MotionGrid>
        </div>
      </section>

      <ContactCta
        title="Size uygun cihaz seçeneklerini birlikte inceleyelim."
        description="İşitme ihtiyaçlarınıza ve günlük yaşamınıza uygun cihaz türleri hakkında bilgi almak için Voice Klinik ekibiyle iletişime geçebilirsiniz."
      />
    </main>
  );
}
