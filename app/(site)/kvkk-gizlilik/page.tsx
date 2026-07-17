import { ContactCta } from "@/components/site/contact-cta";
import { ContentSection } from "@/components/site/content-section";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import {
  buildBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/site-seo";

export const metadata = createPageMetadata({
  title: "KVKK ve Gizlilik",
  description:
    "Voice Klinik İşitme Merkezi KVKK ve gizlilik bilgilendirmesi.",
  path: "/kvkk-gizlilik",
  image: "/images/about-clinic.jpg",
});

export default function PrivacyPage() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "KVKK ve Gizlilik", path: "/kvkk-gizlilik" },
        ])}
      />
      <PageHero
        tag="Yasal Bilgilendirme"
        title="KVKK ve Gizlilik"
        description="Kişisel verilerin korunması ve gizlilik yaklaşımımız hakkında genel bilgilendirme."
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "KVKK ve Gizlilik" },
        ]}
      />

      <ContentSection
        eyebrow="Gizlilik"
        title="Kişisel verilerin korunmasına önem veriyoruz"
        description="Voice Klinik İşitme Merkezi, iletişim ve randevu süreçlerinde paylaşılan kişisel bilgilerin gizliliğine önem verir. Bu sayfa, kişisel verilerin hangi amaçlarla işlenebileceği, nasıl korunabileceği ve kullanıcıların bu konudaki temel hakları hakkında genel bilgilendirme sunar; hukuki danışmanlık niteliği taşımaz."
        items={[
          "İletişim taleplerinin yanıtlanması",
          "Randevu süreçlerinin planlanması",
          "Hizmet kalitesinin ve kullanıcı deneyiminin geliştirilmesi",
          "Yasal yükümlülüklerin gerektirdiği kayıtların tutulması",
        ]}
        twoColumns
      />

      <ContactCta
        title="Gizlilik süreçleri hakkında bilgi almak için bize ulaşın."
        description="Kişisel verilerinizle ilgili genel sorularınızı Voice Klinik ekibine iletebilirsiniz."
      />
    </main>
  );
}
