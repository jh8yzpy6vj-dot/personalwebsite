import type { Metadata } from "next";
import { Archivo, Figtree } from "next/font/google";
import "./globals.css";
import StructuredData from "./StructuredData";
import { INDEXABLE, SITE_URL } from "@/lib/site";

/*
 * ⚠️ **Ersatzschriften für den Übergang** — nicht die Schriften der Seite.
 *
 * Laut UI-SPEC sind das Druk Wide Bold und Avenir Next. Jakob hat die
 * Lizenzen, aber die Dateien dürfen erst ins Projekt, wenn das GitHub-Repo
 * privat ist und feststeht, dass es Web-Lizenzen sind (TECH-STACK.md,
 * „Schriften"). Bis dahin nennt globals.css die echten Namen zuerst — wo sie
 * installiert sind (Avenir Next auf jedem Apple-Gerät), erscheinen sie —
 * und fällt sonst auf diese beiden zurück.
 *
 * `next/font/google` lädt sie zur Build-Zeit und liefert sie vom eigenen
 * Worker aus. Der Browser baut **keine** Verbindung zu Google auf.
 *
 * - **Archivo** mit Breitenachse, gesetzt auf 125 % (`font-stretch`): die
 *   breiteste freie Grotesk, die Druk Wide nahekommt. Ähnlich, nicht gleich.
 * - **Figtree**: geometrisch-humanistisch wie Avenir Next.
 */
const drukErsatz = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-druk-ersatz",
  display: "swap",
});

const avenirErsatz = Figtree({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-avenir-ersatz",
  display: "swap",
});

const TITLE = "jakob sax";
const DESCRIPTION = "Fotos und Filme von Jakob Sax.";

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
     * Die Vorschaukarte entsteht bei `npm run og` (scripts/og.mjs) und liegt
     * als fertige Datei unter `public/og/`. Eine Karte für alle Seiten —
     * Detailseiten mit eigener Karte gibt es seit dem Umbau nicht mehr.
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
  // sind.
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
    <html lang="de" className={`${drukErsatz.variable} ${avenirErsatz.variable}`}>
      <head>
        {/*
          Speculation Rules: Der Browser lädt eine Seite schon vor, wenn der
          Zeiger länger auf einem Link verweilt. Der Klick fühlt sich dann
          nicht „schnell" an, sondern sofort.

          `moderate` statt `eager`: Vorgeladen wird erst bei erkennbarer
          Absicht, nicht bei jedem Link im Blickfeld — sonst zahlt jemand mit
          teurem Mobilfunk für Seiten, die er nie öffnet.

          Gilt nur für eigene Seiten (`/*`): Die Filmlinks führen nach
          außen und werden nie vorgeladen.
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
