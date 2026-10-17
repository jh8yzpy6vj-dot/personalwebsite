import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/site";

/**
 * robots.txt
 *
 * ⚠️ **Wichtige Feinheit — hier steht bewusst KEIN `disallow`, obwohl die
 * Seite gerade nicht indexiert werden soll.**
 *
 * `Disallow` verbietet das *Crawlen*, nicht das *Indexieren*. Wer beides
 * kombiniert, erreicht das Gegenteil: Ein Crawler, der die Seite nicht laden
 * darf, sieht auch das `noindex` im HTML nicht — die URL kann dann trotzdem
 * im Index landen, wenn irgendwo ein Link darauf zeigt, nur eben ohne
 * Beschreibung. Und ein bereits indexierter Eintrag verschwindet nie wieder,
 * weil die Entfernungsanweisung nie gelesen wird.
 *
 * Richtig ist deshalb: **Crawlen erlauben, Indexieren per `noindex` im
 * HTML verbieten** (siehe app/layout.tsx). So liest der Crawler die
 * Anweisung und nimmt die Seite wieder heraus.
 *
 * **Ausnahme seit 2026-10-17: `/admin` und `/api/`.** Dort gilt die
 * Überlegung oben nicht: Die Verwaltung war nie öffentlich und ist nirgends
 * verlinkt, es gibt also keinen Eintrag, der verschwinden müsste — und ohne
 * Anmeldung antwortet sie ohnehin mit 404 bzw. der Access-Anmeldung. Ein
 * Crawler hat dort nichts verloren. Das `noindex` kommt trotzdem
 * zusätzlich als `X-Robots-Tag`-Header (next.config.mjs), falls doch
 * jemand einen Link irgendwohin kopiert.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    // Die Sitemap nur anmelden, wenn die Seite auch indexiert werden soll.
    sitemap: INDEXABLE ? `${SITE_URL}/sitemap.xml` : undefined,
    host: SITE_URL,
  };
}
