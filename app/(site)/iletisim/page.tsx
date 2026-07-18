import Link from "next/link";
import { MotionCard } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { PageImageHero } from "@/components/site/page-image-hero";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import type { IconType } from "react-icons";
import { AppointmentFormSection } from "@/components/site/appointment-form-section";
import { ContactRequestForm } from "@/components/site/contact-request-form";
import { JsonLd } from "@/components/site/json-ld";
import {
  buildBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/site-seo";

export const metadata = createPageMetadata({
  title: "İletişim",
  description:
    "Voice Klinik İşitme Merkezi iletişim bilgileri, adres, çalışma saatleri ve randevu talep formu.",
  path: "/iletisim",
  image: "/images/hero-hearing-care..jpg",
});

const contactCards = [
  {
    title: "Telefon",
    value: "0 532 217 31 58",
    description:
      "Randevu, cihaz danışmanlığı ve teknik servis talepleriniz için bizi arayabilirsiniz.",
    actionLabel: "Telefonla ara",
    href: "tel:+905322173158",
    icon: FiPhone,
    iconClassName: "bg-cyan-50 text-cyan-700",
    buttonClassName: "bg-[#071225] !text-white hover:bg-[#102A43]",
  },
  {
    title: "WhatsApp",
    value: "0 532 217 31 58",
    description:
      "Hızlı bilgi almak ve randevu talebinizi iletmek için WhatsApp üzerinden bize ulaşabilirsiniz.",
    actionLabel: "WhatsApp ile ulaş",
    href: "https://wa.me/905322173158",
    isExternal: true,
    icon: FaWhatsapp,
    iconClassName: "bg-emerald-50 text-emerald-600",
    buttonClassName: "bg-emerald-600 !text-white hover:bg-emerald-700",
  },
  {
    title: "E-posta",
    value: "gdeniz5831@gmail.com",
    description: "Sorularınızı ve taleplerinizi e-posta üzerinden bize iletebilirsiniz.",
    actionLabel: "Mail gönder",
    href: "mailto:gdeniz5831@gmail.com",
    icon: FiMail,
    iconClassName: "bg-sky-50 text-sky-600",
    buttonClassName: "bg-sky-600 !text-white hover:bg-sky-700",
  },
  {
    title: "Instagram",
    value: "Instagram",
    description:
      "Güncel duyurularımızı ve paylaşımlarımızı Instagram üzerinden takip edebilirsiniz.",
    actionLabel: "Instagram’a git",
    href: "https://www.instagram.com/voiceclinicisitmemerkezi/",
    isExternal: true,
    icon: FaInstagram,
    iconClassName: "bg-pink-50 text-pink-600",
    buttonClassName: "bg-pink-600 !text-white hover:bg-pink-700",
  },
] satisfies {
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  href: string;
  isExternal?: boolean;
  icon: IconType;
  iconClassName: string;
  buttonClassName: string;
}[];

const locationCard = {
  title: "Lokasyon",
  value: "Voice Klinik İşitme Merkezi",
  addressLines: [
    "Akasya Mh. 186. Sk. A Blok No:4 İç Kapı 6",
    "Akıllı Plaza, Adliye yanı Kuponpark üzeri",
    "Antakya / HATAY",
  ],
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Akasya+Mh.+186.+Sk.+A+Blok+No:4+%C4%B0%C3%A7+Kap%C4%B1+6+Ak%C4%B1ll%C4%B1+Plaza+Antakya+Hatay",
  icon: FiMapPin,
  iconClassName: "bg-amber-50 text-amber-600",
} satisfies {
  title: string;
  value: string;
  addressLines: string[];
  mapsHref: string;
  icon: IconType;
  iconClassName: string;
};

export default function ContactPage() {
  const LocationIcon = locationCard.icon;

  return (
    <main className="bg-[#faf8f3] text-foreground">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Ana Sayfa", path: "/" },
          { name: "İletişim", path: "/iletisim" },
        ])}
      />
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "İletişim" },
        ]}
        eyebrow="İLETİŞİM"
        title="Bizimle iletişime geçin"
        imageSrc="/images/hero-hearing-care..jpg"
        imageAlt="Voice Klinik İşitme Merkezi iletişim"
      />

      <section className="px-4 py-10 sm:px-6 md:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="sr-only">İletişim bilgileri</h2>
          <MotionGrid className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {contactCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <MotionCard
                  key={card.title}
                  index={index}
                  className="flex h-full flex-col rounded-2xl border border-[#eadfca]/90 bg-white/90 p-3.5 sm:rounded-[1.5rem] sm:p-5 lg:p-5 xl:p-6"
                >
                  <span
                    className={`inline-flex size-9 items-center justify-center rounded-xl text-lg sm:size-11 sm:rounded-2xl sm:text-[22px] ${card.iconClassName}`}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-serif text-base font-bold text-[#071225] sm:mt-4 sm:text-xl lg:text-xl xl:text-2xl">
                    {card.title}
                  </h3>
                  <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#071225] sm:mt-2 sm:text-sm sm:leading-7">
                    {card.value}
                  </p>
                  <p className="mt-2 hidden flex-1 text-sm leading-7 text-slate-600 sm:mt-3 sm:block">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    target={card.isExternal ? "_blank" : undefined}
                    rel={card.isExternal ? "noopener noreferrer" : undefined}
                    className={`site-btn-motion mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg px-2 text-center text-[11px] font-bold sm:mt-5 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm sm:shadow-md ${card.buttonClassName}`}
                  >
                    {card.actionLabel}
                  </Link>
                </MotionCard>
              );
            })}

            <MotionCard
              index={contactCards.length}
              className="flex h-full flex-col rounded-2xl border border-[#eadfca]/90 bg-white/90 p-3.5 sm:rounded-[1.5rem] sm:p-5 lg:p-5 xl:p-6"
            >
              <span
                className={`inline-flex size-9 items-center justify-center rounded-xl text-lg sm:size-11 sm:rounded-2xl sm:text-[22px] ${locationCard.iconClassName}`}
              >
                <LocationIcon aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-serif text-base font-bold text-[#071225] sm:mt-4 sm:text-xl lg:text-xl xl:text-2xl">
                {locationCard.title}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#071225] sm:mt-2 sm:text-sm sm:leading-7">
                {locationCard.value}
              </p>
              <p className="mt-2 flex-1 text-xs leading-5 text-slate-600 sm:mt-3 sm:text-sm sm:leading-7">
                {locationCard.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <Link
                href={locationCard.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="site-btn-motion mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-amber-600 px-2 text-center text-[11px] font-bold !text-white hover:bg-amber-700 sm:mt-5 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm sm:shadow-md"
              >
                Haritada aç
              </Link>
            </MotionCard>
          </MotionGrid>
        </div>
      </section>

      <AppointmentFormSection>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B88A28]">
          Randevu Talebi
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#071225]">
          Size dönüş yapalım
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Bilgilerinizi bırakın, ekibimiz en kısa sürede sizinle iletişime
          geçsin.
        </p>

        <ContactRequestForm />
      </AppointmentFormSection>
    </main>
  );
}
