import { describe, expect, it } from "vitest";

import { leseDevVars } from "./r2.mjs";

/**
 * Der Leser für `.dev.vars`.
 *
 * ⚠️ **Warum es diese Datei gibt.** Der Leser zerlegte den Text an `\n`, und
 * auf Windows — also dort, wo er läuft — endet jede Zeile auf `\r\n`. In
 * JavaScript zählt `\r` als Zeilenende, `.` matcht Zeilenenden nicht, und
 * damit scheiterte `(.*)$` an *jeder* Zeile. Die Zugangsdaten wurden nie
 * gelesen, während dieselbe Datei auf Linux anstandslos durchlief.
 *
 * Zwei Runden mit Jan hat das gekostet, beide Male mit der Vermutung, die
 * Datei sei falsch angelegt. Sie war es nie.
 */
describe("leseDevVars", () => {
  const ZEILEN = [
    "R2_ACCOUNT_ID=43ff",
    "R2_BUCKET=websitebucket",
    "R2_PUBLIC_URL=https://medien.jakobsax.de",
  ];

  it("liest Zeilen mit Unix-Zeilenenden", () => {
    expect(leseDevVars(ZEILEN.join("\n"))).toEqual({
      R2_ACCOUNT_ID: "43ff",
      R2_BUCKET: "websitebucket",
      R2_PUBLIC_URL: "https://medien.jakobsax.de",
    });
  });

  it("liest Zeilen mit Windows-Zeilenenden — der Fehler vom 2026-09-12", () => {
    expect(leseDevVars(ZEILEN.join("\r\n"))).toEqual({
      R2_ACCOUNT_ID: "43ff",
      R2_BUCKET: "websitebucket",
      R2_PUBLIC_URL: "https://medien.jakobsax.de",
    });
  });

  it("kommt mit einer abschließenden Leerzeile klar", () => {
    expect(leseDevVars("R2_BUCKET=eimer\r\n")).toEqual({ R2_BUCKET: "eimer" });
    expect(leseDevVars("R2_BUCKET=eimer\n\n")).toEqual({ R2_BUCKET: "eimer" });
  });

  it("überspringt Kommentare, Leerzeilen und Unsinn", () => {
    const text = ["# ein Kommentar", "", "   ", "kaputte zeile ohne gleich", "R2_BUCKET=eimer"];
    expect(leseDevVars(text.join("\r\n"))).toEqual({ R2_BUCKET: "eimer" });
  });

  it("entfernt Anführungszeichen, aber nur außen", () => {
    const text = [
      `A="mit doppelten"`,
      `B='mit einfachen'`,
      `C=in"der"mitte`,
      `D="nur vorne`,
    ];
    expect(leseDevVars(text.join("\n"))).toEqual({
      A: "mit doppelten",
      B: "mit einfachen",
      C: `in"der"mitte`,
      D: `"nur vorne`,
    });
  });

  it("verträgt Leerzeichen um Name und Wert", () => {
    expect(leseDevVars("  R2_BUCKET  =  eimer  \r\n")).toEqual({ R2_BUCKET: "eimer" });
  });

  it("lässt Werte mit Gleichheitszeichen ganz", () => {
    // Ein Secret darf alles enthalten — auch das Trennzeichen selbst.
    expect(leseDevVars("R2_SECRET_ACCESS_KEY=abc=def==\r\n")).toEqual({
      R2_SECRET_ACCESS_KEY: "abc=def==",
    });
  });

  it("gibt bei leerem Text ein leeres Objekt zurück", () => {
    expect(leseDevVars("")).toEqual({});
  });
});
