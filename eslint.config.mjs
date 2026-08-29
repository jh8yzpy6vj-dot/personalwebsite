import next from "eslint-config-next";

/**
 * ESLint-Konfiguration (Flat Config).
 *
 * ⚠️ **Ersetzt das kaputte `next lint`.** Bis 2026-08-28 stand in der
 * package.json `"lint": "next lint"` — den Befehl gibt es in Next 16 nicht
 * mehr, er las „lint" als Verzeichnisnamen und brach ab. Das Skript war
 * also wirkungslos und gab falsche Sicherheit.
 */

/**
 * Generierte und temporäre Verzeichnisse. Ohne diese Liste prüft ESLint
 * die gebündelten Worker-Dateien aus `.wrangler/tmp/` mit — dort stehen
 * dann Dutzende „Fehler" in fremdem, minifiziertem Code.
 *
 * In der Flat Config wirkt ein Objekt, das **nur** `ignores` enthält,
 * projektweit. Deshalb steht es als eigener Eintrag ganz vorn.
 */
const ignoriert = {
  ignores: [
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "node_modules/**",
    "out/**",
  ],
};

const projekt = {
  rules: {
    /*
     * Wir verlinken bewusst mit `<a>` statt `next/link`.
     *
     * Grund: Die seitenübergreifenden View Transitions
     * (`@view-transition { navigation: auto }` in globals.css) greifen nur
     * bei **echten** Navigationen. Mit dem Client-Router von Next gäbe es
     * keine — der Übergang fiele ersatzlos weg. Die Ladezeit fangen
     * stattdessen die Speculation Rules ab, die die Zielseite bei
     * erkennbarer Absicht vorladen.
     *
     * Das ist eine bewusste Abwägung, kein Versehen — deshalb abgeschaltet
     * statt bei jedem Lauf zwanzigmal gemeldet.
     */
    "@next/next/no-html-link-for-pages": "off",

    /*
     * `<img>` statt `next/image`: Der OpenNext-Adapter bringt keinen
     * Bildoptimierer mit, den `next/image` auf dem Worker nutzen könnte.
     * Die Optimierung passiert stattdessen zur Build-Zeit (siehe
     * „Bildmaterial ablegen" in TECH-STACK.md).
     *
     * ⚠️ Sobald echte Bilder da sind, diese Entscheidung erneut prüfen —
     * dann steht `srcset` an, und dafür gibt es womöglich einen besseren Weg.
     */
    "@next/next/no-img-element": "off",
  },
};

/* Als Variable statt anonym exportiert — sonst meldet ESLint sich über die
   eigene Konfiguration. */
const konfiguration = [ignoriert, ...next, projekt];

export default konfiguration;
