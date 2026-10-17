import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PIPELINE_VERSION } from "../lib/bilder-regeln.mjs";
import { ausManifest, variantenSchluessel } from "./medien.mjs";

/**
 * Die Medienpipeline ohne `.medien-cache` — so, wie sie in der Medien-Action
 * läuft.
 *
 * ⚠️ **Warum das unter Test steht.** Fiele `ausManifest` durch, sähe man es
 * nicht an einem Fehler, sondern nur an der Rechnung: Jede Action rechnete
 * alle Bilder neu (rund 35 s je Bild), lüde sie erneut hoch, und jeder Lauf
 * lieferte ein neues `lqip` — also täglich einen Commit und einen Deploy für
 * nichts.
 */

const BASIS = "https://medien.jakobsax.de";

/** Ein Schlüssel wie in `main()`: ETag, Pipelineversion, Bucket-Adresse. */
function schluesselFuer(etag, basis = BASIS) {
  return createHash("sha1").update(etag).update(String(PIPELINE_VERSION)).update(basis).digest("hex");
}

function eintragMit(v, name = "arbeiten/x") {
  const u = name.split("/").map(encodeURIComponent).join("/");
  return {
    breite: 3000,
    hoehe: 2000,
    avif: `${BASIS}/b/${u}-480.avif?v=${v} 480w, ${BASIS}/b/${u}-800.avif?v=${v} 800w`,
    webp: `${BASIS}/b/${u}-480.webp?v=${v} 480w, ${BASIS}/b/${u}-800.webp?v=${v} 800w`,
    fallback: `${BASIS}/b/${u}-800.jpg?v=${v}`,
    lqip: "data:image/webp;base64,AAAA",
  };
}

const DATEIEN = [
  "b/arbeiten/x-480.avif",
  "b/arbeiten/x-800.avif",
  "b/arbeiten/x-480.webp",
  "b/arbeiten/x-800.webp",
  "b/arbeiten/x-800.jpg",
];

describe("variantenSchluessel", () => {
  it("macht aus Adressen Bucket-Schlüssel — ohne Basis, ohne Abfrage, dekodiert", () => {
    const e = eintragMit("abcdef12", "arbeiten/mein bild, quer");
    expect(variantenSchluessel(e, BASIS)).toEqual([
      "b/arbeiten/mein bild, quer-480.avif",
      "b/arbeiten/mein bild, quer-800.avif",
      "b/arbeiten/mein bild, quer-480.webp",
      "b/arbeiten/mein bild, quer-800.webp",
      "b/arbeiten/mein bild, quer-800.jpg",
    ]);
  });

  it("gibt null für eine fremde Domain oder einen anderen Ordner", () => {
    expect(variantenSchluessel(eintragMit("abcdef12"), "https://andere.example")).toBeNull();
    const e = eintragMit("abcdef12");
    e.fallback = `${BASIS}/original/arbeiten/x.jpg?v=abcdef12`;
    expect(variantenSchluessel(e, BASIS)).toBeNull();
  });

  it("gibt null bei kaputter Kodierung", () => {
    const e = eintragMit("abcdef12");
    e.fallback = `${BASIS}/b/arbeiten/x%E0%A4%A-800.jpg?v=abcdef12`;
    expect(variantenSchluessel(e, BASIS)).toBeNull();
  });
});

describe("ausManifest", () => {
  const schluessel = schluesselFuer('"etag-1"');
  const v = schluessel.slice(0, 8);
  const imBucket = new Set(DATEIEN);

  it("übernimmt einen Eintrag mit passendem Fingerabdruck und allen Dateien", () => {
    const eintrag = eintragMit(v);
    expect(ausManifest(eintrag, schluessel, imBucket, BASIS)).toEqual({
      schluessel,
      eintrag,
      dateien: DATEIEN,
    });
  });

  it("verwirft ein ersetztes Original (anderer ETag → anderer Fingerabdruck)", () => {
    const eintrag = eintragMit(v);
    expect(ausManifest(eintrag, schluesselFuer('"etag-2"'), imBucket, BASIS)).toBeNull();
  });

  it("verwirft nach einem Domainwechsel", () => {
    const eintrag = eintragMit(v);
    const neu = schluesselFuer('"etag-1"', "https://bilder.jakobsax.de");
    expect(ausManifest(eintrag, neu, imBucket, "https://bilder.jakobsax.de")).toBeNull();
  });

  it("verwirft, wenn auch nur eine Adresse den Fingerabdruck nicht trägt — der Fehler vom 2026-10-15", () => {
    const eintrag = eintragMit(v);
    eintrag.webp = eintrag.webp.replace(`-800.webp?v=${v}`, "-800.webp");
    expect(ausManifest(eintrag, schluessel, imBucket, BASIS)).toBeNull();
  });

  it("verwirft, wenn eine Variante im Bucket fehlt", () => {
    const ohne = new Set(DATEIEN.filter((d) => d !== "b/arbeiten/x-800.jpg"));
    expect(ausManifest(eintragMit(v), schluessel, ohne, BASIS)).toBeNull();
  });

  it("verwirft Unvollständiges", () => {
    expect(ausManifest(undefined, schluessel, imBucket, BASIS)).toBeNull();
    for (const feld of ["breite", "hoehe", "lqip", "avif", "webp", "fallback"]) {
      const e = eintragMit(v);
      delete e[feld];
      expect(ausManifest(e, schluessel, imBucket, BASIS), feld).toBeNull();
    }
  });

  /*
   * Gegen das echte, eingecheckte Manifest: Jeder Eintrag muss sich mit
   * seinem eigenen Fingerabdruck zurückgewinnen lassen, wenn alle seine
   * Dateien im Bucket liegen. Fiele hier einer durch, würde er in jeder
   * Action neu gerechnet.
   */
  it("gewinnt jeden Eintrag des eingecheckten Manifests zurück", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../lib/bilder-manifest.json", import.meta.url), "utf8"),
    );
    const basis = new URL(Object.values(manifest)[0].fallback).origin;
    for (const [name, eintrag] of Object.entries(manifest)) {
      const v8 = new URL(eintrag.fallback).searchParams.get("v");
      // Ein Schlüssel, dessen erste acht Stellen der Fingerabdruck sind.
      const s = `${v8}${"0".repeat(32)}`;
      const dateien = variantenSchluessel(eintrag, basis);
      expect(dateien, name).not.toBeNull();
      expect(ausManifest(eintrag, s, new Set(dateien), basis), name).not.toBeNull();
    }
  });
});
