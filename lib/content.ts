/**
 * Single source of truth für alle Inhalte der Seite.
 *
 * ⚠️ WICHTIG: Alle Angaben hier stammen aus dem Briefing-Dokument und sind
 * NOCH NICHT von Jakob freigegeben. Vor dem Livegang gegenprüfen lassen
 * (siehe TODO.md). Nichts hier erfinden — nur belegte Angaben eintragen.
 */

/** Pfad zum Hero-Video in /public. `null` = Platzhalter wird angezeigt. */
export const HERO_VIDEO: string | null = null;

/** Pfad zum Poster-/Fallback-Bild des Heros. `null` = reiner Farbverlauf. */
export const HERO_POSTER: string | null = null;

export const SITE = {
  name: "jakob sax",
  /** Eigene Selbstbeschreibung (Instagram-Bio), bewusst kleingeschrieben. */
  positioning: "fotografie für kultur & theater im öffentlichen raum",
  locations: "rastatt · stuttgart",
} as const;

export type Category = "festivals" | "bewegtbild" | "redaktion";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "festivals", label: "festivals." },
  { id: "bewegtbild", label: "bewegtbild." },
  { id: "redaktion", label: "redaktion." },
];

export type Work = {
  id: string;
  category: Category;
  /** Auftraggeber bzw. Sender — steht als Label über dem Titel. */
  client: string;
  title: string;
  /** Ort bzw. Spielort. Leer lassen, wenn nicht belegt — nicht erfinden. */
  place?: string;
  year: string;
  /** Eigene Rolle. Pflichtangabe — Credit-Kultur, siehe Briefing. */
  role: string;
  /** Bildpfad in /public. `null` = Platzhalter-Kachel. */
  image: string | null;
  /** Beschreibt die Szene — Barrierefreiheit und SEO. */
  alt?: string;
};

/**
 * Arbeiten. Bewusst NICHT enthalten: die Onetake-Arbeiten (Kath. Kirche
 * Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele) —
 * dafür ist laut Briefing erst eine Freigabe nötig, weil sie über eine Firma
 * liefen, an der Jakob nicht mehr beteiligt ist.
 */
export const WORKS: Work[] = [
  {
    id: "tete-a-tete-2026",
    category: "festivals",
    client: "tête-à-tête",
    title: "Straßentheaterfestival Rastatt",
    place: "Rastatt",
    year: "2026",
    role: "Fotografie",
    image: null,
    alt: "Höhenartistik über dem Ehrenhof des Rastatter Schlosses",
  },
  {
    id: "wiwawo-52",
    category: "bewegtbild",
    client: "Bayerischer Kanu-Verband",
    title: "52. Jugend-Wildwasserwoche",
    place: "Pfunds, Tirol",
    year: "2025",
    role: "Kamera, Schnitt",
    image: null,
  },
  {
    id: "wiwawo-51",
    category: "bewegtbild",
    client: "Bayerischer Kanu-Verband",
    title: "51. Jugend-Wildwasserwoche",
    year: "2024",
    role: "Kamera, Schnitt",
    image: null,
  },
  {
    id: "wiwawo-50",
    category: "bewegtbild",
    client: "Bayerischer Kanu-Verband",
    title: "50. Jugend-Wildwasserwoche",
    year: "2023",
    role: "Kamera, Schnitt",
    image: null,
  },
  {
    id: "bkv-filmworkshop",
    category: "bewegtbild",
    client: "Bayerischer Kanu-Verband",
    title: "Filmworkshop mit Jugendlichen",
    year: "2024",
    role: "Workshopleitung",
    image: null,
  },
  {
    id: "swr-klima",
    category: "redaktion",
    client: "SWR",
    title: "Klimaredaktion, Wirtschaft und Umwelt",
    place: "Stuttgart",
    year: "seit 2026",
    role: "Redaktion, Hörfunk und Online",
    image: null,
  },
  {
    id: "ard-aktuell-ltw",
    category: "redaktion",
    client: "ARD aktuell",
    title: "Landtagswahl Baden-Württemberg",
    place: "Stuttgart",
    year: "2026",
    role: "Redaktion",
    image: null,
  },
  {
    id: "strg-f",
    category: "redaktion",
    client: "NDR — STRG_F / Panorama",
    title: "Reportage über einen Rechtsextremisten",
    year: "2025",
    role: "Recherche und Kamera",
    image: null,
  },
  {
    id: "swr-heimat",
    category: "redaktion",
    client: "SWR Heimat",
    title: "Porträt eines katholischen Pfarrers",
    year: "2025",
    role: "Beitrag im Team",
    image: null,
  },
];

export type Service = {
  id: string;
  title: string;
  audience: string;
  description: string;
  /** Konkrete Eckdaten. Preise erst eintragen, wenn Jakob sie festgelegt hat. */
  facts: string[];
};

export const SERVICES: Service[] = [
  {
    id: "fotos",
    title: "festival- & bühnenfotos.",
    audience: "Festivals, Compagnien, Kulturämter",
    description:
      "Fotografie von Auftritten im öffentlichen Raum — Höhenartistik, Stelzentheater, Feuerperformance, Publikum. Ein Moment auf dem Hochseil passiert genau einmal.",
    facts: [
      "Auswahl über eine Online-Galerie",
      "Lieferzeit: noch festzulegen",
      "Nutzungsrechte: noch festzulegen",
    ],
  },
  {
    id: "bewegtbild",
    title: "bewegtbild & aftermovie.",
    audience: "Veranstalter, Kulturämter, Verbände",
    description:
      "Filme, die einen Zweck haben — beim Bayerischen Kanu-Verband ging es um Nachwuchs- und Mitgliedergewinnung, nicht um Dekoration.",
    facts: [
      "Konzept, Kamera und Schnitt aus einer Hand",
      "Lieferzeit: noch festzulegen",
      "Nutzungsrechte: noch festzulegen",
    ],
  },
  {
    id: "workshops",
    title: "filmworkshops.",
    audience: "Jugendarbeit, Vereine, Verbände",
    description:
      "Mehrtägige Workshops, in denen die Teilnehmenden selbst konzipieren, drehen und schneiden. Beim Bayerischen Kanu-Verband entstanden so eine Doku und ein Werbeclip.",
    facts: [
      "Dauer: nach Absprache",
      "Ab acht Teilnehmenden",
      "Konditionen: noch festzulegen",
    ],
  },
];

/** Referenzzeile. Nur belegte Auftraggeber — siehe Hinweis bei WORKS. */
export const REFERENCES: string[] = [
  "tête-à-tête Rastatt",
  "Bayerischer Kanu-Verband",
];

export const ABOUT = {
  paragraphs: [
    "Ich arbeite als Journalist beim SWR in Stuttgart, in der Klimaredaktion und in der Abteilung Wirtschaft und Umwelt.",
    "Davor: 18 Monate Volontariat mit Stationen in Stuttgart, Mainz, Rastatt, Hamburg, Mannheim und Bremen. Sechs Wochen davon bei STRG_F und Panorama – Die Reporter beim NDR, dort auch an der Kamera. Zum Abschluss vier Wochen bei ARD aktuell während der Landtagswahl in Baden-Württemberg.",
    "Dieselbe Aufmerksamkeit bringe ich auf den Festivalplatz mit: antizipieren, warten, im richtigen Moment auslösen. Beim Straßentheater gibt es keinen zweiten Take.",
  ],
  authorPageLabel: "SWR-Autorenseite",
  authorPageUrl: "https://www.swr.de/swraktuell/autor-jakob-sax-100.html",
} as const;

/**
 * Kontakt. ⚠️ Alle Werte sind Platzhalter — echte Daten erst eintragen,
 * wenn Jakob sie freigibt (E-Mail, Telefon, vertrauliche Kanäle, Anschrift).
 */
export const CONTACT = {
  booking: {
    heading: "buchungsanfragen.",
    /** Primary CTA — Verb + Nomen, siehe design/UI-SPEC.md. */
    cta: "E-Mail schreiben",
    email: "hallo@jakobsax.media",
    note: "Für Anfragen von Festivals, Kulturämtern, Veranstaltern und Compagnien.",
  },
  confidential: {
    heading: "vertraulich.",
    note: "Für Hinweise an mich als Journalist. Ich behandle Quellen vertraulich und nenne niemanden ohne Absprache.",
    channels: ["Signal: noch einzutragen", "Threema: noch einzutragen", "PGP: noch einzutragen"],
  },
  instagram: {
    label: "@jakobsax.media",
    url: "https://www.instagram.com/jakobsax.media/",
  },
} as const;
