import exifr from "exifr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { jpegSegmente } from "./exif.mjs";
import { alsSharpExif, saeubere } from "./saeubern.mjs";

/**
 * `saeubere` — die eine Stelle, an der Uploads aus der Verwaltung und
 * `npm run verkleinern -- --original` ihre Metadaten verlieren.
 *
 * ⚠️ Eine Sicherheitsgrenze: Was hier durchrutscht, liegt danach unter
 * `original/` im **öffentlichen** Bucket. Geprüft wird deshalb nicht nur,
 * dass GPS fehlt, sondern dass **nur** die Positivliste übrig ist.
 */

const KAMERA_EXIF = {
  IFD0: { Make: "TESTKAMERA", Model: "T-1000", Software: "geheime-software" },
  IFD2: {
    DateTimeOriginal: "2026:08:15 22:14:03",
    ExposureTime: "1/500",
    FNumber: "28/10",
    ISOSpeedRatings: "6400",
  },
  IFD3: {
    GPSLatitude: "48/1 51/1 3/1",
    GPSLatitudeRef: "N",
    GPSLongitude: "8/1 12/1 30/1",
    GPSLongitudeRef: "E",
  },
};

function leinwand() {
  return sharp({
    create: { width: 64, height: 48, channels: 3, background: { r: 90, g: 120, b: 60 } },
  });
}

/**
 * Eine Datei wie aus der Kamera: hochkant gehalten (Orientierung 6),
 * Aufnahmewerte **und** GPS.
 *
 * ⚠️ Die Orientierung über `withMetadata`, nicht als `IFD0.Orientation` in
 * `withExif` — dort überschreibt sharp sie still mit 1.
 */
function kamera(format) {
  return leinwand().toFormat(format).withMetadata({ orientation: 6 }).withExifMerge(KAMERA_EXIF).toBuffer();
}

/** Was nach dem Säubern übrig sein darf — Tags, wie `exifr` sie benennt. */
const ERLAUBT = new Set([
  "Orientation",
  "DateTimeOriginal",
  "ExposureTime",
  "FNumber",
  "ISO",
  "ISOSpeedRatings",
  // Strukturfelder, die jedes EXIF-Segment trägt.
  "ExifIFDPointer",
  "ExifVersion",
  "XResolution",
  "YResolution",
  "ResolutionUnit",
  // Schreibt libvips beim Neukodieren selbst: die Maße, die ohnehin jeder sieht.
  "ExifImageWidth",
  "ExifImageHeight",
]);

async function pruefeNurPositivliste(datei) {
  const alles = (await exifr.parse(datei, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, icc: false, translateKeys: true })) ?? {};
  const fremd = Object.keys(alles).filter((k) => !ERLAUBT.has(k));
  expect(fremd).toEqual([]);
  expect(await exifr.gps(datei).catch(() => undefined)).toBeUndefined();
}

describe("saeubere — JPEG", () => {
  it("entfernt GPS und Kameradaten, behält Orientierung und Aufnahmewerte", async () => {
    const roh = await kamera("jpeg");
    // Gegenprobe: Die Testdatei trägt wirklich GPS.
    expect((await exifr.gps(roh))?.latitude).toBeGreaterThan(48);

    const { datei, format, neuKodiert, breite, hoehe } = await saeubere(roh);
    expect(format).toBe("jpeg");
    expect(neuKodiert).toBe(false);
    await pruefeNurPositivliste(datei);

    expect((await sharp(datei).metadata()).orientation).toBe(6);
    const werte = await exifr.parse(datei, ["DateTimeOriginal", "FNumber", "ISO", "ExposureTime"]);
    expect(werte.FNumber).toBeCloseTo(2.8);
    expect(werte.ISO).toBe(6400);
    expect(werte.ExposureTime).toBeCloseTo(1 / 500);
    // Orientierung 6 = um 90° gedreht: gemeldet werden die Maße des Bildes.
    expect([breite, hoehe]).toEqual([48, 64]);
  });

  it("lässt die Bilddaten Byte für Byte, wie sie sind", async () => {
    const roh = await kamera("jpeg");
    const { datei } = await saeubere(roh);
    const abSos = (buf) => buf.subarray(jpegSegmente(buf).bilddatenAb);
    expect(Buffer.compare(abSos(datei), abSos(roh))).toBe(0);
  });
});

describe("saeubere — PNG, WebP, TIFF", () => {
  for (const format of ["png", "webp", "tiff"]) {
    it(`${format.toUpperCase()} wird ein JPEG in voller Größe, ohne GPS`, async () => {
      const roh = await kamera(format);
      // Gegenprobe: Die Testdatei trägt wirklich einen EXIF-Block (mit GPS).
      // TIFF führt EXIF als eigene Tags, dort meldet sharp keinen Block.
      if (format !== "tiff") expect((await sharp(roh).metadata()).exif?.length).toBeGreaterThan(0);
      const { datei, neuKodiert, breite, hoehe } = await saeubere(roh);
      // Hochkant: Die Pixel sind gedreht, die Maße getauscht.
      expect([breite, hoehe]).toEqual([48, 64]);
      expect(neuKodiert).toBe(true);
      const meta = await sharp(datei).metadata();
      expect(meta.format).toBe("jpeg");
      // `.rotate()` hat die Orientierung in die Pixel übernommen.
      expect([meta.width, meta.height]).toEqual([breite, hoehe]);
      expect(meta.orientation ?? 1).toBe(1);
      await pruefeNurPositivliste(datei);
    });
  }
});

describe("saeubere — Ablehnung", () => {
  it("wirft bei Unlesbarem", async () => {
    await expect(saeubere(Buffer.from("kein bild"))).rejects.toThrow("keine lesbare Bilddatei");
  });

  it("wirft bei anderen Formaten", async () => {
    const gif = await leinwand().gif().toBuffer();
    await expect(saeubere(gif)).rejects.toThrow(/GIF wird nicht angenommen/);
  });
});

describe("alsSharpExif", () => {
  it("schreibt unter IFD2 und ISOSpeedRatings — die Namen, die libvips annimmt", () => {
    expect(
      alsSharpExif({
        DateTimeOriginal: "2026:08:15 22:14:03",
        ExposureTime: [1, 500],
        FNumber: [28, 10],
        ISOSpeedRatings: 6400,
      }),
    ).toEqual({
      IFD2: {
        DateTimeOriginal: "2026:08:15 22:14:03",
        ExposureTime: "1/500",
        FNumber: "28/10",
        ISOSpeedRatings: "6400",
      },
    });
  });

  it("gibt null ohne Werte — dann schreibt sharp gar keine Metadaten", () => {
    expect(alsSharpExif({})).toBeNull();
  });
});
