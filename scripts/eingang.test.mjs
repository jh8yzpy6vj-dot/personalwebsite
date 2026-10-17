import { describe, expect, it } from "vitest";

import { ZIEL } from "../lib/inhalt-regeln.mjs";
import { originalSchluessel } from "./eingang.mjs";

/**
 * `scripts/eingang.mjs` selbst ist vor allem Ablauf gegen den Bucket; die
 * Entscheidungen darin stehen als reine Funktionen in
 * `lib/inhalt-regeln.mjs` (`ordneEingang`, `originaleVon`) und
 * `scripts/saeubern.mjs` und sind dort getestet. Hier nur, was das Skript
 * selbst festlegt — und dass es sich laden lässt, ohne loszulaufen.
 */
describe("eingang", () => {
  it("legt jedes Ziel als JPEG unter original/ ab", () => {
    for (const ziel of ["portrait", "ueber/01", "arbeiten/x", "arbeiten/x/03", "film/y"]) {
      expect(ZIEL.test(ziel)).toBe(true);
      expect(originalSchluessel(ziel)).toBe(`original/${ziel}.jpg`);
    }
  });
});
