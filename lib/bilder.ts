import manifest from "./bilder-manifest.json";
import { BILDAUSSCHNITTE } from "./bildausschnitte";

/**
 * Zugriff auf die Bilder im R2-Bucket.
 *
 * `lib/bilder-manifest.json` wird von `scripts/medien.mjs` geschrieben und
 * ist **nicht von Hand zu bearbeiten**. Es ist eingecheckt und die einzige
 * Verbindung zwischen Bucket und Seite: Der Build liest nur dieses Manifest
 * und fasst kein Bild an — er braucht dafür weder Zugangsdaten noch Netz.
 *
 * ⚠️ Die Adressen darin sind **vollständig** (`https://medien.…/b/…`), nicht
 * relativ. Wer die Bucket-Domain wechselt, muss einmal `npm run medien`
 * laufen lassen; Begründung in scripts/medien.mjs.
 *
 * Fehlt ein Schlüssel, liefert jede Suche `null` — und was kein Bild hat,
 * erscheint auf der Seite nicht (siehe lib/arbeiten.ts).
 */

/**
 * Aufnahmedaten aus dem EXIF des Originals. Alle Felder optional — je nach
 * Kamera und Exportweg fehlt einzelnes oder alles.
 *
 * Seit dem Umbau vom 2026-10-08 **zeigt die Seite sie nicht mehr an** — pro
 * Arbeit stehen nur Titel und Kunde. Der Typ bleibt, weil das Manifest die
 * Felder weiter trägt und `npm run medien` sie schreibt.
 *
 * ⚠️ Hier stehen **ausschließlich** diese vier Werte. Standortdaten werden
 * gar nicht erst eingelesen (`EXIF_FELDER` in `lib/bilder-regeln.mjs`).
 */
export type Aufnahme = {
  /** „22:14:03" — genau wie in der Datei, ohne Zeitzonen-Umrechnung. */
  zeit?: string;
  /** Belichtungszeit in Sekunden, z. B. 0.002 für 1/500. */
  belichtung?: number;
  /** Blendenzahl, z. B. 2.8. */
  blende?: number;
  iso?: number;
};

export type Bildquelle = {
  /** Abmessungen des Originals, für `width`/`height` am `img`. */
  breite: number;
  hoehe: number;
  /** Fertige `srcset`-Strings je Format. */
  avif: string;
  webp: string;
  /** Einzelnes JPEG für Browser, die weder AVIF noch WebP können. */
  fallback: string;
  /** Winziges Vorschaubild als Datei-URI. */
  lqip: string;
  /** Aufnahmedaten, falls die Datei welche mitbringt. */
  exif?: Aufnahme;
};

/**
 * Obergrenze für Verbindungen, bei denen jemand ausdrücklich um wenig Daten
 * gebeten hat. 800px deckt jedes Telefondisplay einfach (nicht retina) ab —
 * das Motiv ist erkennbar, die Datei ein Bruchteil.
 */
export const SPARSAM_MAX_BREITE = 800;

/**
 * Dieselbe Bildliste, gekürzt auf die kleinen Breiten.
 *
 * Gibt `null` zurück, wenn nichts wegfällt — dann ist eine zweite `<source>`
 * überflüssig und würde nur das HTML aufblähen.
 */
export function sparsamesSrcset(
  srcset: string,
  maxBreite: number = SPARSAM_MAX_BREITE,
): string | null {
  const eintraege = srcset.split(", ");
  const behalten = eintraege.filter((e) => {
    const treffer = e.match(/(\d+)w$/);
    return treffer ? Number(treffer[1]) <= maxBreite : false;
  });
  // Nichts entfernt, oder alles entfernt: In beiden Fällen ist die gekürzte
  // Liste wertlos. „Alles entfernt" passiert bei einem Original, das schon
  // größer als jede Stufe ist — dort wäre ein leeres `srcset` ein kaputtes Bild.
  if (behalten.length === 0 || behalten.length === eintraege.length) return null;
  return behalten.join(", ");
}

/**
 * `sizes` für eine Mosaikkachel.
 *
 * Anders als beim gescheiterten Zeilensatz ist die Breite hier **bekannt**:
 * Das Mosaik läuft in drei Spalten, eine Kachel füllt genau eine davon.
 * Die Spalten sind absichtlich ungleich breit (Gewichte 1.18 / 0.9 / 1.12
 * in `Mosaik.module.css`); `38vw` ist die **breiteste** davon, großzügig
 * aufgerundet. Unter 860px steht eine Spalte über die volle Breite. Ab
 * 1660px Fensterbreite wächst das Mosaik nicht mehr (höchstens 1600px, siehe
 * UI-SPEC), die breiteste Spalte bleibt dann unter 600px.
 *
 * ⚠️ **Muss mit dem Umbruch dort übereinstimmen.** Laufen sie
 * auseinander, lädt der Browser stillschweigend die falsche Stufe — kein
 * Fehler, den irgendwo etwas meldet, nur zu viele Bytes oder ein weiches
 * Bild. Ein Test hält die Zahlen zusammen.
 */
export const MOSAIK_SIZES = "(max-width: 860px) 92vw, (max-width: 1660px) 38vw, 600px";

/**
 * `sizes` für das Hero-Standbild der Startseite.
 *
 * Randlos über die volle Fensterbreite, mit `object-fit: cover` über
 * `100svh`. Die gerenderte Breite ist die Fensterbreite, deshalb reicht hier
 * tatsächlich `100vw`.
 *
 * ⚠️ Das ist kein Rückfall auf den Standardwert, sondern die richtige Angabe
 * für ein randloses Bild. Auf einem Retina-Schirm fordert der Browser damit
 * über 2400px an — die Quelle muss also breit genug sein, siehe die Zeile
 * „Breite der Quelle" in design/UI-SPEC.md.
 */
export const HERO_SIZES = "100vw";

/**
 * `sizes` für ein Film-Standbild auf `/film`.
 *
 * Einspaltig bis 700px, zweispaltig bis 1400px, darüber drei Spalten in
 * höchstens 1400px Seitenbreite — eine Kachel also rund 440px. Dieselben
 * Umbrüche stehen in `app/film/film.module.css`; ein Test hält beide
 * zusammen.
 */
export const FILM_SIZES = "(max-width: 700px) 92vw, (max-width: 1400px) 46vw, 440px";

export const BILDER: Record<string, Bildquelle> = manifest as Record<
  string,
  Bildquelle
>;

/**
 * Bild zu einem Schlüssel, oder `null`.
 *
 * Der Schlüssel ist der Pfad unter `original/` im Bucket ohne Endung, also
 * `arbeiten/tete-a-tete-2026` für `original/arbeiten/tete-a-tete-2026.jpg`.
 */
export function bild(schluessel: string | null | undefined): Bildquelle | null {
  if (!schluessel) return null;
  return BILDER[schluessel] ?? null;
}

/**
 * Das Bild ohne Nummer einer Fotoarbeit: `original/arbeiten/<id>.jpg`.
 * Auf `/foto` steht es vor den nummerierten Bildern der Arbeit.
 */
export function leitbildZurArbeit(id: string): Bildquelle | null {
  return bild(`arbeiten/${id}`);
}

/**
 * Das Standbild eines Films: `original/film/<id>.jpg` im Bucket.
 *
 * Über die `id`, nicht über ein Feld in `content.ts` — Konvention statt
 * Konfiguration. Ein zusätzliches Bildfeld wäre eine zweite Stelle, an der
 * derselbe Name steht, und damit eine Stelle, an der er falsch stehen kann.
 */
export function standbildZumFilm(id: string): Bildquelle | null {
  return bild(`film/${id}`);
}

/**
 * Mittig — der Standard, wenn für ein Bild nichts gewählt wurde.
 *
 * ⚠️ **Warum der Ausschnitt je Bild gewählt werden muss und keine Regel
 * ihn ersetzen kann:** Wo ein Bild in eine feste Form muss — seit dem Umbau
 * das 16:9-Standbild auf `/film` —, bleibt nur ein Teil davon sichtbar, und
 * welcher der richtige ist, hängt allein vom Motiv ab. Bis zum 2026-09-13
 * stand für das damalige Hero pauschal 38 %; Jan hat an drei Bildern
 * gezeigt, dass das nicht trägt.
 *
 * Mittig ist der einzig vertretbare Standard: bei keinem Motiv grob
 * falsch, anders als ein Drittel, das bei der Hälfte danebenliegt.
 */
export const AUSSCHNITT_MITTIG = "50% 50%";

/**
 * Der gewählte Ausschnitt eines Bildes, als `object-position`.
 *
 * Die Werte stehen in `lib/bildausschnitte.ts` — dort steht auch, warum
 * sie eine eigene Datei bekommen und nicht im Dateinamen stecken.
 */
export function ausschnittAus(schluessel: string): string {
  return BILDAUSSCHNITTE[schluessel] ?? AUSSCHNITT_MITTIG;
}

/** Ein Bild samt seinem Schlüssel — für Listen, in denen die Reihenfolge zählt. */
export type Streckenbild = {
  schluessel: string;
  quelle: Bildquelle;
  /** Fertiger `object-position`-Wert, siehe `ausschnittAus`. */
  ausschnitt: string;
};

/**
 * Alle Schlüssel eines Ordners, **ohne** Unterordner, alphabetisch.
 *
 * Die Sortierung ist der Grund für die Namensvorgabe `01.jpg`, `02.jpg` in
 * TECH-STACK.md, Abschnitt „Medien": Ohne führende Null stünde `10` vor `2`.
 */
function ordnerInhalt(praefix: string): Streckenbild[] {
  return Object.keys(BILDER)
    .filter((k) => k.startsWith(praefix) && !k.slice(praefix.length).includes("/"))
    .sort()
    .map((schluessel) => ({
      schluessel,
      quelle: BILDER[schluessel],
      ausschnitt: ausschnittAus(schluessel),
    }));
}

/**
 * Die Bildstrecke einer Arbeit: `original/arbeiten/<id>/*.jpg` im Bucket.
 *
 * Bewusst ein **Ordner** statt einer Liste in `content.ts`. Wer Bilder
 * ergänzen will, legt Dateien ab; niemand muss Code anfassen. Unterordner
 * gehören nicht dazu.
 */
export function bildstreckeZurArbeit(id: string): Streckenbild[] {
  return ordnerInhalt(`arbeiten/${id}/`);
}
