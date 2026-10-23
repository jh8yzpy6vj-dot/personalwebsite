import type { Bildquelle } from "./bilder";
import type { Videoquelle } from "./video";

/**
 * ⚠️ **Übergang: das Video oben liegt im Repo** (seit 2026-10-23) — eine
 * bewusste, einmalige Ausnahme von „kein Video im Git" (TECH-STACK.md,
 * „Medien").
 *
 * Jan wollte Jakobs Video sofort live haben; Hochladen in der Verwaltung ist
 * aber noch nicht eingerichtet, und aus der Cloud-Sitzung gibt es keinen
 * Zugang zum Bucket. Deshalb liegt die fertig umgerechnete Fassung
 * (`scripts/video.mjs`, 7,1 MB) unter `public/uebergang/hero/` und wird
 * vom Worker selbst ausgeliefert — gleiche Herkunft, keine Anfrage an Dritte.
 *
 * **Vorrang hat immer der Bucket:** Steht `hero/film` im Manifest (Jakob hat
 * über die Verwaltung hochgeladen, oder Jan von Hand), gilt das, und diese
 * Dateien werden nicht mehr benutzt. Dann `public/uebergang/` und diese
 * Datei löschen (TODO.md). Aus dem Git-Verlauf verschwinden die 7 MB damit
 * nicht — das ist der Preis.
 */

/** Fingerabdruck der Dateien (sha1, erste acht Stellen) gegen alte Caches. */
const V = { film: "752fa92f", jpg: "a9c8deeb", webp1920: "7a8a314a", webp960: "652bc77e" };
const BASIS = "/uebergang/hero";

/** Wo die Datei unter `public/` liegt — ausgeliefert wird sie über `app/uebergang/film.mp4/route.ts` (wegen `Range`). */
export const UEBERGANG_DATEI = `${BASIS}/film.mp4`;

export const UEBERGANG_FILM: Videoquelle = {
  url: `/uebergang/film.mp4?v=${V.film}`,
  typ: "video/mp4",
  bytes: 7464826,
};

/** Das erste Bild des Videos — wie es die Medien-Action unter `hero/film` ablegen würde. */
export const UEBERGANG_STANDBILD: Bildquelle = {
  breite: 1920,
  hoehe: 1080,
  avif: "",
  webp: `${BASIS}/standbild-960.webp?v=${V.webp960} 960w, ${BASIS}/standbild-1920.webp?v=${V.webp1920} 1920w`,
  fallback: `${BASIS}/standbild-1920.jpg?v=${V.jpg}`,
  lqip: "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADQAQCdASoQAAkAA4BaJZACdACnUc+lAAD6DjPLt4sxq+vxKixzshgX6mc/bTZ6gpjT5T80nECJsjse1wAAAA==",
};

/** Ist das die Übergangsfassung? Für die Verwaltung („liegt noch im Repo"). */
export function istUebergang(quelle: Bildquelle | undefined): boolean {
  return quelle === UEBERGANG_STANDBILD || Boolean(quelle?.fallback.startsWith(`${BASIS}/`));
}

/**
 * Das Manifest mit dem Standbild der Übergangsfassung unter `hero/film` —
 * nur, solange dort nichts Echtes steht. So sehen Seite, Prüfung und
 * Verwaltung dasselbe wie nach einem richtigen Hochladen.
 */
export function mitUebergang(bilder: Record<string, Bildquelle>): Record<string, Bildquelle> {
  return Object.hasOwn(bilder, "hero/film") ? bilder : { ...bilder, "hero/film": UEBERGANG_STANDBILD };
}
