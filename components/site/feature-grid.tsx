import { Reveal } from "@/components/site/motion/reveal";
import { getGridCardDelay } from "@/lib/site-motion";
import { cn } from "@/lib/utils";
import { IconBadge, type SiteIconName } from "@/components/site/site-icon";

export type FeatureGridItem = {
  title: string;
  description: string;
  icon?: SiteIconName;
};

export type FeatureGridProps = {
  items: FeatureGridItem[];
  columns?: 3 | 4;
  className?: string;
};

export function FeatureGrid({ items, columns = 3, className }: FeatureGridProps) {
  const getIconName = (item: FeatureGridItem): SiteIconName => {
    const title = item.title.toLocaleLowerCase("tr-TR");

    if (item.icon) return item.icon;
    if (title.includes("test") || title.includes("değerlendirme")) return "activity";
    if (title.includes("uygulama") || title.includes("seçim")) return "settings";
    if (title.includes("bakım") || title.includes("servis")) return "wrench";
    if (title.includes("yedek") || title.includes("aksesuar")) return "package";
    if (title.includes("destek") || title.includes("takip")) return "headset";
    if (title.includes("bluetooth")) return "message-circle";
    if (title.includes("şarj")) return "calendar";
    if (title.includes("güven") || title.includes("koru")) return "shield-check";

    return "check-circle";
  };

  return (
    <section className={cn("bg-background px-4 py-10 sm:px-6 lg:px-8 lg:py-12", className)}>
        <div
          className={cn(
            "mx-auto grid max-w-7xl gap-4 sm:grid-cols-2",
            columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {items.map((item, index) => (
            <Reveal
              key={item.title}
              asChild
              variant="fade-up-card"
              delay={getGridCardDelay(index)}
            >
              <article className="site-card-motion group rounded-2xl border border-[#eadfca] bg-white p-5 shadow-lg shadow-slate-950/5 hover:border-[#D4AF37]/45 hover:shadow-xl hover:shadow-slate-950/10">
                <IconBadge name={getIconName(item)} variant="light" size="sm" className="mb-4" />
                <h3 className="text-lg font-bold tracking-tight text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
  );
}
