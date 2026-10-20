import { describe, expect, it } from "vitest";
import manifest from "./bilder-manifest.json";
import { INHALT, type Inhalt } from "./inhalt";
import { nurFehler, pruefeInhalt, type Befund } from "./inhalt-pruefen";
import { alsJsonLd } from "./site";

/**
 * Die Prüfung entscheidet, ob die Verwaltung speichern darf und ob der Build
 * durchläuft. Getestet wird beides: dass der eingecheckte Stand gültig ist,
 * und dass jede Regel wirklich greift.
 */

const BILDER = Object.keys(manifest);
const kopie = (): Inhalt => structuredClone(INHALT);
const fehlerText = (b: Befund[]) => nurFehler(b).map((f) => `${f.ort}: ${f.text}`);

describe("pruefeInhalt — der eingecheckte Stand", () => {
  it("hat keinen einzigen Fehler", () => {
    expect(fehlerText(pruefeInhalt(INHALT, BILDER))).toEqual([]);
  });
});

describe("pruefeInhalt — Regeln", () => {
  it("überlebt jede Form, ohne zu werfen", () => {
    for (const roh of [null, 1, "x", [], {}, { foto: 3 }, { foto: { arbeiten: [null] } }]) {
      expect(() => pruefeInhalt(roh, BILDER)).not.toThrow();
      expect(nurFehler(pruefeInhalt(roh, BILDER)).length).toBeGreaterThan(0);
    }
  });

  it("verbietet Rechtsformzusätze im Kunden (E10)", () => {
    const i = kopie();
    i.foto.arbeiten[1].kunde = "altonale GmbH";
    expect(fehlerText(pruefeInhalt(i, BILDER)).join()).toMatch(/Rechtsform/);
  });

  it("verbietet doppelte ids und unbekannte Kategorien", () => {
    const i = kopie();
    i.foto.arbeiten.push({ ...i.foto.arbeiten[0] });
    i.foto.arbeiten[2].kategorie = "gibtsnicht";
    const f = fehlerText(pruefeInhalt(i, BILDER)).join("\n");
    expect(f).toMatch(/zweimal/);
    expect(f).toMatch(/keine der Kategorien/);
  });

  it("verlangt https bei Filmen und Links", () => {
    const i = kopie();
    i.filme.push({ id: "f", titel: "F", kunde: "K", link: "http://example.org" });
    i.ueber.instagram.url = "javascript:alert(1)";
    const f = fehlerText(pruefeInhalt(i, BILDER)).join("\n");
    expect(f).toMatch(/Film „F“ · Link/);
    expect(f).toMatch(/Instagram · Adresse/);
  });

  it("lehnt Bildschlüssel ab, die aus dem Bucket-Baum ausbrechen", () => {
    const i = kopie();
    i.foto.reihenfolge.push("../geheim", "/absolut", "arbeiten/x y");
    expect(fehlerText(pruefeInhalt(i, BILDER)).filter((t) => /ungültigen Bildschlüssel/.test(t))).toHaveLength(3);
  });

  it("lehnt Schlüssel in der Reihenfolge ab, die zu keiner Arbeit gehören", () => {
    const i = kopie();
    i.foto.reihenfolge.push("ueber/01");
    expect(fehlerText(pruefeInhalt(i, BILDER)).join()).toMatch(/gehört zu keiner Arbeit/);
  });

  it("prüft Ausschnitte und Papierkorb-Daten", () => {
    const i = kopie();
    i.bildausschnitte["arbeiten/at-tension"] = "oben";
    i.papierkorb["arbeiten/stamp/01"] = "gestern";
    const f = fehlerText(pruefeInhalt(i, BILDER)).join("\n");
    expect(f).toMatch(/kein Ausschnitt/);
    expect(f).toMatch(/JJJJ-MM-TT/);
  });

  it("verlangt im Papierkorb ein echtes Datum, nicht nur die Form", () => {
    const i = kopie();
    i.papierkorb["arbeiten/stamp/01"] = "2026-99-99";
    i.papierkorb["arbeiten/stamp/02"] = "2026-02-30";
    i.papierkorb["arbeiten/stamp/03"] = "2028-02-29"; // Schaltjahr — gültig
    const f = fehlerText(pruefeInhalt(i, BILDER)).filter((t) => t.startsWith("Papierkorb"));
    expect(f).toEqual([
      "Papierkorb: „arbeiten/stamp/01“: „2026-99-99“ ist kein gültiges Datum.",
      "Papierkorb: „arbeiten/stamp/02“: „2026-02-30“ ist kein gültiges Datum.",
    ]);
  });

  it("verlangt genau vier Highlight-Plätze", () => {
    const i = kopie();
    i.startseite.highlights.pop();
    expect(fehlerText(pruefeInhalt(i, BILDER)).join()).toMatch(/genau vier/);
  });

  it("warnt nur, wenn das Hero weniger als sechs Bilder hat", () => {
    const i = kopie();
    i.foto.hero = i.foto.hero.slice(0, 3);
    const b = pruefeInhalt(i, BILDER);
    expect(nurFehler(b)).toEqual([]);
    expect(b.some((x) => x.stufe === "warnung" && /sechs bis acht/.test(x.text))).toBe(true);
  });

  it("warnt, wenn das Hero ein ausgeblendetes oder gelöschtes Bild nennt", () => {
    const i = kopie();
    i.ausgeblendet.push(i.foto.hero[0]);
    i.papierkorb[i.foto.hero[1]] = "2026-10-17";
    const w = pruefeInhalt(i, BILDER).filter((x) => x.stufe === "warnung").map((x) => x.text).join("\n");
    expect(w).toMatch(/ist ausgeblendet/);
    expect(w).toMatch(/liegt im Papierkorb/);
  });

  it("warnt bei Bildern, die (noch) nicht im Manifest stehen, statt den Build zu brechen", () => {
    const i = kopie();
    i.foto.hero.push("arbeiten/stamp/09");
    const b = pruefeInhalt(i, BILDER);
    expect(nurFehler(b)).toEqual([]);
    expect(b.some((x) => /gibt es \(noch\) nicht/.test(x.text))).toBe(true);
  });

  it("begrenzt die Länge von Texten", () => {
    const i = kopie();
    i.foto.arbeiten[0].titel = "x".repeat(500);
    expect(fehlerText(pruefeInhalt(i, BILDER)).join()).toMatch(/länger als/);
  });
});

/*
 * Die Links von „Über mich“ landen im JSON-LD jeder Seite. Zwei Sicherungen:
 * Die Prüfung lässt keine Adresse mit < > " ' durch, und `alsJsonLd`
 * maskiert trotzdem — falls doch einmal etwas an der Prüfung vorbeikommt.
 */
describe("Adressen im JSON-LD", () => {
  const BOESE = "https://www.instagram.com/x/</script><script>alert(document.domain)</script>";

  it("lehnt eine Adresse ab, die das Skript-Element beenden würde", () => {
    const i = kopie();
    i.ueber.instagram.url = BOESE;
    const f = nurFehler(pruefeInhalt(i, BILDER));
    expect(f.map((x) => x.ort)).toContain("Über mich · Instagram · Adresse");
  });

  it("lehnt Leerzeichen und Anführungszeichen ab — bei Links, Filmen und dem Hero-Video", () => {
    const i = kopie();
    i.ueber.swr.url = "https://www.swr.de/a b";
    i.filme.push({ id: "f", titel: "F", kunde: "K", link: 'https://example.org/"onmouseover' });
    i.startseite.heroVideo = "https://medien.example.org/film.mp4'";
    const orte = nurFehler(pruefeInhalt(i, BILDER)).map((x) => x.ort);
    expect(orte).toContain("Über mich · SWR · Adresse");
    expect(orte).toContain("Film „F“ · Link");
    expect(orte).toContain("Startseite · Hero-Video");
  });

  it("nimmt gewöhnliche Adressen an, auch ohne Schrägstrich am Ende", () => {
    const i = kopie();
    expect(i.ueber.instagram.url).toMatch(/^https:\/\//);
    i.ueber.swr.url = "https://www.swr.de";
    i.filme.push({ id: "f", titel: "F", kunde: "K", link: "https://www.ardmediathek.de/video/abc?t=12&x=%3C" });
    expect(fehlerText(pruefeInhalt(i, BILDER))).toEqual([]);
  });

  it("alsJsonLd lässt kein </script> stehen und bleibt dasselbe JSON", () => {
    const daten = { u: BOESE, und: "a & b", pfeil: "->" };
    const text = alsJsonLd(daten);
    expect(text).not.toMatch(/[<>&]/);
    expect(text.toLowerCase()).not.toContain("</script");
    expect(JSON.parse(text)).toEqual(daten);
  });
});
