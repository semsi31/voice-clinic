import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Klinik İşitme Merkezi",
  description: "Voice Klinik İşitme Merkezi kurumsal web sitesi ve yönetim paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
