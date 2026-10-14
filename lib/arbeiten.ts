import {
  FILME,
  FOTOS,
  KATEGORIEN,
  TEXT_FOLGT,
  UEBER_BILDER,
  type Film,
  type Fotoarbeit,
  type Kategorie,
} from "./content";
import {
  ausschnittAus,
  bilderImOrdner,
  bildstreckeZurArbeit,
  leitbildZurArbeit,
  standbildZumFilm,
  type Bildquelle,
  type Streckenbild,
} from "./bilder";

/**
 * Ableitungen aus den Arbeiten — die einzige Stelle, an der aus `content.ts`
 * etwas für die Seiten berechnet wird. Sonst wandert Logik in die Views und
 * dieselbe Regel steht dreimal leicht verschieden da.
 *
 * Zwei Regeln aus dem UI-SPEC stecken hier:
 *
 * 1. **Beschriftung „Titel – Kunde"** — `beschriftung()`. Seit dem 2026-10-14
 *    kommt auf der Detailseite der Textkasten dazu (`textDerArbeit()`).
 * 2. **Was kein Bild hat, erscheint nicht.** Eine Seite, die nur aus Bildern
 *    besteht, darf keine grauen Platzhalterkacheln zeigen. Was fehlt, meldet
 *    `npm run medien`.
 */

/**
 * „Titel – Kunde": Halbgeviertstrich (U+2013) mit je einem Leerzeichen.
 * Das ist die einzige Beschriftung, die eine Arbeit auf der Seite trägt.
 */
export function beschriftung(a: { titel: string; kunde?: string }): string {
  /* Ohne Kunde (Festivals, für die Jakob keinen genannt hat) nur der Titel —
     ein „tête-à-tête – " mit leerem Ende sähe nach Fehler aus. */
  return a.kunde ? `${a.titel} – ${a.kunde}` : a.titel;
}

/** Ein Bild im Mosaik, mit allem, was Kachel und Lichtkasten brauchen. */
export type Mosaikbild = Streckenbild & {
  /**
   * Was beim Überfahren und im Lichtkasten steht: „Titel – Kunde" der Arbeit,
   * oder „{Bildtitel} – {Titel}", wenn Jakobs Liste dem Bild eine eigene
   * Überschrift gibt (meist die Compagnie).
   */
  beschriftung: string;
  /** Zu welcher Arbeit das Bild gehört — für Verweise auf die Detailseite. */
  arbeit: string;
  /**
   * Alt-Text: die Szenenbeschreibung aus `content.ts`, gefolgt von der
   * Beschriftung — oder, wenn es keine gibt, „Titel – Kunde, Bild n".
   * Die Beschriftung steckt in beiden Fällen darin, damit ein Screenreader
   * auch ohne Überfahren erfährt, zu welcher Arbeit das Bild gehört.
   */
  alt: string;
};

/**
 * Alle Bilder einer Fotoarbeit in Anzeigereihenfolge: zuerst das Bild ohne
 * Nummer (`original/arbeiten/<id>.jpg`), falls es eines gibt, dann
 * `01`, `02`, … nach Dateiname.
 */
export function bilderDerArbeit(arbeit: Fotoarbeit): Mosaikbild[] {
  const text = beschriftung(arbeit);
  const leitbild = leitbildZurArbeit(arbeit.id);
  const liste: { name: string; bild: Streckenbild }[] = [];

  if (leitbild) {
    const schluessel = `arbeiten/${arbeit.id}`;
    liste.push({
      name: "leitbild",
      bild: { schluessel, quelle: leitbild, ausschnitt: ausschnittAus(schluessel) },
    });
  }
  for (const b of bildstreckeZurArbeit(arbeit.id)) {
    liste.push({ name: b.schluessel.slice(b.schluessel.lastIndexOf("/") + 1), bild: b });
  }

  return liste.map(({ name, bild }, i) => {
    const szene = arbeit.alt?.[name];
    const titel = arbeit.bildtitel?.[name];
    const zeile = titel ? `${titel} – ${arbeit.titel}` : text;
    return {
      ...bild,
      beschriftung: zeile,
      arbeit: arbeit.id,
      alt: szene ? `${szene} – ${zeile}` : `${zeile}, Bild ${i + 1}`,
    };
  });
}

/** Eine Fotoarbeit über ihre `id`, oder `null`. */
export function arbeitNach(id: string, fotos: Fotoarbeit[] = FOTOS): Fotoarbeit | null {
  return fotos.find((a) => a.id === id) ?? null;
}

/**
 * Die Arbeiten, die eine Seite haben — also mindestens ein Bild. In der
 * Reihenfolge, in der `/foto` sie zeigt: nach Kategorie (`KATEGORIEN`),
 * darin nach `FOTOS`. Auf diese Reihenfolge stützt sich auch das Blättern
 * zwischen den Detailseiten, damit „nächste" dorthin führt, wo man es von
 * der Übersicht her erwartet.
 */
export function arbeitenMitBild(fotos: Fotoarbeit[] = FOTOS): Fotoarbeit[] {
  const mitBild = fotos.filter((a) => bilderDerArbeit(a).length > 0);
  return KATEGORIEN.flatMap((k) => mitBild.filter((a) => a.kategorie === k.id));
}

/** Eine Kategorie auf `/foto` mit ihren Arbeiten und deren Startbild. */
export type Kategorieblock = {
  id: Kategorie;
  label: string;
  arbeiten: { arbeit: Fotoarbeit; beschriftung: string; startbild: Mosaikbild }[];
};

/**
 * Die Übersicht auf `/foto`: je Kategorie die Arbeiten mit ihrem
 * **Startbild** — dem ersten Bild der Arbeit. Kategorien ohne Arbeit mit
 * Bild fallen weg.
 */
export function uebersicht(fotos: Fotoarbeit[] = FOTOS): Kategorieblock[] {
  const arbeiten = arbeitenMitBild(fotos);
  return KATEGORIEN.map((k) => ({
    id: k.id,
    label: k.label,
    arbeiten: arbeiten
      .filter((a) => a.kategorie === k.id)
      .map((arbeit) => ({
        arbeit,
        beschriftung: beschriftung(arbeit),
        startbild: bilderDerArbeit(arbeit)[0],
      })),
  })).filter((k) => k.arbeiten.length > 0);
}

/** Vorige und nächste Arbeit — in der Reihenfolge von `arbeitenMitBild`. */
export function nachbarn(
  id: string,
  fotos: Fotoarbeit[] = FOTOS,
): { vorher: Fotoarbeit | null; nachher: Fotoarbeit | null } {
  const liste = arbeitenMitBild(fotos);
  const i = liste.findIndex((a) => a.id === id);
  if (i < 0) return { vorher: null, nachher: null };
  return { vorher: liste[i - 1] ?? null, nachher: liste[i + 1] ?? null };
}

/** Der Text im Kasten der Detailseite — Jakobs Text oder `TEXT_FOLGT`. */
export function textDerArbeit(arbeit: Fotoarbeit): string {
  return arbeit.text ?? TEXT_FOLGT;
}

/**
 * Die Bilder auf `/ueber` (`original/ueber/01.jpg`, …), mit der Beschriftung
 * aus `UEBER_BILDER`.
 */
export function bilderFuerUeber(): Mosaikbild[] {
  return bilderImOrdner("ueber").map((b, i) => {
    const nr = b.schluessel.slice(b.schluessel.lastIndexOf("/") + 1);
    const zeile = UEBER_BILDER[nr] ?? "Jakob Sax";
    return { ...b, beschriftung: zeile, arbeit: "ueber", alt: `Jakob Sax bei der Arbeit – ${zeile}, Bild ${i + 1}` };
  });
}

/**
 * Das ganze Mosaik: alle Fotoarbeiten **in der Reihenfolge von `FOTOS`**,
 * jede mit ihren Bildern. Arbeiten ohne Bild fallen dabei von selbst heraus.
 */
export function fotosFuerMosaik(fotos: Fotoarbeit[] = FOTOS): Mosaikbild[] {
  return fotos.flatMap(bilderDerArbeit);
}

/** Fotoarbeiten, zu denen es kein einziges Bild gibt — für Warnungen. */
export function fotoarbeitenOhneBild(fotos: Fotoarbeit[] = FOTOS): Fotoarbeit[] {
  return fotos.filter((a) => bilderDerArbeit(a).length === 0);
}

/** Ein Film auf `/film`, mit Standbild und dem Ziel in Worten. */
export type Filmkachel = Film & {
  beschriftung: string;
  standbild: Bildquelle;
  ausschnitt: string;
  /** „auf YouTube", „in der ARD Mediathek" … — nur für Screenreader. */
  ziel: string;
};

/**
 * Die Filme **in der Reihenfolge von `FILME`**. Ohne Standbild erscheint ein
 * Film nicht — auch dann nicht, wenn der Link stimmt.
 */
export function filmeMitStandbild(filme: Film[] = FILME): Filmkachel[] {
  return filme.flatMap((film) => {
    const standbild = standbildZumFilm(film.id);
    if (!standbild) return [];
    return [
      {
        ...film,
        beschriftung: beschriftung(film),
        standbild,
        ausschnitt: ausschnittAus(`film/${film.id}`),
        ziel: zielDesLinks(film.link),
      },
    ];
  });
}

/** Filme ohne Standbild — für Warnungen. */
export function filmeOhneStandbild(filme: Film[] = FILME): Film[] {
  return filme.filter((f) => !standbildZumFilm(f.id));
}

/**
 * Wohin ein Filmlink führt, in Worten: „auf YouTube", „auf Vimeo",
 * „in der ARD Mediathek". Steht nur für Screenreader hinter der
 * Beschriftung — Sehende sehen ein ↗. Unbekannte Adressen nennen ihren
 * Hostnamen, statt etwas zu behaupten.
 */
export function zielDesLinks(link: string): string {
  let host: string;
  try {
    host = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "extern";
  }
  const ist = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (ist("youtube.com") || ist("youtu.be")) return "auf YouTube";
  if (ist("vimeo.com")) return "auf Vimeo";
  if (ist("ardmediathek.de")) return "in der ARD Mediathek";
  if (ist("zdf.de")) return "in der ZDF Mediathek";
  if (ist("swr.de")) return "beim SWR";
  if (ist("ndr.de")) return "beim NDR";
  return `auf ${host}`;
}
