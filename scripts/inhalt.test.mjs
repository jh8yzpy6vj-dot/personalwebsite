import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { formatiereInhalt, INHALT_DATEI, leseInhalt } from "./inhalt.mjs";

/**
 * Das Schreibformat von `lib/inhalt.json`.
 *
 * ⚠️ Es muss **exakt** das sein, was der Server beim Speichern aus der
 * Verwaltung schreibt. Sonst bestünde jeder Commit der Medien-Action (der
 * Papierkorb schreibt die Datei) zur Hälfte aus Umformatierung, und im
 * Verlauf der Verwaltung wäre nicht mehr zu sehen, was sich geändert hat.
 */
describe("formatiereInhalt", () => {
  it("ist JSON mit zwei Leerzeichen und einem Zeilenumbruch am Ende", () => {
    expect(formatiereInhalt({ a: [1, { b: null }] })).toBe('{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ]\n}\n');
  });

  it("gibt die eingecheckte Datei unverändert wieder", async () => {
    const text = await readFile(INHALT_DATEI, "utf8");
    expect(formatiereInhalt(await leseInhalt())).toBe(text);
  });
});
