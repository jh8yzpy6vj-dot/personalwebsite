/**
 * Zentrale technische Eckdaten der Seite.
 *
 * Bewusst getrennt von `content.ts`: Dort stehen Inhalte (Texte, Arbeiten,
 * Kontakt), hier stehen technische Werte (URL, Indexierbarkeit).
 */

/**
 * Kanonische Basis-URL. Ohne abschließenden Schrägstrich.
 *
 * ⚠️ Die Domain-Entscheidung ist offen (`jakobsax.de` vs. `jakobsax.media`,
 * siehe TODO.md). Deshalb steht sie hier an genau einer Stelle — ein Wechsel
 * ist ein Einzeiler. Ein Domainwechsel nach dem ersten externen Link kostet
 * allerdings Ranking, also vorher entscheiden.
 */
export const SITE_URL = "https://jakobsax.de";

/**
 * Steuert, ob Suchmaschinen die Seite indexieren dürfen.
 *
 * **Seit dem 2026-10-26 `true`** — Jan: „Entsperr die Seite für Google."
 * Impressum und Datenschutz stehen, die Kontaktdaten sind echt. Bewusst vor
 * den übrigen Launch-Blockern in TODO.md (Rechtstexte anwaltlich lesen,
 * Nebentätigkeit, Bild- und Persönlichkeitsrechte, Kundennennung) — die
 * bleiben offen.
 *
 * ⚠️ **Zurück auf `false`** nimmt die Seite nicht sofort heraus: Google muss
 * das `noindex` erst wieder lesen (deshalb kein `Disallow`, siehe
 * app/robots.ts). Schneller geht es über die Search Console („Entfernen").
 */
export const INDEXABLE = true;

/**
 * JSON für ein `<script>`-Element (JSON-LD, Speculation Rules).
 *
 * ⚠️ **`JSON.stringify` allein reicht nicht.** Es lässt `<` stehen, und der
 * HTML-Parser beendet das Element bei `</script` — egal, welcher `type`
 * gesetzt ist. Ein Link wie `https://x/</script><script>…` liefe sonst als
 * Code auf jeder Seite, auch auf der Anmeldung von `/admin`. `<` & Co.
 * sind gültiges JSON und werden beim Lesen wieder zu denselben Zeichen.
 */
export function alsJsonLd(daten: unknown): string {
  return JSON.stringify(daten)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
