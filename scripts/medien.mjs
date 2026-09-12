/**
 * Medienpipeline — **läuft lokal, nicht im Build.**
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

import {
  AVIF_MAX_BREITE,
  BUDGET,
  EXIF_FELDER,
  LQIP_BREITE,
  PIPELINE_VERSION,
  QUALITAET,
  QUELLE_WARNUNG,
  breitenFuer,
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
async function verarbeite(r2, name, quelldatei, basisUrl, warnungen) {
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
        `deutlich mehr als nötig. Vorgabe: lange Kante 2400–3000px, unter 3 MB.`,
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
    return `${ableitungsBasis}/${urlName}${anhang}`;
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

    for (const [endung, optionen] of formate) {
      const daten = await basis.clone().toFormat(endung, optionen).toBuffer();

      if (daten.length > BUDGET.fehler) {
        throw new Error(
          `${name}: die ${b}px-${endung.toUpperCase()}-Variante ist ` +
            `${menschlich(daten.length)} — über der harten Grenze von ` +
            `${menschlich(BUDGET.fehler)}. Unkomprimiertes Original?`,
        );
      }
      if (endung === "avif" && b === 1200 && daten.length > BUDGET.warnung) {
        warnungen.push(
          `${name}: ${menschlich(daten.length)} bei 1200px ` +
            `(Budget ${menschlich(BUDGET.warnung)}).`,
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
      avif: srcset(ableitungsBasis, urlName, avifBreiten, "avif"),
      webp: srcset(ableitungsBasis, urlName, breiten, "webp"),
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
  let ids;
  try {
    const { WORKS } = await import("../lib/content.ts");
    ids = new Set(WORKS.map((w) => w.id));
  } catch {
    return; // Ohne content.ts (zu altes Node) entfällt die Prüfung.
  }

  const bekannt = new Set(["portrait", "hero/standbild", "hero/film"]);

  for (const name of namen) {
    if (bekannt.has(name)) continue;
    const teile = name.split("/");

    // `video/<id>` — dieselben ids wie die Arbeiten.
    if (teile.length === 2 && teile[0] === "video" && ids.has(teile[1])) continue;

    if (teile[0] === "arbeiten" && ids.has(teile[1])) {
      // arbeiten/<id> · arbeiten/<id>/01 · arbeiten/<id>/serie/01
      if (teile.length === 2 || teile.length === 3) continue;
      if (teile.length === 4 && teile[2] === "serie") continue;
    }

    warnungen.push(
      `${name}: gehört zu nichts und erscheint nirgends auf der Seite. ` +
        (teile[0] === "arbeiten" || teile[0] === "video"
          ? `Erwartet wird eine id aus content.ts ` +
            `(${[...ids].slice(0, 3).join(", ")}, …).`
          : `Erlaubt sind \`arbeiten/…\`, \`video/<id>\`, \`hero/standbild\`, ` +
            `\`hero/film\`, \`portrait\`.`),
    );
  }
}

async function main() {
  const r2 = zugang();
  const basisUrl = oeffentlich();
  await mkdir(CACHE, { recursive: true });

  const stand = existsSync(CACHE_STAND)
    ? JSON.parse(await readFile(CACHE_STAND, "utf8"))
    : {};

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
       * Videos werden **nicht** umgerechnet. Das bräuchte ffmpeg und gehört
       * ohnehin in die Hand dessen, der den Schnitt gemacht hat (Vorgaben in
       * TECH-STACK.md). Hier wird nur verzeichnet, was im Bucket liegt — die
       * Datei wird direkt von dort ausgeliefert, nicht kopiert.
       */
      videos[name] = {
        // Kodiert wie bei den Bildern — hier reicht `encodeURI`, weil der
        // Schlüssel als ganzer Pfad mit seinen Schrägstrichen gemeint ist.
        url: `${basisUrl}/${encodeURI(objekt.key)}`,
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
    const alt = stand[name];

    if (alt?.schluessel === schluessel && alt.dateien.every((d) => imBucket.has(d))) {
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
        `${unveraendert} unverändert, ${Object.keys(videos).length} Videos verzeichnet.`,
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

    const { eintrag, dateien } = await verarbeite(r2, name, lokal, basisUrl, warnungen);
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
    `Medien: ${offen.length} Bilder erzeugt, ${unveraendert} unverändert, ` +
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

main().catch((fehler) => {
  console.error(`Medienpipeline abgebrochen: ${fehler.message}`);
  process.exit(1);
});
