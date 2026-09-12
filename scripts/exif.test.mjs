import exifr from "exifr";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { baueExifSegment, behalten, jpegSegmente, saeubereJpeg } from "./exif.mjs";

/**
 * Das Säubern der Originale.
 *
 * ⚠️ **Das hier ist eine Sicherheitsgrenze, kein Formatierungsdetail.** Die
 * Dateien unter `original/` liegen in einem **öffentlichen** Bucket und sollen
 * künftig sogar verlinkt werden. Was hier durchrutscht, ist abrufbar.
 *
 * Deshalb wird nicht geprüft, ob „GPS weg ist", sondern ob **nur** das
 * dasteht, was dastehen soll — eine Positivliste lässt sich vollständig
 * prüfen, eine Negativliste nie.
 */

/** Eine Datei, wie sie aus einer Kamera kommt: Aufnahmedaten **und** GPS. */
async function kameradatei() {
  return sharp({
    create: { width: 64, height: 48, channels: 3, background: { r: 90, g: 120, b: 60 } },
  })
    .jpeg({ quality: 92 })
    .withExif({
      IFD0: { Make: "TESTKAMERA", Model: "T-1000", Software: "geheime-software" },
      IFD2: { FNumber: "28/10", ISOSpeedRatings: "6400", DateTimeOriginal: "2026:08:15 22:14:03" },
      IFD3: {
        GPSLatitude: "48/1 51/1 3/1",
        GPSLatitudeRef: "N",
        GPSLongitude: "8/1 12/1 30/1",
        GPSLongitudeRef: "E",
      },
    })
    .toBuffer();
}

describe("baueExifSegment", () => {
  it("schreibt genau die übergebenen Felder — und sie kommen wieder heraus", async () => {
    const segment = baueExifSegment({
      Orientation: 6,
      ExifVersion: Buffer.from("0232", "latin1"),
      DateTimeOriginal: "2026:08:15 22:14:03",
      ExposureTime: [1, 500],
      FNumber: [28, 10],
      ISOSpeedRatings: 6400,
    });
    // Als eigenständige Datei prüfen, nicht nur als Bytes.
    const roh = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#333" } })
      .jpeg()
      .toBuffer();
    const { datei } = saeubereJpeg(roh, segment);
    const gelesen = await exifr.parse(datei, true);

    // ⚠️ Gegen `sharp` geprüft, nicht gegen `exifr`: `sharp` ist der Leser,
    // der in `scripts/medien.mjs` tatsächlich danach dreht. `exifr.parse`
    // übersetzt den Wert mit `true` in Klartext („Rotate 90 CW") — richtig,
    // aber nicht die Zahl, auf die es ankommt.
    expect((await sharp(datei).metadata()).orientation).toBe(6);
    expect(gelesen.DateTimeOriginal).toBeTruthy();
    expect(gelesen.ExposureTime).toBeCloseTo(1 / 500, 6);
    expect(gelesen.FNumber).toBeCloseTo(2.8, 3);
    expect(gelesen.ISO ?? gelesen.ISOSpeedRatings).toBe(6400);
  });

  it("gibt null zurück, wenn nichts zu schreiben ist — dann bekommt die Datei gar kein APP1", () => {
    expect(baueExifSegment({})).toBeNull();
    expect(baueExifSegment({ Orientation: undefined })).toBeNull();
  });

  it("weist alles ab, was nicht auf der Positivliste steht", () => {
    expect(() => baueExifSegment({ GPSLatitude: "48/1" })).toThrow(/Positivliste/);
    expect(() => baueExifSegment({ Make: "Canon" })).toThrow(/Positivliste/);
  });

  it("schreibt kein IFD1 — also auch kein eingebettetes Vorschaubild", async () => {
    const segment = baueExifSegment({ Orientation: 1 });
    // Der Zeiger auf IFD1 steht hinter den Einträgen von IFD0 und muss 0 sein.
    const tiff = segment.subarray(4 + 6);
    const n0 = tiff.readUInt16LE(8);
    expect(tiff.readUInt32LE(8 + 2 + n0 * 12)).toBe(0);
  });
});

describe("Segmente behalten oder verwerfen", () => {
  const leer = Buffer.alloc(20);
  it("verwirft alles, was Ortsangaben tragen kann", () => {
    expect(behalten(0xe1, leer)).toBe(false); // APP1: EXIF und XMP
    expect(behalten(0xed, leer)).toBe(false); // APP13: IPTC
    expect(behalten(0xfe, leer)).toBe(false); // COM
    for (const m of [0xe3, 0xe5, 0xe6, 0xec, 0xef]) expect(behalten(m, leer)).toBe(false);
  });

  it("verwirft APP2 ohne ICC — dort steckt MPF mit eingebetteten Vorschaubildern", () => {
    expect(behalten(0xe2, Buffer.from("MPF\0", "latin1"))).toBe(false);
    expect(behalten(0xe2, Buffer.from("ICC_PROFILE\0abc", "latin1"))).toBe(true);
  });

  it("behält Struktur und Farbe", () => {
    expect(behalten(0xe0, leer)).toBe(true); // JFIF
    expect(behalten(0xee, leer)).toBe(true); // Adobe
    for (const m of [0xdb, 0xc4, 0xc0, 0xdd]) expect(behalten(m, leer)).toBe(true);
  });
});

describe("saeubereJpeg an einer echten Kameradatei", () => {
  let vorher;
  let nachher;

  beforeAll(async () => {
    vorher = await kameradatei();
    nachher = saeubereJpeg(
      vorher,
      baueExifSegment({ Orientation: 1, FNumber: [28, 10], ISOSpeedRatings: 6400 }),
    ).datei;
  });

  it("die Testdatei trägt vorher wirklich GPS — sonst prüft der Test nichts", async () => {
    const gps = await exifr.gps(vorher);
    expect(gps?.latitude).toBeCloseTo(48.85, 1);
    expect(gps?.longitude).toBeCloseTo(8.2083, 1);
  });

  it("hinterher sind keine Koordinaten mehr da", async () => {
    expect(await exifr.gps(nachher)).toBeFalsy();
    const alles = await exifr.parse(nachher, true);
    for (const schluessel of Object.keys(alles ?? {})) {
      expect(schluessel).not.toMatch(/^GPS/);
    }
  });

  it("auch nicht als Rohbytes irgendwo in der Datei", () => {
    // Der eigentliche Test: Es reicht nicht, dass kein Leser sie findet —
    // die Bytes dürfen gar nicht mehr im File stehen.
    expect(nachher.includes(Buffer.from("TESTKAMERA", "latin1"))).toBe(false);
    expect(nachher.includes(Buffer.from("geheime-software", "latin1"))).toBe(false);
  });

  it("die Bilddaten sind Byte für Byte dieselben — kein Qualitätsverlust", () => {
    const ab = (b) => b.subarray(jpegSegmente(b).bilddatenAb);
    expect(ab(nachher).equals(ab(vorher))).toBe(true);
  });

  it("die Aufnahmedaten bleiben erhalten", async () => {
    const gelesen = await exifr.parse(nachher, true);
    expect(gelesen.FNumber).toBeCloseTo(2.8, 3);
    expect(gelesen.ISO ?? gelesen.ISOSpeedRatings).toBe(6400);
  });

  it("das Bild ist danach noch lesbar und gleich groß", async () => {
    const meta = await sharp(nachher).metadata();
    expect([meta.width, meta.height]).toEqual([64, 48]);
  });

  it("die Orientierung überlebt — sonst läge ein Hochformat quer", async () => {
    const { datei } = saeubereJpeg(vorher, baueExifSegment({ Orientation: 6 }));
    expect((await sharp(datei).metadata()).orientation).toBe(6);
  });
});

describe("jpegSegmente", () => {
  it("weist an, was kein JPEG ist, statt Unsinn zu liefern", () => {
    expect(() => jpegSegmente(Buffer.from("\x89PNG\r\n\x1a\n"))).toThrow(/SOI/);
    expect(() => jpegSegmente(Buffer.alloc(2))).toThrow(/SOI/);
  });
});
