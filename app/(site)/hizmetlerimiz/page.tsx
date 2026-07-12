import type { Metadata } from "next";
import { ContactCta } from "@/components/site/contact-cta";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { Reveal } from "@/components/site/motion/reveal";
import { PageImageHero } from "@/components/site/page-image-hero";
import { sectionHeadingDelays } from "@/lib/site-motion";

export const metadata: Metadata = {
  title: "Hizmetlerimiz | Voice Klinik İşitme Merkezi",
  description:
    "Voice Klinik işitme testi, cihaz uygulaması, satış, bakım, aksesuar ve satış sonrası destek hizmetleri.",
};

const services = [
  {
    title: "İşitme Testi ve Değerlendirme",
    description: "İşitme durumunuzu profesyonel değerlendirme süreciyle analiz ediyor, günlük yaşam ihtiyaçlarınızı dikkate alarak size en uygun yönlendirmeyi planlıyoruz.",
    image: "/images/service-hearing-test.jpg",
  },
  {
    title: "İşitme Cihazı Uygulaması",
    description: "İhtiyacınıza uygun işitme cihazının seçimi, uygulanması ve kişisel ayarlarının yapılması sürecinde uzman desteği sunuyoruz.",
    image: "/images/service-hearing-aid-fitting.jpg",
  },
  {
    title: "İşitme Cihazı Satışı",
    description: "Farklı kullanım beklentilerine ve işitme ihtiyaçlarına uygun modern işitme cihazı seçenekleri hakkında anlaşılır bilgilendirme sağlıyoruz.",
    image: "/images/service-hearing-aid-sales.jpg",
  },
  {
    title: "Cihaz Bakım ve Kontrol",
    description: "İşitme cihazınızın performansını korumak için düzenli bakım, temizlik ve kontrol süreçlerinde profesyonel destek veriyoruz.",
    image: "/images/service-device-care.jpg",
  },
  {
    title: "Yedek Parça ve Aksesuar",
    description: "Cihaz kullanım konforunu artıran aksesuarlar, pil, kulak kalıbı ve ihtiyaç duyulan yedek parça çözümleriyle yanınızda oluyoruz.",
    image: "/images/service-accessories.jpg",
  },
  {
    title: "Satış Sonrası Destek",
    description: "Cihaz kullanım sürecinde karşılaşabileceğiniz sorular, ayarlama ihtiyaçları ve takip süreçleri için satış sonrasında da destek sunuyoruz.",
    image: "/images/service-after-sales.jpg",
  },
];

export default function ServicesPage() {
  return (
    <main className="bg-background text-foreground">
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Hizmetlerimiz" },
        ]}
        eyebrow="TÜM HİZMETLER"
        title="İşitme sağlığınız için profesyonel hizmet alanları"
        imageSrc="/images/about-clinic.jpg"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B88A28]">
                Hizmet Alanları
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-primary sm:text-[38px]">
                İşitme sağlığı sürecinizin her adımında yanınızdayız
              </h2>
            </div>
          </Reveal>

          <MotionGrid className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <MotionCard
                key={service.title}
                index={index}
                className="group overflow-hidden rounded-[1.75rem] border border-[#eadfca] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] hover:border-[#D4AF37]/45 hover:shadow-[0_18px_44px_rgba(15,23,42,0.09)]"
              >
                <div
                  className="relative min-h-[210px] overflow-hidden bg-[#f6eddf]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 18% 20%, rgba(212,175,55,0.24), transparent 30%), linear-gradient(135deg, #fffaf0 0%, #ead8b8 52%, #102A43 100%)",
                  }}
                >
                  <MotionCardImage
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${service.image}')` }}
                  />
                </div>

                <div className="flex min-h-[220px] flex-col p-6">
                  <h3 className="font-serif text-2xl font-bold leading-tight text-primary transition-colors group-hover:text-[#B88A28]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </MotionCard>
            ))}
          </MotionGrid>
        </div>
      </section>

      <ContactCta
        title="Hangi hizmete ihtiyacınız olduğunu birlikte netleştirelim."
        description="Voice Klinik ekibiyle görüşerek işitme sağlığınız için uygun hizmet adımını planlayabilirsiniz."
      />
    </main>
  );
}
