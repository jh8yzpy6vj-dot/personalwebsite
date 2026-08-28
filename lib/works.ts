import { WORKS, type Category, type Work } from "./content";

/**
 * Ableitungen aus den Arbeiten.
 *
 * Bewusst hier und nicht in den Komponenten: `content.ts` bleibt die einzige
 * Inhaltsquelle, dieses Modul die einzige Stelle, an der aus ihr etwas
 * abgeleitet wird (Filtern, Sortieren, Slug-Auflösung). Sonst wandert Logik
 * in die Views und dieselbe Sortierung existiert dreimal leicht verschieden.
 */

/**
 * Jahr als Zahl. `year` ist ein String, weil dort auch „seit 2026" stehen
 * kann — für Sortierung und Anzeige brauchen wir daraus eine Zahl.
 */
export function yearOf(work: Work): number {
  const match = work.year.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

/** Neueste zuerst. Bei gleichem Jahr bleibt die Reihenfolge aus `content.ts`. */
export function byNewest(works: Work[] = WORKS): Work[] {
  return [...works].sort((a, b) => yearOf(b) - yearOf(a));
}

/**
 * Die neuesten n Arbeiten, gemischt über alle Bereiche — für den
 * `zuletzt.`-Block auf der Startseite.
 *
 * Das ist das Aktualitätssignal, nicht die Gliederung des Archivs: Sortiert
 * wird dort nach Kategorie, weil niemand fragt „was hat er 2024 gemacht?",
 * sondern „hat er sowas wie meins schon gemacht?" (siehe SITE-PLAN.md).
 */
export function latest(n: number): Work[] {
  return byNewest().slice(0, n);
}

export function byCategory(category: Category): Work[] {
  return byNewest(WORKS.filter((w) => w.category === category));
}

/** Die `id` aus `content.ts` ist der URL-Slug — deshalb URL-stabil halten. */
export function bySlug(slug: string): Work | undefined {
  return WORKS.find((w) => w.id === slug);
}

export function allSlugs(): string[] {
  return WORKS.map((w) => w.id);
}

/** Metazeile einer Kachel: lässt fehlende Felder weg statt leere Trenner. */
export function metaLine(work: Work): string {
  return [work.place, work.role, work.year].filter(Boolean).join(" · ");
}

/**
 * Vorherige und nächste Arbeit **innerhalb derselben Kategorie**.
 *
 * Ohne das ist jede Detailseite eine Sackgasse — man kann nur zurück. Wer
 * eine Festivalarbeit anschaut, will die nächste Festivalarbeit sehen, nicht
 * einen Radiobeitrag; deshalb innerhalb der Kategorie und nicht global.
 *
 * Bewusst **ohne Umlauf**: Am Ende der Liste ist Schluss. Ein Ring würde
 * vortäuschen, es ginge endlos weiter, und man liefe im Kreis, ohne es zu
 * merken.
 */
export function neighbours(work: Work): { prev?: Work; next?: Work } {
  const liste = byCategory(work.category);
  const i = liste.findIndex((w) => w.id === work.id);
  if (i === -1) return {};
  return { prev: liste[i - 1], next: liste[i + 1] };
}

/** Arbeiten zu einer Leistung, in der Reihenfolge der `works`-Liste. */
export function forService(ids: readonly string[]): Work[] {
  return ids.map(bySlug).filter((w): w is Work => Boolean(w));
}
