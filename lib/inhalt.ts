import roh from "./inhalt.json";

/**
 * **Die Inhalte der Seite — seit dem 2026-10-17 in `lib/inhalt.json`.**
 *
 * Vorher standen sie als TypeScript in `lib/content.ts`. Umgezogen, weil Jakob
 * sie seitdem über die Verwaltung unter `/admin` selbst bearbeitet: Die
 * Verwaltung schreibt diese eine Datei per Git-Commit auf `main` zurück, und
 * eine JSON-Datei kann sie sauber lesen und schreiben, TypeScript nicht.
 *
 * ⚠️ **Wer von Hand etwas ändert: vorher `git pull`.** Jakob committet über
 * die Verwaltung auf denselben Branch.
 *
 * Diese Datei liefert nur die Typen und den geladenen Stand. Die alten Namen
 * (`FOTOS`, `FOTO_HERO`, `ABOUT` …) gibt es weiter in `lib/content.ts`, damit
 * die Seiten unverändert bleiben. Geprüft wird der Inhalt in
 * `lib/inhalt-pruefen.ts` — beim Build **und** vor jedem Speichern in der
 * Verwaltung, mit denselben Regeln.
 *
 * Schlüssel für Bilder sind überall der Pfad unter `original/` im Bucket ohne
 * Endung, genau wie im Manifest: `arbeiten/<id>` (Startbild einer Arbeit),
 * `arbeiten/<id>/01`, `ueber/01`, `film/<id>`, `portrait`.
 */

/** Ein Link mit sichtbarer Bezeichnung (Kontaktzeile auf `/ueber`). */
export type Link = { label: string; url: string };

/**
 * Eine Fotoarbeit. Ihre Bilder liegen im Bucket unter
 * `original/arbeiten/<id>.jpg` (das **Startbild**) und
 * `original/arbeiten/<id>/01.jpg`, `02.jpg`, … — die `id` ist der Ordnername.
 */
export type Fotoarbeit = {
  /** Ordnername im Bucket. Nicht umbenennen, ohne den Ordner mitzunehmen. */
  id: string;
  /** Eine der `foto.kategorien`. Ordnet nur noch neue Bilder ein (siehe `foto.reihenfolge`). */
  kategorie: string;
  /** So, wie Jakob ihn schreibt. Gehört das Jahr dazu, steht es hier. */
  titel: string;
  /**
   * Ohne Rechtsformzusatz (kein „e.V.", keine „GmbH") — UI-SPEC, E10.
   * Fehlt bei Festivals, für die Jakob keinen Auftraggeber genannt hat;
   * dann steht nur der Titel da.
   */
  kunde?: string;
  /**
   * Überschrift je Bild, meist die Compagnie („Cie. Dyptik"). Schlüssel ist
   * der Dateiname ohne Endung (`"01"`, `"02"`, …; das Startbild heißt
   * `"leitbild"`). Die Beschriftung wird dann „{Bildtitel} – {Titel}".
   */
  bildtitel?: Record<string, string>;
  /**
   * Szenenbeschreibung je Bild (Alt-Text), Schlüssel wie bei `bildtitel`.
   * Fehlt ein Eintrag, setzt die Seite „Titel – Kunde, Bild n" ein —
   * korrekt, aber ohne Information über das Motiv.
   */
  alt?: Record<string, string>;
  /**
   * Interne Anmerkung — erscheint **nur in der Verwaltung**, nie auf der
   * Seite. Für Herkunft und offene Fragen („von Claude, nicht von Jakob
   * freigegeben"), die vorher als Kommentar in `content.ts` standen.
   */
  notiz?: string;
};

/**
 * Ein Film. Er liegt **nicht** bei uns, sondern bei YouTube, Vimeo oder in
 * einer Mediathek — die Seite verlinkt nur. Bei uns liegt allein das
 * Standbild: `original/film/<id>.jpg` im Bucket. Ohne Standbild zeigt
 * `/film` eine dunkle Kachel mit ▶ (seit 2026-10-23).
 */
export type Film = {
  /** Name des Standbilds im Bucket (`original/film/<id>.jpg`). */
  id: string;
  titel: string;
  /** Ohne Rechtsformzusatz; mehrere Auftraggeber mit Schrägstrich, „SWR/ARD". */
  kunde: string;
  /** Vollständige `https://`-Adresse. Wird von `npm run links` geprüft. */
  link: string;
  /** Interne Anmerkung, nur in der Verwaltung sichtbar. */
  notiz?: string;
};

/**
 * Wie die Seite bei Google und beim Teilen eines Links erscheint (seit
 * 2026-10-25, Reiter Startseite). Gilt für die Startseite und überall, wo eine
 * Seite nichts Eigenes setzt.
 */
export type Seo = {
  /** Titel im Suchergebnis und auf der Vorschaukarte. */
  titel: string;
  /** Die Zeile darunter. Google kürzt meist nach etwa 160 Zeichen. */
  beschreibung: string;
  /**
   * Vorschaubild beim Teilen (WhatsApp, Instagram, LinkedIn …) — ein Foto aus
   * `/foto`. `null`: die feste Vorschaukarte `public/og/start.jpg`.
   */
  bild: string | null;
};

/**
 * Die Angaben im Impressum (seit 2026-10-25 in der Verwaltung, vorher fest in
 * `lib/legal.ts`). ⚠️ Pflicht nach § 5 DDG: Name, ladungsfähige Anschrift
 * (kein Postfach), E-Mail. Hinweise zu jedem Feld in `lib/legal.ts`.
 */
export type Impressum = {
  name: string;
  strasse: string;
  plzOrt: string;
  land: string;
  email: string;
  /** Freiwillig. */
  telefon: string | null;
  /** Nur „soweit vorhanden": `DE` + neun Ziffern. ⚠️ Nie die Steuernummer. */
  ustId: string | null;
  /** Verantwortlich nach § 18 Abs. 2 MStV (Name und Anschrift) — nur, falls einschlägig. */
  mstv: string | null;
};

export type Inhalt = {
  seite: {
    /** Schriftzug und Wortmarke — bewusst kleingeschrieben (UI-SPEC, E7). */
    name: string;
    /** Die Zeile im Hero der Startseite (Jakobs Instagram-Bio, klein). */
    positioning: string;
    locations: string;
  };
  startseite: {
    /**
     * **Was oben auf der Startseite steht** (seit 2026-10-23, Schalter in der
     * Verwaltung): `"video"` — das Video aus dem Bucket (`hero/film`, in der
     * Verwaltung hochgeladen) bzw. `heroVideo`; `"foto"` — nur das Standbild
     * bzw. `heroErsatz`, auch wenn es ein Video gibt. Fehlt bei `"video"` das
     * Video, steht dort ebenfalls das Foto — gültig, kein Fehler.
     *
     * ⚠️ **Darf fehlen und heißt dann `"video"`** — so verhielt sich die Seite
     * vor dem Schalter (Video, sobald eins da ist). Sonst passte kein Stand
     * aus dem Verlauf von vor dem 2026-10-23 mehr zur Prüfung, und
     * „Wiederherstellen" ginge für alle älteren Stände nicht mehr. Lesen
     * immer über `heroArtVon`.
     */
    heroArt?: "foto" | "video";
    /**
     * **Ausnahmeweg** für das Hero-Video: eine vollständige, externe
     * `https://`-Adresse. Normalfall `null` — dann kommt das Video aus dem
     * Bucket (`original/hero/film.mp4`). Ein Eintrag hier hat Vorrang.
     */
    heroVideo: string | null;
    /** Beschreibung des Hero-Standbilds; `null` = reine Dekoration. */
    heroAlt: string | null;
    /**
     * Das Foto, das die Startseite trägt, solange es **weder Hero-Video noch
     * Hero-Standbild** im Bucket gibt. Querformat, keine erkennbaren
     * Gesichter, trägt hinter dem Schriftzug (UI-SPEC, „Bildbehandlung").
     * ⚠️ Wie alle Bildplätze der Startseite nur ein **sichtbares Foto aus
     * `/foto`** (`fotosFuerMosaik`): Bei einem ausgeblendeten oder
     * gelöschten Bild, einem von „Über mich" oder einem Film-Standbild bleibt
     * der Platz leer — die Prüfung warnt.
     */
    heroErsatz: string | null;
    /**
     * Die Bilder der beiden Wege („foto", „film"). Für film gilt: Gibt es
     * einen Film mit Standbild, nimmt die Seite dessen Standbild; der Wert
     * hier ist nur der Rückfall, `null` zeigt eine dunkle Fläche mit ▶.
     */
    wege: { foto: string | null; film: string | null };
    /**
     * **Genau vier Plätze**, in dieser Reihenfolge. Fehlt das Bild zu einem
     * Schlüssel — oder steht `null` da —, zeigt der Platz „Highlight folgt".
     */
    highlights: (string | null)[];
  };
  foto: {
    /**
     * Die Kategorien. Sichtbar sind sie nirgends (Jakob: ein Mosaik ohne
     * Grenzen). Seit dem 2026-10-17 ordnen sie nur noch Bilder ein, die
     * (noch) nicht in `reihenfolge` stehen.
     */
    kategorien: string[];
    arbeiten: Fotoarbeit[];
    /**
     * **Die Reihenfolge des Mosaiks auf `/foto`** — frei, über Arbeiten und
     * Kategorien hinweg, von Jakob in der Verwaltung gezogen. Enthält auch
     * ausgeblendete Bilder, damit sie beim Wiedereinblenden an ihren Platz
     * zurückkehren. Ein Bild, das hier fehlt (frisch hochgeladen), kommt
     * **ans Ende** — nach Kategorie, Arbeit und Dateiname. So verschwindet
     * nie still etwas.
     */
    reihenfolge: string[];
    /**
     * Die Bilder im Hero von `/foto`, **in dieser Reihenfolge**; die Blende
     * läuft über sie. Sechs bis acht **sichtbare** empfohlen (UI-SPEC) — die
     * Prüfung warnt außerhalb davon. Erstes Bild = das, was ohne Skript
     * steht. Ausgeblendete und gelöschte Bilder behalten ihren Platz hier,
     * erscheinen aber nicht; so kehren sie beim Einblenden bzw.
     * Wiederherstellen an ihren Platz zurück.
     */
    hero: string[];
  };
  ueber: {
    /** Die 3–4 Zeilen auf `/ueber`. */
    zeilen: string[];
    /** Beschreibung des Porträts (`original/portrait.jpg`). */
    portraitAlt: string;
    /** Die Kontaktzeile — drei Links, sonst nichts (E6, E12). */
    email: string;
    instagram: Link;
    swr: Link;
    /**
     * Beschriftung je Bild des Mosaiks auf `/ueber` (`ueber/01`, …). Ohne
     * Eintrag erscheint „Jakob Sax".
     */
    bilder: Record<string, string>;
    /** Reihenfolge dieser Bilder; Fehlendes kommt ans Ende, nach Dateiname. */
    reihenfolge: string[];
  };
  /** Die Filme, **in dieser Reihenfolge** auf `/film`. */
  filme: Film[];
  /**
   * Bilder, die im Bucket liegen, aber **nicht auf die Seite** sollen. Zum
   * Wiedereinblenden den Schlüssel streichen; die Datei bleibt im Bucket.
   */
  ausgeblendet: string[];
  /**
   * Gelöschte Bilder: Schlüssel → Tag des Löschens (`JJJJ-MM-TT`). Auf der
   * Seite wie ausgeblendet. **Nach 30 Tagen** entfernt die Medien-Action
   * (`.github/workflows/medien.yml`) das Original aus dem Bucket und den
   * Eintrag von hier. Bis dahin stellt die Verwaltung es mit einem Klick
   * wieder her.
   */
  papierkorb: Record<string, string>;
  /**
   * Wo der Bildausschnitt sitzt, je Bild, als `object-position`
   * („50% 78%" = mittig, weit unten). Gilt nur, wo ein Bild beschnitten
   * wird: im Hero von `/foto`, auf der Startseite, bei Film-Standbildern.
   * Ohne Eintrag mittig. Warum es das gibt: `lib/bildausschnitte.ts`.
   */
  bildausschnitte: Record<string, string>;
  /**
   * ⚠️ **Darf fehlen** (Stände vor dem 2026-10-25) — dann gelten
   * `SEO_STANDARD` bzw. `IMPRESSUM_STANDARD`, die Werte von davor. Sonst
   * ließe sich kein älterer Stand aus dem Verlauf wiederherstellen. Lesen
   * immer über `seoVon` und `impressumVon`.
   */
  seo?: Seo;
  impressum?: Impressum;
};

/**
 * Der eingecheckte Stand. `as Inhalt`, weil JSON keine Typen trägt — dass
 * die Form stimmt, prüft `pruefeInhalt` beim Build (`lib/content.ts`).
 */
export const INHALT = roh as unknown as Inhalt;

/** Was vor dem 2026-10-25 fest im Code stand — Rückfall für ältere Stände. */
export const SEO_STANDARD: Seo = {
  titel: "jakob sax",
  beschreibung: "Fotos und Filme von Jakob Sax.",
  bild: null,
};

/** Was vor dem 2026-10-25 fest in `lib/legal.ts` stand — Rückfall für ältere Stände. */
export const IMPRESSUM_STANDARD: Impressum = {
  name: "Jakob Sax",
  strasse: "Röttererbergstraße 1",
  plzOrt: "76437 Rastatt",
  land: "Deutschland",
  email: "mail@jakobsax.de",
  telefon: null,
  ustId: null,
  mstv: null,
};

export function seoVon(inhalt: Pick<Inhalt, "seo">): Seo {
  return inhalt.seo ?? SEO_STANDARD;
}

export function impressumVon(inhalt: Pick<Inhalt, "impressum">): Impressum {
  return inhalt.impressum ?? IMPRESSUM_STANDARD;
}

/** Foto oder Video oben — fehlt der Eintrag (Stand vor dem 2026-10-23), heißt das „Video". */
export function heroArtVon(startseite: Pick<Inhalt["startseite"], "heroArt">): "foto" | "video" {
  return startseite.heroArt ?? "video";
}

/**
 * Der Dateiname eines Bildes innerhalb seiner Arbeit: `"leitbild"` für
 * `arbeiten/<id>`, sonst der letzte Pfadteil (`"01"`). Damit greifen
 * `bildtitel` und `alt`.
 */
export function bildName(schluessel: string): string {
  const teile = schluessel.split("/");
  return teile[0] === "arbeiten" && teile.length === 2 ? "leitbild" : teile[teile.length - 1];
}

/**
 * Zu welcher Fotoarbeit ein Schlüssel gehört (`arbeiten/<id>` oder
 * `arbeiten/<id>/NN`), sonst `null`.
 */
export function arbeitZu(schluessel: string): string | null {
  const teile = schluessel.split("/");
  if (teile[0] !== "arbeiten") return null;
  if (teile.length === 2 || teile.length === 3) return teile[1];
  return null;
}

/** Ist das Bild auf der Seite zu sehen (weder ausgeblendet noch gelöscht)? */
export function istVerborgen(inhalt: Pick<Inhalt, "ausgeblendet" | "papierkorb">, schluessel: string) {
  return inhalt.ausgeblendet.includes(schluessel) || schluessel in inhalt.papierkorb;
}
