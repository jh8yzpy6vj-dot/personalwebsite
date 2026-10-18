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
 * ⚠️ **Steht bewusst auf `false`.** Solange die Launch-Blocker aus TODO.md
 * offen sind, darf die Seite nicht in den Index: Die Inhalte sind nicht von
 * Jakob gegengeprüft und die Rechtstexte nicht anwaltlich gelesen. Ein einmal
 * indexierter Stand wird auch nach der Korrektur noch eine Weile ausgeliefert.
 *
 * **Auf `true` setzen, wenn:** Impressum und Datenschutz existieren, die
 * Kontaktdaten echt sind und Jakob die Inhalte freigegeben hat.
 */
export const INDEXABLE = false;

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
