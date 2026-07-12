import type { Metadata } from "next";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ContactCta } from "@/components/site/contact-cta";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { PageImageHero } from "@/components/site/page-image-hero";
import { Reveal } from "@/components/site/motion/reveal";
import { IMAGE_REVEAL_DURATION_MS, sectionHeadingDelays, SPLIT_TEXT_DELAY_MS } from "@/lib/site-motion";
import { featuredPost, otherBlogPosts } from "./blog-posts";

export const metadata: Metadata = {
  title: "Blog | Voice Klinik İşitme Merkezi",
  description:
    "İşitme sağlığı, işitme cihazı kullanımı ve bakım süreçleri hakkında Voice Klinik bilgilendirme yazıları.",
};

function getPublicImage(src: string) {
  const imagePath = join(process.cwd(), "public", src.replace(/^\//, ""));

  if (!existsSync(imagePath)) {
    return null;
  }

  return {
    src: `${src}?v=${Math.round(statSync(imagePath).mtimeMs)}`,
    alt: src,
  };
}

function getBlogListCoverSrc(slug: string, fallback: string) {
  const webpSrc = `/images/${slug}.webp`;
  const webpPath = join(process.cwd(), "public", webpSrc.slice(1));

  if (existsSync(webpPath)) {
    return webpSrc;
  }

  return fallback;
}

const blogListCoverPositions: Partial<Record<string, string>> = {};

function getBlogListCoverPosition(slug: string) {
  return blogListCoverPositions[slug] ?? "object-center";
}

function BlogImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const image = getPublicImage(src);

  if (!image) {
    return (
      <div
        className={`bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.18),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)] ${className ?? ""}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cover thumbnails use direct img with object-cover crop.
    <img src={image.src} alt={alt} className={className} />
  );
}

export default function BlogPage() {
  return (
    <main className="bg-[#faf8f3] text-foreground">
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Blog" },
        ]}
        eyebrow="BİLGİ MERKEZİ"
        title="İşitme sağlığı hakkında bilgilendirici içerikler"
        imageSrc="/images/blog-hearing-test.jpg"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl border-y border-[#eadfca] py-6 lg:py-7">
            <article className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14">
              <Reveal variant="image-mask" duration={IMAGE_REVEAL_DURATION_MS} className="overflow-hidden rounded-xl">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="site-reveal-mask-inner group block"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden lg:aspect-auto lg:h-[400px] lg:max-h-[400px]">
                  <BlogImage
                    src={getBlogListCoverSrc(featuredPost.slug, featuredPost.image)}
                    alt={featuredPost.title}
                    className={`site-card-image-motion absolute inset-0 size-full object-cover ${getBlogListCoverPosition(featuredPost.slug)}`}
                  />
                </div>
              </Link>
              </Reveal>

              <Reveal variant="slide-right" delay={SPLIT_TEXT_DELAY_MS}>
                <div className="flex flex-col">
                  <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#B88A28]">
                      <span>{featuredPost.category}</span>
                      <span className="h-1 w-1 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                      <time>{featuredPost.date}</time>
                    </div>
                  </Reveal>
                  <Reveal variant="fade-up" delay={sectionHeadingDelays.title} duration={650}>
                    <h2 className="mt-2 font-serif text-2xl font-bold leading-snug tracking-tight text-[#071225] sm:text-[1.75rem]">
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="transition hover:text-[#B88A28]"
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>
                  </Reveal>
                  <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.description}>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 sm:text-[0.9375rem]">
                      {featuredPost.excerpt}
                    </p>
                  </Reveal>
                  <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.content}>
                    <Link
                      href={`/blog/${featuredPost.slug}`}
                      className="site-link-arrow-motion mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#B88A28] hover:text-[#071225]"
                    >
                      Devamını Oku
                      <span className="site-link-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </Reveal>
                </div>
              </Reveal>
            </article>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-7xl">
            <MotionGrid className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {otherBlogPosts.map((post, index) => (
                <MotionCard
                  key={post.slug}
                  index={index}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#eadfca]/80 bg-white transition-colors hover:border-[#D4AF37]/40"
                >
                  <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
                    <div className="relative aspect-[16/9] w-full max-h-[200px] overflow-hidden">
                      <MotionCardImage className="absolute inset-0 size-full">
                        <BlogImage
                          src={getBlogListCoverSrc(post.slug, post.image)}
                          alt={post.title}
                          className={`size-full object-cover ${getBlogListCoverPosition(post.slug)}`}
                        />
                      </MotionCardImage>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#B88A28]">
                      <span>{post.category}</span>
                      <span className="h-1 w-1 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                      <time>{post.date}</time>
                    </div>
                    <h2 className="mt-2 line-clamp-2 font-serif text-lg font-bold leading-snug tracking-tight text-[#071225]">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="transition hover:text-[#B88A28]"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                      {post.excerpt}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="site-link-arrow-motion mt-auto inline-flex w-fit items-center gap-2 pt-3 text-sm font-semibold text-[#B88A28] hover:text-[#071225]"
                    >
                      Devamını Oku
                      <span className="site-link-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </MotionCard>
              ))}
            </MotionGrid>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl border-t border-[#eadfca] pt-8">
          <Reveal variant="fade-up-compact">
            <h2 className="text-base font-semibold text-[#071225]">
              Bilgilendirme amaçlı içerikler
            </h2>
          </Reveal>
          <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.description}>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Blog içerikleri genel bilgilendirme amacıyla hazırlanır. Kişisel
              işitme ihtiyaçlarınız için uzman değerlendirmesi ve yüz yüze
              danışmanlık önerilir.
            </p>
          </Reveal>
        </div>
      </section>

      <ContactCta
        title="İşitme sağlığınızla ilgili sorularınızı bize iletin."
        description="Blog içerikleri genel bilgilendirme sağlar; kişisel değerlendirme için Voice Klinik ekibiyle görüşebilirsiniz."
      />
    </main>
  );
}
