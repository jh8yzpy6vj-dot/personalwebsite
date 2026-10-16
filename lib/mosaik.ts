/**
 * Spaltengewichte und Verteilung des Mosaiks (app/components/Mosaik.tsx).
 * Eigene Datei, damit die Verteilung ohne React testbar ist.
 */

/**
 * Breitengewichte der Spalten (UI-SPEC, „Mosaik"). ⚠️ Absichtlich ungleich —
 * warum, steht in Mosaik.module.css. Sie stehen hier und nicht im CSS, weil
 * die Verteilung mit ihnen rechnet; Mosaik.tsx setzt sie je Spalte als `flex`.
 */
export const GEWICHTE = [1.18, 0.9, 1.12, 0.96];

/** Rechenbreite des Mosaiks in px (die größte Inhaltsbreite von `/foto`) und
    der Abstand darin (`--space-lg`). Es kommt nur aufs Verhältnis an. */
const RECHENBREITE = 1600;
const ABSTAND = 24;

type Masse = { quelle: { breite: number; hoehe: number } };

/**
 * Verteilt die Bilder auf die Spalten: jedes in die Spalte, die gerade am
 * kürzesten ist, bei Gleichstand in die linke. Die erste Reihe liest sich
 * damit 1-2-3(-4) wie bisher.
 *
 * ⚠️ **Bis zum 2026-10-16 lief das stur reihum** (Bild 4 → Spalte 1, egal
 * was). Das ignoriert die Formate: Auf `/foto` endeten die vier Spalten bei
 * 1440px um bis zu 1200px versetzt, unten stand eine Spalte mehrere Bilder
 * lang allein. Jan: „sie ist verbuggt."
 *
 * Gerechnet wird beim Rendern aus den Maßen im Manifest — im Browser läuft
 * dafür kein Skript, der Spaltensatz bleibt reines CSS.
 */
export function verteile<T extends Masse>(bilder: T[], gewichte: number[]) {
  const summe = gewichte.reduce((a, b) => a + b, 0);
  const nutzbar = RECHENBREITE - (gewichte.length - 1) * ABSTAND;
  const breiten = gewichte.map((g) => (nutzbar * g) / summe);
  const hoehen = gewichte.map(() => 0);
  const spalten: { bild: T; i: number }[][] = gewichte.map(() => []);
  bilder.forEach((bild, i) => {
    let s = 0;
    for (let k = 1; k < hoehen.length; k++) if (hoehen[k] < hoehen[s] - 0.5) s = k;
    spalten[s].push({ bild, i });
    hoehen[s] += (breiten[s] * bild.quelle.hoehe) / bild.quelle.breite + ABSTAND;
  });
  return spalten;
}
