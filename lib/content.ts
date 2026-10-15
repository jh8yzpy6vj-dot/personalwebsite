/**
 * Single source of truth für alle Inhalte der Seite.
 *
 * Seit dem Umbau vom 2026-10-08 („Präsenz statt Verkauf", siehe SITE-PLAN.md)
 * stehen hier vor allem die Fotoarbeiten, die Filme und die Zeilen für
 * `/ueber`. Seit dem 2026-10-14 (abends) ist `/foto` ein Hero mit Blende
 * über `FOTO_HERO` und darunter ein Mosaik aus allen Fotoarbeiten, nach
 * Kategorie geordnet, ohne sichtbare Grenzen (UI-SPEC, „/foto").
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
 * auch hinter dem Schriftzug. Bis 2026-10-15 war das der Bus an der
 * Bergstraße (`wiwawo-53/06`) — den hat Jakob ausgeblendet. Seitdem SPPI bei
 * Nacht: Querformat, dunkel, die Figuren klein und ohne erkennbare Gesichter.
 *
 * ⚠️ Eine Wahl von Claude, **nicht von Jakob** — er entscheidet. Sobald
 * `hero/standbild` im Bucket liegt, hat das Vorrang, und dieser Wert ist
 * wirkungslos. `null` schaltet den Ersatz ab. Ein ausgeblendetes Bild
 * (`ausblenden`) wirkt hier nicht — dann bliebe die Startseite schwarz.
 */
export const HERO_ERSATZ: string | null = "arbeiten/tete-a-tete/01";

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
  /* Bis 2026-10-15 `wiwawo-53/05` (grünes Boot) — von Jakob ausgeblendet. */
  foto: "arbeiten/wiwawo-53/08",
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
  "arbeiten/tete-a-tete/03",
  "arbeiten/welttheater-der-strasse",
  "arbeiten/wiwawo-53/01",
  "arbeiten/at-tension",
];

/**
 * Die Bilder im Hero von `/foto`, **in dieser Reihenfolge** — sechs bis acht,
 * die Blende läuft über sie (UI-SPEC, „/foto"). Schlüssel wie im Manifest.
 * Ein Schlüssel ohne Bild fällt still weg; ein Test prüft, dass alle da sind.
 *
 * Abwechselnd aus den Kategorien, damit die Folge nicht viermal dasselbe
 * Festival zeigt. ⚠️ Das Hero ist auf dem Laptop breiter als hoch — ein
 * Hochformat verliert dort viel Höhe. Deshalb nur Hochformate, deren Motiv
 * in einem Streifen trägt, mit Ausschnitt aus `bildausschnitte.ts`.
 *
 * ⚠️ **Vorauswahl von Claude, nicht von Jakob** — gewählt am Screenshot von
 * Jakobs Bilderordner (2026-10-14), nicht an den Originalen. Jakob
 * entscheidet. Erstes Bild = das, was ohne Skript steht.
 */
export const FOTO_HERO: string[] = [
  "arbeiten/at-tension", // Cie. Dyptik — Körper fliegen über dem Publikum
  "arbeiten/welttheater-der-strasse", // Commando Percu — rotes Feuer
  "arbeiten/tete-a-tete/01", // SPPI — Bühne bei Nacht, Querformat
  "arbeiten/welttheater-der-strasse/04", // Collectif Malunés — Trapez im Gegenlicht
  "arbeiten/wiwawo-52", // Boot in der Walze
  "arbeiten/stadtfest-karlsruhe", // Tuchakrobatik am Kran
  "arbeiten/tete-a-tete/03", // Chloe Loftus am Gerüst
];

/**
 * Die Kategorien, **in dieser Reihenfolge** — danach ist das Mosaik auf
 * `/foto` geordnet. Sichtbar sind sie nicht: Jakob will ein Mosaik ohne
 * Grenzen (2026-10-14), keine Zwischenüberschriften. Aus seiner Bilderliste
 * (`261012_jakobsax.de_WebsiteBilder.xlsx`); „Theater" auf Jans Ansage als
 * eigene Kategorie. „Journalismus" heißt in der Liste „SWR" — umbenannt,
 * weil STRG_F vom NDR ist.
 */
export const KATEGORIEN = ["festival", "theater", "paddeln", "journalismus"] as const;

export type Kategorie = (typeof KATEGORIEN)[number];

/**
 * Eine Fotoarbeit. Ihre Bilder liegen im Bucket unter
 * `original/arbeiten/<id>.jpg` (das **Startbild**, im Mosaik das erste der
 * Arbeit) und `original/arbeiten/<id>/01.jpg`, `02.jpg`, … — die `id` ist
 * der Ordnername. Kein Bildfeld: Konvention statt Konfiguration, siehe
 * TECH-STACK.md.
 */
export type Fotoarbeit = {
  /** Ordnername im Bucket. Nicht umbenennen, ohne den Ordner mitzunehmen. */
  id: string;
  kategorie: Kategorie;
  /** So, wie Jakob ihn schreibt. Gehört das Jahr dazu, steht es hier. */
  titel: string;
  /**
   * Ohne Rechtsformzusatz (kein „e.V.", keine „GmbH") — UI-SPEC, E10.
   * Fehlt bei Festivals, für die Jakob keinen Auftraggeber genannt hat;
   * dann steht nur der Titel da.
   */
  kunde?: string;
  /**
   * Überschrift je Bild aus Jakobs Liste, meist die Compagnie („Cie.
   * Dyptik"). Schlüssel wie bei `alt`. Die Beschriftung des Bildes wird dann
   * „{Bildtitel} – {Titel}", sonst die der Arbeit.
   */
  bildtitel?: Record<string, string>;
  /**
   * Szenenbeschreibung je Bild, Schlüssel ist der Dateiname ohne Endung
   * (`"01"`, `"02"`, …; das Startbild heißt `"leitbild"`). Fehlt ein
   * Eintrag, setzt die Seite „Titel – Kunde, Bild n" ein — korrekt, aber
   * ohne Information über das Motiv.
   */
  alt?: Record<string, string>;
  /**
   * Bilder, die im Bucket liegen, aber **nicht auf die Seite** sollen —
   * Namen wie bei `alt` (`"leitbild"`, `"01"`, …). Fehlt das Leitbild, wird
   * das erste übrige Bild zum Startbild der Arbeit. Zum Wieder-Einblenden
   * den Namen streichen; die Datei bleibt dafür im Bucket.
   */
  ausblenden?: string[];
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
 * Die Fotoarbeiten. **Die Reihenfolge hier ist die Reihenfolge im Mosaik
 * auf `/foto`** (innerhalb ihrer Kategorie).
 *
 * Seit dem 2026-10-14 nach Jakobs Bilderliste. Die Reihenfolge der Bilder
 * innerhalb einer Arbeit ist die Reihenfolge der Zeilen dort; die erste Zeile
 * ist das Startbild. ⚠️ Gegengelesen ist nur, was in seiner Liste steht.
 *
 * Bewusst NICHT enthalten: die Onetake-Arbeiten (Rechte ungeklärt, siehe
 * TODO.md, Langfristig).
 */
export const FOTOS: Fotoarbeit[] = [
  // ── festival ─────────────────────────────────────────────────────────
  {
    id: "tete-a-tete",
    kategorie: "festival",
    titel: "tête-à-tête",
    bildtitel: {
      leitbild: "Cie. Pau Palaus",
      "01": "SPPI",
      "02": "GOGO home",
      "03": "Chloe Loftus",
      "04": "Roi Borallas",
      "05": "Niels Seidel",
    },
  },
  {
    id: "stamp",
    kategorie: "festival",
    titel: "STAMP",
    /* In der Liste einmal „altonale GmbH", ohne Rechtsform (E10). */
    kunde: "altonale",
    /*
     * ⚠️ Das Bild „Cie. Sept fois la langue" (ONE09024 in Jakobs Liste) lag
     * nicht im Ordner. Das dort liegende ONE09173 zeigt eine Moderation vor
     * einem SWR-Logo und steht deshalb unter `ueber/`, nicht hier.
     */
  },
  {
    id: "at-tension",
    kategorie: "festival",
    titel: "at.tension",
    bildtitel: { leitbild: "Cie. Dyptik", "01": "Cie. Pol & Freddy" },
  },
  {
    id: "stadtfest-karlsruhe",
    kategorie: "festival",
    /* In Jakobs Liste ohne Überschrift; „Stadtfest" aus dem Dateinamen. */
    titel: "Stadtfest",
    kunde: "Karlsruhe Marketing & Event",
  },

  // ── theater ──────────────────────────────────────────────────────────
  {
    id: "welttheater-der-strasse",
    kategorie: "theater",
    titel: "Welttheater der Strasse",
    bildtitel: {
      leitbild: "Commando Percu",
      "01": "Commando Percu",
      "02": "Collectif Malunés",
      "03": "Commando Percu",
      "04": "Collectif Malunés",
      "05": "Circumstances",
      "06": "SPPI",
      "07": "SPPI",
    },
  },

  // ── paddeln ──────────────────────────────────────────────────────────
  {
    id: "wiwawo-53",
    kategorie: "paddeln",
    /* Die 53. Jugend-Wildwasserwoche fand 2026 statt. Kunde so, wie Jakob
       ihn in seiner Liste schreibt. */
    titel: "WiWaWo 2026",
    kunde: "Bayerischer Kanu-Verband",
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
    /* Jakob am 2026-10-15 (über Jan): Gruppenfoto, Lagerfeuer, die drei
       Boote im Wildwasser und den Bus „rausschmeißen". Bleiben 01, 07, 08;
       Startbild ist damit der Wasserfall (01). */
    ausblenden: ["leitbild", "02", "03", "04", "05", "06"],
  },
  {
    id: "wiwawo-52",
    kategorie: "paddeln",
    titel: "WiWaWo 2025",
    kunde: "Bayerischer Kanu-Verband",
  },
  {
    id: "kanu-freestyle-untertuerkheim",
    kategorie: "paddeln",
    titel: "Indoor Kanu Freestyle",
    kunde: "Untertürkheim",
  },

  // ── journalismus ─────────────────────────────────────────────────────
  {
    id: "toedliches-gold",
    kategorie: "journalismus",
    titel: "Tödliches Gold",
    kunde: "Y-Kollektiv/ARD",
    /*
     * Die drei Aufnahmen aus Jakobs Liste (Ghana), am 2026-10-15 nachgereicht.
     * Reihenfolge so, wie Jan sie geschickt hat: Schmelzer = Startbild, dann
     * Arbeiter an der Pumpe, dann das Porträt. ⚠️ Erscheint erst, wenn die
     * Bilder im Bucket liegen (TODO.md, Jan). Bis 2026-10-14 stand hier ein
     * gezeichneter Goldbarren als Platzhalter.
     *
     * ⚠️ Szenenbeschreibungen von Claude, **nicht von Jakob freigegeben**.
     */
    alt: {
      leitbild:
        "Ein Mann mit Mundschutz und Sonnenbrille auf der Stirn schmilzt mit einem Brenner Gold in einer kleinen Schale, daneben ein dunkler Barren",
      "01": "Ein Arbeiter in schlammverschmierter Kleidung steht von hinten gesehen, die Hände in den Hüften, neben einer Pumpe in einer aufgewühlten Lehmgrube",
      "02": "Ein Arbeiter mit verschränkten Armen, Gesicht und Arme voller Staub, steht in einer Grube zwischen Erdwänden und orangefarbenen Rohren",
    },
  },
  /*
   * STRG_F und Tagesthemen: am 2026-10-14 offline genommen (Interviewpartner
   * im Bild, Rechte ungeklärt), am 2026-10-15 von Jakob freigegeben
   * („STRG_F geht klar … der andere … geht klar"). ⚠️ Die Bilder wurden aus
   * dem Bucket gelöscht und müssen neu hochgeladen werden (TODO.md, Jan) —
   * bis dahin erscheinen die beiden nicht (kein Bild, keine Kachel).
   */
  {
    id: "strg-f",
    kategorie: "journalismus",
    titel: "STRG_F",
    kunde: "NDR/ARD für funk",
  },
  {
    id: "tagesthemen",
    kategorie: "journalismus",
    titel: "Tagesthemen",
    kunde: "ARD/SWR",
  },
];

/**
 * Bilder für `/ueber` (`original/ueber/01.jpg`, …): laut Jakobs Liste „nicht
 * unter Fotos & Startseite anzeigen". Beschriftung je Bild aus der Liste.
 * Ohne Eintrag erscheint das Bild mit „Jakob Sax" als Beschriftung.
 */
export const UEBER_BILDER: Record<string, string> = {
  "01": "Tödliches Gold – Y-Kollektiv/ARD",
  "02": "STRG_F – NDR für funk",
  "03": "Maimarkt Mannheim LIVE – SWR",
  "04": "Maimarkt Mannheim LIVE – SWR",
  /* "05" ist ONE09173, nicht in Jakobs Liste — Moderation vor einem SWR-Logo. */
};

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
