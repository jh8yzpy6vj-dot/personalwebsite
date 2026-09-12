/**
 * Metadaten aus einer JPEG-Datei entfernen — **ohne die Bilddaten anzufassen.**
 *
 * ⚠️ **Warum das nicht `sharp` macht.** `sharp` dekodiert und kodiert immer
 * neu; jeder Durchlauf kostet Qualität. Für „Originalgröße behalten, nur die
 * Standortdaten raus" ist das genau der falsche Weg. Eine JPEG-Datei besteht
 * aber aus klar getrennten Abschnitten: erst Metadaten-Segmente, dann ab
 * `SOS` die komprimierten Bilddaten. Wer nur die Segmente davor austauscht und
 * alles ab `SOS` **byteweise** kopiert, verändert kein einziges Pixel.
 *
 * ⚠️ **Positivliste, nicht Negativliste.** Es wird nichts „herausgelöscht".
 * Der EXIF-Block wird komplett **neu gebaut** und enthält ausschließlich, was
 * hier ausdrücklich hineingeschrieben wird. Alles andere — GPS,
 * MakerNotes, eingebettete Vorschaubilder, XMP, IPTC — existiert im Ergebnis
 * schlicht nicht, weil es nie geschrieben wurde. Das ist dieselbe Haltung wie
 * bei `EXIF_FELDER` in `lib/bilder-regeln.mjs` und aus demselben Grund: Bei
 * einer Negativliste ist ein vergessener Ort ein Leck, bei einer Positivliste
 * nur ein fehlendes Feld.
 *
 * Das zählt hier doppelt, weil die Dateien unter `original/` in einem
 * **öffentlichen** Bucket liegen und einzeln abrufbar sind.
 */

/** Die vier Aufnahmewerte, die die Seite anzeigt — und die Orientierung. */
export const EXIF_TAGS = {
  // IFD0
  Orientation: { ifd: 0, tag: 0x0112, typ: 3 },
  // Exif-IFD
  ExifVersion: { ifd: 1, tag: 0x9000, typ: 7 },
  DateTimeOriginal: { ifd: 1, tag: 0x9003, typ: 2 },
  ExposureTime: { ifd: 1, tag: 0x829a, typ: 5 },
  FNumber: { ifd: 1, tag: 0x829d, typ: 5 },
  ISOSpeedRatings: { ifd: 1, tag: 0x8827, typ: 3 },
};

/** Bytes je TIFF-Typ. 2=ASCII, 3=SHORT, 5=RATIONAL, 7=UNDEFINED. */
const TYP_BYTES = { 2: 1, 3: 2, 5: 8, 7: 1 };

/** Rohbytes eines Wertes, passend zum Typ. */
function werteBytes(typ, wert) {
  if (typ === 2) {
    const text = Buffer.from(`${wert}`, "latin1");
    return Buffer.concat([text, Buffer.from([0])]); // ASCII ist nullterminiert.
  }
  if (typ === 7) return Buffer.from(wert);
  if (typ === 3) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(wert, 0);
    return b;
  }
  if (typ === 5) {
    // RATIONAL: Zähler und Nenner als je vier Bytes.
    const b = Buffer.alloc(8);
    b.writeUInt32LE(wert[0], 0);
    b.writeUInt32LE(wert[1], 4);
    return b;
  }
  throw new Error(`Unbekannter EXIF-Typ ${typ}`);
}

/** Anzahl der Elemente — bei ASCII zählt das Nullbyte mit. */
function anzahl(typ, wert, bytes) {
  return typ === 5 ? 1 : bytes.length / TYP_BYTES[typ];
}

const IFD_GROESSE = (n) => 2 + n * 12 + 4;
const EXIF_IFD_ZEIGER = 0x8769;

/**
 * Ein vollständiges APP1-Segment (`FFE1 … Exif\0\0 …`) aus genau den
 * übergebenen Feldern.
 *
 * `felder` ist ein Objekt mit Namen aus `EXIF_TAGS`; alles, was dort nicht
 * vorkommt, landet nicht in der Datei. Fehlt alles, gibt es `null` — dann
 * bekommt die Datei gar kein APP1, was der sauberste Zustand ist.
 */
export function baueExifSegment(felder) {
  const eintraege = { 0: [], 1: [] };
  for (const [name, wert] of Object.entries(felder)) {
    if (wert === undefined || wert === null) continue;
    const def = EXIF_TAGS[name];
    if (!def) throw new Error(`Nicht auf der Positivliste: ${name}`);
    const bytes = werteBytes(def.typ, wert);
    eintraege[def.ifd].push({ ...def, bytes, anzahl: anzahl(def.typ, wert, bytes) });
  }
  if (eintraege[0].length === 0 && eintraege[1].length === 0) return null;

  // Das Exif-IFD hängt als Zeiger in IFD0 — also braucht IFD0 einen Eintrag
  // mehr, sobald dort etwas steht.
  const hatExif = eintraege[1].length > 0;
  const n0 = eintraege[0].length + (hatExif ? 1 : 0);
  const n1 = eintraege[1].length;

  const ifd0Off = 8;
  const exifOff = ifd0Off + IFD_GROESSE(n0);
  let datenOff = exifOff + (hatExif ? IFD_GROESSE(n1) : 0);

  const daten = [];
  /** Schreibt einen Eintrag und legt zu lange Werte hinten ab. */
  function eintrag(puffer, pos, e) {
    puffer.writeUInt16LE(e.tag, pos);
    puffer.writeUInt16LE(e.typ, pos + 2);
    puffer.writeUInt32LE(e.anzahl, pos + 4);
    if (e.bytes.length <= 4) {
      e.bytes.copy(puffer, pos + 8);
    } else {
      puffer.writeUInt32LE(datenOff, pos + 8);
      daten.push(e.bytes);
      datenOff += e.bytes.length;
      // TIFF-Werte stehen an geraden Adressen.
      if (e.bytes.length % 2 === 1) {
        daten.push(Buffer.from([0]));
        datenOff += 1;
      }
    }
  }

  const kopf = Buffer.alloc(8);
  kopf.write("II", 0, "latin1");
  kopf.writeUInt16LE(42, 2);
  kopf.writeUInt32LE(ifd0Off, 4);

  const ifd0 = Buffer.alloc(IFD_GROESSE(n0));
  const exif = Buffer.alloc(hatExif ? IFD_GROESSE(n1) : 0);

  // Einträge müssen nach Tag sortiert sein — das verlangt die TIFF-Spezifikation,
  // und manche Leser verlassen sich darauf.
  const sortiert0 = [...eintraege[0]];
  if (hatExif) sortiert0.push({ tag: EXIF_IFD_ZEIGER, typ: 4, anzahl: 1, zeiger: true });
  sortiert0.sort((a, b) => a.tag - b.tag);

  ifd0.writeUInt16LE(n0, 0);
  sortiert0.forEach((e, i) => {
    const pos = 2 + i * 12;
    if (e.zeiger) {
      ifd0.writeUInt16LE(e.tag, pos);
      ifd0.writeUInt16LE(4, pos + 2);
      ifd0.writeUInt32LE(1, pos + 4);
      ifd0.writeUInt32LE(exifOff, pos + 8);
    } else {
      eintrag(ifd0, pos, e);
    }
  });
  ifd0.writeUInt32LE(0, 2 + n0 * 12); // Kein IFD1 — also auch kein Vorschaubild.

  if (hatExif) {
    const sortiert1 = [...eintraege[1]].sort((a, b) => a.tag - b.tag);
    exif.writeUInt16LE(n1, 0);
    sortiert1.forEach((e, i) => eintrag(exif, 2 + i * 12, e));
    exif.writeUInt32LE(0, 2 + n1 * 12);
  }

  const tiff = Buffer.concat([kopf, ifd0, exif, ...daten]);
  const rumpf = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const kopfSeg = Buffer.alloc(4);
  kopfSeg.writeUInt16BE(0xffe1, 0);
  kopfSeg.writeUInt16BE(rumpf.length + 2, 2); // Länge zählt sich selbst mit.
  return Buffer.concat([kopfSeg, rumpf]);
}

/** Marker ohne Längenfeld: SOI, EOI, TEM und die Restart-Marker. */
const OHNE_LAENGE = new Set([0xd8, 0xd9, 0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);

/**
 * Die Segmente einer JPEG-Datei bis einschließlich `SOS`.
 *
 * Ab `SOS` (`FFDA`) folgen die komprimierten Bilddaten; die werden nicht
 * zerlegt, sondern als ein Stück bis zum Dateiende übernommen.
 */
export function jpegSegmente(buf) {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) {
    throw new Error("Keine JPEG-Datei (SOI fehlt).");
  }
  const segmente = [];
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) throw new Error(`Kaputtes JPEG: kein Marker an Position ${i}.`);
    let marker = buf[i + 1];
    let j = i + 1;
    while (marker === 0xff && j < buf.length - 1) marker = buf[(j += 1)]; // Füllbytes.
    if (marker === 0xda) return { segmente, bilddatenAb: i };
    if (OHNE_LAENGE.has(marker)) {
      i = j + 1;
      continue;
    }
    const laenge = buf.readUInt16BE(j + 1);
    if (laenge < 2) throw new Error(`Kaputtes JPEG: Segmentlänge ${laenge}.`);
    segmente.push({ marker, start: i, ende: j + 1 + laenge, inhaltAb: j + 3 });
    i = j + 1 + laenge;
  }
  throw new Error("Kaputtes JPEG: kein SOS gefunden.");
}

/**
 * Welche Segmente übernommen werden.
 *
 * ⚠️ Verworfen wird alles, was Ortsangaben tragen **kann**, nicht nur, was
 * sie üblicherweise trägt:
 *
 * - `APP1` — EXIF (mit GPS und MakerNotes) und XMP (kann `exif:GPSLatitude`
 *   enthalten). Der EXIF-Teil wird neu gebaut, der XMP-Teil ersatzlos.
 * - `APP13` — Photoshop/IPTC, dort stehen `City`, `Country`, `Sub-location`.
 * - `APP2` außer ICC — insbesondere **MPF**: Darin hängen bei vielen Kameras
 *   eingebettete Vorschaubilder **mit eigenem EXIF-Block**. Ein Leck, das man
 *   nicht sieht, weil das sichtbare Bild sauber ist.
 * - `APP3`–`APP12`, `APP15` — herstellereigene Blöcke, Inhalt undokumentiert.
 * - `COM` — freier Text.
 *
 * Behalten werden `APP0` (JFIF), `APP2` mit ICC-Profil (sonst verschieben sich
 * die Farben) und `APP14` (Adobe; ohne ihn liest mancher Decoder die Farben
 * von CMYK-Dateien falsch) sowie alle Struktursegmente (`DQT`, `DHT`, `SOF`, …).
 */
export function behalten(marker, inhalt) {
  if (marker === 0xe2) return inhalt.subarray(0, 12).toString("latin1") === "ICC_PROFILE\0";
  if (marker === 0xe0 || marker === 0xee) return true;
  if (marker >= 0xe1 && marker <= 0xef) return false; // alle übrigen APPn
  if (marker === 0xfe) return false; // COM
  return true;
}

/**
 * Die Datei neu zusammensetzen: neues APP1, gesäuberte Segmente, Bilddaten
 * unverändert.
 */
export function saeubereJpeg(buf, exifSegment) {
  const { segmente, bilddatenAb } = jpegSegmente(buf);
  const teile = [Buffer.from([0xff, 0xd8])];
  // Das APP1 steht direkt hinter SOI — so schreibt es die Exif-Spezifikation vor.
  if (exifSegment) teile.push(exifSegment);
  const verworfen = [];
  for (const s of segmente) {
    if (behalten(s.marker, buf.subarray(s.inhaltAb, s.ende))) {
      teile.push(buf.subarray(s.start, s.ende));
    } else {
      verworfen.push(s.marker);
    }
  }
  teile.push(buf.subarray(bilddatenAb)); // Bilddaten + EOI, byteweise.
  return { datei: Buffer.concat(teile), verworfen };
}
