/**
 * Bildpipeline — läuft vor jedem Build (`prebuild`, siehe package.json).
 *
 * Aufgabe: Aus einer Originaldatei in `bilder/` alle ausgelieferten Varianten
 * erzeugen (AVIF, WebP, ein JPEG-Rückfall, ein winziges Vorschaubildchen) und
 * die Pfade in `lib/bilder-manifest.json` schreiben.
 *
 * Warum zur Bauzeit und nicht zur Laufzeit: Der OpenNext-Adapter bringt
 * keinen Bildoptimierer mit (siehe TECH-STACK.md). Ein Bild pro Anfrage neu
 * zu rechnen ginge im Worker ohnehin nicht — zur Bauzeit ist es einmal Arbeit
 * und danach eine statische Datei am Rand des Netzes.
 *
 * Warum Ableitungen nicht ins Git kommen: Neun Arbeiten mal fünf Breiten mal
 * drei Formate sind über hundert Dateien, die sich bei jeder Qualitätsänderung
 * alle ändern. Im Repo liegt das Original, ausgeliefert wird das Erzeugte.
 *
 * Bedienung für Jan und Jakob: Datei nach `bilder/arbeiten/<id>.jpg` legen,
 * wobei `<id>` die `id` der Arbeit aus `lib/content.ts` ist. Mehr nicht —
 * beim nächsten Build erscheint das Bild. Details in `bilder/README.md`.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";
import sharp from "sharp";

import {
  BUDGET,
  EXIF_FELDER,
  LQIP_BREITE,
  PIPELINE_VERSION,
  QUALITAET,
  breitenFuer,
  fallbackBreite,
  srcset,
  variantenName,
} from "../lib/bilder-regeln.mjs";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const QUELLE = path.join(WURZEL, "bilder");
const ZIEL = path.join(WURZEL, "public", "b");
const MANIFEST = path.join(WURZEL, "lib", "bilder-manifest.json");

/**
 * Buchhaltung der Pipeline (Prüfsummen, erzeugte Dateien) — getrennt vom
 * Manifest, weil das Manifest in den Browser ausgeliefert wird. Dort haben
 * Prüfsummen und Dateilisten nichts verloren. Liegt außerhalb von `public/`,
 * wird nicht eingecheckt und darf jederzeit fehlen.
 */
const CACHE = path.join(WURZEL, ".bilder-cache.json");

/** Öffentlicher Pfadanfang der erzeugten Dateien. */
const BASIS_URL = "/b";

const ENDUNGEN = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);

/** Alle Originale unter `bilder/`, als Pfade relativ zu diesem Ordner. */
async function quellen(unter = "") {
  const ordner = path.join(QUELLE, unter);
  if (!existsSync(ordner)) return [];

  const eintraege = await readdir(ordner, { withFileTypes: true });
  const gefunden = [];

  for (const eintrag of eintraege) {
    const relativ = path.posix.join(unter, eintrag.name);
    if (eintrag.isDirectory()) {
      gefunden.push(...(await quellen(relativ)));
    } else if (ENDUNGEN.has(path.extname(eintrag.name).toLowerCase())) {
      gefunden.push(relativ);
    }
  }

  return gefunden.sort();
}

/**
 * Cache-Schlüssel einer Quelle: Inhalt plus Pipelineversion. Über den Inhalt
 * statt über das Änderungsdatum, weil ein frischer Checkout alle Datumsangaben
 * neu setzt und sonst jeder Build alles neu rechnen würde.
 */
async function schluessel(datei) {
  const inhalt = await readFile(datei);
  return createHash("sha1")
    .update(inhalt)
    .update(String(PIPELINE_VERSION))
    .digest("hex");
}

function menschlich(bytes) {
  return `${Math.round(bytes / 1024)} kB`;
}

/**
 * Aufnahmedaten aus dem Original — Uhrzeit, Belichtungszeit, Blende, ISO.
 *
 * Zwei Entscheidungen, die nicht offensichtlich sind:
 *
 * 1. **`pick` statt „alles lesen und dann aussortieren".** Was nicht gelesen
 *    wird, kann auch nicht versehentlich im Manifest landen — allen voran
 *    die GPS-Koordinaten. Die Liste steht in `lib/bilder-regeln.mjs`.
 *
 * 2. **`reviveValues: false`, also die rohe Zeichenkette statt eines
 *    `Date`.** Im EXIF steht keine Zeitzone. Aus `2026:08:28 22:14:03` ein
 *    `Date` zu machen heißt, die Zeitzone des **Build-Rechners** anzunehmen —
 *    dann zeigt die Seite je nach Server eine andere Uhrzeit an. Genommen
 *    wird deshalb genau das, was in der Datei steht.
 *
 * Fehlt das EXIF (viele Exportwege werfen es weg), gibt es keine Zeile.
 * Das ist kein Fehler und bricht nichts.
 */
async function aufnahmedaten(quelle) {
  let roh;
  try {
    roh = await exifr.parse(quelle, { pick: EXIF_FELDER, reviveValues: false });
  } catch {
    return undefined;
  }
  if (!roh) return undefined;

  const daten = {};

  if (typeof roh.DateTimeOriginal === "string") {
    /*
     * Format laut EXIF-Spezifikation: "JJJJ:MM:TT hh:mm:ss".
     *
     * **Mit Sekunden** gespeichert, obwohl die Zeile unter dem Bild nur
     * Stunde und Minute zeigt: Im Kontaktbogen liegen alle Frames in
     * derselben Minute — dort ist gerade die Sekunde die Information.
     * Gekürzt wird deshalb beim Anzeigen, nicht beim Auslesen.
     */
    const treffer = roh.DateTimeOriginal.match(/\b(\d{2}:\d{2}:\d{2})$/);
    if (treffer) daten.zeit = treffer[1];
  }
  if (typeof roh.ExposureTime === "number" && roh.ExposureTime > 0) {
    daten.belichtung = roh.ExposureTime;
  }
  if (typeof roh.FNumber === "number" && roh.FNumber > 0) {
    daten.blende = roh.FNumber;
  }
  const iso = roh.ISO ?? roh.ISOSpeedRatings;
  if (typeof iso === "number" && iso > 0) daten.iso = iso;

  return Object.keys(daten).length > 0 ? daten : undefined;
}

/**
 * Eine Quelle verarbeiten. Gibt den Manifesteintrag zurück und sammelt
 * Warnungen ein, statt sie sofort zu drucken — so bleibt die Ausgabe je Bild
 * beieinander.
 */
async function verarbeite(relativ, warnungen) {
  const quelle = path.join(QUELLE, relativ);
  const name = relativ.replace(/\.[^.]+$/, "");
  const zielOrdner = path.join(ZIEL, path.dirname(name));
  const basisUrl = path.posix.join(BASIS_URL, path.dirname(name));
  const dateiName = path.basename(name);

  // `.rotate()` ohne Argument wendet die EXIF-Ausrichtung an. Das ist keine
  // Kür: sharp schreibt die Metadaten nicht mit (Standardverhalten, und
  // erwünscht — damit sind GPS-Koordinaten aus den Ausgabedateien draußen),
  // ohne die Drehung läge ein Hochformat aus dem Telefon danach quer.
  const meta = await sharp(quelle).metadata();
  const gedreht = typeof meta.orientation === "number" && meta.orientation >= 5;
  const breite = gedreht ? meta.height : meta.width;
  const hoehe = gedreht ? meta.width : meta.height;

  if (!breite || !hoehe) {
    throw new Error(`${relativ}: Abmessungen nicht lesbar — kaputte Datei?`);
  }

  const breiten = breitenFuer(breite);
  await mkdir(zielOrdner, { recursive: true });

  const erzeugt = [];

  for (const b of breiten) {
    const basis = sharp(quelle).rotate().resize({ width: b, withoutEnlargement: true });

    for (const [endung, optionen] of [
      ["avif", { quality: QUALITAET.avif }],
      ["webp", { quality: QUALITAET.webp }],
    ]) {
      const ziel = path.join(zielOrdner, variantenName(dateiName, b, endung));
      const { size } = await basis.clone().toFormat(endung, optionen).toFile(ziel);
      erzeugt.push(ziel);

      if (size > BUDGET.fehler) {
        throw new Error(
          `${relativ}: ${path.basename(ziel)} ist ${menschlich(size)} groß — ` +
            `über der harten Grenze von ${menschlich(BUDGET.fehler)}. ` +
            `Das deutet auf ein unkomprimiertes Original hin (Screenshot? PNG?).`,
        );
      }
      if (endung === "avif" && b === 1200 && size > BUDGET.warnung) {
        warnungen.push(
          `${relativ}: ${menschlich(size)} bei 1200px (Budget ${menschlich(BUDGET.warnung)}). ` +
            `Kein Fehler, aber die Seite wird auf schlechtem Netz spürbar langsamer.`,
        );
      }
    }
  }

  // Rückfall für Browser ohne AVIF und WebP. Ein einzelnes JPEG genügt:
  // Wer beide modernen Formate nicht kann, ist so selten, dass sich ein
  // eigenes `srcset` dafür nicht lohnt.
  const fb = fallbackBreite(breiten);
  const fallbackZiel = path.join(zielOrdner, variantenName(dateiName, fb, "jpg"));
  await sharp(quelle)
    .rotate()
    .resize({ width: fb, withoutEnlargement: true })
    .jpeg({ quality: QUALITAET.jpeg, mozjpeg: true })
    .toFile(fallbackZiel);
  erzeugt.push(fallbackZiel);

  // Vorschaubildchen als Datei-URI: liegt im Manifest, also im HTML, und ist
  // damit da, bevor irgendein Bild geladen wurde. Verhindert die graue Fläche
  // beim Aufbau, ohne dafür eine Anfrage zu kosten.
  const lqip = await sharp(quelle)
    .rotate()
    .resize({ width: LQIP_BREITE })
    .webp({ quality: 40 })
    .toBuffer();

  const exif = await aufnahmedaten(quelle);

  return {
    eintrag: {
      breite,
      hoehe,
      ...(exif ? { exif } : {}),
      avif: srcset(basisUrl, dateiName, breiten, "avif"),
      webp: srcset(basisUrl, dateiName, breiten, "webp"),
      fallback: path.posix.join(basisUrl, variantenName(dateiName, fb, "jpg")),
      lqip: `data:image/webp;base64,${lqip.toString("base64")}`,
    },
    dateien: erzeugt.map((p) => path.relative(ZIEL, p)),
  };
}

/** Erzeugte Dateien löschen, zu denen es kein Original mehr gibt. */
async function raeumeAuf(behalten) {
  if (!existsSync(ZIEL)) return 0;

  const alle = [];
  const durchlaufe = async (unter) => {
    const eintraege = await readdir(path.join(ZIEL, unter), { withFileTypes: true });
    for (const e of eintraege) {
      const relativ = path.join(unter, e.name);
      if (e.isDirectory()) await durchlaufe(relativ);
      else alle.push(relativ);
    }
  };
  await durchlaufe("");

  let geloescht = 0;
  for (const datei of alle) {
    if (!behalten.has(datei)) {
      await rm(path.join(ZIEL, datei));
      geloescht += 1;
    }
  }
  return geloescht;
}

async function main() {
  const dateien = await quellen();
  const cache = existsSync(CACHE) ? JSON.parse(await readFile(CACHE, "utf8")) : {};

  const manifest = {};
  const neuerCache = {};
  const behalten = new Set();
  const warnungen = [];
  let neu = 0;
  let uebersprungen = 0;

  for (const relativ of dateien) {
    const name = relativ.replace(/\.[^.]+$/, "");
    const hash = await schluessel(path.join(QUELLE, relativ));
    const alt = cache[name];

    // Nur überspringen, wenn die Prüfsumme passt **und** die Dateien wirklich
    // da sind. Sonst fehlt nach einem frischen Checkout mit übrig gebliebenem
    // Cache jedes Bild, und niemand versteht, warum.
    const dateienDa =
      alt?.dateien?.every((d) => existsSync(path.join(ZIEL, d))) ?? false;

    if (alt?.hash === hash && dateienDa) {
      manifest[name] = alt.eintrag;
      neuerCache[name] = alt;
      alt.dateien.forEach((d) => behalten.add(d));
      uebersprungen += 1;
      continue;
    }

    const { eintrag, dateien: erzeugt } = await verarbeite(relativ, warnungen);
    manifest[name] = eintrag;
    neuerCache[name] = { hash, eintrag, dateien: erzeugt };
    erzeugt.forEach((d) => behalten.add(d));
    neu += 1;
    console.log(`  ✓ ${name} (${eintrag.breite}×${eintrag.hoehe})`);
  }

  const geloescht = await raeumeAuf(behalten);
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(CACHE, `${JSON.stringify(neuerCache)}\n`);

  for (const w of warnungen) console.warn(`  ! ${w}`);

  if (dateien.length === 0) {
    console.log(
      "Bilder: keine Originale in bilder/ — die Seite zeigt Platzhalter. " +
        "Anleitung: bilder/README.md",
    );
  } else {
    console.log(
      `Bilder: ${neu} erzeugt, ${uebersprungen} unverändert` +
        (geloescht > 0 ? `, ${geloescht} verwaiste gelöscht` : ""),
    );
  }
}

main().catch((fehler) => {
  console.error(`Bildpipeline abgebrochen: ${fehler.message}`);
  process.exit(1);
});
