import { heroArtVon, INHALT, type Film, type Fotoarbeit } from "./inhalt";
import { nurFehler, pruefeInhalt } from "./inhalt-pruefen";
import { BILDER } from "./bilder";

/**
 * Die Inhalte der Seite unter ihren gewohnten Namen.
 *
 * ⚠️ **Seit dem 2026-10-17 stehen die Inhalte nicht mehr hier, sondern in
 * `lib/inhalt.json`** — Jakob bearbeitet sie über die Verwaltung unter
 * `/admin`, die genau diese Datei per Git-Commit zurückschreibt. Typen und
 * Feldbeschreibungen: `lib/inhalt.ts`. Diese Datei reicht den Stand nur
 * unter den alten Namen weiter, damit Seiten und Komponenten unverändert
 * bleiben, und **prüft ihn beim Build**.
 *
 * ⚠️ WICHTIG (unverändert seit dem Umbau): Nichts ist von Jakob freigegeben,
 * solange er es nicht ausdrücklich bestätigt hat. Nichts erfinden — nur
 * belegte Angaben eintragen. Was von Claude stammt, trägt in der Datei eine
 * `notiz`, die die Verwaltung anzeigt.
 */

/*
 * ⚠️ **Die Prüfung beim Build.** Jede Seite importiert diese Datei, also
 * läuft das hier in `next build`. Ein Fehler bricht den Build ab, und
 * Cloudflare lässt die alte Fassung online — ein kaputter Stand aus der
 * Verwaltung (oder von Hand) geht so nie live. Dieselben Regeln prüft die
 * Verwaltung schon vor dem Speichern; das hier ist das Netz darunter.
 */
const FEHLER = nurFehler(pruefeInhalt(INHALT, Object.keys(BILDER)));
if (FEHLER.length > 0) {
  throw new Error(
    `lib/inhalt.json ist ungültig:\n${FEHLER.map((f) => `  - ${f.ort}: ${f.text}`).join("\n")}`,
  );
}

export type { Film, Fotoarbeit };
/** Seit 2026-10-17 frei benennbar (in der Verwaltung), also `string`. */
export type Kategorie = string;

export const HERO_ART: "foto" | "video" = heroArtVon(INHALT.startseite);
export const HERO_VIDEO: string | null = INHALT.startseite.heroVideo;
export const HERO_ALT: string | null = INHALT.startseite.heroAlt;
export const HERO_ERSATZ: string | null = INHALT.startseite.heroErsatz;
export const SITE = INHALT.seite;
export const WEGE: { foto: string | null; film: string | null } = INHALT.startseite.wege;
export const HIGHLIGHTS: (string | null)[] = INHALT.startseite.highlights;
export const FOTO_HERO: string[] = INHALT.foto.hero;
export const KATEGORIEN: string[] = INHALT.foto.kategorien;
export const FOTOS: Fotoarbeit[] = INHALT.foto.arbeiten;
export const FILME: Film[] = INHALT.filme;

export const ABOUT = {
  zeilen: INHALT.ueber.zeilen,
  portraitAlt: INHALT.ueber.portraitAlt,
  email: INHALT.ueber.email,
  instagram: INHALT.ueber.instagram,
  swr: INHALT.ueber.swr,
};
