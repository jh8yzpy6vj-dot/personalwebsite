/**
 * `npm run eingang` — holt die Bilder, die Jakob in der Verwaltung
 * hochgeladen hat, aus dem **privaten** Eingangs-Bucket, säubert sie und
 * legt sie als Original in den öffentlichen Bucket.
 *
 * Läuft in der Medien-Action (`.github/workflows/medien.yml`) vor
 * `npm run medien`, geht aber genauso lokal (Zugangsdaten aus `.dev.vars`).
 *
 * Ablauf je Datei `<ziel>.<endung>` im Eingang:
 *
 * 1. `ziel` gegen `ZIEL` prüfen (dieselbe Regel wie beim Hochladen,
 *    `lib/admin/vertrag.ts`). Was nicht passt, bleibt liegen und wird
 *    gemeldet — hier wird nichts geraten.
 * 2. Holen und säubern (`scripts/saeubern.mjs`): GPS und alle anderen
 *    Metadaten außer der Positivliste fliegen raus, PNG/WebP/TIFF werden
 *    JPEG.
 * 3. Nach `original/<ziel>.jpg` im öffentlichen Bucket legen und **jedes
 *    andere** `original/<ziel>.<endung>` löschen.
 * 4. Erst dann aus dem Eingang löschen.
 *
 * ⚠️ **Warum die Reihenfolge 3 → 4.** Scheitert irgendetwas dazwischen,
 * liegt die Datei noch im Eingang, und der nächste Lauf macht es noch
 * einmal. Andersherum wäre ein Bild, das Jakob hochgeladen hat, im
 * schlimmsten Fall einfach weg.
 *
 * ⚠️ **Warum nie zwei Originale je Schlüssel.** `npm run medien` macht aus
 * `original/portrait.png` und `original/portrait.jpg` denselben Namen
 * `portrait` — welches gewinnt, hinge an der Sortierung des Buckets. Ersetzt
 * Jakob ein JPEG durch ein PNG, muss das alte JPEG also weg.
 *
 * **Das Video oben** (`hero/film.<mp4|mov>`, seit 2026-10-23) geht einen
 * eigenen Weg: ffmpeg rechnet es um (`scripts/video.mjs` — ohne Ton und
 * Metadaten, klein genug für Mobilfunk), es liegt danach als
 * `original/hero/film.mp4` im öffentlichen Bucket und sein erstes Bild als
 * `original/hero/film.jpg`. Dieses Standbild rechnet `npm run medien` wie
 * jedes Bild — und weil es unter **demselben Schlüssel** im Bild-Manifest
 * steht, erkennt die Verwaltung daran, dass das Video fertig ist.
 *
 * Aufrufe:
 *   npm run eingang              verarbeiten
 *   npm run eingang -- --probe   nur zeigen, was zu tun wäre
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { VIDEO_ENDUNGEN, VIDEO_ZIEL, ordneEingang, originaleVon } from "../lib/inhalt-regeln.mjs";
import {
  KURZ_ZWISCHENSPEICHERN,
  eingangEingerichtet,
  hole,
  lege,
  liste,
  loesche,
  zugang,
  zugangEingang,
} from "./r2.mjs";
import { saeubere } from "./saeubern.mjs";
import { rechneVideo } from "./video.mjs";

const probe = process.argv.includes("--probe");

/**
 * Ein Ziel als Bucket-Schlüssel des Originals. Immer `.jpg` — `saeubere`
 * liefert JPEG. Das Video oben immer `.mp4` — `rechneVideo` liefert MP4.
 */
export function originalSchluessel(ziel) {
  return `original/${ziel}.${ziel === VIDEO_ZIEL ? "mp4" : "jpg"}`;
}

/**
 * Das Video oben übernehmen: umrechnen, Video und Standbild ablegen, ältere
 * Fassungen mit anderer Endung löschen. Gibt die Zeile fürs Log zurück.
 */
async function uebernimmVideo(oeffentlich, roh) {
  const ziel = originalSchluessel(VIDEO_ZIEL);
  const standbildZiel = `original/${VIDEO_ZIEL}.jpg`;
  const { video, standbild, breite, hoehe, dauer, rate } = await rechneVideo(roh);
  // Auch das Standbild durch die Säuberung — es kommt zwar aus ffmpeg, aber derselbe Weg für jedes Bild.
  const bild = await saeubere(standbild);

  /* Erst das Standbild, dann das Video: Bricht es dazwischen ab, zeigt die
     Seite schlimmstenfalls das neue Standbild zum alten Video, nie ein
     Video ohne Standbild. */
  await lege(oeffentlich, standbildZiel, bild.datei, "image/jpeg", KURZ_ZWISCHENSPEICHERN);
  await lege(oeffentlich, ziel, video, "video/mp4", KURZ_ZWISCHENSPEICHERN);

  const vorhanden = (await liste(oeffentlich, `original/${VIDEO_ZIEL}.`)).map((o) => o.key);
  const andere = [
    ...originaleVon(vorhanden, VIDEO_ZIEL, VIDEO_ENDUNGEN).filter((key) => key !== ziel),
    ...originaleVon(vorhanden, VIDEO_ZIEL).filter((key) => key !== standbildZiel),
  ];
  for (const key of andere) {
    await loesche(oeffentlich, key);
    console.log(`    – ${key} (alte Fassung ersetzt)`);
  }

  return (
    `${ziel} + ${standbildZiel}  ${breite}×${hoehe}, ${dauer.toFixed(1)} s, ` +
    `${menschlich(roh.length)} → ${menschlich(video.length)} (höchstens ${rate} kbit/s, ohne Ton und Metadaten)`
  );
}

function menschlich(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} kB`;
}

async function main() {
  if (!eingangEingerichtet()) {
    /* Kein Fehler: Ohne Eingang gibt es schlicht nichts hochzuladen, und
       die Action soll deshalb nicht täglich rot werden. */
    console.log("Eingang: EINGANG_BUCKET ist nicht gesetzt — nichts zu tun.");
    return;
  }

  const eingang = zugangEingang();
  const oeffentlich = zugang();

  const { dateien, unbekannt } = ordneEingang(await liste(eingang, ""));

  for (const key of unbekannt) {
    console.warn(
      `  ! ${key}: kein gültiges Ziel — bleibt im Eingang liegen. ` +
        `Erwartet: arbeiten/<id>, arbeiten/<id>/NN, ueber/NN, film/<id> oder portrait, ` +
        `mit Endung jpg, png, webp oder tif — oder hero/film als mp4 oder mov.`,
    );
  }

  if (dateien.length === 0) {
    console.log(
      `Eingang: nichts zu verarbeiten` +
        (unbekannt.length > 0 ? ` (${unbekannt.length} unbekannte Datei(en) liegen gelassen).` : "."),
    );
    return;
  }

  if (probe) {
    for (const d of dateien) {
      console.log(`  + ${d.key} → ${originalSchluessel(d.ziel)} (würde übernommen)`);
      for (const u of d.ueberholt) console.log(`    – ${u} (überholt, würde gelöscht)`);
    }
    console.log(`[Probelauf] ${dateien.length} Datei(en) wären zu übernehmen. Nichts geändert.`);
    return;
  }

  let uebernommen = 0;
  let fehler = 0;

  for (const d of dateien) {
    const ziel = originalSchluessel(d.ziel);
    try {
      const roh = await hole(eingang, d.key);

      if (d.ziel === VIDEO_ZIEL) {
        const zeile = await uebernimmVideo(oeffentlich, roh);
        await loesche(eingang, d.key);
        for (const u of d.ueberholt) {
          await loesche(eingang, u);
          console.log(`    – ${u} (überholt durch ${d.key})`);
        }
        console.log(`  ✓ ${d.key} → ${zeile}`);
        uebernommen += 1;
        continue;
      }

      const { datei, format, neuKodiert, verworfen, anhang, breite, hoehe } = await saeubere(roh);

      await lege(oeffentlich, ziel, datei, "image/jpeg", KURZ_ZWISCHENSPEICHERN);

      // Andere Originale zum selben Schlüssel weg — siehe oben.
      const andere = originaleVon(
        (await liste(oeffentlich, `original/${d.ziel}.`)).map((o) => o.key),
        d.ziel,
      ).filter((key) => key !== ziel);
      for (const key of andere) {
        await loesche(oeffentlich, key);
        console.log(`    – ${key} (altes Original ersetzt)`);
      }

      await loesche(eingang, d.key);
      for (const u of d.ueberholt) {
        await loesche(eingang, u);
        console.log(`    – ${u} (überholt durch ${d.key})`);
      }

      console.log(
        `  ✓ ${d.key} → ${ziel}  ${breite}×${hoehe}, ${menschlich(datei.length)}` +
          (neuKodiert
            ? `, ${format.toUpperCase()} als JPEG neu kodiert`
            : verworfen.length > 0
              ? `, ${verworfen.length} Metadatenblock/-blöcke entfernt`
              : "") +
          (anhang > 0 ? `, Anhang hinter dem Bildende (${anhang} Bytes) entfernt` : ""),
      );
      uebernommen += 1;
    } catch (e) {
      /*
       * Weitermachen: Ein kaputtes Bild soll die anderen nicht aufhalten.
       * Die Datei bleibt im Eingang (die Verwaltung zeigt sie als wartend),
       * und der Lauf endet am Schluss mit Code 1, damit es auffällt.
       */
      fehler += 1;
      console.error(`  ✗ ${d.key}: ${e instanceof Error ? e.message : String(e)} — bleibt im Eingang.`);
    }
  }

  console.log(
    `Eingang: ${uebernommen} übernommen` +
      (fehler > 0 ? `, ${fehler} fehlgeschlagen` : "") +
      (unbekannt.length > 0 ? `, ${unbekannt.length} unbekannt liegen gelassen` : "") +
      ".",
  );
  if (fehler > 0) process.exitCode = 1;
}

// Nur als Skript starten, nicht beim Import (Tests) — wie in `scripts/medien.mjs`.
const direkt =
  import.meta.main ??
  (process.argv[1] !== undefined &&
    path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase());
if (direkt) {
  main().catch((e) => {
    console.error(`Eingang abgebrochen: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}
