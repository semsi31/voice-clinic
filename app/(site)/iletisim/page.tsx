import type { Metadata } from "next";
import Link from "next/link";
import { MotionCard } from "@/components/site/motion/motion-card";
import { MotionGrid } from "@/components/site/motion/motion-grid";
import { PageImageHero } from "@/components/site/page-image-hero";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import type { IconType } from "react-icons";
import { ContactRequestForm } from "@/components/site/contact-request-form";

export const metadata: Metadata = {
  title: "İletişim | Voice Klinik İşitme Merkezi",
  description:
    "Voice Klinik İşitme Merkezi iletişim bilgileri, şube adresleri, çalışma saatleri ve randevu talep formu.",
};

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
  icon: FiMapPin,
  iconClassName: "bg-amber-50 text-amber-600",
} satisfies {
  title: string;
  value: string;
  addressLines: string[];
  icon: IconType;
  iconClassName: string;
};

export default function ContactPage() {
  const LocationIcon = locationCard.icon;

  return (
    <main className="bg-[#faf8f3] text-foreground">
      <PageImageHero
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/" },
          { label: "İletişim" },
        ]}
        eyebrow="İLETİŞİM"
        title="Bizimle iletişime geçin"
        imageSrc="/images/hero-hearing-care..jpg"
      />

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <MotionGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {contactCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <MotionCard
                  key={card.title}
                  index={index}
                  className="flex h-full flex-col rounded-[1.5rem] border border-[#eadfca] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.07)] sm:p-6"
                >
                  <span
                    className={`inline-flex size-12 items-center justify-center rounded-2xl text-[22px] shadow-sm ${card.iconClassName}`}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-bold text-[#071225]">
                    {card.title}
                  </h3>
                  <p className="mt-2 break-words text-sm font-bold leading-7 text-[#071225] sm:text-base">
                    {card.value}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    target={card.isExternal ? "_blank" : undefined}
                    rel={card.isExternal ? "noopener noreferrer" : undefined}
                    className={`site-btn-motion mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-bold shadow-md ${card.buttonClassName}`}
                  >
                    {card.actionLabel}
                  </Link>
                </MotionCard>
              );
            })}
            <MotionCard
              index={contactCards.length}
              className="flex h-full flex-col rounded-[1.5rem] border border-[#eadfca] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.07)] sm:p-6"
            >
              <span
                className={`inline-flex size-12 items-center justify-center rounded-2xl text-[22px] shadow-sm ${locationCard.iconClassName}`}
              >
                <LocationIcon aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-2xl font-bold text-[#071225]">
                {locationCard.title}
              </h3>
              <p className="mt-2 text-sm font-bold leading-7 text-[#071225] sm:text-base">
                {locationCard.value}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {locationCard.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </MotionCard>
          </MotionGrid>
        </div>
      </section>

      <section
        id="randevu-talebi"
        className="scroll-mt-28 px-4 py-6 pb-12 sm:scroll-mt-32 sm:px-6 lg:px-8 lg:pb-14"
      >
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[#eadfca] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
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
        </div>
      </section>
    </main>
  );
}
