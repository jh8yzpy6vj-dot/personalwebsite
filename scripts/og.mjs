/**
 * Vorschaukarten (OpenGraph) — **läuft lokal oder in der Medien-Action**, im
 * Anschluss an `scripts/medien.mjs` (`npm run medien` ruft beides
 * nacheinander auf).
 *
 * Erzeugt **eine** Karte (`start.jpg`) für alle Seiten unter `public/og/`.
 * Seit dem Umbau vom 2026-10-08 gibt es keine Detailseiten mehr und damit
 * keine Karte je Arbeit; alte Karten räumt das Skript selbst weg. Anders als die Bildvarianten liegen die Karten **im Repo**:
 * Es sind rund zehn Dateien à 50 kB, sie ändern sich nur mit den Titeln, und
 * so ist die Seite ohne den Bucket vollständig. Nach einem Lauf gehören die
 * geänderten Karten mit committet. Das ist das Bild, das WhatsApp, Slack, Mastodon und LinkedIn
 * zeigen, wenn jemand einen Link teilt. Wirft ein Festival den Link in die
 * Gruppe, entscheidet diese Karte, ob jemand tippt; ohne sie steht dort eine
 * graue Fläche mit der Domain darunter.
 *
 * ⚠️ **Warum das hier steht und nicht als `opengraph-image.tsx` in `app/`.**
 * Genau so war es zuerst gebaut, und `next build` hat die Karten auch sauber
 * vorgerendert — **im echten Worker gaben sie trotzdem 500 zurück**
 * (`[unenv] fs.readFile is not implemented`). Der Adapter bediente die Route
 * nicht aus dem Vorrender-Cache, sondern führte sie zur Laufzeit aus, und
 * dort gibt es kein Dateisystem. Aufgefallen erst beim Prüfen gegen
 * `wrangler dev` — siehe „Prüfen vor dem Deploy" in TECH-STACK.md.
 *
 * Als statische Datei aus der Pipeline ist das Problem strukturell weg: Die
 * Karten sind fertige PNGs am Rand des Netzes, im Worker läuft dafür nichts.
 *
 * Die Texte kommen aus `lib/inhalt.json` — der einzigen Inhaltsquelle, statt
 * sie ein zweites Mal zu pflegen.
 *
 * ⚠️ **Bis 2026-10-17 las das Skript `lib/content.ts`.** Die importiert seit
 * dem Umzug der Inhalte TypeScript und JSON ohne Endung; das kann nur der
 * Bündler, nicht Node. Der Import wäre gescheitert, das Skript hätte
 * „übersprungen" gemeldet — und es gäbe still keine neuen Karten mehr.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
/*
 * ⚠️ `next/og.js` mit Endung, nicht `next/og`. Das Paket `next` bringt keine
 * `exports`-Zuordnung mit; in Anwendungscode ergänzt der Bündler die Endung,
 * ein blankes Node-Skript tut das nicht und findet die Datei sonst nicht.
 */
import { ImageResponse } from "next/og.js";
import sharp from "sharp";

import { leseInhalt } from "./inhalt.mjs";
import { OG_GROESSE, ogKarte } from "./og-karte.mjs";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const ZIEL = path.join(WURZEL, "public", "og");
const MANIFEST = path.join(WURZEL, "lib", "bilder-manifest.json");
/** Zwischenspeicher der Medienpipeline — siehe `foto()`. */
const CACHE = path.join(WURZEL, ".medien-cache");

/**
 * Schriften als TrueType. `next/font` lädt nur WOFF2, damit kann Satori
 * nichts anfangen — deshalb liegen die beiden Schnitte als TTF im Repo
 * (`assets/fonts/`, OFL, Lizenztext daneben). Sie werden nur hier gelesen
 * und **nicht** an Browser ausgeliefert.
 */
async function schriften() {
  const [display, mono] = await Promise.all([
    readFile(path.join(WURZEL, "assets/fonts/bricolage-700.ttf")),
    readFile(path.join(WURZEL, "assets/fonts/martianmono-400.ttf")),
  ]);
  return [
    { name: "Display", data: display, weight: 700, style: "normal" },
    { name: "Mono", data: mono, weight: 400, style: "normal" },
  ];
}

/** Wird am Ende einmal gesammelt gemeldet, nicht je Karte. */
const fehlendeFotos = [];

/**
 * Das Foto als Datei-URI — Satori kann keine Datei vom Dateisystem laden.
 *
 * Zuerst aus dem **lokalen Zwischenspeicher** der Medienpipeline:
 * `eintrag.fallback` ist eine vollständige Adresse
 * (`https://medien.…/b/arbeiten/x-1200.jpg?v=…`); dieselbe Datei liegt nach
 * `npm run medien` unter `.medien-cache/b/arbeiten/x-1200.jpg`. Über den
 * Pfadanteil der Adresse ist das unabhängig davon, unter welcher Domain der
 * Bucket gerade erreichbar ist.
 *
 * ⚠️ **Sonst aus dem Bucket, über genau diese Adresse.** In der Medien-Action
 * gibt es keinen Zwischenspeicher, der über den Lauf hinaus bleibt: Dort
 * liegen nur die Bilder, die dieser Lauf neu gerechnet hat. Ohne den
 * Download bekäme die Karte dort fast nie ein Foto — nämlich immer dann,
 * wenn das Startbild unverändert ist.
 *
 * Klappt beides nicht, gibt es `null`; was dann geschieht, entscheidet
 * `main()`.
 */
async function foto(eintrag) {
  if (!eintrag?.fallback) return null;
  let adresse;
  try {
    adresse = new URL(eintrag.fallback);
  } catch {
    return null; // Kein absoluter Link — Manifest aus einer älteren Version.
  }
  // Im Zwischenspeicher liegt der Bucket-Schlüssel roh, in der Adresse kodiert.
  const pfad = decodeURIComponent(adresse.pathname);
  try {
    const datei = await readFile(path.join(CACHE, pfad));
    return `data:image/jpeg;base64,${datei.toString("base64")}`;
  } catch {
    // Nicht im Zwischenspeicher — dann aus dem Bucket.
  }
  try {
    const antwort = await fetch(adresse, { signal: AbortSignal.timeout(30_000) });
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
    const datei = Buffer.from(await antwort.arrayBuffer());
    /* Nur, was wirklich ein JPEG ist: Eine Fehlerseite mit Status 200 (etwa
       von einer falsch eingerichteten Domain) ergäbe sonst eine kaputte Karte. */
    const format = await sharp(datei)
      .metadata()
      .then((m) => m.format)
      .catch(() => undefined);
    if (format !== "jpeg") throw new Error("kein JPEG");
    return `data:image/jpeg;base64,${datei.toString("base64")}`;
  } catch (fehler) {
    fehlendeFotos.push(`${pfad} (${fehler.name === "TimeoutError" ? "Zeitüberschreitung" : fehler.message})`);
    return null;
  }
}

/**
 * Obergrenze je Karte. Sie wird von jedem Messenger geladen, der eine
 * Vorschau baut — bei zehn Karten summiert sich das auf dem Server, und beim
 * Empfänger zählt jedes Byte, bevor er überhaupt etwas sieht.
 */
const OG_BUDGET = 250 * 1024;

/**
 * ⚠️ **JPEG, nicht PNG.** `ImageResponse` liefert PNG, und PNG ist für ein
 * Foto das falsche Format: Die Karten waren so **je rund 970 kB**. Durch
 * sharp als JPEG sind es rund 70 — bei einem Bild, das ohnehin nur als
 * kleine Vorschau erscheint, ohne sichtbaren Unterschied.
 */
async function schreibe(name, element, fonts) {
  const antwort = new ImageResponse(element, { ...OG_GROESSE, fonts });
  const png = Buffer.from(await antwort.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  await writeFile(path.join(ZIEL, `${name}.jpg`), jpeg);
  return jpeg.length;
}

async function main() {
  const inhalt = await leseInhalt();
  const manifest = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, "utf8"))
    : {};

  await mkdir(ZIEL, { recursive: true });
  const fonts = await schriften();
  const behalten = new Set();

  const gross = [];
  const pruefe = (name, bytes) => {
    if (bytes > OG_BUDGET) gross.push(`${name} (${Math.round(bytes / 1024)} kB)`);
  };

  /* Dasselbe Bild wie auf der Startseite: das Hero-Standbild, sonst das
     Ersatzfoto aus lib/inhalt.json. */
  const heroErsatz = inhalt.startseite?.heroErsatz;
  const startbild = manifest["hero/standbild"] ?? (heroErsatz ? manifest[heroErsatz] : null);
  const startfoto = await foto(startbild);
  behalten.add("start.jpg");

  /*
   * ⚠️ **War das Foto nur gerade nicht zu holen, bleibt die alte Karte
   * stehen.** Sonst entstünde eine Karte ohne Foto, die Medien-Action
   * committete sie — und am nächsten Tag, wenn der Bucket wieder antwortet,
   * wieder die mit Foto: zwei Commits und zwei Deploys für nichts, dazwischen
   * eine graue Vorschau. Ohne vorhandene Karte (frischer Klon) gilt weiter:
   * lieber ohne Foto als gar keine.
   */
  let erzeugt = 0;
  if (startbild && !startfoto && existsSync(path.join(ZIEL, "start.jpg"))) {
    console.warn("  ! start.jpg nicht neu erzeugt: Das Foto war nicht zu holen, die alte Karte bleibt.");
  } else {
    pruefe(
      "start",
      await schreibe(
        "start",
        ogKarte({
          marke: inhalt.seite.name,
          /* Keine Positionierungszeile (UI-SPEC) — nur, was es hier gibt. */
          titel: "foto · film",
          foto: startfoto,
        }),
        fonts,
      ),
    );
    erzeugt += 1;
  }

  // Karten zu gelöschten Arbeiten wegräumen — sonst bleibt eine Vorschau für
  // eine URL liegen, die es nicht mehr gibt.
  let geloescht = 0;
  for (const datei of await readdir(ZIEL)) {
    if (!behalten.has(datei)) {
      await rm(path.join(ZIEL, datei));
      geloescht += 1;
    }
  }

  for (const g of gross) {
    console.warn(`  ! Vorschaukarte über Budget: ${g} (Grenze ${OG_BUDGET / 1024} kB)`);
  }
  if (fehlendeFotos.length > 0) {
    console.warn(
      `  ! ${fehlendeFotos.length} Foto(s) weder im Zwischenspeicher ` +
        `(${path.relative(WURZEL, CACHE)}) noch aus dem Bucket zu holen.\n` +
        `    Beispiel: ${fehlendeFotos[0]}`,
    );
  }
  console.log(
    `Vorschaukarten: ${erzeugt} erzeugt` +
      (geloescht > 0 ? `, ${geloescht} verwaiste gelöscht` : ""),
  );
}

main().catch((fehler) => {
  console.error(`Vorschaukarten abgebrochen: ${fehler.message}`);
  process.exit(1);
});
