/**
 * Medienpipeline — **läuft lokal oder in der Medien-Action, nie im Build.**
 *
 * Seit dem 2026-10-17 läuft sie auch in `.github/workflows/medien.yml`
 * (täglich und auf Knopfdruck aus der Verwaltung), dort ohne
 * `.medien-cache` — siehe `ausManifest()`.
 *
 * Holt die Originale aus dem R2-Bucket, erzeugt daraus alle ausgelieferten
 * Bildvarianten, legt sie zurück nach R2 und schreibt die Manifeste, die
 * eingecheckt werden. Videos werden nur verzeichnet, nicht verarbeitet.
 *
 * ⚠️ **Warum das nicht mehr im Cloudflare-Build läuft.** Vorher lagen die
 * Originale im Repo und der Build verarbeitete sie bei jedem Deploy neu.
 * Zwölf Kameradateien ergaben rund sechs Minuten Bauzeit, und die Dateien
 * blieben für immer im Git-Verlauf (einmal 134 MB). Jetzt liegt beides in
 * R2, der Build liest nur das eingecheckte Manifest und fasst kein Bild an.
 *
 * **Bedienung:** Dateien nach `original/…` in den Bucket legen (auch per
 * Cloudflare-Dashboard, dafür braucht niemand Git), dann einmal
 * `npm run medien` laufen lassen und die geänderten Manifeste committen.
 * Anleitung für Jan und Jakob: TECH-STACK.md, Abschnitt „Medien".
 *
 * Aufrufe:
 *   npm run medien              verarbeiten und hochladen
 *   npm run medien -- --probe   nur zeigen, was zu tun wäre (holt nichts,
 *                               rechnet nichts, schreibt nichts)
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";
import sharp from "sharp";

import { leseInhalt } from "./inhalt.mjs";

import {
  AVIF_MAX_BREITE,
  EXIF_FELDER,
  LQIP_BREITE,
  PIPELINE_VERSION,
  QUALITAET,
  QUELLE_WARNUNG,
  breitenFuer,
  budgetFuer,
  fallbackBreite,
  srcset,
  variantenName,
} from "../lib/bilder-regeln.mjs";
import { hole, lege, liste, loesche, zugang } from "./r2.mjs";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const BILD_MANIFEST = path.join(WURZEL, "lib", "bilder-manifest.json");
const VIDEO_MANIFEST = path.join(WURZEL, "lib", "video-manifest.json");

/**
 * Lokaler Zwischenspeicher. Enthält heruntergeladene Originale und erzeugte
 * Varianten, damit ein zweiter Lauf nicht alles neu holt und rechnet — und
 * damit `scripts/og.mjs` die Vorschaukarten aus den fertigen JPEGs bauen
 * kann, ohne sie erneut aus R2 zu ziehen. Ignoriert, darf jederzeit fehlen.
 */
const CACHE = path.join(WURZEL, ".medien-cache");
const CACHE_STAND = path.join(CACHE, "stand.json");

/** Präfixe im Bucket. */
const R2_ORIGINAL = "original/";
const R2_ABLEITUNG = "b/";

const BILD_ENDUNGEN = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);
const VIDEO_ENDUNGEN = new Set([".mp4", ".webm", ".mov"]);

const TYPEN = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

/**
 * Ab hier ist das Hero-Video zu schwer.
 *
 * Es startet ohne Zutun und lädt damit auf jedem Mobilfunkgerät mit, bevor
 * irgendetwas anderes fertig ist. 8 MB sind bei durchschnittlichem LTE rund
 * fünf Sekunden — der Kurator auf dem Festivalgelände hat laut SITE-PLAN.md
 * genau die nicht. Eine **Warnung**, keine Sperre: Die Datei liegt schon im
 * Bucket, sie hier abzulehnen würde nichts besser machen.
 */
const HERO_BUDGET = 8 * 1024 * 1024;

const probe = process.argv.includes("--probe");

/**
 * Die öffentliche Adresse des Buckets, z. B. `https://medien.jakobsax.de`.
 *
 * ⚠️ Sie landet **fest in den Manifesten**. Wer die Domain wechselt, muss
 * einmal `npm run medien` mit der neuen Adresse laufen lassen; der Cache
 * merkt die Änderung von selbst (die Adresse steckt im Cache-Schlüssel) und
 * schreibt alle Einträge neu. Der Alternativweg — relative Pfade im Manifest
 * und die Domain im Code — hätte bedeutet, jeden `srcset`-String zur
 * Laufzeit zusammenzusetzen; das ist im Renderpfad die schlechtere Stelle.
 */
function oeffentlich() {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) {
    throw new Error(
      "R2_PUBLIC_URL fehlt — die öffentliche Adresse des Buckets,\n" +
        "    z. B. https://medien.jakobsax.de (Custom Domain in R2 → Settings).\n" +
        "    Die r2.dev-Adresse ist ausdrücklich nicht für den Dauerbetrieb gedacht.",
    );
  }
  return url.replace(/\/+$/, "");
}

function menschlich(bytes) {
  return `${Math.round(bytes / 1024)} kB`;
}

/** Aufnahmedaten — siehe `EXIF_FELDER`: GPS wird gar nicht erst gelesen. */
async function aufnahmedaten(datei) {
  let roh;
  try {
    roh = await exifr.parse(datei, { pick: EXIF_FELDER, reviveValues: false });
  } catch {
    return undefined;
  }
  if (!roh) return undefined;

  const daten = {};
  if (typeof roh.DateTimeOriginal === "string") {
    const treffer = roh.DateTimeOriginal.match(/\b(\d{2}:\d{2}:\d{2})$/);
    if (treffer) daten.zeit = treffer[1];
  }
  if (typeof roh.ExposureTime === "number" && roh.ExposureTime > 0) {
    daten.belichtung = roh.ExposureTime;
  }
  if (typeof roh.FNumber === "number" && roh.FNumber > 0) daten.blende = roh.FNumber;
  const iso = roh.ISO ?? roh.ISOSpeedRatings;
  if (typeof iso === "number" && iso > 0) daten.iso = iso;

  return Object.keys(daten).length > 0 ? daten : undefined;
}

/**
 * Ein Original verarbeiten: alle Varianten erzeugen, in den Cache legen und
 * nach R2 hochladen. Gibt den Manifesteintrag und die erzeugten Schlüssel
 * zurück.
 *
 * `name` ist der Pfad unter `original/` ohne Endung, also
 * `arbeiten/tete-a-tete-2026` oder `arbeiten/wiwawo-52/serie/03-gewaehlt`.
 * Daraus werden die Ableitungen `b/<name>-<breite>.<endung>` — derselbe
 * Baum, nur unter anderem Präfix. Das ist beim Nachsehen im Dashboard der
 * entscheidende Vorteil gegenüber gehashten Namen.
 */
async function verarbeite(r2, name, quelldatei, basisUrl, warnungen, schluessel) {
  const meta = await sharp(quelldatei).metadata();
  /*
   * Ab EXIF-Orientierung 5 ist das Bild um 90° gedreht abgelegt: `sharp`
   * meldet dann Breite und Höhe der *Datei*, nicht die des Bildes, das
   * `.rotate()` gleich erzeugt. Ohne den Tausch stünde am `img` ein
   * falsches Seitenverhältnis und die Seite ruckelte beim Laden.
   */
  const gedreht = typeof meta.orientation === "number" && meta.orientation >= 5;
  const breite = gedreht ? meta.height : meta.width;
  const hoehe = gedreht ? meta.width : meta.height;
  if (!breite || !hoehe) throw new Error(`${name}: Abmessungen nicht lesbar — kaputte Datei?`);

  const rohGroesse = (await readFile(quelldatei)).byteLength;
  if (Math.max(breite, hoehe) > QUELLE_WARNUNG.kante || rohGroesse > QUELLE_WARNUNG.bytes) {
    warnungen.push(
      `${name}: Original ist ${breite}×${hoehe} und ${menschlich(rohGroesse)} — ` +
        `auch für ein Archiv-Original viel. Ein Panorama oder ein Scan, das hier ` +
        `nicht hingehört? Sonst ignorieren: Originale dürfen groß sein.`,
    );
  }

  const breiten = breitenFuer(breite);
  const erzeugt = [];
  /** Öffentliche Adresse des Ableitungsordners, ohne Schrägstrich am Ende. */
  const ableitungsBasis = `${basisUrl}/${R2_ABLEITUNG}`.replace(/\/$/, "");
  /*
   * ⚠️ Der Name muss in die Adresse **kodiert**, in den Bucket-Schlüssel roh.
   * `srcset` ist kommagetrennt und leerzeichenempfindlich: Eine Datei
   * „mein bild, quer.jpg" — vom Handy hochgeladen völlig normal — hätte roh
   * eine Liste ergeben, die der Browser komplett verwirft. Nicht bloß dieses
   * eine Bild wäre kaputt gewesen, sondern das ganze `srcset`.
   */
  const urlName = name.split("/").map(encodeURIComponent).join("/");

  /**
   * Fingerabdruck für die Adresse — die ersten acht Stellen des
   * Cache-Schlüssels, der aus ETag des Originals, Pipelineversion und
   * Bucket-Adresse entsteht.
   *
   * ⚠️ **Ohne ihn zeigte die Seite nach einem Bildwechsel das alte Foto.**
   * Die Varianten liegen unter sprechenden, *stabilen* Namen
   * (`01-1200.avif`) und werden mit `max-age=31536000, immutable`
   * ausgeliefert. Ändert sich das Bild, ändert sich der Name eben **nicht** —
   * Browser und Cloudflare-Edge halten die alte Datei ein Jahr lang für
   * gültig und fragen wegen `immutable` nicht einmal nach.
   *
   * Aufgefallen ist es an einem Nebeneffekt: Die Aufnahmezeile unter den
   * Bildern stimmte plötzlich nicht mehr zum Bild. Sie steht im HTML, das
   * frisch gerendert wird — neue Zeit, altes Foto.
   *
   * Der Fingerabdruck steht als Abfrage **hinter** dem Pfad, nicht im
   * Dateinamen: Im R2-Dashboard bleiben die Namen damit lesbar, und genau
   * das war der Grund, überhaupt sprechende statt gehashter Namen zu nehmen.
   * Für Browser und Edge ist es trotzdem eine andere Adresse.
   */
  const fingerabdruck = schluessel.slice(0, 8);

  /**
   * Eine Variante in den Cache legen und hochladen; gibt ihre Adresse zurück.
   * `endung` wird an `urlName` bzw. `name` angehängt — Adresse kodiert,
   * Schlüssel roh.
   */
  async function ablegen(anhang, daten, typ) {
    const key = `${R2_ABLEITUNG}${name}${anhang}`;
    const lokal = path.join(CACHE, key);
    await mkdir(path.dirname(lokal), { recursive: true });
    await writeFile(lokal, daten);
    await lege(r2, key, daten, typ);
    erzeugt.push(key);
    return `${ableitungsBasis}/${urlName}${anhang}?v=${fingerabdruck}`;
  }

  // AVIF nur bis `AVIF_MAX_BREITE` — Begründung samt Messwerten dort.
  const avifBreiten = breiten.filter((b) => b <= AVIF_MAX_BREITE);

  for (const b of breiten) {
    /*
     * Einmal dekodieren, zweimal kodieren: `.clone()` teilt die entpackte
     * Bitmap zwischen AVIF und WebP. Getrennte Schleifen je Format wären
     * lesbarer, würden das Original aber doppelt so oft auspacken.
     */
    const basis = sharp(quelldatei).rotate().resize({ width: b, withoutEnlargement: true });

    const formate = [["webp", { quality: QUALITAET.webp }]];
    if (avifBreiten.includes(b)) formate.unshift(["avif", { quality: QUALITAET.avif }]);

    /*
     * ⚠️ Das Budget hängt an der **Pixelzahl**, nicht an der Breite. Bei
     * gleicher Breite hat ein Hochformat die 1,5-fache Fläche eines
     * Querformats; feste Zahlen waren stillschweigend für Querformate
     * gerechnet und hätten einen Lauf mit Hochformaten abgebrochen.
     */
    const budget = budgetFuer(b, Math.round((b * hoehe) / breite));

    for (const [endung, optionen] of formate) {
      const daten = await basis.clone().toFormat(endung, optionen).toBuffer();

      if (daten.length > budget.fehler) {
        throw new Error(
          `${name}: die ${b}px-${endung.toUpperCase()}-Variante ist ` +
            `${menschlich(daten.length)} — über der harten Grenze von ` +
            `${menschlich(budget.fehler)}. Unkomprimiertes Original?`,
        );
      }
      if (endung === "avif" && b === 1200 && daten.length > budget.warnung) {
        warnungen.push(
          `${name}: ${menschlich(daten.length)} bei 1200px ` +
            `(Budget ${menschlich(budget.warnung)}).`,
        );
      }

      await ablegen(variantenName("", b, endung), daten, TYPEN[`.${endung}`]);
    }
  }

  const fb = fallbackBreite(breiten);
  const fallbackUrl = await ablegen(
    variantenName("", fb, "jpg"),
    await sharp(quelldatei)
      .rotate()
      .resize({ width: fb, withoutEnlargement: true })
      .jpeg({ quality: QUALITAET.jpeg, mozjpeg: true })
      .toBuffer(),
    TYPEN[".jpg"],
  );

  const lqip = await sharp(quelldatei)
    .rotate()
    .resize({ width: LQIP_BREITE })
    .webp({ quality: 40 })
    .toBuffer();

  const exif = await aufnahmedaten(quelldatei);

  return {
    eintrag: {
      breite,
      hoehe,
      ...(exif ? { exif } : {}),
      /*
       * Die `srcset`-Strings entstehen aus **denselben Breitenlisten**, die
       * eben die Schleife gesteuert haben — so kann dort keine Datei
       * genannt werden, die nicht geschrieben wurde.
       */
      avif: srcset(ableitungsBasis, urlName, avifBreiten, "avif", fingerabdruck),
      webp: srcset(ableitungsBasis, urlName, breiten, "webp", fingerabdruck),
      fallback: fallbackUrl,
      lqip: `data:image/webp;base64,${lqip.toString("base64")}`,
    },
    dateien: erzeugt,
  };
}

/**
 * Gehört jede Datei zu etwas, das die Seite auch anzeigt?
 *
 * Ein Werkzeug, das stumm das Falsche tut, ist schlimmer als eines, das
 * meckert: Zwölf Kameradateien mit Namen wie `©JakobSax_JPG6785.JPG` wurden
 * einmal klaglos verarbeitet und erschienen nirgends.
 */
async function pruefeZuordnung(namen, warnungen) {
  /*
   * ⚠️ Aus `lib/inhalt.json`, nicht mehr aus `lib/content.ts` (seit dem
   * 2026-10-17): Die importiert TypeScript ohne Endungen, das kann Node
   * nicht laden — und hier stand ein `catch`, das die Prüfung dann still
   * ausfallen ließ.
   */
  const inhalt = await leseInhalt();
  const fotoIds = new Set(inhalt.foto.arbeiten.map((a) => a.id));
  const filmIds = new Set(inhalt.filme.map((f) => f.id));
  const bekannt = new Set(["portrait", "hero/standbild", "hero/film"]);
  const vorhanden = new Set(namen);

  for (const name of namen) {
    if (bekannt.has(name)) continue;
    const teile = name.split("/");

    // ueber/01 — die Bilder auf /ueber (ueber.bilder in lib/inhalt.json).
    if (teile.length === 2 && teile[0] === "ueber") continue;

    // film/<id> — das Standbild eines Films aus `filme`.
    if (teile.length === 2 && teile[0] === "film" && filmIds.has(teile[1])) continue;

    // arbeiten/<id> · arbeiten/<id>/01 — eine Fotoarbeit aus foto.arbeiten.
    if (teile[0] === "arbeiten" && fotoIds.has(teile[1])) {
      if (teile.length === 2 || teile.length === 3) continue;
    }

    warnungen.push(
      `${name}: gehört zu nichts und erscheint nirgends auf der Seite. ` +
        (teile[0] === "arbeiten"
          ? `Erwartet wird eine id aus foto.arbeiten in lib/inhalt.json ` +
            `(${[...fotoIds].slice(0, 3).join(", ")}, …).`
          : teile[0] === "film"
            ? `Erwartet wird eine id aus filme in lib/inhalt.json.`
            : `Erlaubt sind \`arbeiten/<id>/NN\`, \`film/<id>\`, \`ueber/NN\`, ` +
              `\`hero/standbild\`, \`hero/film\`, \`portrait\`.`),
    );
  }

  /* Umgekehrt: Was in lib/inhalt.json steht, aber kein Bild hat, erscheint
     nicht (UI-SPEC) — das soll jemand erfahren, statt es auf der Seite zu suchen. */
  for (const id of fotoIds) {
    const hat = [...vorhanden].some(
      (n) => n === `arbeiten/${id}` || n.startsWith(`arbeiten/${id}/`),
    );
    if (!hat) warnungen.push(`Fotoarbeit „${id}" hat kein Bild und erscheint nicht.`);
  }
  for (const id of filmIds) {
    if (!vorhanden.has(`film/${id}`)) {
      warnungen.push(`Film „${id}" hat kein Standbild (original/film/${id}.jpg) und erscheint nicht.`);
    }
  }
}

/**
 * Die Bucket-Schlüssel hinter den Adressen eines Manifesteintrags:
 * `https://medien…/b/arbeiten/x%20y-480.avif?v=… 480w` → `b/arbeiten/x y-480.avif`.
 * Gibt `null`, sobald eine Adresse nicht unter `basisUrl/b/` liegt.
 *
 * @param {{ avif?: string; webp?: string; fallback?: string }} eintrag
 * @param {string} basisUrl ohne Schrägstrich am Ende
 * @returns {string[] | null}
 */
export function variantenSchluessel(eintrag, basisUrl) {
  const adressen = [];
  for (const feld of ["avif", "webp"]) {
    for (const teil of String(eintrag[feld] ?? "").split(",")) {
      const adresse = teil.trim().split(/\s+/)[0];
      if (adresse) adressen.push(adresse);
    }
  }
  if (eintrag.fallback) adressen.push(eintrag.fallback);

  const praefix = `${basisUrl}/`;
  const schluessel = [];
  for (const adresse of adressen) {
    if (!adresse.startsWith(praefix)) return null; // andere Domain
    const ohneAbfrage = adresse.slice(praefix.length).split("?")[0];
    let roh;
    try {
      roh = decodeURIComponent(ohneAbfrage);
    } catch {
      return null; // kaputt kodiert
    }
    if (!roh.startsWith(R2_ABLEITUNG)) return null;
    schluessel.push(roh);
  }
  return [...new Set(schluessel)];
}

/**
 * Einen Eintrag des Zwischenspeichers **aus dem eingecheckten Manifest
 * zurückgewinnen** — oder `null`, wenn das nicht sicher geht.
 *
 * ⚠️ **Warum es das gibt.** Die Medien-Action läuft auf einer frischen
 * Maschine, `.medien-cache/stand.json` gibt es dort nie. Ohne diesen Weg
 * hielte sie jedes Bild für neu und rechnete täglich alle Varianten aller
 * Bilder — rund 35 s je Bild — und lüde sie erneut hoch. Das Manifest im
 * Repo ist aber genau das Ergebnis des letzten Laufs.
 *
 * Es gilt nur, was diese Prüfung übersteht — dieselbe Strenge wie beim
 * Zwischenspeicher:
 *
 * - Jede Adresse in `avif`, `webp` und `fallback` trägt den Fingerabdruck
 *   **dieses** Laufs (`?v=` + die ersten acht Stellen von `schluessel`).
 *   Der Schlüssel hängt an ETag, Pipelineversion und Bucket-Adresse;
 *   ändert sich eins davon, ändert sich der Fingerabdruck, und das Bild
 *   wird neu gerechnet. Ein ersetztes Original fällt also immer durch.
 * - Jede daraus abgeleitete Datei liegt tatsächlich im Bucket (`imBucket`)
 *   — wer unter `b/` aufgeräumt hat, bekommt eine Neuberechnung statt 404.
 *
 * @param {Record<string, unknown> | undefined} eintrag aus `lib/bilder-manifest.json`
 * @param {string} schluessel der Cache-Schlüssel dieses Laufs (sha1, hex)
 * @param {Set<string>} imBucket alle Schlüssel unter `b/`
 * @param {string} basisUrl ohne Schrägstrich am Ende
 * @returns {{ schluessel: string; eintrag: object; dateien: string[] } | null}
 */
export function ausManifest(eintrag, schluessel, imBucket, basisUrl) {
  if (!eintrag || typeof eintrag !== "object") return null;
  if (typeof eintrag.breite !== "number" || typeof eintrag.hoehe !== "number") return null;
  if (typeof eintrag.lqip !== "string") return null;
  for (const feld of ["avif", "webp", "fallback"]) {
    if (typeof eintrag[feld] !== "string" || eintrag[feld].length === 0) return null;
  }

  const v = `?v=${schluessel.slice(0, 8)}`;
  // Jede einzelne Adresse — am 2026-10-15 trug der Rückfall den
  // Fingerabdruck und das `srcset` nicht.
  const adressen = [
    ...`${eintrag.avif},${eintrag.webp}`.split(",").map((t) => t.trim().split(/\s+/)[0]),
    eintrag.fallback,
  ].filter(Boolean);
  if (!adressen.every((a) => a.endsWith(v))) return null;

  const dateien = variantenSchluessel(eintrag, basisUrl);
  if (!dateien || dateien.length === 0) return null;
  if (!dateien.every((d) => imBucket.has(d))) return null;

  return { schluessel, eintrag, dateien };
}

/**
 * Gilt ein Eintrag aus dem Zwischenspeicher noch? Schlüssel, Adressen und
 * Dateien im Bucket müssen stimmen — Begründungen in `main()`.
 */
function gilt(alt, schluessel, imBucket) {
  if (alt?.schluessel !== schluessel) return false;
  /* Alle drei Adressfelder — am 2026-10-15 fehlte der Fingerabdruck im
     `srcset`, während der Rückfall ihn trug. */
  const v = `?v=${schluessel.slice(0, 8)}`;
  const adresseAktuell = ["fallback", "avif", "webp"].every((feld) =>
    alt?.eintrag?.[feld]?.includes(v),
  );
  return adresseAktuell && Array.isArray(alt.dateien) && alt.dateien.every((d) => imBucket.has(d));
}

async function main() {
  const r2 = zugang();
  const basisUrl = oeffentlich();
  await mkdir(CACHE, { recursive: true });

  const stand = existsSync(CACHE_STAND)
    ? JSON.parse(await readFile(CACHE_STAND, "utf8"))
    : {};
  /* Das eingecheckte Manifest, **bevor** dieser Lauf es überschreibt — der
     Rückfall, wenn der Zwischenspeicher fehlt (siehe `ausManifest`). */
  const altesManifest = existsSync(BILD_MANIFEST)
    ? JSON.parse(await readFile(BILD_MANIFEST, "utf8"))
    : {};
  let ausDemManifest = 0;

  console.log(`R2: lese ${R2_ORIGINAL} und ${R2_ABLEITUNG}…`);
  const objekte = await liste(r2, R2_ORIGINAL);
  /*
   * Was tatsächlich im Bucket liegt — nicht, was der Zwischenspeicher dort
   * vermutet. Die beiden können auseinanderlaufen: Wer im Dashboard unter
   * `b/` aufräumt, während `.medien-cache/stand.json` liegen bleibt, bekäme
   * sonst „11 unverändert" gemeldet und eine Seite voller 404. Genau das ist
   * beim Prüfen passiert.
   */
  const imBucket = new Set((await liste(r2, R2_ABLEITUNG)).map((o) => o.key));

  const bilder = {};
  const videos = {};
  const neuerStand = {};
  const behalten = new Set();
  const warnungen = [];
  const offen = [];
  let unveraendert = 0;

  for (const objekt of objekte.sort((a, b) => a.key.localeCompare(b.key))) {
    const relativ = objekt.key.slice(R2_ORIGINAL.length);
    const endung = path.extname(relativ).toLowerCase();
    const name = relativ.replace(/\.[^.]+$/, "");

    if (VIDEO_ENDUNGEN.has(endung)) {
      /*
       * Videos werden **hier nicht** umgerechnet — hier wird nur verzeichnet,
       * was im Bucket liegt; die Datei wird direkt von dort ausgeliefert.
       * Umgerechnet wird das Video oben schon beim Übernehmen aus der
       * Verwaltung (`scripts/eingang.mjs` → `scripts/video.mjs`). Von Hand
       * Abgelegtes muss fertig exportiert sein (TECH-STACK.md, „Medien").
       */
      videos[name] = {
        // Kodiert wie bei den Bildern — hier reicht `encodeURI`, weil der
        // Schlüssel als ganzer Pfad mit seinen Schrägstrichen gemeint ist.
        // Mit Fingerabdruck aus der ETag, wie bei den Bildvarianten: Seit
        // Jakob das Video in der Verwaltung ersetzen kann (2026-10-23),
        // bleibt die Adresse dieselbe — ohne ihn liefen Browser und Edge
        // noch eine Weile das alte.
        url: `${basisUrl}/${encodeURI(objekt.key)}?v=${createHash("sha1").update(objekt.etag).digest("hex").slice(0, 8)}`,
        typ: TYPEN[endung] ?? "video/mp4",
        bytes: objekt.groesse,
      };
      if (name === "hero/film" && objekt.groesse > HERO_BUDGET) {
        warnungen.push(
          `${relativ}: ${menschlich(objekt.groesse)} — das Hero-Video startet von ` +
            `selbst und lädt damit auf jedem Mobilfunkgerät mit, bevor sonst ` +
            `irgendetwas fertig ist. Vorgabe: unter ${menschlich(HERO_BUDGET)} ` +
            `(TECH-STACK.md, Abschnitt „Medien").`,
        );
      }
      continue;
    }

    if (!BILD_ENDUNGEN.has(endung)) {
      warnungen.push(`${relativ}: unbekannte Endung, übersprungen.`);
      continue;
    }

    /*
     * Der Cache hängt an der ETag des Originals (bei R2 die Prüfsumme),
     * der Pipelineversion und der öffentlichen Adresse. Ändert sich eins
     * davon, wird das Bild neu gerechnet — sonst nicht.
     */
    const schluessel = createHash("sha1")
      .update(objekt.etag)
      .update(String(PIPELINE_VERSION))
      .update(basisUrl)
      .digest("hex");
    /*
     * ⚠️ **Auch die Adresse muss stimmen, nicht nur der Schlüssel.**
     *
     * Am 2026-09-12 bekamen die Adressen einen Fingerabdruck gegen einen
     * Cache-Fehler — und die Änderung wäre wirkungslos geblieben: Der
     * Schlüssel wäre unverändert gewesen, also käme der Eintrag samt
     * **alter** Adresse aus `stand.json` zurück, der Lauf meldete
     * „unverändert", und im Manifest stünde weiter die Adresse ohne
     * Fingerabdruck.
     *
     * `PIPELINE_VERSION` zu erhöhen behebt den Einzelfall. Diese Prüfung
     * behebt die **Klasse**: Ein zwischengespeicherter Eintrag gilt nur,
     * wenn seine Adresse die ist, die dieser Lauf erzeugen würde. Wer die
     * Form der Adressen künftig ändert und die Version vergisst, bekommt
     * eine Neuberechnung statt eines stillen Fehlers.
     *
     * Fehlt der Eintrag im Zwischenspeicher oder gilt er nicht (Medien-Action,
     * frischer Klon, oder `stand.json` von einem älteren Lauf als das
     * Manifest), wird er aus dem eingecheckten Manifest zurückgewonnen —
     * mit denselben Prüfungen, siehe `ausManifest`.
     */
    let alt = stand[name];
    if (!gilt(alt, schluessel, imBucket)) {
      alt = ausManifest(altesManifest[name], schluessel, imBucket, basisUrl);
      if (alt) ausDemManifest += 1;
    }

    if (alt) {
      bilder[name] = alt.eintrag;
      neuerStand[name] = alt;
      alt.dateien.forEach((d) => behalten.add(d));
      unveraendert += 1;
      continue;
    }

    offen.push({ objekt, name, schluessel });
  }

  /*
   * Erst zuordnen, dann rechnen. Die Prüfung braucht die vollständige Liste
   * der Namen, und sie soll **vor** der teuren Arbeit stehen: Wer zwölf
   * falsch benannte Kameradateien hochgeladen hat, soll das nicht erst nach
   * sechs Minuten AVIF erfahren.
   */
  await pruefeZuordnung(
    [...Object.keys(bilder), ...offen.map((o) => o.name), ...Object.keys(videos)],
    warnungen,
  );
  for (const w of warnungen) console.warn(`  ! ${w}`);
  const bereitsGemeldet = warnungen.length;

  if (probe) {
    for (const { name } of offen) console.log(`  + ${name} (würde erzeugt)`);
    console.log(
      `[Probelauf] ${offen.length} Bilder wären zu erzeugen, ` +
        `${unveraendert} unverändert (davon ${ausDemManifest} aus dem Manifest), ` +
        `${Object.keys(videos).length} Videos verzeichnet.`,
    );
    console.log("Nichts geholt, nichts gerechnet, nichts geschrieben.");
    return;
  }

  for (const { objekt, name, schluessel } of offen) {
    /*
     * ⚠️ **Immer frisch holen, nie die Datei im Zwischenspeicher benutzen.**
     * Hierher kommt nur, was neu oder geändert ist — und beim Geänderten
     * liegt unter demselben Pfad noch die *alte* Fassung. Ein `existsSync`
     * davor sparte einen Download und lieferte dafür ein Bild, das im Bucket
     * längst ersetzt war: Jakob tauscht ein Foto aus, die Pipeline meldet
     * „erzeugt", und auf der Seite steht weiter das alte. Genau das ist beim
     * Prüfen passiert.
     */
    const lokal = path.join(CACHE, objekt.key);
    await mkdir(path.dirname(lokal), { recursive: true });
    await writeFile(lokal, await hole(r2, objekt.key));

    const { eintrag, dateien } = await verarbeite(r2, name, lokal, basisUrl, warnungen, schluessel);
    bilder[name] = eintrag;
    neuerStand[name] = { schluessel, eintrag, dateien };
    dateien.forEach((d) => behalten.add(d));
    console.log(`  ✓ ${name} (${eintrag.breite}×${eintrag.hoehe})`);
  }

  /*
   * Verwaiste Ableitungen: liegen in R2 unter `b/`, gehören aber zu keinem
   * Original mehr. Ohne das bliebe eine Variante für ein längst gelöschtes
   * Bild für immer im Bucket liegen — und würde bezahlt.
   */
  let geloescht = 0;
  for (const key of imBucket) {
    if (!behalten.has(key)) {
      await loesche(r2, key);
      geloescht += 1;
    }
  }

  // Sortiert schreiben: sonst wechselt die Reihenfolge im Manifest je nach
  // Antwort des Buckets und jeder Lauf erzeugt ein unleserliches Diff.
  const sortiert = (o) =>
    Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

  await writeFile(BILD_MANIFEST, `${JSON.stringify(sortiert(bilder), null, 2)}\n`);
  await writeFile(VIDEO_MANIFEST, `${JSON.stringify(sortiert(videos), null, 2)}\n`);
  await writeFile(CACHE_STAND, `${JSON.stringify(neuerStand)}\n`);

  // Warnungen aus dem Verarbeiten (Budget, zu große Originale). Die aus der
  // Zuordnung sind oben schon gemeldet und werden hier nicht wiederholt.
  for (const w of warnungen.slice(bereitsGemeldet)) console.warn(`  ! ${w}`);

  console.log(
    `Medien: ${offen.length} Bilder erzeugt, ${unveraendert} unverändert ` +
      `(davon ${ausDemManifest} aus dem Manifest), ` +
      `${Object.keys(videos).length} Videos verzeichnet` +
      (geloescht > 0 ? `, ${geloescht} verwaiste entfernt` : ""),
  );
  /*
   * ⚠️ Die Vorschaukarten laufen **von hier aus**, nicht als zweiter Befehl
   * in `package.json`. Dort stand `medien.mjs && og.mjs` — und npm hängt die
   * Argumente hinter die ganze Kette, `npm run medien -- --probe` reichte
   * `--probe` also an `og.mjs` weiter statt hierher. Der Probelauf lief damit
   * als echter Lauf. Beim ersten Versuch an einem echten Bucket passiert.
   */
  const kartenCode = await karten();

  console.log("⚠️ Die geänderten Manifeste in lib/ committen, sonst sieht die Seite nichts.");

  /*
   * ⚠️ Die Bilder sind an dieser Stelle **fertig und die Manifeste
   * geschrieben** — nur die Vorschaukarten fehlen. Deshalb kein `throw`: Ein
   * Abbruch hier hätte „Medienpipeline abgebrochen" gemeldet und den Eindruck
   * erweckt, die ganze Arbeit sei verloren. Der Rückgabewert bleibt trotzdem
   * ungleich null, damit niemand versehentlich einen halben Lauf weiterreicht.
   */
  if (kartenCode !== 0) {
    console.error(
      `\n  ! Die Vorschaukarten sind fehlgeschlagen (Code ${kartenCode}).\n` +
        `    Bilder und Manifeste sind davon unberührt und fertig.\n` +
        `    Erneut versuchen mit: npm run og`,
    );
    process.exitCode = 1;
  }
}

/**
 * `scripts/og.mjs` als eigener Prozess — es bringt sein eigenes `main` mit,
 * und ein Import würde es beim Laden ausführen.
 */
async function karten() {
  const { spawn } = await import("node:child_process");
  const skript = path.join(WURZEL, "scripts", "og.mjs");
  return new Promise((fertig) => {
    spawn(process.execPath, [skript], { stdio: "inherit" }).on("close", fertig);
  });
}

/*
 * Nur als Skript starten, nicht beim Import: Die Tests
 * (`scripts/medien.test.mjs`) laden `ausManifest` aus dieser Datei, und ein
 * `main()` beim Laden griffe dort nach dem Bucket. `import.meta.main` gibt es
 * erst ab Node 22.18/24.2; davor der Vergleich der Pfade (ohne Groß- und
 * Kleinschreibung, weil Windows den Laufwerksbuchstaben mal so, mal so liefert).
 */
const direkt =
  import.meta.main ??
  (process.argv[1] !== undefined &&
    path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase());
if (direkt) {
  main().catch((fehler) => {
    console.error(`Medienpipeline abgebrochen: ${fehler.message}`);
    process.exit(1);
  });
}
