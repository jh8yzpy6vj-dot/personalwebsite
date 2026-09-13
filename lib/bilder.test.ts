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

/**
 * ⚠️ Die harte Grenze **bricht den Lauf ab**. Ein zu enges Budget ist damit
 * kein Schönheitsfehler, sondern eine Sperre — und genau das drohte: Feste
 * Zahlen waren stillschweigend für Querformate gerechnet.
 */
describe("budgetFuer", () => {
  it("bricht bei echten Hochformat-Varianten nicht ab", async () => {
    const { budgetFuer } = await import("./bilder-regeln.mjs");
    // Gemessener Worst Case (Rauschbild) aus AVIF_MAX_BREITE: 2400×3652 = 2405 kB.
    // Mit den alten festen 1,5 MB wäre hier Schluss gewesen.
    expect(budgetFuer(2400, 3652).fehler).toBeGreaterThan(2405 * 1024);
    // Und die 1200er-Warnung darf bei 322 kB (ebenfalls gemessen) nicht anschlagen.
    expect(budgetFuer(1200, 1826).warnung).toBeGreaterThan(322 * 1024);
  });

  it("fängt weiterhin ab, was der Fehler meint: eine Datei ohne echte Kompression", async () => {
    const { budgetFuer } = await import("./bilder-regeln.mjs");
    // Rohes RGB sind rund 3000 kB je Megapixel — das muss sicher darüber liegen.
    const rohesRgb = (b: number, h: number) => b * h * 3;
    expect(budgetFuer(2400, 3652).fehler).toBeLessThan(rohesRgb(2400, 3652));
    expect(budgetFuer(1200, 800).fehler).toBeLessThan(rohesRgb(1200, 800));
  });

  it("skaliert mit der Fläche, nicht mit der Breite", async () => {
    const { budgetFuer } = await import("./bilder-regeln.mjs");
    // Gleiche Breite, anderthalbfache Höhe → anderthalbfaches Budget.
    const quer = budgetFuer(2400, 1600).fehler;
    const hoch = budgetFuer(2400, 2400).fehler;
    expect(hoch / quer).toBeCloseTo(1.5, 5);
  });
});

const lies = (pfad: string) =>
  import("node:fs/promises").then((fs) =>
    fs.readFile(new URL(pfad, import.meta.url), "utf8"),
  );

describe("Mosaik", () => {
  /*
   * ⚠️ Der Zeilensatz (bis 2026-09-13) konnte Formate nicht mischen — er
   * reihte sie in Dateireihenfolge aneinander, bei fünf Hochformaten und
   * einem Querformat also zu einem Streifen plus Einzelbild. Spalten
   * mischen von selbst. Wer hier auf `flex` zurückbaut, baut den Fehler
   * zurück.
   */
  it("verteilt reihum, nicht spaltenweise", async () => {
    const tsx = await lies("../app/components/Mosaik.tsx");
    // Spaltenweise gefüllt läse sich die obere Reihe 1-3-5 statt 1-2-3.
    expect(tsx).toContain("spalten[i % spalten.length].push");
  });

  it("gibt den Spalten ungleiche Breiten", async () => {
    const css = await lies("../app/components/Mosaik.module.css");
    /*
     * ⚠️ Der eigentliche Hebel. Bei gleich breiten Spalten stehen fünf
     * Hochformate wieder gleich hoch nebeneinander — ein Raster, nur
     * anders sortiert. Jan zur ersten Fassung: „das ist kein mosaik."
     */
    const gewichte = [...css.matchAll(/\.spalte:nth-child\(\d\)\s*\{\s*flex:\s*([\d.]+)/g)]
      .map((t) => Number(t[1]));
    expect(gewichte).toHaveLength(3);
    expect(new Set(gewichte).size, "alle drei Gewichte verschieden").toBe(3);
  });

  it("stellt die Dateireihenfolge her, wenn die Spalten fallen", async () => {
    const tsx = await lies("../app/components/Mosaik.tsx");
    const css = await lies("../app/components/Mosaik.module.css");
    // Ohne `order` laegen die Bilder auf dem Telefon als 1,4,2,5,3,6
    // untereinander — derselbe Fehler wie damals in den Flanken.
    expect(css).toMatch(/\.spalte\s*\{\s*display:\s*contents/);
    expect(tsx).toContain("style={{ order: i }}");
  });

  it("hält sizes und den Spaltenumbruch auf derselben Breite", async () => {
    const { MOSAIK_SIZES } = await import("./bilder");
    const css = await lies("../app/components/Mosaik.module.css");
    // Laufen sie auseinander, lädt der Browser stillschweigend die falsche
    // Stufe — niemand bekommt einen Fehler, es kostet nur Bytes oder Schärfe.
    expect(MOSAIK_SIZES).toContain("(max-width: 860px)");
    expect(css).toContain("@media (max-width: 860px)");
  });

  it("der Lichtkasten liegt fest im Fenster, nicht im Inhalt", async () => {
    const css = await lies("../app/components/Mosaik.module.css");
    // `absolute` hiesse: am Anfang des Inhalts statt im Sichtfeld — beim
    // Schliessen landete man wieder ganz oben auf der Seite.
    expect(css).toMatch(/\.kasten\s*\{[^}]*position:\s*fixed/);
  });

  it("gibt den Fokus an die Kachel zurück, die ihn geöffnet hat", async () => {
    const tsx = await lies("../app/components/Mosaik.tsx");
    // Hält zugleich die Scrollposition. Ohne `preventScroll` springt der
    // Browser die Kachel an und verschiebt die Seite dabei doch wieder.
    expect(tsx).toContain("ausloeser.current?.focus({ preventScroll: true })");
  });

  it("überlässt dem Lichtkasten die Pfeiltasten", async () => {
    const kasten = await lies("../app/components/Mosaik.tsx");
    const tasten = await lies("../app/components/Blaettertasten.tsx");
    // Ohne beides sprang der erste Druck auf → zur nächsten Arbeit, statt
    // im Lichtkasten weiterzublättern. Gegen den echten Server gemessen.
    expect(kasten).toContain('data-blaettern="aus"');
    expect(tasten).toContain('dialog[open], [role="dialog"]');
  });

  it("das Hero fordert die volle Fensterbreite an", async () => {
    const { HERO_SIZES } = await import("./bilder");
    // Randlos mit `cover` — hier ist `100vw` die richtige Angabe und kein
    // vergessener Standardwert.
    expect(HERO_SIZES).toBe("100vw");
  });
});

/**
 * Die drei Pflichten aus „Blende im Hero" in design/UI-SPEC.md. Alle drei
 * sind unsichtbar, wenn sie fehlen: Die Seite sieht richtig aus und lädt
 * nur sieben Bilder statt einem, läuft im Hintergrund weiter, oder bewegt
 * sich bei jemandem, der ausdrücklich um Ruhe gebeten hat.
 */
describe("Blende im Hero", () => {
  it("lädt nur das erste Bild mit Vorrang", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    expect(tsx).toContain("vorrang={i === 0}");
  });

  it("steht still, solange das Hero nicht im Bild ist", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    expect(tsx).toContain("IntersectionObserver");
  });

  it("läuft ohne Bewegungswunsch gar nicht erst an", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    expect(tsx).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
  });

  it("trennt Standzeit und Dauer in zwei Werte", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    // Hingen sie aneinander, sah man die Bilder nicht — der Fehler, der
    // den ganzen Umbau ausgelöst hat.
    expect(tsx).toMatch(/const STANDZEIT_MS = \d+/);
    expect(tsx).toMatch(/const DAUER_MS = BLOCK_MS \+ AUFDECK_MS/);
  });

  it("führt die Taktzeiten nur an einer Stelle", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    const css = await lies("../app/components/Blende.module.css");
    // Doppelt geführt laufen sie auseinander, sobald sich der Takt ändert
    // — im Stylesheet standen einmal 5200ms, die zu nichts mehr passten.
    expect(tsx).toContain('"--takt-block"');
    expect(tsx).toContain('"--takt-aufdecken"');
    expect(tsx).toContain('"--takt-fahrt"');
    expect(css).not.toMatch(/transition:\s*opacity\s*\d+ms/);
    expect(css).not.toMatch(/animation:\s*fahrt\s*\d+ms/);
  });

  /*
   * ⚠️ Der Fehler, den Jan zweimal gesehen hat: „die drei vierecke kommen
   * nicht nacheinander, sondern gleichzeitig." Ein Element, dessen erste
   * berechnete Deckkraft schon der Endwert ist, bekommt keinen Übergang.
   * Die Flächen müssen also erst unsichtbar im Dokument stehen und
   * `laeuft` einen Bildaufbau später dazubekommen.
   */
  it("hängt die Flächen ein, bevor sie aufkommen", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    const css = await lies("../app/components/Blende.module.css");
    expect(tsx).toContain('setPhase("bereit")');
    expect(tsx).toContain("requestAnimationFrame");
    // `bereit` darf die Flächen gerade **nicht** aufdecken.
    expect(css).not.toMatch(/\.bereit \.block/);
  });

  it("lässt die Flächen einander überlappen", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    const einzeln = Number(tsx.match(/const BLOCK_EINZELN_MS = (\d+)/)?.[1]);
    const block = Number(tsx.match(/const BLOCK_MS = (\d+)/)?.[1]);
    // Versatz = (BLOCK_MS − BLOCK_EINZELN_MS) / 2. Ist eine Fläche nicht
    // länger als der Versatz, erscheinen sie im Gänsemarsch statt als
    // eine Bewegung.
    expect(einzeln).toBeGreaterThan((block - einzeln) / 2);
  });

  it("wechselt erst nach der Überblendung weiter", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    // Vorher stand hier DAUER_MS + 40 — das schnitt die Überblendung nach
    // einem Vierzigstel ab, das Bild stand schlagartig da.
    expect(tsx).toContain("DAUER_MS + 60");
  });

  /*
   * ⚠️ Die drei Regeln, an denen die erste Fassung live zerbrochen ist.
   * Jan: „die hero animation ist krass am hängen, das sieht aus wie
   * Pixelfehler nicht wie eine gewollte animation." Alle drei sind in
   * einem Screenshot nicht zu sehen und mit Platzhalterbildern nicht zu
   * reproduzieren — deshalb stehen sie hier.
   */
  it("bewegt nur das laufende Bild", async () => {
    const css = await lies("../app/components/Blende.module.css");
    // Blockausschnitte und eintreffendes Bild müssen dieselbe
    // Transformation tragen, sonst springt das Motiv beim Umschlag. Am
    // sichersten ist: beide tragen keine.
    expect(css).toMatch(/\.aktiv \.bild\s*\{[^}]*animation:\s*fahrt/);
    expect(css).not.toMatch(/\.block img\s*\{[^}]*animation:/);
  });

  it("fährt nur in eine Richtung", async () => {
    const css = await lies("../app/components/Blende.module.css");
    // Abwechselnd hinein und hinaus hieße: jedes zweite Bild beginnt bei
    // 1.07, während die Blöcke, die es aufdecken, bei 1 stehen.
    expect(css).not.toContain("fahrtRueck");
  });

  it("blendet nur in ein fertig geladenes Bild", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    // Sonst zeigen die Blockausschnitte schlicht noch nichts — das war
    // der sichtbare Teil von „Pixelfehler".
    expect(tsx).toContain("stand.current.geladen.includes(kommt)");
  });

  it("tauscht nie die Adresse einer Bildlage", async () => {
    const tsx = await lies("../app/components/Blende.tsx");
    // Je Bild eine eigene Lage mit stabilem `key`; gewechselt werden nur
    // Deckkraft und Ebene. Beim Adresstausch liegt mindestens ein
    // Bildaufbau mit dem alten Inhalt dazwischen.
    expect(tsx).toContain("gemountet.map((i)");
    expect(tsx).toContain("key={i}");
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
      expect(e.avif, schluessel).toMatch(/\.avif(\?v=[0-9a-f]{8})? \d+w/);
      expect(e.webp, schluessel).toMatch(/\.webp(\?v=[0-9a-f]{8})? \d+w/);
      /*
       * ⚠️ Der Fingerabdruck `?v=…` gehört dazu und darf hier nicht
       * wegassertiert werden: Die Adressen werden mit
       * `max-age=31536000, immutable` ausgeliefert, also **nie** neu
       * geholt. Ohne den Anhang zeigte die Seite nach einem neuen Bundle
       * weiter die alten Bilder unter den neuen Uhrzeiten — genau der
       * Fehler vom 2026-09-13.
       *
       * Der Test hing bisher an Manifesten ohne Anhang und fiel deshalb
       * erst auf, als ein frisch erzeugtes Manifest dazukam.
       */
      expect(e.fallback, schluessel).toMatch(/\.jpg(\?v=[0-9a-f]{8})?$/);
      expect(e.lqip, schluessel).toMatch(/^data:image\/webp;base64,/);
      // AVIF und WebP müssen dieselben Stufen anbieten, sonst lädt ein
      // Browser je nach Format unterschiedlich große Bilder.
      expect(e.avif.split(", ").length, schluessel).toBe(
        e.webp.split(", ").length,
      );
    }
  });
});
