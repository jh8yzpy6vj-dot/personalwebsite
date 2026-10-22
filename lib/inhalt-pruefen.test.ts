import { describe, expect, it } from "vitest";
import manifest from "./bilder-manifest.json";
import { INHALT, type Inhalt } from "./inhalt";
import { istHttps, nurFehler, pruefeInhalt, type Befund } from "./inhalt-pruefen";
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

  it("zählt im Hero nur sichtbare Bilder", () => {
    const i = kopie();
    i.foto.hero = i.foto.hero.slice(0, 6);
    expect(pruefeInhalt(i, BILDER).some((x) => /sechs bis acht/.test(x.text))).toBe(false);
    i.ausgeblendet.push(i.foto.hero[0]);
    i.papierkorb[i.foto.hero[1]] = "2026-10-17";
    const b = pruefeInhalt(i, BILDER);
    expect(nurFehler(b)).toEqual([]);
    expect(b.find((x) => /sechs bis acht/.test(x.text))?.text).toBe("hat 4 sichtbare Bilder — empfohlen sind sechs bis acht.");
  });

  it("verlangt mindestens ein sichtbares Hero-Bild — ein Bild, das noch verarbeitet wird, zählt", () => {
    const i = kopie();
    i.foto.hero = i.foto.hero.slice(0, 2);
    i.ausgeblendet.push(i.foto.hero[0]);
    i.papierkorb[i.foto.hero[1]] = "2026-10-17";
    expect(fehlerText(pruefeInhalt(i, BILDER))).toEqual(["Hero auf /foto: braucht mindestens ein sichtbares Bild."]);

    /* Steht das Bild noch nicht im Manifest (Upload läuft), ist das kein Fehler — sonst bräche der Build. */
    i.foto.hero.push("arbeiten/stamp/09");
    expect(nurFehler(pruefeInhalt(i, BILDER))).toEqual([]);
  });

  it("warnt, wenn das Hero ein ausgeblendetes oder gelöschtes Bild nennt — mit dem Bild als Schlüssel", () => {
    const i = kopie();
    const [a, b] = i.foto.hero;
    i.ausgeblendet.push(a);
    i.papierkorb[b] = "2026-10-17";
    const w = pruefeInhalt(i, BILDER).filter((x) => x.stufe === "warnung" && x.schluessel);
    expect(w).toContainEqual({
      stufe: "warnung",
      ort: "Hero auf /foto",
      text: "ist ausgeblendet — im Hero erscheint es nicht.",
      schluessel: a,
    });
    expect(w).toContainEqual({
      stufe: "warnung",
      ort: "Hero auf /foto",
      text: "liegt im Papierkorb — im Hero erscheint es nicht.",
      schluessel: b,
    });
  });

  it("warnt bei Bildern, die (noch) nicht im Manifest stehen, statt den Build zu brechen", () => {
    const i = kopie();
    i.foto.hero.push("arbeiten/stamp/09");
    const b = pruefeInhalt(i, BILDER);
    expect(nurFehler(b)).toEqual([]);
    expect(b.find((x) => /gibt es \(noch\) nicht/.test(x.text))).toMatchObject({
      ort: "Hero auf /foto",
      text: "gibt es (noch) nicht — wird es gerade verarbeitet?",
      schluessel: "arbeiten/stamp/09",
    });
  });

  it("warnt, wenn ein Platz der Startseite kein Foto aus /foto ist — der bliebe auf der Seite leer", () => {
    const i = kopie();
    i.startseite.highlights[0] = "ueber/01";
    i.startseite.wege.foto = "portrait";
    const b = pruefeInhalt(i, BILDER);
    expect(nurFehler(b)).toEqual([]);
    const w = b.filter((x) => x.stufe === "warnung").map((x) => `${x.ort}: ${x.schluessel} ${x.text}`);
    const leer = "ist kein Foto aus /foto — der Platz bleibt auf der Seite leer.";
    expect(w).toContain(`Startseite · Highlight 1: ueber/01 ${leer}`);
    expect(w).toContain(`Startseite · Bild zum Bereich Foto: portrait ${leer}`);
    expect(w.filter((t) => t.includes("kein Foto aus /foto"))).toHaveLength(2);
  });

  it("nennt die Plätze und Felder der Startseite wie im Reiter", () => {
    const i = kopie();
    const [a, b] = i.foto.hero;
    i.startseite.heroErsatz = a;
    i.startseite.wege.film = b;
    i.ausgeblendet.push(a);
    i.papierkorb[b] = "2026-10-17";
    i.seite.positioning = "";
    i.seite.name = " ";
    i.startseite.heroAlt = "x".repeat(500);
    i.startseite.heroVideo = "www.swr.de";
    const befunde = pruefeInhalt(i, BILDER);
    expect(befunde).toContainEqual({
      stufe: "warnung",
      ort: "Startseite · Großes Bild oben",
      text: "ist ausgeblendet — der Platz bleibt auf der Seite leer.",
      schluessel: a,
    });
    expect(befunde).toContainEqual({
      stufe: "warnung",
      ort: "Startseite · Bild zum Bereich Film",
      text: "liegt im Papierkorb — der Platz bleibt auf der Seite leer.",
      schluessel: b,
    });
    expect(fehlerText(befunde)).toEqual([
      "Startseite · Name: ist leer.",
      "Startseite · Zeile unter dem Namen: ist leer.",
      expect.stringMatching(/^Startseite · Video oben: muss leer sein/),
      "Startseite · Beschreibung des großen Bilds oben: ist länger als 400 Zeichen.",
    ]);
    /* Die alten Begriffe tauchen nirgends mehr auf. */
    const alles = befunde.map((x) => `${x.ort} ${x.text}`).join("\n");
    expect(alles).not.toMatch(/Ersatzbild|Weg „|Standbilds|Hero-Video|Zeile im Hero|^Seite ·/m);
  });

  it("nennt Arbeiten und Filme beim Titel, mit der Kennung als Bezug — nie die Kennung im Text", () => {
    const i = kopie();
    i.foto.arbeiten.push({ id: "kulturnacht-rastatt-2026", kategorie: i.foto.kategorien[0], titel: "Kulturnacht 2026" });
    const ohneBild = pruefeInhalt(i, BILDER).find((x) => x.kennung === "kulturnacht-rastatt-2026");
    expect(ohneBild).toEqual({
      stufe: "warnung",
      ort: "Arbeit „Kulturnacht 2026“",
      text: "hat (noch) kein Bild und erscheint nicht.",
      kennung: "kulturnacht-rastatt-2026",
    });

    /* Alle Bilder einer Arbeit verborgen: dieselbe Arbeit, beim Titel. */
    const a = i.foto.arbeiten[0];
    const eigene = BILDER.filter((s) => s === `arbeiten/${a.id}` || s.startsWith(`arbeiten/${a.id}/`));
    i.ausgeblendet.push(...eigene);
    const verborgen = pruefeInhalt(i, BILDER).find((x) => x.kennung === a.id && x.stufe === "warnung");
    expect(verborgen?.ort).toBe(`Arbeit „${a.titel}“`);
    expect(verborgen?.text).toBe("hat kein sichtbares Bild und erscheint nicht — alle sind ausgeblendet oder gelöscht.");

    /* Fehler in Feldern: Ort mit dem Feldnamen, dazu die Kennung — auch bei Filmen. */
    i.foto.arbeiten[1].kunde = "Muster GmbH";
    i.filme.push({ id: "neu", titel: "Neuer Film", kunde: "K", link: "http://example.org" });
    const f = nurFehler(pruefeInhalt(i, BILDER));
    expect(f.find((x) => x.ort.endsWith("· Kunde"))).toMatchObject({
      ort: `Arbeit „${i.foto.arbeiten[1].titel}“ · Kunde`,
      kennung: i.foto.arbeiten[1].id,
    });
    expect(f.find((x) => x.ort.endsWith("· Link"))).toMatchObject({ ort: "Film „Neuer Film“ · Link", kennung: "neu" });

    /* Ohne Titel hilft nur die Kennung. */
    i.foto.arbeiten[1].titel = "";
    expect(fehlerText(pruefeInhalt(i, BILDER))).toContain(`Arbeit „${i.foto.arbeiten[1].id}“ · Titel: ist leer.`);
  });

  it("nennt Absätze und Bildtexte wie in der Verwaltung", () => {
    const i = kopie();
    i.ueber.zeilen = ["a", "", "c", "d", "e"];
    const a = i.foto.arbeiten[0];
    a.alt = { ...a.alt, "01": "x".repeat(500) };
    const b = pruefeInhalt(i, BILDER);
    expect(fehlerText(b)).toContain("Über mich · Absatz 2: ist leer.");
    expect(fehlerText(b)).toContain(`Arbeit „${a.titel}“ · Bildbeschreibung „01“: ist länger als 400 Zeichen.`);
    expect(b).toContainEqual({ stufe: "warnung", ort: "Über mich · Text", text: "5 Absätze — gedacht sind drei bis vier." });
  });

  it("nennt in keiner Warnung mit Bild-Bezug den rohen Schlüssel und nirgends das UI-SPEC", () => {
    const i = kopie();
    i.ausgeblendet.push(...i.foto.hero.slice(0, 5));
    i.startseite.highlights = ["ueber/01", "portrait", i.foto.hero[0], "arbeiten/stamp/09"];
    i.foto.hero.push("arbeiten/stamp/09");
    const b = pruefeInhalt(i, BILDER);
    const mitBild = b.filter((x) => x.schluessel);
    expect(mitBild.length).toBeGreaterThan(6);
    for (const x of mitBild) {
      expect(x.stufe).toBe("warnung");
      expect(x.text).not.toContain(x.schluessel);
      expect(x.text).not.toMatch(/„/);
    }
    expect(b.map((x) => `${x.ort} ${x.text}`).join("\n")).not.toMatch(/UI-SPEC/);
  });

  it("zählt den Hinweis auf fehlende Beschreibungen auch für ein einziges Bild richtig", () => {
    const i = kopie();
    const h = (x: Inhalt) => pruefeInhalt(x, BILDER).find((y) => y.ort === "Bildbeschreibungen");
    expect(h(i)?.text).toMatch(/^\d+ sichtbare Bilder haben noch keine Beschreibung \(Alt-Text\)\.$/);
    expect(h(i)).toMatchObject({ stufe: "hinweis" });
    /* Alle Bilder ausblenden bis auf eins ohne Beschreibung. */
    const sichtbar = BILDER.filter((s) => s.startsWith("arbeiten/"));
    const ohne = sichtbar.find((s) => {
      const [, id, name = "leitbild"] = s.split("/");
      return !i.foto.arbeiten.find((a) => a.id === id)?.alt?.[name];
    }) as string;
    i.ausgeblendet = sichtbar.filter((s) => s !== ohne);
    i.foto.hero = [ohne];
    expect(h(i)?.text).toBe("Ein sichtbares Bild hat noch keine Beschreibung (Alt-Text).");
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
    expect(orte).toContain("Startseite · Video oben");
  });

  it("nimmt gewöhnliche Adressen an, auch ohne Schrägstrich am Ende", () => {
    const i = kopie();
    expect(i.ueber.instagram.url).toMatch(/^https:\/\//);
    i.ueber.swr.url = "https://www.swr.de";
    i.filme.push({ id: "f", titel: "F", kunde: "K", link: "https://www.ardmediathek.de/video/abc?t=12&x=%3C" });
    expect(fehlerText(pruefeInhalt(i, BILDER))).toEqual([]);
  });

  it("lehnt Adressen ab, die nirgendwohin oder woandershin führen", () => {
    for (const w of [
      "https://SWR",
      "https://@jakobsax",
      "https://Tagesthemen",
      "https://user@host.de",
      "https://:geheim@host.de",
      "https://@host.de",
      "https:host.de",
      "https:/host.de",
      "https://.de",
      "https://a..b",
      "https://host.de.",
      "https://",
    ]) {
      expect(istHttps(w), w).toBe(false);
      const i = kopie();
      i.ueber.swr.url = w;
      i.filme.push({ id: "f", titel: "F", kunde: "K", link: w });
      i.startseite.heroVideo = w;
      const orte = nurFehler(pruefeInhalt(i, BILDER)).map((x) => x.ort);
      expect(orte, w).toEqual(["Startseite · Video oben", "Über mich · SWR · Adresse", "Film „F“ · Link"]);
    }
  });

  it("nimmt jeden heute gespeicherten Link und übliche Filmlinks weiterhin an", () => {
    const heute = [INHALT.ueber.instagram.url, INHALT.ueber.swr.url, ...INHALT.filme.map((f) => f.link)];
    if (INHALT.startseite.heroVideo !== null) heute.push(INHALT.startseite.heroVideo);
    for (const w of [
      ...heute,
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://vimeo.com/123456789",
      "https://player.vimeo.com/video/123456789#t=10",
      "https://www.ardmediathek.de/video/tagesthemen/abc/Y3JpZDovL2Rhc2Vyc3RlLmRl",
      "https://www.zdf.de/dokumentation/x-100.html",
      "https://www.instagram.com/@jakobsax/",
      "https://www.x.de:8080/a?mail=a@b.de",
      "HTTPS://vimeo.com/1",
      "https://www.swr.de",
      "https://müller.de/x",
    ]) {
      expect(istHttps(w), w).toBe(true);
    }
  });

  it("alsJsonLd lässt kein </script> stehen und bleibt dasselbe JSON", () => {
    const daten = { u: BOESE, und: "a & b", pfeil: "->" };
    const text = alsJsonLd(daten);
    expect(text).not.toMatch(/[<>&]/);
    expect(text.toLowerCase()).not.toContain("</script");
    expect(JSON.parse(text)).toEqual(daten);
  });
});
