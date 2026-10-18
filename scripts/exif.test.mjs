import exifr from "exifr";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { baueExifSegment, behalten, jpegEnde, jpegSegmente, saeubereJpeg, zwischenDenScans } from "./exif.mjs";

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
    expect(behalten(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1"))).toBe(true);
    expect(behalten(0xee, leer)).toBe(true); // Adobe
    for (const m of [0xdb, 0xc4, 0xc0, 0xdd]) expect(behalten(m, leer)).toBe(true);
  });

  it("verwirft APP0 ohne JFIF — JFXX trägt ein eingebettetes Vorschau-JPEG", () => {
    expect(behalten(0xe0, leer)).toBe(false);
    expect(behalten(0xe0, Buffer.from("JFXX\0\x10", "latin1"))).toBe(false);
  });

  it("zwischen den Scans: Tabellen und Scans ja, APPn und COM nein", () => {
    for (const m of [0xc4, 0xdb, 0xdd, 0xda]) expect(zwischenDenScans(m)).toBe(true);
    for (const m of [0xe0, 0xe1, 0xe2, 0xed, 0xee, 0xef, 0xfe]) expect(zwischenDenScans(m)).toBe(false);
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

/*
 * Was hinter dem Bildende hängt. MPF-Dateien tragen dort weitere Bilder mit
 * eigenem EXIF, „Motion Photos“ ein MP4 — beides mit Ortsangabe. ⚠️ Geprüft
 * wird an den Bytes, nicht mit `exifr.gps`: Das liest nur das erste APP1 und
 * fände das angehängte GPS ohnehin nicht.
 */
describe("Anhang hinter dem Bildende", () => {
  const JPEG_ANFANG = Buffer.from([0xff, 0xd8, 0xff]);
  const bilddaten = (b) => b.subarray(jpegSegmente(b).bilddatenAb);
  const endetAufEoi = (b) => b.readUInt16BE(b.length - 2) === 0xffd9;
  const segment = (marker, inhalt) => {
    const kopf = Buffer.alloc(4);
    kopf.writeUInt16BE(0xff00 | marker, 0);
    kopf.writeUInt16BE(inhalt.length + 2, 2);
    return Buffer.concat([kopf, inhalt]);
  };
  /** `einschub` direkt hinter SOI einsetzen. */
  const mitSegment = (b, einschub) => Buffer.concat([b.subarray(0, 2), einschub, b.subarray(2)]);

  it("schneidet ein angehängtes Bild mit GPS und einen Textanhang ab", async () => {
    const grund = await sharp({ create: { width: 32, height: 24, channels: 3, background: "#456" } })
      .jpeg({ quality: 90 })
      .toBuffer();
    const zweites = await kameradatei();
    const text = Buffer.from("MotionPhoto_Data geheimer Ort", "latin1");
    const roh = Buffer.concat([grund, zweites, text]);
    // Gegenprobe: Das angehängte Bild trägt wirklich GPS.
    expect((await exifr.gps(zweites))?.latitude).toBeCloseTo(48.85, 1);

    const { datei, anhang } = saeubereJpeg(roh, baueExifSegment({ Orientation: 1 }));
    expect(endetAufEoi(datei)).toBe(true);
    expect(datei.indexOf(JPEG_ANFANG, 2)).toBe(-1);
    expect(datei.includes(Buffer.from("TESTKAMERA", "latin1"))).toBe(false);
    expect(datei.includes(text)).toBe(false);
    expect(bilddaten(datei).equals(bilddaten(grund))).toBe(true);
    expect(anhang).toBe(zweites.length + text.length);
    expect((await sharp(datei).metadata()).width).toBe(32);
  });

  it("lässt ein progressives JPEG über alle Scans hinweg Byte für Byte, wie es ist", async () => {
    const grund = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#a63" } })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    // In den Bilddaten folgt auf FF nie DA — jedes FFDA ist also ein Scan.
    let scans = 0;
    for (let i = grund.indexOf(Buffer.from([0xff, 0xda])); i !== -1; i = grund.indexOf(Buffer.from([0xff, 0xda]), i + 1)) {
      scans += 1;
    }
    expect(scans).toBeGreaterThan(1);

    const { datei, anhang } = saeubereJpeg(grund, null);
    expect(anhang).toBe(0);
    expect(bilddaten(datei).equals(bilddaten(grund))).toBe(true);
    const meta = await sharp(datei).metadata();
    expect([meta.width, meta.height, meta.isProgressive]).toEqual([40, 30, true]);
  });

  it("hält nicht beim ersten FFD9, wenn es in einer Tabelle zwischen zwei Scans steht", () => {
    const sos = segment(0xda, Buffer.from([1, 1, 0, 0, 63, 0]));
    const datei = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      sos,
      Buffer.from([0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56]), // Daten mit FF00 und Restart
      segment(0xc4, Buffer.from([0x10, 0xff, 0xd9, 0x00])), // DHT mit FFD9 im Inhalt
      sos,
      Buffer.from([0x78, 0xff, 0xff, 0xd9]), // Füllbyte, dann das echte Ende
      Buffer.from("Anhang", "latin1"),
    ]);
    expect(jpegEnde(datei, 2)).toBe(datei.length - "Anhang".length);
  });

  it("wirft, wenn das Bildende fehlt, statt halb gesäubert abzuliefern", async () => {
    const grund = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#333" } }).jpeg().toBuffer();
    expect(() => saeubereJpeg(grund.subarray(0, grund.length - 2), null)).toThrow(/Säubern unvollständig/);
  });

  it("wirft bei einem eingebetteten JPEG in einem behaltenen Segment", async () => {
    const grund = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#333" } }).jpeg().toBuffer();
    // APP14 (Adobe) wird unverändert behalten — hinge daran ein ganzes JPEG, muss das Netz greifen.
    const adobe = segment(0xee, Buffer.concat([Buffer.from("Adobe\0\x64\0\0\0\0\x01", "latin1"), grund]));
    expect(() => saeubereJpeg(mitSegment(grund, adobe), null)).toThrow(/Säubern unvollständig/);
  });

  it("schreibt den JFIF-Kopf ohne Vorschaubild neu und wirft JFXX weg", async () => {
    const grund = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#333" } }).jpeg().toBuffer();
    expect(jpegSegmente(grund).segmente.some((x) => x.marker === 0xe0)).toBe(false); // sharp schreibt keinen
    // JFIF mit 1×1-Vorschau, deren Pixel (255, 216, 255) zufällig wie FFD8FF aussieht — harmlos.
    const kopf = Buffer.from("JFIF\0\x01\x02\x01\0\x48\0\x48", "latin1");
    const jfif = segment(0xe0, Buffer.concat([kopf, Buffer.from([1, 1, 0xff, 0xd8, 0xff])]));
    const jfxx = segment(0xe0, Buffer.concat([Buffer.from("JFXX\0\x10", "latin1"), Buffer.from("Vorschau")]));

    const { datei, verworfen } = saeubereJpeg(mitSegment(grund, Buffer.concat([jfif, jfxx])), null);
    expect(datei.subarray(2, 2 + 18).equals(segment(0xe0, Buffer.concat([kopf, Buffer.from([0, 0])])))).toBe(true);
    expect(datei.indexOf(JPEG_ANFANG, 2)).toBe(-1);
    expect(datei.includes(Buffer.from("Vorschau"))).toBe(false);
    expect(verworfen).toEqual([0xe0]); // JFXX
    expect((await sharp(datei).metadata()).width).toBe(8);
  });

  it("verwirft APP1 mit GPS und COM, die zwischen zwei Scans stecken", async () => {
    const grund = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#a63" } })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    const kamera = await kameradatei();
    const app1 = jpegSegmente(kamera).segmente.find((x) => x.marker === 0xe1);
    const gps = kamera.subarray(app1.start, app1.ende);
    expect((await exifr.gps(kamera))?.latitude).toBeCloseTo(48.85, 1); // Gegenprobe
    const kommentar = segment(0xfe, Buffer.from("Ort: Rastatt, Kirchstr. 1", "latin1"));
    const zweiterScan = grund.indexOf(Buffer.from([0xff, 0xda]), jpegSegmente(grund).bilddatenAb + 2);
    const roh = Buffer.concat([grund.subarray(0, zweiterScan), gps, kommentar, grund.subarray(zweiterScan)]);
    expect((await sharp(roh).metadata()).width).toBe(40); // Decoder lesen so eine Datei

    const { datei, verworfen } = saeubereJpeg(roh, null);
    expect(datei.includes(gps)).toBe(false);
    expect(datei.includes(Buffer.from("TESTKAMERA", "latin1"))).toBe(false);
    expect(datei.includes(Buffer.from("Kirchstr", "latin1"))).toBe(false);
    expect(verworfen).toEqual([0xe1, 0xfe]);
    expect(bilddaten(datei).equals(bilddaten(grund))).toBe(true);
    const [vorher, nachher] = await Promise.all([sharp(grund).raw().toBuffer(), sharp(datei).raw().toBuffer()]);
    expect(nachher.equals(vorher)).toBe(true);
  });

  it("nimmt FFD8FF im ICC-Profil hin — Farbkurven sind Binärdaten", async () => {
    const grund = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#333" } }).jpeg().toBuffer();
    const icc = segment(0xe2, Buffer.concat([Buffer.from("ICC_PROFILE\0\x01\x01", "latin1"), Buffer.from([0xff, 0xc0, 0xff, 0xd8, 0xff, 0xf0])]));
    const { datei } = saeubereJpeg(mitSegment(grund, icc), null);
    expect(datei.includes(icc)).toBe(true);
  });
});
