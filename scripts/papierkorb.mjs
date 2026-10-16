/**
 * `npm run papierkorb` — leert den Papierkorb: Bilder, die Jakob in der
 * Verwaltung gelöscht hat und die dort **länger als 30 Tage** liegen,
 * verschwinden endgültig.
 *
 * Läuft täglich in der Medien-Action (`.github/workflows/medien.yml`),
 * zwischen `npm run eingang` und `npm run medien`.
 *
 * Je abgelaufenem Eintrag:
 *
 * 1. `original/<schluessel>.*` im öffentlichen Bucket löschen. Die Varianten
 *    unter `b/` bleiben hier liegen — `npm run medien` direkt danach findet
 *    sie ohne Original und räumt sie als verwaist weg. So gibt es genau eine
 *    Stelle, die weiß, welche Dateien zu einem Bild gehören.
 * 2. Den Schlüssel **restlos** aus `lib/inhalt.json` entfernen
 *    (`entferneSchluessel` in `lib/inhalt-regeln.mjs`, dort steht warum).
 *
 * ⚠️ **Der einzige Schritt der ganzen Pipeline, der sich nicht zurücknehmen
 * lässt.** Deshalb steht die Entscheidung als reine Funktion unter Test
 * (`planePapierkorb`), unlesbare Daten zählen als nicht abgelaufen, und ein
 * nach dem Löschen neu hochgeladenes Bild unter demselben Schlüssel bleibt
 * stehen.
 *
 * Ist nichts abgelaufen, wird **nichts geschrieben** — sonst entstünde
 * täglich ein Commit ohne Inhalt.
 *
 * Aufrufe:
 *   npm run papierkorb              aufräumen
 *   npm run papierkorb -- --probe   nur zeigen, was weg würde
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ausPapierkorb,
  entferneSchluessel,
  planePapierkorb,
  PAPIERKORB_TAGE,
} from "../lib/inhalt-regeln.mjs";
import { leseInhalt, schreibeInhalt } from "./inhalt.mjs";
import { liste, loesche, zugang } from "./r2.mjs";

const probe = process.argv.includes("--probe");

async function main() {
  let inhalt = await leseInhalt();
  const papierkorb = inhalt.papierkorb ?? {};

  if (Object.keys(papierkorb).length === 0) {
    console.log("Papierkorb: leer.");
    return;
  }

  /*
   * Den Bucket erst fragen, wenn überhaupt etwas im Papierkorb liegt — ohne
   * Einträge braucht dieser Schritt keine Zugangsdaten.
   */
  const r2 = zugang();
  const originale = await liste(r2, "original/");
  const plan = planePapierkorb(papierkorb, originale, new Date());

  const wartend = Object.keys(papierkorb).length - plan.entfernen.length - plan.ersetzt.length;
  if (plan.entfernen.length === 0 && plan.ersetzt.length === 0) {
    console.log(
      `Papierkorb: ${wartend} Bild(er) darin, keins älter als ${PAPIERKORB_TAGE} Tage.`,
    );
    return;
  }

  for (const s of plan.entfernen) console.log(`  – ${s} (seit ${papierkorb[s]} im Papierkorb)`);
  for (const key of plan.loeschen) console.log(`      ${key}`);
  for (const s of plan.ersetzt) {
    console.log(
      `  ↺ ${s}: nach dem Löschen neu hochgeladen — das neue Bild bleibt, ` +
        `nur der Papierkorbeintrag fällt weg.`,
    );
  }

  if (probe) {
    console.log(
      `[Probelauf] ${plan.entfernen.length} Bild(er) würden endgültig gelöscht ` +
        `(${plan.loeschen.length} Datei(en)). Nichts geändert.`,
    );
    return;
  }

  /*
   * Erst der Bucket, dann die Datei: Scheitert das Löschen mittendrin, steht
   * der Eintrag noch im Papierkorb, und der nächste Lauf versucht es erneut.
   * Andersherum zeigte nichts mehr auf das Original, und es bliebe für immer
   * (bezahlt) im Bucket liegen.
   */
  for (const key of plan.loeschen) await loesche(r2, key);

  for (const s of plan.entfernen) inhalt = entferneSchluessel(inhalt, s);
  for (const s of plan.ersetzt) inhalt = ausPapierkorb(inhalt, s);
  await schreibeInhalt(inhalt);

  console.log(
    `Papierkorb: ${plan.entfernen.length} Bild(er) endgültig gelöscht` +
      (plan.ersetzt.length > 0 ? `, ${plan.ersetzt.length} durch neues Bild ersetzt` : "") +
      (wartend > 0 ? `, ${wartend} warten noch` : "") +
      ". lib/inhalt.json geändert.",
  );
}

// Nur als Skript starten, nicht beim Import — wie in `scripts/medien.mjs`.
const direkt =
  import.meta.main ??
  (process.argv[1] !== undefined &&
    path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase());
if (direkt) {
  main().catch((e) => {
    console.error(`Papierkorb abgebrochen: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  });
}
