import manifest from "./bilder-manifest.json";

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
 * Solange im Bucket nichts liegt, ist das Manifest `{}` — jede Suche liefert
 * `null`, und die Oberfläche zeigt ihren Platzhalter. Genau das ist der
 * aktuelle Zustand: Die Mechanik steht, die Fotos fehlen (siehe TODO.md).
 */

/**
 * Aufnahmedaten aus dem EXIF des Originals. Alle Felder optional — je nach
 * Kamera und Exportweg fehlt einzelnes oder alles.
 *
 * ⚠️ Hier stehen **ausschließlich** diese vier Werte. Standortdaten werden
 * gar nicht erst eingelesen (`EXIF_FELDER` in `lib/bilder-regeln.mjs`).
 */
export type Aufnahme = {
  /**
   * „22:14:03" — genau wie in der Datei, ohne Zeitzonen-Umrechnung.
   *
   * Mit Sekunden gespeichert, obwohl die Zeile unter dem Bild nur Stunde und
   * Minute zeigt: Im Kontaktbogen liegen alle Frames in derselben Minute,
   * dort ist die Sekunde die eigentliche Aussage. Gekürzt wird beim Anzeigen.
   */
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
 * aufgerundet. Unter 860px steht eine Spalte über die volle Breite.
 *
 * ⚠️ **Muss mit dem Umbruch dort übereinstimmen.** Laufen sie
 * auseinander, lädt der Browser stillschweigend die falsche Stufe — kein
 * Fehler, den irgendwo etwas meldet, nur zu viele Bytes oder ein weiches
 * Bild. Ein Test hält die Zahlen zusammen.
 */
export const MOSAIK_SIZES = "(max-width: 860px) 92vw, 38vw";

/**
 * `sizes` für das Hero der Detailseite.
 *
 * Randlos über die volle Fensterbreite, mit `object-fit: cover` — am Desktop
 * über `100svh`, mobil in einer 4:3-Box. In beiden Fällen ist die gerenderte
 * Breite die Fensterbreite, deshalb reicht hier tatsächlich `100vw`.
 *
 * ⚠️ Das ist kein Rückfall auf den Standardwert, sondern die richtige Angabe
 * für ein randloses Bild. Auf einem Retina-Schirm fordert der Browser damit
 * über 2400px an — die Quelle muss also breit genug sein, siehe die Zeile
 * „Breite der Quelle" in design/UI-SPEC.md.
 */
export const HERO_SIZES = "100vw";

/**
 * Belichtungszeit, wie Fotografen sie schreiben: kürzer als eine Sekunde
 * als Bruch (`1/500`), ab einer Sekunde mit Einheit (`2s`).
 *
 * `1/500` statt `0.002` ist keine Kosmetik — auf jedem Kameradisplay und in
 * jedem Gespräch steht der Bruch. Die Dezimalzahl liest hier niemand.
 */
export function belichtungAlsText(sekunden: number): string {
  if (sekunden >= 1) {
    // `4s`, aber `1.6s` — nachkommastellen nur, wo sie etwas sagen.
    return `${Number(sekunden.toFixed(1))}s`;
  }
  return `1/${Math.round(1 / sekunden)}`;
}

/** `f/2` statt `f/2.0`, `f/2.8` mit Stelle. */
export function blendeAlsText(zahl: number): string {
  return `f/${Number(zahl.toFixed(1))}`;
}

/**
 * Der Aufnahmezeitpunkt allein: `22:14` oder, mit Sekunden, `22:14:03`.
 *
 * Die Sekunden trägt nur der Kontaktbogen — dort unterscheiden sich die
 * Frames genau darin. Überall sonst wären sie eine Genauigkeit, die niemand
 * braucht und die die Zeile länger macht.
 */
export function zeitpunkt(
  exif: Aufnahme | undefined,
  mitSekunden = false,
): string | null {
  if (!exif?.zeit) return null;
  return mitSekunden ? exif.zeit : exif.zeit.slice(0, 5);
}

/**
 * Die Aufnahmezeile: `22:14 uhr · 1/500 · f/2.8 · iso 6400`.
 *
 * Klein geschrieben und mit `·` getrennt — dieselbe Schreibweise wie die
 * bestehende Metazeile (siehe design/UI-SPEC.md). Fehlende Werte fallen
 * ersatzlos weg, statt leere Trenner stehen zu lassen; bleibt nichts übrig,
 * gibt es `null` und die Zeile erscheint gar nicht.
 *
 * Warum das überhaupt auf der Seite steht: Für Kuratoren und Kollegen ist
 * `1/500 · f/2.8 · iso 6400` sofort lesbar als „der weiß, was er tut" —
 * eine konkrete Nennung statt eines Eigenschaftsworts, genau wie es der
 * Copywriting Contract verlangt.
 */
export function aufnahmeZeile(exif: Aufnahme | undefined): string | null {
  if (!exif) return null;

  const zeit = zeitpunkt(exif);
  const teile = [
    zeit ? `${zeit} uhr` : null,
    typeof exif.belichtung === "number" ? belichtungAlsText(exif.belichtung) : null,
    typeof exif.blende === "number" ? blendeAlsText(exif.blende) : null,
    typeof exif.iso === "number" ? `iso ${exif.iso}` : null,
  ].filter(Boolean);

  return teile.length > 0 ? teile.join(" · ") : null;
}

/**
 * Die kurze Variante für den Filmstreifen: `21:02 uhr · iso 3200`.
 *
 * Blende und Belichtungszeit stehen in einer Strecke an jedem Bild gleich —
 * sie wiederholen sich acht Mal und sagen beim zweiten Bild nichts mehr.
 * Was sich über den Abend ändert, ist die Uhrzeit und mit dem Licht die
 * Empfindlichkeit; genau das bleibt stehen.
 *
 * Nebenbei löst das ein Platzproblem: Die volle Zeile brach auf einem
 * 390px-Display innerhalb des Bildrahmens um.
 */
export function streckenZeile(exif: Aufnahme | undefined): string | null {
  if (!exif) return null;
  const zeit = zeitpunkt(exif);
  const teile = [
    zeit ? `${zeit} uhr` : null,
    typeof exif.iso === "number" ? `iso ${exif.iso}` : null,
  ].filter(Boolean);
  return teile.length > 0 ? teile.join(" · ") : null;
}

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
 * Das Leitbild einer Arbeit — **über die `id`, nicht über ein Feld in
 * `content.ts`**.
 *
 * Bewusst Konvention statt Konfiguration: Jakob und Jan legen die Datei nach
 * `original/arbeiten/<id>.jpg` in den Bucket und sind fertig. Ein zusätzliches
 * `image`-Feld wäre eine zweite Stelle, an der derselbe Name steht — und
 * damit eine Stelle, an der er falsch stehen kann.
 */
export function bildZurArbeit(id: string): Bildquelle | null {
  return bild(`arbeiten/${id}`);
}

/** Ein Bild samt seinem Schlüssel — für Listen, in denen die Reihenfolge zählt. */
export type Streckenbild = { schluessel: string; quelle: Bildquelle };

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
    .map((schluessel) => ({ schluessel, quelle: BILDER[schluessel] }));
}

/**
 * Die Bildstrecke einer Arbeit: `original/arbeiten/<id>/*.jpg` im Bucket.
 *
 * Bewusst ein **Ordner** statt einer Liste in `content.ts` — dieselbe
 * Konvention wie beim Leitbild. Wer eine Strecke ergänzen will, legt Dateien
 * ab; niemand muss Code anfassen.
 *
 * Der Unterordner `serie/` gehört nicht dazu, der ist der Kontaktbogen.
 */
export function bildstreckeZurArbeit(id: string): Streckenbild[] {
  return ordnerInhalt(`arbeiten/${id}/`);
}

export type Serienbild = Streckenbild & {
  /** Der Frame, der es geworden ist — Dateiname endet auf `-gewaehlt`. */
  gewaehlt: boolean;
};

/**
 * Der Kontaktbogen einer Arbeit: `original/arbeiten/<id>/serie/*.jpg`.
 *
 * Alle Frames derselben Aufnahmeserie, der gewählte darunter. Er erkennt sich
 * am Dateinamen (`…-gewaehlt.jpg`) — **nicht** am EXIF-Zeitstempel, denn den
 * bringt nicht jede Datei mit, und dann stünde die Markierung willkürlich
 * woanders. Ein Dateiname ist außerdem im Ordner sichtbar; eine Regel, die
 * man sehen kann, wird seltener falsch angewendet.
 *
 * Ist keiner markiert, gibt es eben keine Markierung. Das ist kein Fehler.
 */
export function serieZurArbeit(id: string): Serienbild[] {
  return ordnerInhalt(`arbeiten/${id}/serie/`).map((b) => ({
    ...b,
    gewaehlt: /-gewaehlt$/.test(b.schluessel),
  }));
}
