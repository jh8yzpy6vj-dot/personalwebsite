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
 *
 * **Seit 2026-10-24 ebenso das Standbild zu „Tödliches Gold"** (`film/toedliches-gold`,
 * das Titelbild der Doku, von Jan geschickt) — aus demselben Grund. Gleiche Regel: Lädt
 * Jakob in der Verwaltung ein Standbild hoch, gilt das.
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

/** Standbild zu „Tödliches Gold" (3840 px geliefert, auf 1920 verkleinert, ohne Metadaten). */
const GOLD = "/uebergang/film/toedliches-gold";
const VG = { jpg: "c4714155", webp1920: "e0a4c117", webp960: "a1d9a742" };
export const UEBERGANG_GOLD: Bildquelle = {
  breite: 1920,
  hoehe: 1080,
  avif: "",
  webp: `${GOLD}-960.webp?v=${VG.webp960} 960w, ${GOLD}-1920.webp?v=${VG.webp1920} 1920w`,
  fallback: `${GOLD}-1920.jpg?v=${VG.jpg}`,
  lqip: "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAAAQAgCdASoQAAkAAsBMJbACdAYqhGEVF0wAAP7SowsopzycEHxDXIrQRRqPPpT/9jhs/lmfh5b75LolP7irNh9u9a/4VOQmhnNfGE5cTM2oNr+l3o+EJOz1ILsaDXNN+8adM4kc+msPHefGLxeT4qNGBMpolWgA",
};

/** Alles, was übergangsweise im Repo liegt, unter seinem Schlüssel im Manifest. */
export const UEBERGANG_BILDER: Record<string, Bildquelle> = {
  "hero/film": UEBERGANG_STANDBILD,
  "film/toedliches-gold": UEBERGANG_GOLD,
};

/** Ist das die Übergangsfassung? Für die Verwaltung („liegt noch im Repo"). */
export function istUebergang(quelle: Bildquelle | undefined): boolean {
  return (
    Object.values(UEBERGANG_BILDER).includes(quelle as Bildquelle) || Boolean(quelle?.fallback.startsWith("/uebergang/"))
  );
}

/**
 * Das Manifest mit den Übergangsbildern (`UEBERGANG_BILDER`) — jedes nur,
 * solange unter seinem Schlüssel nichts Echtes steht. So sehen Seite,
 * Prüfung und Verwaltung dasselbe wie nach einem richtigen Hochladen.
 */
export function mitUebergang(bilder: Record<string, Bildquelle>): Record<string, Bildquelle> {
  const fehlend = Object.entries(UEBERGANG_BILDER).filter(([s]) => !Object.hasOwn(bilder, s));
  return fehlend.length ? { ...bilder, ...Object.fromEntries(fehlend) } : bilder;
}
