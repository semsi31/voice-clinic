import { PageTransition } from "@/components/site/motion/page-transition";
import { SiteMotionProvider } from "@/components/site/motion/site-motion-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="site-theme flex min-h-screen flex-col overflow-x-hidden bg-background">
      <SiteHeader />
      <div className="flex-1">
        <SiteMotionProvider>
          <PageTransition>{children}</PageTransition>
        </SiteMotionProvider>
      </div>
      <SiteFooter />
    </div>
  );
}
