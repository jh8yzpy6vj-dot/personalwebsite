import { describe, expect, it } from "vitest";
import {
  FILME,
  FOTO_HERO,
  FOTOS,
  HERO_ERSATZ,
  HIGHLIGHTS,
  KATEGORIEN,
  WEGE,
} from "./content";
import manifest from "./bilder-manifest.json";
import {
  alleBilderDerArbeit,
  arbeitenMitBild,
  beschriftung,
  bilderDerArbeit,
  bilderFuerUeber,
  filmeFuerSeite,
  filmeMitStandbild,
  filmeOhneStandbild,
  fotoarbeitenOhneBild,
  fotosFuerHero,
  fotosFuerMosaik,
  zielDesLinks,
  type Kontext,
} from "./arbeiten";
import { INHALT, type Fotoarbeit, type Inhalt } from "./inhalt";
import type { Bildquelle } from "./bilder";

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
      expect(a.kunde ?? "", a.id).not.toMatch(/\b(e\.\s?V\.|gGmbH|GmbH|UG)\b/);
    }
  });
});

describe("beschriftung", () => {
  it("setzt Titel und Kunde mit Halbgeviertstrich zusammen", () => {
    expect(beschriftung({ titel: "WiWaWo 2026", kunde: "Bayerischer Kanuverband" })).toBe(
      "WiWaWo 2026 – Bayerischer Kanuverband",
    );
  });

  it("zeigt ohne Kunde nur den Titel, ohne hängenden Strich", () => {
    expect(beschriftung({ titel: "tête-à-tête" })).toBe("tête-à-tête");
  });
});

describe("Fotoarbeiten", () => {
  it("nennt Bildtitel nur für Bilder, die es nach dem Schema gibt", () => {
    for (const a of FOTOS) {
      for (const name of Object.keys(a.bildtitel ?? {})) {
        expect(name, a.id).toMatch(/^(leitbild|\d{2})$/);
      }
    }
  });

  it("verweist auf der Startseite und im Hero auf kein ausgeblendetes Bild", () => {
    /* Ein ausgeblendetes Bild fiele dort still weg — im Startseiten-Hero
       bliebe dann eine schwarze Fläche. */
    const sichtbar = new Set(fotosFuerMosaik().map((b) => b.schluessel));
    const genannt = [HERO_ERSATZ, WEGE.foto, WEGE.film, ...HIGHLIGHTS, ...FOTO_HERO];
    for (const k of genannt) {
      if (k && k in manifest) expect(sichtbar.has(k), k).toBe(true);
    }
    expect(fotosFuerHero().length).toBe(FOTO_HERO.length);
  });

  it("gehört jede Arbeit zu einer bekannten Kategorie", () => {
    const ids = new Set<string>(KATEGORIEN);
    for (const a of FOTOS) expect(ids.has(a.kategorie), a.id).toBe(true);
  });

  it("zeigt nach dem Umzug in lib/inhalt.json dasselbe Mosaik wie vorher", () => {
    /*
     * ⚠️ Stand vom 2026-10-17, unmittelbar vor dem Umzug aus content.ts
     * berechnet (Kategorie → Arbeit → Dateiname, ohne die sechs von Jakob
     * ausgeblendeten WiWaWo-Bilder). Gilt nur, solange niemand in der
     * Verwaltung umsortiert — dann diesen Test löschen, nicht anpassen.
     */
    const erwartet = INHALT.foto.reihenfolge.filter((k) => !INHALT.ausgeblendet.includes(k));
    const ist = fotosFuerMosaik().map((b) => b.schluessel);
    if (ist.length === erwartet.length) expect(ist).toEqual(erwartet);
  });
});

describe("Hero auf /foto", () => {
  it("nennt jedes Bild nur einmal", () => {
    expect(new Set(FOTO_HERO).size).toBe(FOTO_HERO.length);
  });

  it("nennt nur Bilder, die es gibt und die zu einer Fotoarbeit gehören", () => {
    const ids = new Set(FOTOS.map((a) => a.id));
    for (const k of FOTO_HERO) {
      expect(k in manifest, k).toBe(true);
      expect(ids.has(k.split("/")[1]), k).toBe(true);
    }
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

/* ── Ableitungen gegen einen selbst gebauten Kontext ──────────────── */

const q: Bildquelle = {
  breite: 3000,
  hoehe: 2000,
  avif: "/b/x-480.avif 480w",
  webp: "/b/x-480.webp 480w",
  fallback: "/b/x-1200.jpg",
  lqip: "data:image/webp;base64,AAA",
};

/** Ein Kontext mit genau diesen Arbeiten und Bildern, Rest leer. */
function kontext(
  arbeiten: Fotoarbeit[],
  schluessel: string[],
  mehr: Partial<Omit<Inhalt, "foto">> & { foto?: Partial<Inhalt["foto"]> } = {},
): Kontext {
  const { foto, ...rest } = mehr;
  return {
    bilder: Object.fromEntries(schluessel.map((k) => [k, q])),
    inhalt: {
      ...INHALT,
      filme: [],
      ausgeblendet: [],
      papierkorb: {},
      bildausschnitte: {},
      ...rest,
      ueber: { ...INHALT.ueber, bilder: {}, reihenfolge: [], ...(rest.ueber ?? {}) },
      foto: {
        kategorien: ["festival", "theater", "paddeln"],
        arbeiten,
        reihenfolge: [],
        hero: [],
        ...foto,
      },
    },
  };
}

describe("Was kein Bild hat, erscheint nicht", () => {
  it("lässt Fotoarbeiten ohne Bild weg und hält die Reihenfolge", () => {
    const k = kontext(
      [
        { id: "a", kategorie: "festival", titel: "A", kunde: "K" },
        { id: "b", kategorie: "festival", titel: "B", kunde: "K", alt: { "01": "Szene" } },
        { id: "c", kategorie: "festival", titel: "C", kunde: "K" },
      ],
      ["arbeiten/b/02", "arbeiten/b/01", "arbeiten/b", "arbeiten/c/01"],
    );
    const bilder = fotosFuerMosaik(k);
    expect(bilder.map((b) => b.schluessel)).toEqual([
      "arbeiten/b",
      "arbeiten/b/01",
      "arbeiten/b/02",
      "arbeiten/c/01",
    ]);
    expect(bilder[1].alt).toBe("Szene – B – K");
    expect(bilder[2].alt).toBe("B – K, Bild 3");
    expect(fotoarbeitenOhneBild(k).map((a) => a.id)).toEqual(["a"]);
  });

  it("ordnet ohne Wunschliste nach Kategorie, darin nach der Liste der Arbeiten", () => {
    /* Absichtlich durcheinander: Die Reihenfolge der Kategorien kommt aus
       `kategorien`, nicht aus der Liste. */
    const k = kontext(
      [
        { id: "p", kategorie: "paddeln", titel: "P" },
        { id: "leer", kategorie: "festival", titel: "Leer" },
        { id: "f1", kategorie: "festival", titel: "F1" },
        { id: "t", kategorie: "theater", titel: "T" },
        { id: "f2", kategorie: "festival", titel: "F2" },
      ],
      ["arbeiten/p", "arbeiten/f1", "arbeiten/f2/01", "arbeiten/t"],
      { foto: { hero: ["arbeiten/t", "arbeiten/gibtsnicht", "arbeiten/f1"] } },
    );
    expect(arbeitenMitBild(k).map((a) => a.id)).toEqual(["f1", "f2", "t", "p"]);
    expect(fotosFuerMosaik(k).map((b) => b.schluessel)).toEqual([
      "arbeiten/f1",
      "arbeiten/f2/01",
      "arbeiten/t",
      "arbeiten/p",
    ]);
    /* Das Hero hält die eigene Reihenfolge und lässt Fehlendes weg. */
    expect(fotosFuerHero(k).map((b) => b.schluessel)).toEqual(["arbeiten/t", "arbeiten/f1"]);
  });

  it("lässt ausgeblendete und gelöschte Bilder weg, gezählt wird, was zu sehen ist", () => {
    const x: Fotoarbeit = { id: "x", kategorie: "paddeln", titel: "X" };
    const y: Fotoarbeit = { id: "y", kategorie: "paddeln", titel: "Y" };
    const k = kontext(
      [x, y],
      ["arbeiten/x", "arbeiten/x/01", "arbeiten/x/02", "arbeiten/x/03", "arbeiten/y"],
      { ausgeblendet: ["arbeiten/x", "arbeiten/y"], papierkorb: { "arbeiten/x/02": "2026-10-17" } },
    );
    const bilder = bilderDerArbeit(x, k);
    expect(bilder.map((b) => b.schluessel)).toEqual(["arbeiten/x/01", "arbeiten/x/03"]);
    expect(bilder[1].alt).toBe("X, Bild 2");
    expect(fotoarbeitenOhneBild(k).map((a) => a.id)).toEqual(["y"]);
    /* Die Verwaltung sieht trotzdem alle. */
    expect(alleBilderDerArbeit(x, k)).toHaveLength(4);
  });

  it("beschriftet ein Bild mit seinem eigenen Titel, wenn es einen hat", () => {
    const a: Fotoarbeit = {
      id: "x",
      kategorie: "festival",
      titel: "at.tension",
      bildtitel: { leitbild: "Cie. Dyptik" },
    };
    const bilder = bilderDerArbeit(a, kontext([a], ["arbeiten/x", "arbeiten/x/01"]));
    expect(bilder.map((b) => b.beschriftung)).toEqual(["Cie. Dyptik – at.tension", "at.tension"]);
  });

  it("lässt Filme ohne Standbild weg", () => {
    const k = kontext([], ["film/b"], {
      filme: [
        { id: "a", titel: "A", kunde: "K", link: "https://vimeo.com/1" },
        { id: "b", titel: "B", kunde: "K", link: "https://youtu.be/x" },
      ],
    });
    const kacheln = filmeMitStandbild(k);
    expect(kacheln.map((f) => f.id)).toEqual(["b"]);
    expect(kacheln[0].beschriftung).toBe("B – K");
    expect(kacheln[0].ziel).toBe("auf YouTube");
    expect(filmeOhneStandbild(k).map((f) => f.id)).toEqual(["a"]);

    // /film zeigt beide, in Jakobs Reihenfolge; ohne Standbild mit `null`.
    const seite = filmeFuerSeite(k);
    expect(seite.map((f) => [f.id, f.standbild !== null])).toEqual([
      ["a", false],
      ["b", true],
    ]);
    expect(seite[0].ziel).toBe("auf Vimeo");
  });
});

describe("Freie Reihenfolge (Verwaltung, seit 2026-10-17)", () => {
  const arbeiten: Fotoarbeit[] = [
    { id: "a", kategorie: "festival", titel: "A" },
    { id: "b", kategorie: "theater", titel: "B" },
  ];
  const alle = ["arbeiten/a", "arbeiten/a/01", "arbeiten/b", "arbeiten/b/01"];

  it("folgt der Wunschliste, auch über Arbeiten und Kategorien hinweg", () => {
    const k = kontext(arbeiten, alle, {
      foto: { reihenfolge: ["arbeiten/b/01", "arbeiten/a", "arbeiten/b", "arbeiten/a/01"] },
    });
    expect(fotosFuerMosaik(k).map((b) => b.schluessel)).toEqual([
      "arbeiten/b/01",
      "arbeiten/a",
      "arbeiten/b",
      "arbeiten/a/01",
    ]);
  });

  it("hängt Bilder ohne Platz in der Liste hinten an, in natürlicher Ordnung", () => {
    /* Frisch hochgeladen: steht noch in keiner Liste — darf nie still fehlen. */
    const k = kontext(arbeiten, [...alle, "arbeiten/a/02"], {
      foto: { reihenfolge: ["arbeiten/b", "arbeiten/a"] },
    });
    expect(fotosFuerMosaik(k).map((b) => b.schluessel)).toEqual([
      "arbeiten/b",
      "arbeiten/a",
      "arbeiten/a/01",
      "arbeiten/a/02",
      "arbeiten/b/01",
    ]);
  });

  it("überspringt Schlüssel der Liste, die es (noch) nicht gibt", () => {
    const k = kontext(arbeiten, alle, {
      foto: { reihenfolge: ["arbeiten/a/09", "arbeiten/b", "arbeiten/a", "arbeiten/a/01", "arbeiten/b/01"] },
    });
    expect(fotosFuerMosaik(k).map((b) => b.schluessel)).toEqual([
      "arbeiten/b",
      "arbeiten/a",
      "arbeiten/a/01",
      "arbeiten/b/01",
    ]);
  });

  it("ordnet /ueber nach eigener Liste und beschriftet nach vollem Schlüssel", () => {
    const k = kontext([], ["ueber/01", "ueber/02", "ueber/03"], {
      ueber: {
        ...INHALT.ueber,
        bilder: { "ueber/03": "Drei" },
        reihenfolge: ["ueber/03", "ueber/01"],
      },
      ausgeblendet: ["ueber/01"],
    });
    const bilder = bilderFuerUeber(k);
    expect(bilder.map((b) => b.schluessel)).toEqual(["ueber/03", "ueber/02"]);
    expect(bilder.map((b) => b.beschriftung)).toEqual(["Drei", "Jakob Sax"]);
  });

  it("nimmt den Bildausschnitt aus dem Inhalt", () => {
    const k = kontext(arbeiten, alle, { bildausschnitte: { "arbeiten/a": "50% 20%" } });
    expect(fotosFuerMosaik(k).find((b) => b.schluessel === "arbeiten/a")?.ausschnitt).toBe("50% 20%");
    expect(fotosFuerMosaik(k).find((b) => b.schluessel === "arbeiten/b")?.ausschnitt).toBe("50% 50%");
  });
});
