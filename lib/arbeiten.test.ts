import { describe, expect, it, vi } from "vitest";
import { FILME, FOTOS } from "./content";
import { beschriftung, zielDesLinks } from "./arbeiten";

describe("Inhalte", () => {
  it("vergibt jede id nur einmal", () => {
    for (const liste of [FOTOS, FILME]) {
      const ids = liste.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("verlinkt jeden Film mit einer https-Adresse", () => {
    for (const film of FILME) expect(film.link, film.id).toMatch(/^https:\/\//);
  });

  it("schreibt Kunden ohne Rechtsformzusatz (E10)", () => {
    for (const a of [...FOTOS, ...FILME]) {
      expect(a.kunde, a.id).not.toMatch(/\b(e\.\s?V\.|gGmbH|GmbH|UG)\b/);
    }
  });
});

describe("beschriftung", () => {
  it("setzt Titel und Kunde mit Halbgeviertstrich zusammen", () => {
    expect(beschriftung({ titel: "WiWaWo 2026", kunde: "Bayerischer Kanuverband" })).toBe(
      "WiWaWo 2026 – Bayerischer Kanuverband",
    );
  });
});

describe("zielDesLinks", () => {
  it("nennt die bekannten Plattformen", () => {
    expect(zielDesLinks("https://www.youtube.com/watch?v=x")).toBe("auf YouTube");
    expect(zielDesLinks("https://youtu.be/x")).toBe("auf YouTube");
    expect(zielDesLinks("https://vimeo.com/1")).toBe("auf Vimeo");
    expect(zielDesLinks("https://www.ardmediathek.de/video/x")).toBe("in der ARD Mediathek");
  });

  it("behauptet bei Unbekanntem nichts", () => {
    expect(zielDesLinks("https://example.org/x")).toBe("auf example.org");
    expect(zielDesLinks("kein link")).toBe("extern");
  });
});

describe("Was kein Bild hat, erscheint nicht", () => {
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
    const modul = await import("./arbeiten");
    vi.doUnmock("./bilder-manifest.json");
    return modul;
  }

  it("lässt Fotoarbeiten ohne Bild weg und hält die Reihenfolge", async () => {
    const { fotosFuerMosaik, fotoarbeitenOhneBild } = await mitManifest({
      "arbeiten/b/02": q,
      "arbeiten/b/01": q,
      "arbeiten/b": q,
      "arbeiten/c/01": q,
    });
    const fotos = [
      { id: "a", titel: "A", kunde: "K" },
      { id: "b", titel: "B", kunde: "K", alt: { "01": "Szene" } },
      { id: "c", titel: "C", kunde: "K" },
    ];
    const bilder = fotosFuerMosaik(fotos);
    expect(bilder.map((b) => b.schluessel)).toEqual([
      "arbeiten/b",
      "arbeiten/b/01",
      "arbeiten/b/02",
      "arbeiten/c/01",
    ]);
    expect(bilder[1].alt).toBe("Szene – B – K");
    expect(bilder[2].alt).toBe("B – K, Bild 3");
    expect(fotoarbeitenOhneBild(fotos).map((a) => a.id)).toEqual(["a"]);
  });

  it("lässt Filme ohne Standbild weg", async () => {
    const { filmeMitStandbild, filmeOhneStandbild } = await mitManifest({ "film/b": q });
    const filme = [
      { id: "a", titel: "A", kunde: "K", link: "https://vimeo.com/1" },
      { id: "b", titel: "B", kunde: "K", link: "https://youtu.be/x" },
    ];
    const kacheln = filmeMitStandbild(filme);
    expect(kacheln.map((f) => f.id)).toEqual(["b"]);
    expect(kacheln[0].beschriftung).toBe("B – K");
    expect(kacheln[0].ziel).toBe("auf YouTube");
    expect(filmeOhneStandbild(filme).map((f) => f.id)).toEqual(["a"]);
  });
});
