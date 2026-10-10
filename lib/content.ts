/**
 * Single source of truth für alle Inhalte der Seite.
 *
 * Seit dem Umbau vom 2026-10-08 („Präsenz statt Verkauf", siehe SITE-PLAN.md)
 * stehen hier nur noch drei Dinge: die Fotoarbeiten, die Filme und die
 * Zeilen für `/ueber`. Pro Arbeit gibt es genau zwei Angaben — Titel und
 * Kunde. Mehr zeigt die Seite nicht.
 *
 * ⚠️ WICHTIG: Nichts hier ist von Jakob freigegeben, solange er es nicht
 * ausdrücklich bestätigt hat (siehe TODO.md, Launch-Blocker). Nichts
 * erfinden — nur belegte Angaben eintragen.
 */

/**
 * **Ausnahmeweg** für das Hero-Video: eine vollständige, externe Adresse.
 *
 * Der Normalfall ist `null`. Dann kommt das Video aus dem R2-Bucket
 * (`original/hero/film.mp4` → `heroVideo()` in lib/video.ts), und niemand
 * muss dafür Code anfassen — Datei in den Bucket legen, `npm run medien`,
 * fertig.
 *
 * Hier steht etwas nur, wenn das Video **woanders** liegt, etwa bei einem
 * Streamingdienst mit eigener Auslieferung. Ein Eintrag hier hat Vorrang vor
 * dem Bucket.
 */
export const HERO_VIDEO: string | null = null;

/**
 * Bildbeschreibung für das Hero-Standbild (`original/hero/standbild.jpg` im
 * Bucket).
 *
 * `null` behandelt das Bild als reine Dekoration (`alt=""`) — vertretbar,
 * weil darüber der Schriftzug als Überschrift steht. Sobald das Bild
 * feststeht, gehört hier trotzdem eine echte Szenenbeschreibung hin.
 */
export const HERO_ALT: string | null = null;

/**
 * Das Foto, das die Startseite trägt, solange es **weder Hero-Video noch
 * Hero-Standbild** gibt (`original/hero/…` im Bucket). Schlüssel wie im
 * Manifest, also `arbeiten/<id>/NN`.
 *
 * Eine schwarze Fläche ist als erster Eindruck einer Seite, die durch Bilder
 * überzeugen soll, das Schwächste, was es gibt. Gewählt nach drei Regeln
 * (UI-SPEC, „Bildbehandlung"): Querformat, keine erkennbaren Gesichter, trägt
 * auch hinter dem Schriftzug. Bei `wiwawo-53` erfüllt das nur Bild 06 (Bus an
 * der Bergstraße, Nebel im Tal).
 *
 * ⚠️ Eine Wahl von Claude, **nicht von Jakob** — er entscheidet. Sobald
 * `hero/standbild` im Bucket liegt, hat das Vorrang, und dieser Wert ist
 * wirkungslos. `null` schaltet den Ersatz ab.
 */
export const HERO_ERSATZ: string | null = "arbeiten/wiwawo-53/06";

export const SITE = {
  /** Schriftzug und Wortmarke — bewusst kleingeschrieben (UI-SPEC, E7). */
  name: "jakob sax",
  /**
   * Die Zeile im Hero der Startseite — Jakobs eigene Instagram-Bio, bewusst
   * kleingeschrieben. Seit dem 2026-10-10 wieder da (Jans Entscheidung, siehe
   * UI-SPEC, „Startseite").
   */
  positioning: "fotografie für kultur & theater im öffentlichen raum",
  locations: "rastatt · stuttgart",
} as const;

/**
 * Die Bilder für die beiden Wege auf der Startseite („foto", „film").
 * Schlüssel wie im Manifest. Für film gilt: Gibt es einen Film mit Standbild,
 * nimmt die Seite dessen Standbild; `film` hier ist nur der Rückfall, `null`
 * zeigt eine dunkle Fläche mit ▶.
 */
export const WEGE: { foto: string | null; film: string | null } = {
  foto: "arbeiten/wiwawo-53/05",
  film: null,
};

/**
 * Die Highlights auf der Startseite: **genau vier Plätze**, in dieser
 * Reihenfolge. Schlüssel wie im Manifest (`arbeiten/<id>/NN`). Fehlt das Bild
 * zu einem Schlüssel — oder steht `null` da —, zeigt der Platz „Highlight
 * folgt". So kann Jakob die vier Plätze nach und nach füllen.
 *
 * ⚠️ Vorauswahl von Claude aus dem, was im Bucket liegt — Jakob entscheidet.
 */
export const HIGHLIGHTS: (string | null)[] = [
  "arbeiten/wiwawo-53/01",
  "arbeiten/wiwawo-53/04",
  "arbeiten/wiwawo-53/02",
  "arbeiten/wiwawo-53/03",
];

/**
 * Eine Fotoarbeit. Ihre Bilder liegen im Bucket unter
 * `original/arbeiten/<id>.jpg` (optional, erscheint als erstes) und
 * `original/arbeiten/<id>/01.jpg`, `02.jpg`, … — die `id` ist der Ordnername.
 * Kein Bildfeld: Konvention statt Konfiguration, siehe TECH-STACK.md.
 */
export type Fotoarbeit = {
  /** Ordnername im Bucket. Nicht umbenennen, ohne den Ordner mitzunehmen. */
  id: string;
  /** So, wie Jakob ihn schreibt. Gehört das Jahr dazu, steht es hier. */
  titel: string;
  /** Ohne Rechtsformzusatz (kein „e.V.", keine „GmbH") — UI-SPEC, E10. */
  kunde: string;
  /**
   * Szenenbeschreibung je Bild, Schlüssel ist der Dateiname ohne Endung
   * (`"01"`, `"02"`, …; das Bild ohne Nummer heißt `"leitbild"`). Fehlt ein
   * Eintrag, setzt die Seite „Titel – Kunde, Bild n" ein — korrekt, aber
   * ohne Information über das Motiv.
   */
  alt?: Record<string, string>;
};

/**
 * Ein Film. Er liegt **nicht** bei uns, sondern bei YouTube, Vimeo oder in
 * einer Mediathek — die Seite verlinkt nur. Bei uns liegt allein das
 * Standbild: `original/film/<id>.jpg` im Bucket. Ohne Standbild erscheint
 * der Film nicht.
 */
export type Film = {
  /** Name des Standbilds im Bucket (`original/film/<id>.jpg`). */
  id: string;
  titel: string;
  /** Ohne Rechtsformzusatz; mehrere Auftraggeber mit Schrägstrich, „SWR/ARD". */
  kunde: string;
  /** Vollständige `https://`-Adresse. Wird von `npm run links` geprüft. */
  link: string;
};

/**
 * Die Fotoarbeiten. **Die Reihenfolge hier ist die Reihenfolge im Mosaik.**
 *
 * Bewusst NICHT enthalten: die Onetake-Arbeiten (Rechte ungeklärt, siehe
 * TODO.md, Langfristig).
 */
export const FOTOS: Fotoarbeit[] = [
  {
    id: "wiwawo-53",
    /*
     * Titel und Kunde wie in Jakobs Konzept vom 2026-10-08, der Kunde ohne
     * „e.V." (E10). Die 53. Jugend-Wildwasserwoche fand 2026 statt.
     */
    titel: "WiWaWo 2026",
    kunde: "Bayerischer Kanuverband",
    /*
     * ⚠️ Von den Bildern abgeleitet, **nicht von Jakob freigegeben** — wie
     * alles hier gegenlesen lassen.
     */
    alt: {
      leitbild:
        "Gruppenfoto der Teilnehmenden und Betreuenden unter einem offenen Holzdach, viele in hellgrünen T-Shirts",
      "01": "Ein Kajak fährt einen weiß schäumenden Wasserfall in einer Felsschlucht hinab, oben auf den Felsen stehen Zuschauende",
      "02": "Lagerfeuer bei Nacht",
      "03": "Kajakfahrer mit blauem Helm im gelben Boot in einer brechenden Welle",
      "04": "Kajakfahrerin mit rotem Helm stellt ihr grünes Boot im Wildwasser senkrecht",
      "05": "Kajakfahrer im grünen Boot mit rotem Paddel auf einem Fluss mit Kiesufer",
      "06": "Weißer Kleinbus mit Kajaks auf dem Dach an einer Bergstraße, im Tal liegt Nebel",
    },
  },
];

/**
 * Die Filme. **Die Reihenfolge hier ist die Reihenfolge auf `/film`.**
 *
 * Noch leer: Für keinen Film liegt bisher ein öffentlicher Link **und** ein
 * Standbild vor. Bekannt sind WiWaWo 50–52 (Bayerischer Kanuverband; die
 * Filme liegen bisher nirgends öffentlich) und „Y-Kollektiv: Tödliches Gold"
 * (SWR/ARD; der Link fehlt). Einträge ohne belegten Link bleiben draußen —
 * nichts erfinden. Was Jakob liefern muss: TODO.md, UMBAU-Schritt 7.
 *
 * Form eines Eintrags:
 *
 *     {
 *       id: "y-kollektiv-toedliches-gold",
 *       titel: "Y-Kollektiv: Tödliches Gold",
 *       kunde: "SWR/ARD",
 *       link: "https://…",
 *     },
 */
export const FILME: Film[] = [];

export const ABOUT = {
  /**
   * Die 3–4 Zeilen auf `/ueber`.
   *
   * ⚠️ **Übergangstext.** Jakob schreibt die endgültigen Zeilen selbst
   * (TODO.md). Bis dahin stehen hier die beiden Absätze, die vorher schon
   * im Kurzanriss der Startseite standen — nichts Neues, nichts erfunden.
   */
  zeilen: [
    "Ich arbeite als Journalist beim SWR in Stuttgart, in der Klimaredaktion und in der Abteilung Wirtschaft und Umwelt.",
    "Dieselbe Aufmerksamkeit bringe ich auf den Festivalplatz mit: antizipieren, warten, im richtigen Moment auslösen. Beim Straßentheater gibt es keinen zweiten Take.",
  ],

  /**
   * Beschreibung des Porträts (`original/portrait.jpg` im Bucket).
   *
   * ⚠️ Von der Aufnahme abgeleitet, **nicht von Jakob freigegeben**. Wer das
   * Foto austauscht, muss die Beschreibung mit austauschen.
   */
  portraitAlt:
    "Jakob Sax im Gegenlicht der untergehenden Sonne, dahinter unscharf Bäume und Dächer",

  /** Die Kontaktzeile — drei Links, sonst nichts (E6, E12). */
  email: "mail@jakobsax.de",
  instagram: {
    label: "Instagram",
    url: "https://www.instagram.com/jakobsax.media/",
  },
  swr: {
    label: "SWR-Autorenseite",
    url: "https://www.swr.de/swraktuell/autor-jakob-sax-100.html",
  },
} as const;
