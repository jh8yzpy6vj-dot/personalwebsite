/**
 * `lib/inhalt.json` lesen und schreiben — für die Node-Skripte.
 *
 * ⚠️ **Warum nicht mehr `import("../lib/content.ts")`.** Seit dem 2026-10-17
 * stehen die Inhalte in `lib/inhalt.json`, und `content.ts` importiert
 * TypeScript und JSON ohne Endung. Das kann der Bündler von Next, blankes
 * Node nicht — jeder Skript-Import von `content.ts` scheitert seitdem. Die
 * Skripte lesen deshalb die JSON-Datei direkt.
 *
 * ⚠️ **Das Schreibformat ist festgelegt:** `JSON.stringify(x, null, 2)` plus
 * Zeilenumbruch — exakt das, was der Server beim Speichern aus der
 * Verwaltung schreibt (`app/api/admin/speichern`). Weicht eins davon ab,
 * besteht jeder Commit der Medien-Action zur Hälfte aus Formatierung, und
 * im Verlauf der Verwaltung ist nicht mehr zu sehen, was sich geändert hat.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

/** Der Ort der Datei. */
export const INHALT_DATEI = path.join(WURZEL, "lib", "inhalt.json");

/** Der Text, wie er in der Datei steht. Rein, damit es prüfbar bleibt. */
export function formatiereInhalt(inhalt) {
  return `${JSON.stringify(inhalt, null, 2)}\n`;
}

/** Den eingecheckten Stand lesen. */
export async function leseInhalt(datei = INHALT_DATEI) {
  return JSON.parse(await readFile(datei, "utf8"));
}

/** Den Stand zurückschreiben — im selben Format wie der Server. */
export async function schreibeInhalt(inhalt, datei = INHALT_DATEI) {
  await writeFile(datei, formatiereInhalt(inhalt));
}
