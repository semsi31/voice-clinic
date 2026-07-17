import { ContactCta } from "@/components/site/contact-cta";
import { ContentSection } from "@/components/site/content-section";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import {
  buildBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/site-seo";

export const metadata = createPageMetadata({
  title: "Çerez Politikası",
  description:
    "Voice Klinik İşitme Merkezi web sitesi çerez kullanımı hakkında genel bilgilendirme.",
  path: "/cerez-politikasi",
  image: "/images/about-clinic.jpg",
});

export default function CookiePolicyPage() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "Çerez Politikası", path: "/cerez-politikasi" },
        ])}
      />
      <PageHero
        tag="Yasal Bilgilendirme"
        title="Çerez Politikası"
        description="Web sitesi deneyimini iyileştirmeye yardımcı olabilecek çerez kullanımı hakkında genel bilgilendirme."
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Çerez Politikası" },
        ]}
      />

      <ContentSection
        eyebrow="Çerezler"
        title="Web sitesi kullanım deneyimini destekleyen temel bilgiler"
        description="Çerezler, web sitesinin daha düzenli çalışmasına ve kullanıcı deneyiminin anlaşılmasına yardımcı olabilen küçük veri parçalarıdır. Bu sayfa çerez kullanımına ilişkin genel bilgilendirme amacı taşır; hukuki danışmanlık niteliğinde değildir."
        items={[
          "Site işlevlerinin sağlıklı çalışmasına destek olma",
          "Kullanıcı deneyimini ve site performansını anlama",
          "Tercihlerin daha düzenli yönetilmesine yardımcı olma",
          "Yasal bilgilendirme süreçlerini destekleme",
        ]}
        twoColumns
      />

      <ContactCta
        title="Çerez kullanımı hakkında sorularınızı iletin."
        description="Web sitesi gizlilik ve çerez süreçleriyle ilgili genel bilgi almak için bizimle iletişime geçebilirsiniz."
      />
    </main>
  );
}
