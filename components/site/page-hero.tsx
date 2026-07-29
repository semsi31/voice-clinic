import { PageImageHero } from "@/components/site/page-image-hero";
import { cdnImageSrc } from "@/lib/cdn-image";

export type PageHeroBreadcrumb = {
  label: string;
  href?: string;
};

export type PageHeroProps = {
  title: string;
  description: string;
  breadcrumbs: PageHeroBreadcrumb[];
  tag?: string;
  className?: string;
};

const LEGAL_HERO_IMAGE = cdnImageSrc("/images/about-clinic.jpg");

export function PageHero({ title, breadcrumbs, tag }: PageHeroProps) {
  return (
    <PageImageHero
      breadcrumbs={breadcrumbs}
      eyebrow={tag ?? "Bilgilendirme"}
      title={title}
      imageSrc={LEGAL_HERO_IMAGE}
    />
  );
}
