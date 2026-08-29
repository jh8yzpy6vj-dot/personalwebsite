import type { Metadata } from "next";
import { Bricolage_Grotesque, Newsreader, Martian_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "./StructuredData";
import { INDEXABLE, SITE_URL } from "@/lib/site";

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

const TITLE = "jakob sax — fotografie für kultur & theater im öffentlichen raum";
const DESCRIPTION =
  "Jakob Sax, Journalist beim SWR und Fotograf für Straßentheater und zeitgenössischen Zirkus. Rastatt und Stuttgart.";

export const metadata: Metadata = {
  // Basis für alle relativen URLs in OpenGraph und Canonical.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "jakob sax",
    title: TITLE,
    description: DESCRIPTION,
    /*
     * Die Vorschaukarte entsteht zur Bauzeit in `scripts/og.mjs` und liegt
     * als fertige Datei unter `public/og/`. Sie trägt die Positionierung
     * auch ohne Foto; sobald `bilder/hero/standbild.jpg` liegt, trägt sie es
     * mit. Gilt für jede Seite ohne eigene Karte — die Arbeiten haben ihre
     * eigene, siehe app/arbeiten/[slug]/page.tsx.
     */
    images: [{ url: "/og/start.jpg", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/start.jpg"],
  },
  // Siehe lib/site.ts: bleibt auf noindex, solange die Launch-Blocker offen
  // sind (erfundene E-Mail-Adresse, kein Impressum, ungeprüfte Inhalte).
  robots: INDEXABLE
    ? { index: true, follow: true }
    : { index: false, follow: false },
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
      <head>
        {/*
          Speculation Rules: Der Browser lädt eine Seite schon vor, wenn der
          Zeiger länger auf einem Link verweilt. Der Klick fühlt sich dann
          nicht „schnell" an, sondern sofort.

          `moderate` statt `eager`: Vorgeladen wird erst bei erkennbarer
          Absicht, nicht bei jedem Link im Blickfeld — sonst zahlt jemand mit
          teurem Mobilfunk für Seiten, die er nie öffnet.

          Progressive Enhancement: Browser ohne Unterstützung ignorieren den
          Block. Kein JavaScript im eigentlichen Sinn, nur eine Anweisung.
        */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{ where: { href_matches: "/*" }, eagerness: "moderate" }],
            }),
          }}
        />
      </head>
      <body>
        {/* Erstes fokussierbares Element jeder Seite. Zielt auf #inhalt,
            das jede Seite auf ihrem <main> trägt. */}
        <a className="skip-link" href="#inhalt">
          Zum Inhalt springen
        </a>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
