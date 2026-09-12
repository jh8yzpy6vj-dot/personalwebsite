/**
 * Kameradateien auf Bucket-Format bringen — **läuft lokal, vor dem Hochladen.**
 *
 * Nimmt einen Ordner voller Originale aus der Kamera und legt daraus einen
 * fertigen `original/`-Baum an: richtig benannt, richtig groß, ohne
 * Standortdaten. Der Ordner lässt sich danach als Ganzes ins R2-Dashboard
 * ziehen — oder mit `--hochladen` schiebt das Skript ihn selbst hinein.
 *
 * ⚠️ **Warum es das gibt.** Die Namensvorgabe (`<id>.jpg` fürs Leitbild,
 * `<id>/01.jpg` für die Strecke) ist die einzige Verbindung zwischen Datei und
 * Arbeit — und beim ersten echten Upload gingen genau daran zwölf Dateien
 * daneben: flach im Bucket statt unter `original/`, mit Kameranamen statt
 * `id`, und mit 11 MB statt unter 3. Von Hand ist das zwölfmal dieselbe
 * fehleranfällige Fleißarbeit.
 *
 * Aufrufe:
 *   npm run verkleinern -- <ordner> --arbeit wiwawo-53
 *   npm run verkleinern -- <ordner> --arbeit wiwawo-53 --leitbild JPG7043.JPG
 *   npm run verkleinern -- <ordner> --serie tete-a-tete-2026
 *   npm run verkleinern -- <datei>  --einzel portrait
 *   … zusätzlich --hochladen, um das Ergebnis gleich in den Bucket zu legen
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";
import sharp from "sharp";

import { EXIF_FELDER } from "../lib/bilder-regeln.mjs";
import { lege, zugang } from "./r2.mjs";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

/** Wohin das Ergebnis geschrieben wird. Ignoriert, darf jederzeit weg. */
const ZIEL = path.join(WURZEL, ".medien-vorbereitet");

/**
 * Vorgaben aus TECH-STACK.md, Abschnitt „Medien": lange Kante 2400–3000 px,
 * unter 3 MB. 3000 als Obergrenze, weil ausgeliefert ohnehin höchstens 2400
 * werden — die Reserve ist für einen späteren Zuschnitt.
 */
const MAX_KANTE = 3000;
const QUALITAET = 88;
const WARNUNG_BYTES = 3 * 1024 * 1024;

const ENDUNGEN = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);

function menschlich(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} kB`;
}

/**
 * Die Aufnahmedaten aus der Kamera — und **nur diese vier**.
 *
 * ⚠️ Das ist dieselbe Sicherheitsgrenze wie in `scripts/medien.mjs`, hier aber
 * an einer Stelle, die leicht übersehen wird: Die Datei landet unter
 * `original/` im Bucket, und der Bucket ist **öffentlich** (die Videos werden
 * von dort ausgeliefert). Ein Original mit GPS wäre über seine Adresse
 * abrufbar — bei Aufnahmeorten und bei einem Journalisten kein Randthema.
 *
 * `sharp` schreibt ohne `withExif` gar keine Metadaten und mit
 * `withMetadata()` **alle** inklusive GPS. Deshalb der Weg über eine
 * Positivliste: auslesen, was gebraucht wird, und genau das zurückschreiben.
 */
async function aufnahmedaten(quelle) {
  let roh;
  try {
    roh = await exifr.parse(quelle, { pick: EXIF_FELDER, reviveValues: false });
  } catch {
    return null;
  }
  if (!roh) return null;

  /*
   * ⚠️ **`IFD2`, nicht `ExifIFD`** — und **`ISOSpeedRatings`, nicht `ISO`**.
   * `withExif` reicht die Namen an libvips/exiv2 durch; unter `ExifIFD`
   * geschriebene Felder verschwanden spurlos, und `ISO` wurde stillschweigend
   * verworfen, während die drei anderen Werte ankamen. Beides gemessen, nicht
   * vermutet.
   */
  const feld = {};
  if (roh.DateTimeOriginal) feld.DateTimeOriginal = String(roh.DateTimeOriginal);
  if (typeof roh.ExposureTime === "number" && roh.ExposureTime > 0) {
    feld.ExposureTime =
      roh.ExposureTime >= 1
        ? `${Math.round(roh.ExposureTime * 100)}/100`
        : `1/${Math.round(1 / roh.ExposureTime)}`;
  }
  if (typeof roh.FNumber === "number" && roh.FNumber > 0) {
    feld.FNumber = `${Math.round(roh.FNumber * 10)}/10`;
  }
  const iso = roh.ISO ?? roh.ISOSpeedRatings;
  if (typeof iso === "number" && iso > 0) feld.ISOSpeedRatings = String(iso);

  return Object.keys(feld).length > 0 ? { IFD2: feld } : null;
}

/** Eine Datei verkleinern und unter `zielName` im Zielbaum ablegen. */
async function verkleinere(quelle, zielName, meldungen) {
  const exif = await aufnahmedaten(quelle);

  let bild = sharp(quelle)
    // Drehung anwenden, bevor die Maße zählen — sonst liegt ein Hochformat quer.
    .rotate()
    .resize({ width: MAX_KANTE, height: MAX_KANTE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITAET, mozjpeg: true });
  if (exif) bild = bild.withExif(exif);

  const daten = await bild.toBuffer();
  const ziel = path.join(ZIEL, zielName);
  await mkdir(path.dirname(ziel), { recursive: true });
  await writeFile(ziel, daten);

  const vorher = (await stat(quelle)).size;
  const { width, height } = await sharp(daten).metadata();
  meldungen.push({
    zielName,
    von: path.basename(quelle),
    text:
      `${width}×${height}, ${menschlich(vorher)} → ${menschlich(daten.length)}` +
      (exif ? "" : "  (ohne Aufnahmedaten)"),
    zuGross: daten.length > WARNUNG_BYTES,
  });
  return daten;
}

/** Bilddateien eines Ordners, alphabetisch — Unterordner bleiben außen vor. */
async function bilderIn(ordner) {
  const eintraege = await readdir(ordner, { withFileTypes: true });
  return eintraege
    .filter((e) => e.isFile() && ENDUNGEN.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}

function abbruch(text) {
  console.error(`\n${text}\n`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const MIT_WERT = new Set(["--arbeit", "--serie", "--einzel", "--leitbild"]);
  const wert = {};
  let quelle;
  let hochladen = false;

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (MIT_WERT.has(a)) {
      i += 1;
      wert[a] = args[i];
    } else if (a === "--hochladen") {
      hochladen = true;
    } else if (a.startsWith("--")) {
      abbruch(`Unbekannte Angabe: ${a}`);
    } else if (quelle === undefined) {
      quelle = a;
    } else {
      abbruch(`Zwei Quellen angegeben (${quelle} und ${a}) — es geht nur eine.`);
    }
  }

  const { "--arbeit": arbeit, "--serie": serie, "--einzel": einzel, "--leitbild": leitbild } = wert;

  if (!quelle || (!arbeit && !serie && !einzel)) {
    abbruch(
      "Aufruf:\n" +
        "  npm run verkleinern -- <ordner> --arbeit <id>        Leitbild + Bildstrecke\n" +
        "  npm run verkleinern -- <ordner> --serie <id>         Kontaktbogen\n" +
        "  npm run verkleinern -- <datei>  --einzel <schluessel>  z. B. portrait\n" +
        "\nZusätzlich --leitbild <dateiname>, um das Leitbild selbst zu wählen,\n" +
        "und --hochladen, um das Ergebnis gleich in den Bucket zu legen.",
    );
  }
  if (!existsSync(quelle)) abbruch(`Gibt es nicht: ${quelle}`);

  /*
   * Die `id` gegen content.ts prüfen — **bevor** gerechnet wird. Eine Datei
   * unter einem Namen, den die Seite nicht kennt, erscheint nirgends; genau
   * das ist beim ersten Anlauf zwölfmal passiert.
   */
  const id = arbeit ?? serie;
  if (id) {
    try {
      const { WORKS } = await import("../lib/content.ts");
      if (!WORKS.some((w) => w.id === id)) {
        abbruch(
          `„${id}" ist keine Arbeit aus lib/content.ts.\n` +
            `Bekannt sind:\n  ${WORKS.map((w) => w.id).join("\n  ")}\n\n` +
            `Gibt es die Arbeit noch nicht, muss sie dort zuerst angelegt werden.`,
        );
      }
    } catch {
      console.warn("  ! id nicht geprüft (Node kann lib/content.ts nicht lesen).");
    }
  }

  await rm(ZIEL, { recursive: true, force: true });
  const meldungen = [];

  if (einzel) {
    await verkleinere(quelle, `original/${einzel}.jpg`, meldungen);
  } else {
    const dateien = await bilderIn(quelle);
    if (dateien.length === 0) abbruch(`Keine Bilder in ${quelle}.`);

    if (serie) {
      // Kontaktbogen: durchnummeriert, Reihenfolge = Dateiname.
      for (const [i, name] of dateien.entries()) {
        const nr = String(i + 1).padStart(2, "0");
        await verkleinere(path.join(quelle, name), `original/arbeiten/${serie}/serie/${nr}.jpg`, meldungen);
      }
      console.log(
        `\n⚠️ Im Kontaktbogen markiert \`-gewaehlt\` am Dateinamen das Bild, das es\n` +
          `   geworden ist. Genau eins umbenennen, z. B. 03.jpg → 03-gewaehlt.jpg.`,
      );
    } else {
      /*
       * Ohne `--leitbild` wird die erste Datei zum Leitbild. Das ist eine
       * Notlösung, keine Auswahl: Welches Bild die Kachel trägt, ist eine
       * fotografische Entscheidung und gehört Jakob, nicht der Sortierung.
       */
      const leit = leitbild ?? dateien[0];
      if (!dateien.includes(leit)) {
        abbruch(`--leitbild ${leit} liegt nicht in ${quelle}.\nGefunden: ${dateien.join(", ")}`);
      }
      if (!leitbild) {
        console.log(`\n! Leitbild nicht gewählt — genommen wird die erste Datei (${leit}).`);
        console.log(`  Mit --leitbild <dateiname> bestimmst du es selbst.`);
      }

      await verkleinere(path.join(quelle, leit), `original/arbeiten/${arbeit}.jpg`, meldungen);
      let nr = 0;
      for (const name of dateien) {
        if (name === leit) continue;
        nr += 1;
        await verkleinere(
          path.join(quelle, name),
          `original/arbeiten/${arbeit}/${String(nr).padStart(2, "0")}.jpg`,
          meldungen,
        );
      }
    }
  }

  console.log("");
  for (const m of meldungen) {
    console.log(`  ${m.zuGross ? "!" : "✓"} ${m.zielName}   ← ${m.von}`);
    console.log(`      ${m.text}`);
  }
  const zuGross = meldungen.filter((m) => m.zuGross);
  if (zuGross.length > 0) {
    console.warn(
      `\n  ! ${zuGross.length} Datei(en) über ${menschlich(WARNUNG_BYTES)}. ` +
        `Nicht schlimm, aber ungewöhnlich —\n    meist steckt ein sehr detailreiches Motiv dahinter.`,
    );
  }

  if (!hochladen) {
    console.log(
      `\n${meldungen.length} Dateien liegen in ` +
        `${path.join(path.relative(WURZEL, ZIEL), "original")}\n\n` +
        `Weiter geht es so:\n` +
        `  a) den Ordner \`original\` daraus ins R2-Dashboard ziehen, oder\n` +
        `  b) denselben Befehl noch einmal mit --hochladen aufrufen.\n` +
        `Danach: npm run medien`,
    );
    return;
  }

  const r2 = zugang();
  for (const m of meldungen) {
    const daten = await readFile(path.join(ZIEL, m.zielName));
    await lege(r2, m.zielName, daten, "image/jpeg");
    console.log(`  → ${m.zielName}`);
  }
  console.log(`\n${meldungen.length} Dateien im Bucket. Weiter mit: npm run medien`);
}

main().catch((fehler) => {
  console.error(`Verkleinern abgebrochen: ${fehler.message}`);
  process.exit(1);
});
