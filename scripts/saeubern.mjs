/**
 * Ein Original säubern: **nur** Orientierung und die vier Aufnahmewerte
 * behalten, alles andere — GPS zuerst — verwerfen.
 *
 * Gemeinsam benutzt von `scripts/verkleinern.mjs` (`--original`, lokal) und
 * `scripts/eingang.mjs` (Medien-Action, Uploads aus der Verwaltung). Vorher
 * stand die Auswahl der Felder nur in `verkleinern.mjs`; zwei Kopien einer
 * Sicherheitsgrenze laufen früher oder später auseinander.
 *
 * - **JPEG** bleibt Byte für Byte, wie es ist — nur die Metadaten-Segmente
 *   werden ersetzt (`saeubereJpeg` in `scripts/exif.mjs`, dort steht warum).
 * - **PNG, WebP, TIFF** werden einmal als JPEG (Qualität 95) in **voller
 *   Größe** neu kodiert. Verlustfrei geht für sie hier nicht: Die Pipeline
 *   und der Bucket erwarten `original/<ziel>.jpg`, und einen Segmenttausch
 *   wie bei JPEG gibt es für diese Formate in diesem Projekt nicht. 95 liegt
 *   sichtbar nicht unter dem Original, und ausgeliefert wird ohnehin aus
 *   den daraus gerechneten Varianten.
 *
 * ⚠️ **Positivliste, keine Negativliste** — wie `EXIF_FELDER` in
 * `lib/bilder-regeln.mjs`. `exifr` liest nur diese Tags, `baueExifSegment`
 * schreibt nur diese Tags, und `sharp` schreibt ohne `withExif` gar keine.
 * GPS kommt an keiner Stelle vor, also kann es auch nirgends durchrutschen.
 */

import exifr from "exifr";
import sharp from "sharp";

import { EXIF_FELDER } from "../lib/bilder-regeln.mjs";
import { baueExifSegment, saeubereJpeg } from "./exif.mjs";

/** Qualität beim Umwandeln von PNG/WebP/TIFF — siehe oben. */
export const UMWANDLUNG_QUALITAET = 95;

/** Formate, die `saeubere` annimmt — so, wie `sharp` sie meldet. */
const UMWANDELBAR = new Set(["png", "webp", "tiff"]);

/**
 * Die Aufnahmewerte, die die Seite anzeigt, als Felder für
 * `baueExifSegment`: Zeit als Text, Belichtung und Blende als Bruch
 * `[zaehler, nenner]`, ISO als Zahl. Unlesbares fehlt einfach.
 *
 * `quelle` ist ein Buffer oder ein Dateipfad.
 */
export async function aufnahmeFelder(quelle) {
  const roh = await exifr
    .parse(quelle, { pick: EXIF_FELDER, reviveValues: false })
    .catch(() => null);
  const felder = {};
  if (!roh) return felder;

  if (roh.DateTimeOriginal) felder.DateTimeOriginal = String(roh.DateTimeOriginal);
  if (typeof roh.ExposureTime === "number" && roh.ExposureTime > 0) {
    felder.ExposureTime =
      roh.ExposureTime >= 1
        ? [Math.round(roh.ExposureTime * 100), 100]
        : [1, Math.round(1 / roh.ExposureTime)];
  }
  if (typeof roh.FNumber === "number" && roh.FNumber > 0) {
    felder.FNumber = [Math.round(roh.FNumber * 10), 10];
  }
  const iso = roh.ISO ?? roh.ISOSpeedRatings;
  if (typeof iso === "number" && iso > 0) felder.ISOSpeedRatings = iso;
  return felder;
}

/**
 * Dieselben Felder in der Form, die `sharp().withExif()` erwartet — oder
 * `null`, wenn nichts da ist.
 *
 * ⚠️ **`IFD2`, nicht `ExifIFD`** — und **`ISOSpeedRatings`, nicht `ISO`**.
 * `withExif` reicht die Namen an libvips/exiv2 durch; unter `ExifIFD`
 * geschriebene Felder verschwanden spurlos, und `ISO` wurde stillschweigend
 * verworfen. Beides gemessen, nicht vermutet (vorher in `verkleinern.mjs`).
 */
export function alsSharpExif(felder) {
  const ifd2 = {};
  if (felder.DateTimeOriginal) ifd2.DateTimeOriginal = felder.DateTimeOriginal;
  if (felder.ExposureTime) ifd2.ExposureTime = felder.ExposureTime.join("/");
  if (felder.FNumber) ifd2.FNumber = felder.FNumber.join("/");
  if (felder.ISOSpeedRatings) ifd2.ISOSpeedRatings = String(felder.ISOSpeedRatings);
  return Object.keys(ifd2).length > 0 ? { IFD2: ifd2 } : null;
}

/**
 * Ein Original säubern. Gibt die neue Datei (immer JPEG) zurück, dazu die
 * Maße des **angezeigten** Bildes und was geschehen ist.
 *
 * Wirft bei allem, was kein lesbares JPEG, PNG, WebP oder TIFF ist — eine
 * kaputte Datei soll auffallen, nicht als leeres Bild im Bucket landen.
 *
 * `anhang` sind die Bytes, die bei einem JPEG hinter dem Bildende hingen
 * (eingebettete Bilder, Motion-Photo-Videos) und abgeschnitten wurden
 * (`saeubereJpeg`).
 *
 * @param {Buffer} roh
 * @returns {Promise<{ datei: Buffer; format: string; neuKodiert: boolean;
 *   verworfen: number[]; anhang: number; breite: number; hoehe: number }>}
 */
export async function saeubere(roh) {
  let meta;
  try {
    meta = await sharp(roh).metadata();
  } catch {
    throw new Error("keine lesbare Bilddatei");
  }
  const felder = await aufnahmeFelder(roh);
  // Ab Orientierung 5 liegt das Bild um 90° gedreht in der Datei.
  const gedreht = (meta.orientation ?? 1) >= 5;
  const breite = (gedreht ? meta.height : meta.width) ?? 0;
  const hoehe = (gedreht ? meta.width : meta.height) ?? 0;

  if (meta.format === "jpeg") {
    /*
     * Die **Orientierung** muss mit: Die Pixel bleiben, wie die Kamera sie
     * geschrieben hat, ohne sie läge jedes gedreht aufgenommene Hochformat
     * quer.
     */
    const { datei, verworfen, anhang } = saeubereJpeg(
      roh,
      baueExifSegment({ Orientation: meta.orientation ?? 1, ...felder }),
    );
    return { datei, format: "jpeg", neuKodiert: false, verworfen, anhang, breite, hoehe };
  }

  if (meta.format && UMWANDELBAR.has(meta.format)) {
    /*
     * `.rotate()` wendet die Orientierung auf die Pixel an — danach braucht
     * die Datei keine mehr. `withExif` ersetzt die Metadaten vollständig;
     * ohne Aufnahmewerte schreibt `sharp` gar keine.
     */
    let bild = sharp(roh).rotate().jpeg({ quality: UMWANDLUNG_QUALITAET, mozjpeg: true });
    const exif = alsSharpExif(felder);
    if (exif) bild = bild.withExif(exif);
    const datei = await bild.toBuffer();
    return { datei, format: meta.format, neuKodiert: true, verworfen: [], anhang: 0, breite, hoehe };
  }

  throw new Error(
    `Format ${meta.format?.toUpperCase() ?? "unbekannt"} wird nicht angenommen ` +
      `(nur JPEG, PNG, WebP, TIFF)`,
  );
}
