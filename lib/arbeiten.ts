import {
  FILME,
  FOTO_HERO,
  FOTOS,
  KATEGORIEN,
  UEBER_BILDER,
  type Film,
  type Fotoarbeit,
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
 * 1. **Beschriftung „Titel – Kunde"** — `beschriftung()`.
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
  /** Zu welcher Arbeit das Bild gehört. */
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

  const aus = new Set(arbeit.ausblenden);
  return liste.filter(({ name }) => !aus.has(name)).map(({ name, bild }, i) => {
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

/**
 * Die Arbeiten, die erscheinen — also mindestens ein Bild haben. Geordnet
 * nach Kategorie (`KATEGORIEN`), darin nach `FOTOS`.
 */
export function arbeitenMitBild(fotos: Fotoarbeit[] = FOTOS): Fotoarbeit[] {
  const mitBild = fotos.filter((a) => bilderDerArbeit(a).length > 0);
  return KATEGORIEN.flatMap((k) => mitBild.filter((a) => a.kategorie === k));
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
 * Das ganze Mosaik auf `/foto`: alle Fotoarbeiten **nach Kategorie**
 * (`KATEGORIEN`), darin in der Reihenfolge von `FOTOS`, jede mit ihren
 * Bildern. Arbeiten ohne Bild fallen dabei von selbst heraus. Die
 * Kategorien stehen nirgends dran — Jakob: ein Mosaik, keine Grenzen.
 */
export function fotosFuerMosaik(fotos: Fotoarbeit[] = FOTOS): Mosaikbild[] {
  return arbeitenMitBild(fotos).flatMap(bilderDerArbeit);
}

/**
 * Die Bilder im Hero von `/foto`, in der Reihenfolge von `FOTO_HERO`.
 * Schlüssel ohne Bild fallen weg, statt eine Lücke in die Folge zu reißen.
 */
export function fotosFuerHero(
  schluessel: string[] = FOTO_HERO,
  fotos: Fotoarbeit[] = FOTOS,
): Mosaikbild[] {
  const alle = fotosFuerMosaik(fotos);
  return schluessel.flatMap((k) => alle.find((b) => b.schluessel === k) ?? []);
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
