import { describe, expect, it } from "vitest";

/**
 * Die Entscheidungen des Papierkorbs stehen in `lib/inhalt-regeln.mjs`
 * (`planePapierkorb`, `entferneSchluessel`) und sind in
 * `lib/inhalt-regeln.test.ts` getestet. Hier nur: Das Skript lässt sich
 * laden, ohne loszulaufen — sonst griffe schon der Import nach dem Bucket
 * und nach `lib/inhalt.json`.
 */
describe("papierkorb", () => {
  it("startet beim Import nicht", async () => {
    await expect(import("./papierkorb.mjs")).resolves.toBeDefined();
  });
});
