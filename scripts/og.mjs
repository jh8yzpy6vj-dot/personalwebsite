/**
 * Vorschaukarten (OpenGraph) — **läuft lokal**, im Anschluss an
 * `scripts/medien.mjs` (`npm run medien` ruft beides nacheinander auf).
 *
 * Erzeugt je Arbeit und einmal für die Seite selbst ein JPEG unter
 * `public/og/`. Anders als die Bildvarianten liegen die Karten **im Repo**:
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
 * ⚠️ Braucht **Node ≥ 22.18** (oder ≥ 22.6 mit `--experimental-strip-types`),
 * weil das Skript `lib/content.ts` direkt liest — so bleibt `content.ts` die
 * einzige Inhaltsquelle, statt die Titel ein zweites Mal zu pflegen. Kann
 * Node das nicht, bricht der Build **nicht** ab: Es gibt dann eine Warnung
 * und keine Karten.
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
 * ⚠️ Die Quelle ist der **lokale Zwischenspeicher** der Medienpipeline, nicht
 * der Bucket. `eintrag.fallback` ist eine vollständige Adresse
 * (`https://medien.…/b/arbeiten/x-1200.jpg`); dieselbe Datei liegt nach
 * `npm run medien` unter `.medien-cache/b/arbeiten/x-1200.jpg`. Über den
 * Pfadanteil der Adresse ist das unabhängig davon, unter welcher Domain der
 * Bucket gerade erreichbar ist.
 *
 * Fehlt der Zwischenspeicher (frischer Klon), entsteht die Karte **ohne**
 * Foto statt gar nicht. Das ist die richtige Reihenfolge: Ein fehlendes Foto
 * ist ein schwächeres Vorschaubild, ein Abbruch wäre gar keins.
 */
async function foto(eintrag) {
  if (!eintrag?.fallback) return null;
  let pfad;
  try {
    pfad = new URL(eintrag.fallback).pathname;
  } catch {
    return null; // Kein absoluter Link — Manifest aus einer älteren Version.
  }
  try {
    const datei = await readFile(path.join(CACHE, pfad));
    return `data:image/jpeg;base64,${datei.toString("base64")}`;
  } catch {
    fehlendeFotos.push(pfad);
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

/** Metazeile einer Arbeit — dieselbe Regel wie in lib/works.ts. */
const metaZeile = (w) => [w.place, w.role, w.year].filter(Boolean).join(" · ");

async function main() {
  let inhalt;
  try {
    inhalt = await import("../lib/content.ts");
  } catch (fehler) {
    console.warn(
      `  ! Vorschaukarten übersprungen: ${fehler.message}\n` +
        `    Node ${process.versions.node} kann lib/content.ts nicht lesen. ` +
        `Ab Node 22.18 geht das von selbst.`,
    );
    return;
  }

  const { SITE, WORKS } = inhalt;
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

  pruefe(
    "start",
    await schreibe(
      "start",
      ogKarte({
        marke: SITE.name,
        titel: SITE.positioning,
        unter: SITE.locations,
        foto: await foto(manifest["hero/standbild"]),
      }),
      fonts,
    ),
  );
  behalten.add("start.jpg");

  for (const work of WORKS) {
    pruefe(
      work.id,
      await schreibe(
        work.id,
        ogKarte({
          marke: SITE.name,
          ueber: work.client,
          titel: work.title,
          unter: metaZeile(work),
          foto: await foto(manifest[`arbeiten/${work.id}`]),
        }),
        fonts,
      ),
    );
    behalten.add(`${work.id}.jpg`);
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
      `  ! ${fehlendeFotos.length} Karte(n) ohne Foto — die Dateien fehlen im\n` +
        `    Zwischenspeicher (${path.relative(WURZEL, CACHE)}). Einmal ` +
        `\`npm run medien\` laufen lassen,\n    dann sind sie da. Beispiel: ` +
        `${fehlendeFotos[0]}`,
    );
  }
  console.log(
    `Vorschaukarten: ${behalten.size} erzeugt` +
      (geloescht > 0 ? `, ${geloescht} verwaiste gelöscht` : ""),
  );
}

main().catch((fehler) => {
  console.error(`Vorschaukarten abgebrochen: ${fehler.message}`);
  process.exit(1);
});
