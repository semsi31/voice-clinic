import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/site/contact-cta";
import { JsonLd } from "@/components/site/json-ld";
import { MotionCard, MotionCardImage } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { Reveal } from "@/components/site/motion/reveal";
import { cdnImageSrc } from "@/lib/cdn-image";
import { heroDelays, IMAGE_REVEAL_DURATION_MS, sectionHeadingDelays } from "@/lib/site-motion";
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  createPageMetadata,
  parseTurkishDisplayDate,
} from "@/lib/site-seo";
import { blogPosts, getBlogPostBySlug } from "../blog-posts";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: { absolute: "Blog Yazısı Bulunamadı | Voice Klinik" },
      robots: { index: false, follow: false },
    };
  }

  const publishedTime = parseTurkishDisplayDate(post.date);

  return createPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.image,
    type: "article",
    publishedTime,
    modifiedTime: publishedTime,
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const imageSrc = cdnImageSrc(post.image);
  const relatedPosts = blogPosts
    .filter((relatedPost) => relatedPost.slug !== post.slug)
    .slice(0, 3);
  const visibleSections = post.sections.slice(0, 3);
  const publishedTime = parseTurkishDisplayDate(post.date);
  const postPath = `/blog/${post.slug}`;

  return (
    <main className="bg-[#faf8f3] text-foreground">
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Ana Sayfa", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: postPath },
          ]),
          buildBlogPostingJsonLd({
            title: post.title,
            description: post.excerpt,
            path: postPath,
            image: post.image,
            datePublished: publishedTime,
            dateModified: publishedTime,
          }),
        ]}
      />
      <div className="relative h-[240px] w-full overflow-hidden sm:h-[300px] lg:h-[360px] xl:h-[400px]">
        <Reveal
          variant="fade-image"
          duration={IMAGE_REVEAL_DURATION_MS}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Full-bleed hero banner requires direct img with object-cover crop. */}
          <img
            src={imageSrc}
            alt={post.title}
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            className="size-full object-cover object-[68%_42%]"
          />
        </Reveal>
        <div className="absolute inset-0 bg-[#071225]/20" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#faf8f3]/75"
          aria-hidden="true"
        />
      </div>

      <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="fade-up-compact" delay={heroDelays.breadcrumb} animateOnLoad>
            <nav
              className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground"
              aria-label="Sayfa yolu"
            >
              <Link href="/" className="site-text-link hover:text-[#B88A28]">
                Ana Sayfa
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog" className="site-text-link hover:text-[#B88A28]">
                Blog
              </Link>
              <span aria-hidden="true">/</span>
              <span className="line-clamp-2 text-[#B88A28]">{post.title}</span>
            </nav>
          </Reveal>

          <div className="mt-4 max-w-5xl">
            <Reveal variant="fade-up-compact" delay={heroDelays.eyebrow} animateOnLoad>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B88A28]">
                {post.category}
              </p>
            </Reveal>
            <Reveal variant="fade-up-hero-title" delay={heroDelays.title} animateOnLoad>
              <h1 className="mt-2 font-serif text-[1.875rem] font-bold leading-[1.14] tracking-tight text-[#071225] text-balance sm:text-[2.5rem] lg:text-[2.625rem]">
                {post.title}
              </h1>
            </Reveal>
            <Reveal variant="fade-up-hero" delay={heroDelays.description} animateOnLoad>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <time dateTime={publishedTime}>{post.date}</time>
                <span className="h-1 w-1 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                <span>{post.readingTime}</span>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#102A43]/90 sm:text-[1.05rem] sm:leading-8">
                {post.excerpt}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-12">
            <aside className="order-1 border-b border-[#eadfca]/80 pb-6 lg:order-2 lg:border-b-0 lg:border-l lg:pb-0 lg:pl-8">
              <div className="space-y-5 lg:sticky lg:top-28">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B88A28]">
                    {post.category}
                  </p>
                  <p className="text-sm font-medium text-[#071225]">{post.date}</p>
                  <p className="text-sm text-[#102A43]/80">{post.readingTime}</p>
                </div>

                <nav aria-label="Bu yazıda">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B88A28]">
                    Bu yazıda
                  </p>
                  <ul className="mt-3 space-y-2">
                    {visibleSections.map((section, index) => (
                      <li key={section.heading}>
                        <a
                          href={`#bolum-${index + 1}`}
                          className="block text-sm leading-5 text-[#102A43]/85 transition hover:text-[#B88A28]"
                        >
                          {section.heading}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>

            <article className="order-2 min-w-0 max-w-4xl lg:order-1">
              <Reveal variant="fade-up">
                <p className="min-w-0 break-words border-l-2 border-[#D4AF37] bg-[#fffdf8] px-4 py-3.5 text-[0.9375rem] font-medium leading-7 text-[#071225] sm:px-5 sm:text-base sm:leading-8">
                  {post.intro}
                </p>
              </Reveal>

              <div className="mt-8">
                {visibleSections.map((section, index) => (
                  <Reveal key={section.heading} variant="fade-up-compact" delay={index > 0 ? 60 : 0}>
                    <section
                      id={`bolum-${index + 1}`}
                      className="scroll-mt-28 border-t border-[#eadfca]/70 pt-8 not-first:mt-12 first:border-t-0 first:pt-0"
                    >
                      <h2 className="mb-4 font-serif text-xl font-bold tracking-tight text-[#071225] sm:text-2xl">
                        {section.heading}
                      </h2>
                      <div className="space-y-5">
                        {section.paragraphs.slice(0, 1).map((paragraph) => (
                          <p
                            key={paragraph}
                            className="text-[0.9375rem] leading-7 text-[#102A43] sm:text-base sm:leading-8"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      {section.bullets ? (
                        <ul className="mt-5 list-disc space-y-2 pl-5">
                          {section.bullets.slice(0, 3).map((bullet) => (
                            <li
                              key={bullet}
                              className="text-[0.9375rem] leading-7 text-[#102A43] marker:text-[#B88A28]"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  </Reveal>
                ))}
                {post.closing ? (
                  <Reveal variant="fade-up" delay={80}>
                    <p className="mt-12 min-w-0 break-words border-l-2 border-[#D4AF37]/60 bg-[#fffdf8] px-4 py-3.5 text-[0.9375rem] font-medium leading-7 text-[#071225] sm:px-5 sm:text-base sm:leading-8">
                      {post.closing}
                    </p>
                  </Reveal>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal variant="fade-up-compact" delay={sectionHeadingDelays.eyebrow}>
              <h2 className="font-serif text-xl font-bold tracking-tight text-[#071225] sm:text-2xl">
                İlgili yazılar
              </h2>
            </Reveal>
            <MotionGrid className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost, index) => {
                const relatedImageSrc = cdnImageSrc(relatedPost.image);

                return (
                  <MotionCard
                    key={relatedPost.slug}
                    as="a"
                    href={`/blog/${relatedPost.slug}`}
                    index={index}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#eadfca]/80 bg-white transition-colors hover:border-[#D4AF37]/40"
                  >
                    <div className="relative aspect-[16/8] w-full overflow-hidden">
                      {relatedImageSrc ? (
                        <MotionCardImage className="size-full">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Related cover thumbnails use controlled object-cover crop. */}
                          <img
                            src={relatedImageSrc}
                            alt={relatedPost.title}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover object-[68%_42%]"
                          />
                        </MotionCardImage>
                      ) : (
                        <div className="size-full bg-[radial-gradient(circle_at_24%_24%,rgba(212,175,55,0.18),transparent_30%),linear-gradient(135deg,#fff8e8_0%,#ead8b8_45%,#102A43_120%)]" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B88A28]">
                        {relatedPost.category}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-[#071225] transition-colors group-hover:text-[#B88A28]">
                        {relatedPost.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-[#102A43]/85">
                        {relatedPost.excerpt}
                      </p>
                      <span className="site-link-arrow-motion mt-auto pt-4 text-sm font-semibold text-[#B88A28]">
                        Devamını Oku <span className="site-link-arrow inline-block">→</span>
                      </span>
                    </div>
                  </MotionCard>
                );
              })}
            </MotionGrid>
          </div>
        </section>

      <ContactCta
        title="Sorularınız için bizimle iletişime geçin."
        description="Size uygun değerlendirme ve çözüm seçenekleri hakkında bilgi almak için Voice Klinik ekibiyle iletişime geçebilirsiniz."
      />
    </main>
  );
}
