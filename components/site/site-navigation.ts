export type SiteNavigationItem = {
  title: string;
  href: string;
  children?: {
    title: string;
    href: string;
  }[];
};

export const siteSocialLinks = [
  {
    title: "Instagram",
    href: "https://www.instagram.com/voiceclinicisitmemerkezi/",
  },
  { title: "WhatsApp", href: "https://wa.me/905322173158" },
  { title: "Facebook", href: "#" },
] as const;

export const siteServiceLinks = [
  { title: "İşitme Testi ve Değerlendirme", href: "/hizmetlerimiz" },
  { title: "İşitme Cihazı Uygulaması", href: "/hizmetlerimiz" },
  { title: "İşitme Cihazı Satışı", href: "/hizmetlerimiz" },
  { title: "Cihaz Bakım ve Kontrol", href: "/hizmetlerimiz" },
  { title: "Yedek Parça ve Aksesuar", href: "/hizmetlerimiz" },
  { title: "Satış Sonrası Destek", href: "/hizmetlerimiz" },
] as const;

export const siteNavigation: SiteNavigationItem[] = [
  {
    title: "Ana Sayfa",
    href: "/",
  },
  {
    title: "Kurumsal",
    href: "/kurumsal",
  },
  {
    title: "Hizmetlerimiz",
    href: "/hizmetlerimiz",
  },
  {
    title: "İşitme Cihazları",
    href: "/isitme-cihazlari",
  },
  {
    title: "Teknik Servis",
    href: "/teknik-servis",
  },
  {
    title: "Blog",
    href: "/blog",
  },
  {
    title: "İletişim",
    href: "/iletisim",
  },
  {
    title: "Randevu Al",
    href: "/iletisim#randevu-talebi",
  },
];

export const sitePrimaryNavigation = siteNavigation.filter(
  (item) => item.title !== "Randevu Al",
);

export const siteAppointmentLink = siteNavigation.find(
  (item) => item.title === "Randevu Al",
);
