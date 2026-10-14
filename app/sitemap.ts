import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { arbeitenMitBild } from "@/lib/arbeiten";

/**
 * sitemap.xml — vier Adressen (UMBAU 4.7). Impressum und Datenschutz fehlen
 * bewusst: Sie tragen `noindex`.
 *
 * Solange `INDEXABLE` in lib/site.ts `false` ist, meldet die robots.txt
 * diese Sitemap nicht an. Ausgeliefert wird sie trotzdem.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/foto`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/film`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/ueber`, changeFrequency: "yearly", priority: 0.5 },
    /* Seit dem 2026-10-14: eine Detailseite je Fotoarbeit mit Bild. */
    ...arbeitenMitBild().map((a) => ({
      url: `${SITE_URL}/foto/${a.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
  return routes.map((entry) => ({ ...entry, lastModified: now }));
}
