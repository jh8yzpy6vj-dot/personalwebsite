import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allSlugs } from "@/lib/works";
import { SERVICES } from "@/lib/content";

/**
 * sitemap.xml
 *
 * Die Detailseiten werden aus `WORKS` erzeugt, damit die Datei nicht von
 * Hand gepflegt werden muss — eine neue Arbeit in `content.ts` steht damit
 * automatisch in der Sitemap.
 *
 * Impressum und Datenschutz fehlen bewusst: Sie tragen `noindex` und
 * gehören nicht in den Suchindex.
 *
 * Hinweis: Solange `INDEXABLE` in lib/site.ts `false` ist, wird diese
 * Sitemap in der robots.txt nicht angemeldet. Die Datei wird trotzdem
 * ausgeliefert — das schadet nicht und spart beim Launch einen Handgriff.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/arbeiten`, changeFrequency: "monthly", priority: 0.8 },
    /* Leistungsseiten mit hoher Priorität: Sie sind die Landepunkte für die
       kommerziellen Suchanfragen („Festivalfotograf Rastatt"). */
    ...SERVICES.map((s) => ({
      url: `${SITE_URL}/leistungen/${s.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/ueber`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "yearly", priority: 0.5 },
    ...allSlugs().map((slug) => ({
      url: `${SITE_URL}/arbeiten/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];

  return routes.map((entry) => ({ ...entry, lastModified: now }));
}
