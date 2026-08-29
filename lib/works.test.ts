import { describe, expect, it } from "vitest";
import { CATEGORIES, SERVICES, WORKS } from "./content";
import {
  allSlugs,
  byCategory,
  byNewest,
  bySlug,
  forService,
  latest,
  metaLine,
  neighbours,
  yearOf,
} from "./works";

/**
 * Tests für die Ableitungen aus den Inhalten.
 *
 * `lib/works.ts` ist die einzige Stelle, an der aus `content.ts` etwas
 * abgeleitet wird — Sortierung, Nachbarn, Slug-Auflösung. Fehler hier
 * fallen nicht auf: Eine falsche Reihenfolge sieht aus wie eine
 * Entscheidung, ein fehlender Nachbar wie ein Seitenende.
 *
 * Der zweite Teil prüft die **Daten selbst** auf Zusagen, die der Code
 * voraussetzt — etwa dass Slugs eindeutig sind, weil sie URLs werden.
 */

describe("yearOf", () => {
  it("liest die Jahreszahl aus einem einfachen Jahr", () => {
    expect(yearOf({ ...WORKS[0], year: "2026" })).toBe(2026);
  });

  it("liest sie auch aus „seit 2026“", () => {
    // `year` ist ein String, weil dort auch laufende Tätigkeiten stehen.
    expect(yearOf({ ...WORKS[0], year: "seit 2026" })).toBe(2026);
  });

  it("liefert 0 statt NaN, wenn keine Jahreszahl vorkommt", () => {
    // 0 sortiert ans Ende; NaN würde die Sortierung unbrauchbar machen.
    expect(yearOf({ ...WORKS[0], year: "unbekannt" })).toBe(0);
  });
});

describe("Sortierung", () => {
  it("byNewest sortiert absteigend nach Jahr", () => {
    const jahre = byNewest().map(yearOf);
    expect(jahre).toEqual([...jahre].sort((a, b) => b - a));
  });

  it("latest(n) gibt höchstens n Einträge, die neuesten zuerst", () => {
    expect(latest(4)).toHaveLength(4);
    expect(latest(999)).toHaveLength(WORKS.length);
    expect(yearOf(latest(2)[0])).toBeGreaterThanOrEqual(yearOf(latest(2)[1]));
  });
});

describe("byCategory", () => {
  it("liefert nur Arbeiten der gefragten Kategorie", () => {
    for (const kategorie of CATEGORIES) {
      for (const w of byCategory(kategorie.id)) {
        expect(w.category).toBe(kategorie.id);
      }
    }
  });

  it("deckt zusammen alle Arbeiten ab — keine fällt durchs Raster", () => {
    const summe = CATEGORIES.reduce((n, k) => n + byCategory(k.id).length, 0);
    expect(summe).toBe(WORKS.length);
  });
});

describe("neighbours", () => {
  it("gibt am Anfang keinen Vorgänger und am Ende keinen Nachfolger", () => {
    for (const kategorie of CATEGORIES) {
      const liste = byCategory(kategorie.id);
      expect(neighbours(liste[0]).prev).toBeUndefined();
      expect(neighbours(liste[liste.length - 1]).next).toBeUndefined();
    }
  });

  it("bleibt innerhalb derselben Kategorie", () => {
    for (const w of WORKS) {
      const { prev, next } = neighbours(w);
      expect(prev?.category ?? w.category).toBe(w.category);
      expect(next?.category ?? w.category).toBe(w.category);
    }
  });

  it("ist in sich stimmig — der Nachfolger zeigt zurück", () => {
    for (const w of WORKS) {
      const next = neighbours(w).next;
      if (next) expect(neighbours(next).prev?.id).toBe(w.id);
    }
  });
});

describe("metaLine", () => {
  it("lässt fehlende Felder weg statt leere Trenner zu zeigen", () => {
    const ohneOrt = metaLine({ ...WORKS[0], place: undefined });
    expect(ohneOrt).not.toMatch(/·\s*·/);
    expect(ohneOrt.startsWith("·")).toBe(false);
    expect(ohneOrt.endsWith("·")).toBe(false);
  });
});

describe("Zusagen der Daten selbst", () => {
  it("Slugs sind eindeutig — sie werden URLs", () => {
    const slugs = allSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("jeder Slug lässt sich wieder auflösen", () => {
    for (const slug of allSlugs()) expect(bySlug(slug)?.id).toBe(slug);
  });

  it("ein unbekannter Slug liefert undefined statt zu werfen", () => {
    // Die Detailseite verlässt sich darauf und ruft dann notFound().
    expect(bySlug("gibt-es-nicht")).toBeUndefined();
  });

  it("jede Arbeit hat eine bekannte Kategorie", () => {
    const bekannt = new Set(CATEGORIES.map((c) => c.id));
    for (const w of WORKS) expect(bekannt.has(w.category)).toBe(true);
  });

  it("jede Arbeit trägt Auftraggeber, Titel, Jahr und Rolle", () => {
    // Credit-Pflicht aus dem Briefing: Ohne Rolle keine Arbeit auf der Seite.
    for (const w of WORKS) {
      expect(w.client.trim()).not.toBe("");
      expect(w.title.trim()).not.toBe("");
      expect(w.year.trim()).not.toBe("");
      expect(w.role.trim()).not.toBe("");
    }
  });

  it("jede Leistung verweist nur auf existierende Arbeiten", () => {
    // Die Zuordnung ist von Hand gepflegt — ein Tippfehler würde die
    // Arbeit auf der Leistungsseite stillschweigend verschwinden lassen.
    for (const s of SERVICES) {
      expect(forService(s.works)).toHaveLength(s.works.length);
    }
  });

  it("Leistungs-Slugs sind eindeutig", () => {
    const ids = SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
