import type { Metadata } from "next";
import { Bricolage_Grotesque, Newsreader, Martian_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "jakob sax — fotografie für kultur & theater im öffentlichen raum",
  description:
    "Jakob Sax, Journalist beim SWR und Fotograf für Straßentheater und zeitgenössischen Zirkus. Rastatt und Stuttgart.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${display.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
