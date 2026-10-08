import { FILME, FOTOS, type Film, type Fotoarbeit } from "./content";
import {
  ausschnittAus,
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
 * 1. **Pro Arbeit genau zwei Angaben: Titel und Kunde** — `beschriftung()`.
 * 2. **Was kein Bild hat, erscheint nicht.** Eine Seite, die nur aus Bildern
 *    besteht, darf keine grauen Platzhalterkacheln zeigen. Was fehlt, meldet
 *    `npm run medien`.
 */

/**
 * „Titel – Kunde": Halbgeviertstrich (U+2013) mit je einem Leerzeichen.
 * Das ist die einzige Beschriftung, die eine Arbeit auf der Seite trägt.
 */
export function beschriftung(a: { titel: string; kunde: string }): string {
  return `${a.titel} – ${a.kunde}`;
}

/** Ein Bild im Mosaik auf `/foto`, mit allem, was Kachel und Lichtkasten brauchen. */
export type Mosaikbild = Streckenbild & {
  /** „Titel – Kunde" der Arbeit, zu der das Bild gehört. */
  beschriftung: string;
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
    return {
      ...bild,
      beschriftung: text,
      alt: szene ? `${szene} – ${text}` : `${text}, Bild ${i + 1}`,
    };
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
