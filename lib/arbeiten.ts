import { BILDER, AUSSCHNITT_MITTIG, type Bildquelle, type Streckenbild } from "./bilder";
import "./content"; // Prüft lib/inhalt.json beim Build — siehe dort.
import { INHALT, bildName, istVerborgen, type Film, type Fotoarbeit, type Inhalt } from "./inhalt";

/**
 * Ableitungen aus den Arbeiten — die einzige Stelle, an der aus `lib/inhalt.json`
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

/**
 * Wogegen gerechnet wird: der Inhalt und das Manifest der Bilder.
 *
 * Standard ist der eingecheckte Stand (`STANDARD`). Die Verwaltung unter
 * `/admin` reicht ihren **ungespeicherten** Inhalt und das Manifest von
 * `main` herein — so zeigt die Vorschau dort genau das, was die Seite nach
 * dem Speichern zeigen wird, mit derselben Regel statt einer Kopie davon.
 */
export type Kontext = { inhalt: Inhalt; bilder: Record<string, Bildquelle> };
export const STANDARD: Kontext = { inhalt: INHALT, bilder: BILDER };

/** Ausschnitt eines Bildes aus dem Kontext, sonst mittig. */
function ausschnitt(k: Kontext, schluessel: string): string {
  return k.inhalt.bildausschnitte[schluessel] ?? AUSSCHNITT_MITTIG;
}

/**
 * Alle Schlüssel eines Ordners, **ohne** Unterordner, alphabetisch — also
 * `01`, `02`, … (deshalb die führende Null, siehe TECH-STACK.md).
 */
function ordner(k: Kontext, praefix: string): Streckenbild[] {
  return Object.keys(k.bilder)
    .filter((s) => s.startsWith(praefix) && !s.slice(praefix.length).includes("/"))
    .sort()
    .map((schluessel) => ({
      schluessel,
      quelle: k.bilder[schluessel],
      ausschnitt: ausschnitt(k, schluessel),
    }));
}

/** Ein Bild im Mosaik, mit allem, was Kachel und Lichtkasten brauchen. */
export type Mosaikbild = Streckenbild & {
  /**
   * Was beim Überfahren und im Lichtkasten steht: „Titel – Kunde" der Arbeit,
   * oder „{Bildtitel} – {Titel}", wenn das Bild eine eigene Überschrift hat
   * (meist die Compagnie).
   */
  beschriftung: string;
  /** Zu welcher Arbeit das Bild gehört (`"ueber"` auf `/ueber`). */
  arbeit: string;
  /**
   * Alt-Text: die Szenenbeschreibung, gefolgt von der Beschriftung — oder,
   * wenn es keine gibt, „Titel – Kunde, Bild n". Die Beschriftung steckt in
   * beiden Fällen darin, damit ein Screenreader auch ohne Überfahren
   * erfährt, zu welcher Arbeit das Bild gehört.
   */
  alt: string;
};

/**
 * **Alle** Bilder einer Arbeit in ihrer natürlichen Reihenfolge, auch
 * ausgeblendete: zuerst das Startbild (`arbeiten/<id>`), dann `01`, `02`, …
 * Für die Verwaltung und als Grundlage der Reihenfolge neuer Bilder.
 */
export function alleBilderDerArbeit(arbeit: Fotoarbeit, k: Kontext = STANDARD): Streckenbild[] {
  const liste: Streckenbild[] = [];
  const startbild = `arbeiten/${arbeit.id}`;
  if (k.bilder[startbild]) {
    liste.push({ schluessel: startbild, quelle: k.bilder[startbild], ausschnitt: ausschnitt(k, startbild) });
  }
  return [...liste, ...ordner(k, `arbeiten/${arbeit.id}/`)];
}

/**
 * Die **sichtbaren** Bilder einer Fotoarbeit (weder ausgeblendet noch im
 * Papierkorb), in natürlicher Reihenfolge, mit Beschriftung und Alt-Text.
 * „Bild n" zählt, was zu sehen ist.
 */
export function bilderDerArbeit(arbeit: Fotoarbeit, k: Kontext = STANDARD): Mosaikbild[] {
  const text = beschriftung(arbeit);
  return alleBilderDerArbeit(arbeit, k)
    .filter((b) => !istVerborgen(k.inhalt, b.schluessel))
    .map((bild, i) => {
      const name = bildName(bild.schluessel);
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
 * Die Arbeiten, die erscheinen — also mindestens ein sichtbares Bild haben.
 * Geordnet nach Kategorie (`foto.kategorien`), darin nach `foto.arbeiten`.
 * Das ist zugleich die **natürliche Ordnung**, nach der Bilder ohne Platz
 * in `foto.reihenfolge` ans Ende des Mosaiks kommen.
 */
export function arbeitenMitBild(k: Kontext = STANDARD): Fotoarbeit[] {
  const { kategorien, arbeiten } = k.inhalt.foto;
  const mitBild = arbeiten.filter((a) => bilderDerArbeit(a, k).length > 0);
  return kategorien.flatMap((kat) => mitBild.filter((a) => a.kategorie === kat));
}

/**
 * Sortiert nach einer Wunschliste: Was in `reihenfolge` steht, kommt in
 * deren Reihenfolge; was fehlt, **danach** in seiner natürlichen Ordnung.
 * Stabil — gleich eingeordnete Bilder behalten ihre Reihenfolge.
 */
export function nachWunsch<T extends { schluessel: string }>(natuerlich: T[], reihenfolge: string[]): T[] {
  const platz = new Map(reihenfolge.map((s, i) => [s, i]));
  return natuerlich
    .map((b, i) => ({ b, i, p: platz.get(b.schluessel) ?? Number.POSITIVE_INFINITY }))
    .sort((x, y) => (x.p === y.p ? x.i - y.i : x.p - y.p))
    .map(({ b }) => b);
}

/**
 * Das ganze Mosaik auf `/foto`, **in Jakobs Reihenfolge**
 * (`foto.reihenfolge`, seit 2026-10-17 frei über Arbeiten hinweg).
 * Ausgeblendetes und Gelöschtes fehlt; Bilder ohne Platz in der Liste
 * (frisch hochgeladen) kommen ans Ende — nach Kategorie, Arbeit und
 * Dateiname. Die Kategorien stehen nirgends dran.
 */
export function fotosFuerMosaik(k: Kontext = STANDARD): Mosaikbild[] {
  return nachWunsch(
    arbeitenMitBild(k).flatMap((a) => bilderDerArbeit(a, k)),
    k.inhalt.foto.reihenfolge,
  );
}

/**
 * Die Bilder im Hero von `/foto`, in der Reihenfolge von `foto.hero`.
 * Schlüssel ohne (sichtbares) Bild fallen weg, statt eine Lücke in die
 * Folge zu reißen — die Prüfung warnt davor.
 */
export function fotosFuerHero(k: Kontext = STANDARD): Mosaikbild[] {
  const alle = fotosFuerMosaik(k);
  return k.inhalt.foto.hero.flatMap((s) => alle.find((b) => b.schluessel === s) ?? []);
}

/** Fotoarbeiten, die nichts zeigen — für Warnungen. */
export function fotoarbeitenOhneBild(k: Kontext = STANDARD): Fotoarbeit[] {
  return k.inhalt.foto.arbeiten.filter((a) => bilderDerArbeit(a, k).length === 0);
}

/**
 * Die Bilder auf `/ueber` (`original/ueber/01.jpg`, …) in der Reihenfolge
 * von `ueber.reihenfolge`, mit der Beschriftung aus `ueber.bilder`.
 */
export function bilderFuerUeber(k: Kontext = STANDARD): Mosaikbild[] {
  const sichtbar = ordner(k, "ueber/").filter((b) => !istVerborgen(k.inhalt, b.schluessel));
  return nachWunsch(sichtbar, k.inhalt.ueber.reihenfolge).map((b, i) => {
    const zeile = k.inhalt.ueber.bilder[b.schluessel] ?? "Jakob Sax";
    return {
      ...b,
      beschriftung: zeile,
      arbeit: "ueber",
      alt: `Jakob Sax bei der Arbeit – ${zeile}, Bild ${i + 1}`,
    };
  });
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
 * Die Filme **in der Reihenfolge von `filme`** in `lib/inhalt.json`. Ohne Standbild erscheint ein
 * Film nicht — auch dann nicht, wenn der Link stimmt.
 */
export function filmeMitStandbild(k: Kontext = STANDARD): Filmkachel[] {
  return k.inhalt.filme.flatMap((film) => {
    const standbild = k.bilder[`film/${film.id}`];
    if (!standbild) return [];
    return [
      {
        ...film,
        beschriftung: beschriftung(film),
        standbild,
        ausschnitt: ausschnitt(k, `film/${film.id}`),
        ziel: zielDesLinks(film.link),
      },
    ];
  });
}

/** Filme ohne Standbild — für Warnungen. */
export function filmeOhneStandbild(k: Kontext = STANDARD): Film[] {
  return k.inhalt.filme.filter((f) => !k.bilder[`film/${f.id}`]);
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
