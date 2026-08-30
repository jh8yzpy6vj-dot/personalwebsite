import { describe, expect, it, vi } from "vitest";
import {
  BREITEN,
  breitenFuer,
  fallbackBreite,
  srcset,
  variantenName,
} from "./bilder-regeln.mjs";

/**
 * Die Bildpipeline lässt sich schlecht im Ganzen testen — sie schreibt
 * Dateien und braucht echte Fotos. Getestet werden deshalb die Regeln, die
 * entscheiden, *welche* Dateien entstehen, und die Auflösung der Schlüssel.
 * Genau dort sitzen die Fehler, die still bleiben: ein hochskaliertes Bild
 * sieht man nicht, einen falschen Schlüssel merkt man erst am Platzhalter.
 */

describe("breitenFuer", () => {
  it("liefert alle Stufen, die ins Original passen", () => {
    expect(breitenFuer(3000)).toEqual(BREITEN);
    expect(breitenFuer(2400)).toEqual([480, 800, 1200, 1600, 2400]);
  });

  it("skaliert niemals hoch", () => {
    expect(breitenFuer(900)).toEqual([480, 800]);
    expect(breitenFuer(1200)).toEqual([480, 800, 1200]);
    for (const original of [300, 900, 1500, 2000, 5000]) {
      for (const b of breitenFuer(original)) {
        expect(b).toBeLessThanOrEqual(original);
      }
    }
  });

  it("liefert für sehr kleine Originale genau eine Breite: die eigene", () => {
    expect(breitenFuer(300)).toEqual([300]);
    expect(breitenFuer(479)).toEqual([479]);
  });

  it("liefert nie eine leere Liste", () => {
    for (const original of [1, 100, 479, 480, 481, 10000]) {
      expect(breitenFuer(original).length).toBeGreaterThan(0);
    }
  });
});

describe("fallbackBreite", () => {
  it("nimmt 1200, wenn es das gibt", () => {
    expect(fallbackBreite([480, 800, 1200, 1600, 2400])).toBe(1200);
  });

  it("nimmt die größte vorhandene, wenn 1200 fehlt", () => {
    expect(fallbackBreite([480, 800])).toBe(800);
  });

  it("nimmt bei einem winzigen Original dessen eigene Breite", () => {
    expect(fallbackBreite([300])).toBe(300);
  });
});

describe("srcset", () => {
  it("schreibt Pfad und Breitenangabe je Stufe", () => {
    expect(srcset("/b/arbeiten", "tete", [480, 800], "avif")).toBe(
      "/b/arbeiten/tete-480.avif 480w, /b/arbeiten/tete-800.avif 800w",
    );
  });

  it("enthält für jede Breite genau einen Eintrag", () => {
    const breiten = breitenFuer(3000);
    const eintraege = srcset("/b", "x", breiten, "webp").split(", ");
    expect(eintraege).toHaveLength(breiten.length);
  });
});

describe("variantenName", () => {
  it("hängt Breite und Endung an", () => {
    expect(variantenName("wiwawo-52", 800, "jpg")).toBe("wiwawo-52-800.jpg");
  });
});

describe("Schlüsselauflösung", () => {
  const eintrag = {
    breite: 3000,
    hoehe: 2000,
    avif: "/b/arbeiten/tete-a-tete-2026-480.avif 480w",
    webp: "/b/arbeiten/tete-a-tete-2026-480.webp 480w",
    fallback: "/b/arbeiten/tete-a-tete-2026-1200.jpg",
    lqip: "data:image/webp;base64,AAA",
  };

  it("findet das Leitbild einer Arbeit über ihre id", async () => {
    vi.doMock("./bilder-manifest.json", () => ({
      default: { "arbeiten/tete-a-tete-2026": eintrag },
    }));
    vi.resetModules();
    const { bild, bildZurArbeit } = await import("./bilder");

    expect(bildZurArbeit("tete-a-tete-2026")).toEqual(eintrag);
    // Der Präfix ist der Vertrag mit TECH-STACK.md, Abschnitt „Medien": Wer
    // die Datei nach original/arbeiten/<id>.jpg legt, muss sie hier wiederfinden.
    expect(bild("arbeiten/tete-a-tete-2026")).toEqual(eintrag);
    expect(bild("tete-a-tete-2026")).toBeNull();
    expect(bildZurArbeit("gibt-es-nicht")).toBeNull();
    expect(bild(null)).toBeNull();
    expect(bild("")).toBeNull();

    vi.doUnmock("./bilder-manifest.json");
    vi.resetModules();
  });
});

describe("sparsamesSrcset", () => {
  const voll =
    "/b/a-480.avif 480w, /b/a-800.avif 800w, /b/a-1200.avif 1200w, /b/a-1600.avif 1600w, /b/a-2400.avif 2400w";

  it("behält nur die kleinen Stufen", async () => {
    const { sparsamesSrcset } = await import("./bilder");
    expect(sparsamesSrcset(voll)).toBe("/b/a-480.avif 480w, /b/a-800.avif 800w");
  });

  it("gibt null zurück, wenn nichts wegfällt — dann ist die zweite Quelle unnötig", async () => {
    const { sparsamesSrcset } = await import("./bilder");
    expect(sparsamesSrcset("/b/a-480.avif 480w, /b/a-800.avif 800w")).toBeNull();
    expect(sparsamesSrcset("/b/a-480.avif 480w")).toBeNull();
  });

  it("gibt null statt einer leeren Liste zurück", async () => {
    const { sparsamesSrcset } = await import("./bilder");
    // Ein Original, das kleiner als jede Stufe ist, bekommt genau eine Breite —
    // die kann über der Grenze liegen. Ein leeres `srcset` wäre ein kaputtes Bild.
    expect(sparsamesSrcset("/b/a-1000.avif 1000w")).toBeNull();
  });

  it("überschreitet die Grenze nie", async () => {
    const { sparsamesSrcset, SPARSAM_MAX_BREITE } = await import("./bilder");
    const gekuerzt = sparsamesSrcset(voll);
    for (const eintrag of (gekuerzt ?? "").split(", ")) {
      expect(Number(eintrag.match(/(\d+)w$/)![1])).toBeLessThanOrEqual(SPARSAM_MAX_BREITE);
    }
  });
});

describe("Aufnahmezeile", () => {
  it("schreibt die Belichtungszeit als Bruch, wie auf jeder Kamera", async () => {
    const { belichtungAlsText } = await import("./bilder");
    expect(belichtungAlsText(0.002)).toBe("1/500");
    expect(belichtungAlsText(1 / 8000)).toBe("1/8000");
    expect(belichtungAlsText(1 / 60)).toBe("1/60");
  });

  it("schreibt lange Belichtungen mit Einheit statt als Bruch", async () => {
    const { belichtungAlsText } = await import("./bilder");
    // 1/1 wäre richtig gerechnet und trotzdem falsch geschrieben.
    expect(belichtungAlsText(1)).toBe("1s");
    expect(belichtungAlsText(4)).toBe("4s");
    expect(belichtungAlsText(1.6)).toBe("1.6s");
  });

  it("lässt bei der Blende die überflüssige Null weg", async () => {
    const { blendeAlsText } = await import("./bilder");
    expect(blendeAlsText(2)).toBe("f/2");
    expect(blendeAlsText(2.8)).toBe("f/2.8");
    expect(blendeAlsText(1.4)).toBe("f/1.4");
  });

  it("setzt die vollständige Zeile zusammen", async () => {
    const { aufnahmeZeile } = await import("./bilder");
    expect(
      aufnahmeZeile({ zeit: "22:14", belichtung: 0.002, blende: 2.8, iso: 6400 }),
    ).toBe("22:14 uhr · 1/500 · f/2.8 · iso 6400");
  });

  it("lässt fehlende Werte weg, statt leere Trenner zu zeigen", async () => {
    const { aufnahmeZeile } = await import("./bilder");
    expect(aufnahmeZeile({ blende: 2.8, iso: 800 })).toBe("f/2.8 · iso 800");
    expect(aufnahmeZeile({ zeit: "09:03" })).toBe("09:03 uhr");
    for (const zeile of [
      aufnahmeZeile({ blende: 2.8, iso: 800 }),
      aufnahmeZeile({ zeit: "09:03" }),
    ]) {
      expect(zeile).not.toMatch(/^ ·|· ·|· $/);
    }
  });

  it("gibt null zurück, wenn nichts da ist — dann erscheint keine Zeile", async () => {
    const { aufnahmeZeile } = await import("./bilder");
    expect(aufnahmeZeile(undefined)).toBeNull();
    expect(aufnahmeZeile({})).toBeNull();
  });
});

describe("Bildstrecke und Kontaktbogen", () => {
  const q = {
    breite: 3000,
    hoehe: 2000,
    avif: "/b/x-480.avif 480w",
    webp: "/b/x-480.webp 480w",
    fallback: "/b/x-1200.jpg",
    lqip: "data:image/webp;base64,AAA",
  };

  async function mitManifest(eintraege: Record<string, unknown>) {
    vi.doMock("./bilder-manifest.json", () => ({ default: eintraege }));
    vi.resetModules();
    return import("./bilder");
  }

  it("trennt Strecke und Serie sauber", async () => {
    const { bildstreckeZurArbeit, serieZurArbeit } = await mitManifest({
      "arbeiten/tete": q,
      "arbeiten/tete/02": q,
      "arbeiten/tete/01": q,
      "arbeiten/tete/serie/01": q,
      "arbeiten/tete/serie/02-gewaehlt": q,
      "arbeiten/andere/01": q,
    });

    // Das Leitbild gehört nicht in die Strecke, der Unterordner `serie/`
    // auch nicht — und eine andere Arbeit erst recht nicht.
    expect(bildstreckeZurArbeit("tete").map((b) => b.schluessel)).toEqual([
      "arbeiten/tete/01",
      "arbeiten/tete/02",
    ]);
    expect(serieZurArbeit("tete").map((b) => b.schluessel)).toEqual([
      "arbeiten/tete/serie/01",
      "arbeiten/tete/serie/02-gewaehlt",
    ]);

    vi.doUnmock("./bilder-manifest.json");
    vi.resetModules();
  });

  it("markiert genau den Frame, dessen Name auf -gewaehlt endet", async () => {
    const { serieZurArbeit } = await mitManifest({
      "arbeiten/t/serie/01": q,
      "arbeiten/t/serie/02-gewaehlt": q,
      "arbeiten/t/serie/03": q,
    });
    expect(serieZurArbeit("t").map((b) => b.gewaehlt)).toEqual([false, true, false]);

    vi.doUnmock("./bilder-manifest.json");
    vi.resetModules();
  });

  it("liefert leere Listen statt undefined, wenn nichts da ist", async () => {
    const { bildstreckeZurArbeit, serieZurArbeit } = await mitManifest({});
    expect(bildstreckeZurArbeit("gibt-es-nicht")).toEqual([]);
    expect(serieZurArbeit("gibt-es-nicht")).toEqual([]);

    vi.doUnmock("./bilder-manifest.json");
    vi.resetModules();
  });
});

describe("Zeitangaben", () => {
  it("zeigt Sekunden nur, wo sie gebraucht werden", async () => {
    const { zeitpunkt } = await import("./bilder");
    expect(zeitpunkt({ zeit: "22:14:03" })).toBe("22:14");
    expect(zeitpunkt({ zeit: "22:14:03" }, true)).toBe("22:14:03");
    expect(zeitpunkt({})).toBeNull();
    expect(zeitpunkt(undefined)).toBeNull();
  });

  it("kürzt die Streckenzeile auf das, was sich von Bild zu Bild ändert", async () => {
    const { streckenZeile } = await import("./bilder");
    expect(
      streckenZeile({ zeit: "21:02:11", belichtung: 0.002, blende: 2.8, iso: 3200 }),
    ).toBe("21:02 uhr · iso 3200");
    expect(streckenZeile({ iso: 800 })).toBe("iso 800");
    expect(streckenZeile({})).toBeNull();
  });
});

describe("das eingecheckte Manifest", () => {
  it("hat je Eintrag alle Felder, die die Komponente braucht", async () => {
    const { BILDER } = await import("./bilder");

    for (const [schluessel, e] of Object.entries(BILDER)) {
      expect(e.breite, schluessel).toBeGreaterThan(0);
      expect(e.hoehe, schluessel).toBeGreaterThan(0);
      expect(e.avif, schluessel).toMatch(/\.avif \d+w/);
      expect(e.webp, schluessel).toMatch(/\.webp \d+w/);
      expect(e.fallback, schluessel).toMatch(/\.jpg$/);
      expect(e.lqip, schluessel).toMatch(/^data:image\/webp;base64,/);
      // AVIF und WebP müssen dieselben Stufen anbieten, sonst lädt ein
      // Browser je nach Format unterschiedlich große Bilder.
      expect(e.avif.split(", ").length, schluessel).toBe(
        e.webp.split(", ").length,
      );
    }
  });
});
