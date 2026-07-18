import { ContactCta } from "@/components/site/contact-cta";
import {
  DeviceCardsCarousel,
  type DeviceCarouselItem,
} from "@/components/site/device-cards-carousel";
import { JsonLd } from "@/components/site/json-ld";
import { PageImageHero } from "@/components/site/page-image-hero";
import { Reveal } from "@/components/site/motion/reveal";
import { getVersionedPublicImageSrc } from "@/lib/public-image";
import {
  buildBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/site-seo";
import { sectionHeadingDelays } from "@/lib/site-motion";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const metadata = createPageMetadata({
  title: "İşitme Cihazları",
  description:
    "İşitme cihazı türleri, kullanım seçenekleri ve doğru cihaz seçimi hakkında Voice Klinik bilgilendirme sayfası.",
  path: "/isitme-cihazlari",
  image: "/images/blog-hearing-aid-selection.jpg",
});

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

function resolveDeviceImage(src: string): string | null {
  const filePath = join(process.cwd(), "public", src.replace(/^\//, ""));
  if (!existsSync(filePath)) {
    return null;
  }

  return getVersionedPublicImageSrc(src);
}

export default function HearingDevicesPage() {
  const carouselItems: DeviceCarouselItem[] = deviceTypes.map((device) => ({
    ...device,
    imageSrc: resolveDeviceImage(device.image),
  }));

  return (
    <main className="bg-[#faf8f3] text-foreground">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "İşitme Cihazları", path: "/isitme-cihazlari" },
        ])}
      />
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "İşitme Cihazları" },
        ]}
        eyebrow="İŞİTME CİHAZLARI"
        title="Yaşam tarzınıza uygun işitme cihazı seçenekleri"
        imageSrc="/images/blog-hearing-aid-selection.jpg"
        imageClassName="object-[center_35%]"
        imageAlt="Voice Klinik işitme cihazı seçenekleri"
      />

      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex max-w-3xl flex-col gap-0 sm:mb-6">
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
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <DeviceCardsCarousel items={carouselItems} />
        </div>
      </section>

      <ContactCta
        title="Size uygun cihaz seçeneklerini birlikte inceleyelim."
        description="İşitme ihtiyaçlarınıza ve günlük yaşamınıza uygun cihaz türleri hakkında bilgi almak için Voice Klinik ekibiyle iletişime geçebilirsiniz."
      />
    </main>
  );
}
