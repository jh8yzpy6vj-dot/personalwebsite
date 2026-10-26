import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml — vier Adressen (UMBAU 4.7). Impressum und Datenschutz fehlen
 * bewusst: Sie tragen `noindex`.
 *
 * Die robots.txt meldet sie nur an, solange `INDEXABLE` in lib/site.ts
 * `true` ist (seit 2026-10-26). Ausgeliefert wird sie immer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/foto`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/film`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/ueber`, changeFrequency: "yearly", priority: 0.5 },
  ];
  return routes.map((entry) => ({ ...entry, lastModified: now }));
}
