import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  eingangEingerichtet,
  leseDevVars,
  s3Grund,
  xmlText,
  zugang,
  zugangEingang,
} from "./r2.mjs";

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

/**
 * Fehlermeldungen aus S3. ⚠️ Seit die Skripte in der Medien-Action laufen,
 * stehen sie im Log eines öffentlichen Repos — nur Code und Text, nie der
 * ganze Rumpf.
 */
describe("s3Grund", () => {
  it("nimmt nur Code und Message", () => {
    const xml =
      '<?xml version="1.0"?><Error><Code>SignatureDoesNotMatch</Code>' +
      "<Message>The request signature we calculated does not match</Message>" +
      "<AWSAccessKeyId>AKIAGEHEIM</AWSAccessKeyId><StringToSign>AWS4-HMAC-SHA256 …</StringToSign></Error>";
    const grund = s3Grund(xml);
    expect(grund).toBe(": SignatureDoesNotMatch – The request signature we calculated does not match");
    expect(grund).not.toContain("AKIAGEHEIM");
  });

  it("ist leer ohne erkennbaren Fehler", () => {
    expect(s3Grund("")).toBe("");
    expect(s3Grund("<html>Bad Gateway</html>")).toBe("");
  });
});

describe("xmlText", () => {
  it("übersetzt Entitäten zurück, &amp; zuletzt", () => {
    expect(xmlText("a&amp;b&lt;c&gt;&quot;&apos;")).toBe(`a&b<c>"'`);
    expect(xmlText("&amp;lt;")).toBe("&lt;");
  });
});

describe("zugang mit zweitem Bucket", () => {
  const NAMEN = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_S3_ENDPOINT",
    "R2_JURISDICTION",
    "EINGANG_BUCKET",
    "EINGANG_JURISDICTION",
  ];
  let vorher;

  /*
   * ⚠️ Jede Variable ausdrücklich setzen — auch leer. Was in der Umgebung
   * steht, gewinnt gegen `.dev.vars`; so liest der Test nie echte
   * Zugangsdaten von einem Entwicklerrechner.
   */
  beforeEach(() => {
    vorher = Object.fromEntries(NAMEN.map((n) => [n, process.env[n]]));
    Object.assign(process.env, {
      R2_ACCOUNT_ID: "konto",
      R2_ACCESS_KEY_ID: "id",
      R2_SECRET_ACCESS_KEY: "geheim",
      R2_BUCKET: "oeffentlich",
      R2_S3_ENDPOINT: "",
      R2_JURISDICTION: "eu",
      EINGANG_BUCKET: "eingang",
      EINGANG_JURISDICTION: "",
    });
  });
  afterEach(() => {
    for (const [n, w] of Object.entries(vorher)) {
      if (w === undefined) delete process.env[n];
      else process.env[n] = w;
    }
  });

  it("ohne Angabe wie bisher der öffentliche Bucket", () => {
    expect(zugang().basis).toBe("https://konto.eu.r2.cloudflarestorage.com/oeffentlich");
  });

  it("wählt einen anderen Bucket mit denselben Zugangsdaten", () => {
    expect(zugang({ bucket: "anders" }).basis).toBe("https://konto.eu.r2.cloudflarestorage.com/anders");
  });

  it("zugangEingang nimmt EINGANG_BUCKET; leeres EINGANG_JURISDICTION heißt „keine“", () => {
    expect(zugangEingang().basis).toBe("https://konto.r2.cloudflarestorage.com/eingang");
  });

  it("zugangEingang nimmt ohne EINGANG_JURISDICTION die des öffentlichen Buckets", () => {
    delete process.env.EINGANG_JURISDICTION;
    // Kein .dev.vars-Wert kann hier dazwischenfunken: Dort steht er nicht.
    expect(zugangEingang().basis).toBe("https://konto.eu.r2.cloudflarestorage.com/eingang");
  });

  it("nennt fehlende Variablen beim Namen, nie Werte", () => {
    process.env.EINGANG_BUCKET = "";
    process.env.R2_SECRET_ACCESS_KEY = "";
    expect(() => zugangEingang()).toThrow(/R2_SECRET_ACCESS_KEY, EINGANG_BUCKET/);
    try {
      zugangEingang();
    } catch (e) {
      expect(e.message).not.toContain("konto");
    }
  });

  it("eingangEingerichtet folgt EINGANG_BUCKET", () => {
    expect(eingangEingerichtet()).toBe(true);
    process.env.EINGANG_BUCKET = "";
    expect(eingangEingerichtet()).toBe(false);
  });
});
