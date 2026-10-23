import { describe, expect, it } from "vitest";
import manifest from "../bilder-manifest.json";
import type { Bildquelle } from "../bilder";
import { INHALT, istVerborgen, type Inhalt } from "../inhalt";
import { nurFehler, ORT_BESCHREIBUNGEN, pruefeInhalt, type Befund } from "../inhalt-pruefen";
import { filmeMitStandbild, fotosFuerHero, fotosFuerMosaik } from "../arbeiten";
import {
  aendereArbeit,
  aendereFilm,
  alleFotos,
  angekommen,
  ausgewertet,
  erwarteteBilder,
  letzterFehlschlag,
  nachDemEingang,
  ROT_RUNDEN,
  verarbeitungsanzeige,
  alleUeberBilder,
  ausschnittAus,
  ausserhalb,
  bildBezeichnung,
  bildtext,
  dateiTyp,
  deutschesDatum,
  eindeutigeId,
  enthaeltEmail,
  entferneArbeit,
  entferneFilm,
  ersetzeTeilfolge,
  fasseZusammen,
  gleich,
  gleicherCommit,
  grundGegenFilm,
  hatBilder,
  DOPPELKLICK_ABSTAND,
  DOPPELKLICK_ZEIT,
  istDoppelklick,
  istTextfeld,
  legeAb,
  legeInPapierkorb,
  LEERER_STAPEL,
  leseAusschnitt,
  mitHttps,
  mitPapierkorbDaten,
  naechsteZiele,
  neueArbeit,
  neuerFilm,
  ohneEmail,
  ordneArbeiten,
  ordneFilme,
  pruefeAltenStand,
  pruefeDatei,
  restTage,
  schrittVor,
  schrittZurueck,
  setzeAusschnitt,
  setzeBildtext,
  setzeFotoReihenfolge,
  setzeUeberBeschriftung,
  slug,
  stabil,
  STAPEL_MAX,
  stapelNachSpeichern,
  stelleWiederHer,
  tagAus,
  tastenbefehl,
  tippgruppen,
  umschalteAusgeblendet,
  umschalteHero,
  verschiebe,
  entferneZeile,
  groesse,
  neueZeile,
  platzhalter,
  setzeSeite,
  setzeStartbild,
  setzeStartText,
  setzeUeberFeld,
  setzeUeberLink,
  setzeZeile,
  startbild,
  waehlbareBilder,
  werteAus,
  aufDerStartseite,
  blaetterListe,
  blaettern,
  blaetterTaste,
  lesePlatz,
  mosaikVon,
  naechstesOhneBeschreibung,
  ohneBeschreibung,
  platzImMosaik,
  startplatzName,
  startplatzZuSehen,
  STARTPLAETZE,
  verschiebeAufPlatz,
  verwendung,
  feldFuerBefund,
  REITER,
  reiterFuerBefund,
  setzeAusgeblendet,
  wasDannFehlt,
  bilderDerArbeit,
  FELDNAMEN,
  nichtsZuSehen,
  startplatzZustand,
  zeigeziel,
  scrollSchritt,
} from "./werkzeuge";
import type { Lauf } from "./vertrag";

/**
 * Die Rechnungen der Verwaltung. Die Oberfläche ruft nur diese Funktionen
 * auf — was hier stimmt, stimmt dort.
 */

const BILDER = manifest as Record<string, Bildquelle>;
const kopie = (): Inhalt => structuredClone(INHALT);
const fehlerText = (b: Befund[]) => nurFehler(b).map((f) => `${f.ort}: ${f.text}`);
const k = (inhalt: Inhalt = kopie()) => ({ inhalt, bilder: BILDER });

describe("slug und eindeutigeId", () => {
  it("schreibt Umlaute aus und ersetzt Sonderzeichen", () => {
    expect(slug("Tödliches Gold")).toBe("toedliches-gold");
    expect(slug("Straße & Büro")).toBe("strasse-buero");
    expect(slug("tête-à-tête 2026")).toBe("tete-a-tete-2026");
    expect(slug("  --STRG_F!!  ")).toBe("strg-f");
    expect(slug("???")).toBe("");
  });

  it("kürzt auf 60 Zeichen ohne Bindestrich am Ende", () => {
    const s = slug(`${"a".repeat(59)} b`);
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });

  it("hängt -2, -3 an, bis die Kennung frei ist", () => {
    expect(eindeutigeId("STAMP", ["stamp"])).toBe("stamp-2");
    expect(eindeutigeId("STAMP", ["stamp", "stamp-2"])).toBe("stamp-3");
    expect(eindeutigeId("!!!", [], "film")).toBe("film");
    const lang = "x".repeat(60);
    const id = eindeutigeId(lang, [lang]);
    expect(id.length).toBeLessThanOrEqual(60);
    expect(id.endsWith("-2")).toBe(true);
  });
});

describe("naechsteZiele", () => {
  it("nimmt zuerst das Startbild, dann die Nummern", () => {
    expect(naechsteZiele({ arbeit: "neu" }, 3, [])).toEqual({ ok: true, ziele: ["arbeiten/neu", "arbeiten/neu/01", "arbeiten/neu/02"] });
  });

  it("zählt nach der höchsten belegten Nummer weiter, nicht in Lücken", () => {
    const belegt = ["arbeiten/x", "arbeiten/x/01", "arbeiten/x/04", "arbeiten/xy/09", "arbeiten/x/05/zu-tief"];
    expect(naechsteZiele({ arbeit: "x" }, 2, belegt)).toEqual({ ok: true, ziele: ["arbeiten/x/05", "arbeiten/x/06"] });
  });

  it("zählt bei Über mich ab 01 und ohne Startbild", () => {
    expect(naechsteZiele("ueber", 1, [])).toEqual({ ok: true, ziele: ["ueber/01"] });
    expect(naechsteZiele("ueber", 1, ["ueber/01", "ueber/02"])).toEqual({ ok: true, ziele: ["ueber/03"] });
  });

  it("verweigert mehr als 99", () => {
    const r = naechsteZiele({ arbeit: "x" }, 2, ["arbeiten/x", "arbeiten/x/98"]);
    expect(r.ok).toBe(false);
  });
});

describe("Dateien", () => {
  it("erkennt den Typ, notfalls an der Endung", () => {
    expect(dateiTyp({ name: "a.jpg", type: "image/jpeg" })).toBe("image/jpeg");
    expect(dateiTyp({ name: "a.TIFF", type: "" })).toBe("image/tiff");
    expect(dateiTyp({ name: "a.heic", type: "image/heic" })).toBeNull();
    expect(dateiTyp({ name: "a.gif", type: "image/gif" })).toBeNull();
  });

  it("prüft Größe und Typ vor dem Hochladen", () => {
    expect(pruefeDatei({ name: "a.jpg", type: "image/jpeg", size: 1000 })).toEqual({ ok: true, typ: "image/jpeg" });
    expect(pruefeDatei({ name: "a.jpg", type: "image/jpeg", size: 41 * 1024 * 1024 }).ok).toBe(false);
    const heic = pruefeDatei({ name: "IMG_1.HEIC", type: "image/heic", size: 1000 });
    expect(heic.ok === false && heic.text).toContain("JPEG");
  });
});

describe("Reihenfolgen", () => {
  it("verschiebt ein Element", () => {
    expect(verschiebe(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(verschiebe(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(verschiebe(["a", "b"], 1, 9)).toEqual(["a", "b"]);
  });

  it("scrollt beim Ziehen an den Leisten mit, nicht erst am Fensterrand", () => {
    /* 1280×800 nach einer Änderung: Reiterleiste bis 61, Speicherleiste ab 715. */
    const [oben, unten, rand] = [61, 715, 72];
    expect(scrollSchritt(400, oben, unten, rand)).toBe(0);
    expect(scrollSchritt(oben + rand, oben, unten, rand)).toBe(0);
    expect(scrollSchritt(unten - rand, oben, unten, rand)).toBe(0);
    /* Knapp über der Speicherleiste — bisher tot, weil die Zone erst bei 800 - 72 = 728 begann. */
    expect(scrollSchritt(705, oben, unten, rand)).toBe(Math.ceil((705 - (unten - rand)) / 4));
    expect(scrollSchritt(705, oben, unten, rand)).toBeGreaterThan(0);
    expect(scrollSchritt(80, oben, unten, rand)).toBeLessThan(0);
    /* Je näher, desto schneller — auf der Leiste und darüber hinaus höchstens rand / 4. */
    expect(scrollSchritt(700, oben, unten, rand)).toBeGreaterThan(scrollSchritt(660, oben, unten, rand));
    expect(scrollSchritt(unten, oben, unten, rand)).toBe(rand / 4);
    expect(scrollSchritt(790, oben, unten, rand)).toBe(rand / 4);
    expect(scrollSchritt(oben, oben, unten, rand)).toBe(-rand / 4);
    expect(scrollSchritt(10, oben, unten, rand)).toBe(-rand / 4);
    /* Ohne Leisten: der Fensterrand, wie früher. */
    expect(scrollSchritt(10, 0, 800, rand)).toBe(-Math.ceil((rand - 10) / 4));
    expect(scrollSchritt(790, 0, 800, rand)).toBe(Math.ceil((790 - 728) / 4));
  });

  it("lässt bei einer Teilfolge die anderen Plätze stehen", () => {
    /* „x" liegt im Papierkorb und wird nicht angezeigt — sein Platz bleibt. */
    expect(ersetzeTeilfolge(["a", "x", "b", "c"], ["c", "a", "b"])).toEqual(["c", "x", "a", "b"]);
    expect(ersetzeTeilfolge(["a", "b"], ["b", "a", "neu"])).toEqual(["b", "a", "neu"]);
  });

  it("listet alle Fotos — auch ausgeblendete und gelöschte — wie das Mosaik", () => {
    const i = kopie();
    const alle = alleFotos(k(i)).map((b) => b.schluessel);
    const mosaik = fotosFuerMosaik(k(i)).map((b) => b.schluessel);
    /* Dieselbe Reihenfolge, nur ohne Filter. */
    expect(alle.filter((s) => mosaik.includes(s))).toEqual(mosaik);
    const erstes = mosaik[0];
    const versteckt = umschalteAusgeblendet(i, erstes);
    expect(alleFotos(k(versteckt)).map((b) => b.schluessel)).toContain(erstes);
    expect(fotosFuerMosaik(k(versteckt)).map((b) => b.schluessel)).not.toContain(erstes);
  });

  it("schreibt beim Sortieren die vollständige Liste und behält Plätze gelöschter Bilder", () => {
    const i = kopie();
    const gesamt = alleFotos(k(i)).map((b) => b.schluessel);
    const geloescht = gesamt[1];
    const mitPapierkorb = legeInPapierkorb(i, geloescht, "2026-10-17");
    const sichtbar = gesamt.filter((s) => s !== geloescht);
    const neu = verschiebe(sichtbar, 0, sichtbar.length - 1);
    const ergebnis = setzeFotoReihenfolge(mitPapierkorb, gesamt, neu);
    expect(ergebnis.foto.reihenfolge).toHaveLength(gesamt.length);
    expect(ergebnis.foto.reihenfolge[1]).toBe(geloescht);
    expect(ergebnis.foto.reihenfolge.at(-1)).toBe(gesamt[0]);
    expect(nurFehler(pruefeInhalt(ergebnis, Object.keys(BILDER)))).toEqual([]);
  });

  it("ordnet Über-mich-Bilder nach ueber.reihenfolge", () => {
    const q = BILDER["ueber/01"];
    const bilder = { "ueber/01": q, "ueber/02": q, "ueber/03": q, "ueber/x/01": q, portrait: q };
    const i = kopie();
    i.ueber.reihenfolge = ["ueber/03"];
    expect(alleUeberBilder({ inhalt: i, bilder }).map((b) => b.schluessel)).toEqual(["ueber/03", "ueber/01", "ueber/02"]);
  });
});

describe("Änderungen am Inhalt", () => {
  it("verändert nie das Original", () => {
    const i = kopie();
    const vorher = stabil(i);
    umschalteAusgeblendet(i, "arbeiten/stamp");
    umschalteHero(i, "arbeiten/stamp");
    legeInPapierkorb(i, "arbeiten/stamp", "2026-10-17");
    setzeAusschnitt(i, "arbeiten/stamp", "10% 20%");
    setzeBildtext(i, "arbeiten/stamp/01", "alt", "x");
    entferneArbeit(i, "stamp");
    expect(stabil(i)).toBe(vorher);
  });

  it("blendet viele Bilder auf einmal aus und ein — ohne Dubletten, Gelöschtes bleibt, wie es ist", () => {
    const i = kopie();
    const eigene = Object.keys(BILDER).filter((s) => s === "arbeiten/stamp" || s.startsWith("arbeiten/stamp/"));
    expect(eigene.length).toBeGreaterThan(3);
    const [schon, geloescht, ...rest] = eigene;
    i.ausgeblendet = [...i.ausgeblendet, schon];
    i.papierkorb[geloescht] = "2026-10-20";
    const vorher = stabil(i);

    const aus = setzeAusgeblendet(i, eigene, true);
    expect(stabil(i)).toBe(vorher);
    /* Was schon da war, bleibt vorn und einmal; das Gelöschte kommt nicht dazu. */
    expect(aus.ausgeblendet).toEqual([...i.ausgeblendet, ...rest]);
    expect(aus.ausgeblendet.filter((s) => s === schon)).toHaveLength(1);
    expect(aus.ausgeblendet).not.toContain(geloescht);
    expect(eigene.filter((s) => !istVerborgen(aus, s))).toEqual([]);
    /* Noch einmal: nichts doppelt. */
    expect(setzeAusgeblendet(aus, eigene, true).ausgeblendet).toEqual(aus.ausgeblendet);

    /* Einblenden nimmt nur diese heraus — fremde Ausgeblendete bleiben. */
    const fremd = i.ausgeblendet.filter((s) => !eigene.includes(s));
    const ein = setzeAusgeblendet(aus, eigene, false);
    expect(ein.ausgeblendet).toEqual(fremd);
    /* Ein gelöschtes, zugleich ausgeblendetes Bild bleibt beim Einblenden ausgeblendet. */
    const beides = setzeAusgeblendet({ ...aus, ausgeblendet: [...aus.ausgeblendet, geloescht] }, eigene, false);
    expect(beides.ausgeblendet).toEqual([...fremd, geloescht]);
    /* Hin und zurück: derselbe Inhalt bis auf die Reihenfolge der Liste. */
    expect(gleich(setzeAusgeblendet(setzeAusgeblendet(i, rest, true), rest, false), i)).toBe(true);
  });

  it("sagt, was beim Ausblenden anderswo fehlt", () => {
    const i = kopie();
    const reihe = alleFotos(k(i)).map((x) => x.schluessel);
    const [a, b, c] = reihe;
    i.foto.hero = [a, b, reihe[5]];
    i.startseite.heroErsatz = null;
    i.startseite.wege = { foto: null, film: null };
    i.startseite.highlights = [c, null, null, null];
    expect(wasDannFehlt(k(i), [a, b, c])).toBe("2 davon im Hero, 1 auf der Startseite — dort fehlen sie dann.");
    expect(wasDannFehlt(k(i), [a])).toBe("1 davon im Hero — dort fehlt es dann.");
    expect(wasDannFehlt(k(i), [c])).toBe("1 davon auf der Startseite — dort fehlt es dann.");
    expect(wasDannFehlt(k(i), [a, c])).toBe("1 davon im Hero, 1 auf der Startseite — dort fehlen sie dann.");
    expect(wasDannFehlt(k(i), [reihe[6], reihe[7]])).toBeNull();
    expect(wasDannFehlt(k(i), [])).toBeNull();
    /* Ein Rückfall, den die Seite zurzeit nicht zeigt, fehlt dort auch nicht. */
    const d = reihe[6];
    i.startseite.wege.film = d;
    expect(wasDannFehlt(k(i), [d])).toBe("1 davon auf der Startseite — dort fehlt es dann.");
    const mitStandbild = { inhalt: i, bilder: { ...BILDER, [`film/${i.filme[0].id}`]: BILDER[a] } };
    expect(wasDannFehlt(mitStandbild, [d])).toBeNull();
  });

  it("schaltet Ausblenden und Hero hin und zurück", () => {
    const i = kopie();
    const s = "arbeiten/stamp/02";
    expect(umschalteAusgeblendet(umschalteAusgeblendet(i, s), s).ausgeblendet).toEqual(i.ausgeblendet);
    expect(umschalteHero(i, s).foto.hero.at(-1)).toBe(s);
    expect(umschalteHero(umschalteHero(i, s), s).foto.hero).toEqual(i.foto.hero);
  });

  it("legt in den Papierkorb und stellt genau den alten Stand wieder her — auch im Hero", () => {
    const i = kopie();
    const s = i.foto.hero[2];
    const weg = legeInPapierkorb(i, s, "2026-10-17");
    expect(weg.papierkorb[s]).toBe("2026-10-17");
    /* Der Platz im Hero bleibt, auf der Seite fehlt das Bild trotzdem. */
    expect(weg.foto.hero).toEqual(i.foto.hero);
    expect(fotosFuerHero(k(weg)).map((b) => b.schluessel)).not.toContain(s);
    const zurueck = stelleWiederHer(weg, s);
    expect(gleich(zurueck, i)).toBe(true);
    expect(fotosFuerHero(k(zurueck)).map((b) => b.schluessel)[2]).toBe(s);
  });

  it("setzt Ausschnitte; mittig entfernt den Eintrag", () => {
    const i = kopie();
    const mit = setzeAusschnitt(i, "arbeiten/stamp", "30% 70%");
    expect(mit.bildausschnitte["arbeiten/stamp"]).toBe("30% 70%");
    expect(setzeAusschnitt(mit, "arbeiten/stamp", "50% 50%").bildausschnitte["arbeiten/stamp"]).toBeUndefined();
    expect(ausschnittAus(0.333, 1.2)).toBe("33% 100%");
    expect(leseAusschnitt("30% 70%")).toEqual({ x: 30, y: 70 });
    expect(leseAusschnitt(undefined)).toEqual({ x: 50, y: 50 });
  });

  it("setzt Bildtitel und Alt-Text über den Bildnamen", () => {
    const i = kopie();
    const mit = setzeBildtext(i, "arbeiten/stamp", "alt", "Eine Szene");
    expect(mit.foto.arbeiten.find((a) => a.id === "stamp")?.alt).toEqual({ leitbild: "Eine Szene" });
    expect(bildtext(mit, "arbeiten/stamp", "alt")).toBe("Eine Szene");
    const ohne = setzeBildtext(mit, "arbeiten/stamp", "alt", "");
    expect(ohne.foto.arbeiten.find((a) => a.id === "stamp")?.alt).toBeUndefined();
    expect(setzeBildtext(i, "arbeiten/stamp/02", "bildtitel", "Cie. X").foto.arbeiten.find((a) => a.id === "stamp")?.bildtitel).toEqual({ "02": "Cie. X" });
  });

  it("legt Arbeiten an, ändert, ordnet und entfernt sie samt aller Bezüge", () => {
    const i = kopie();
    const { inhalt, id } = neueArbeit(i, "STAMP", i.foto.kategorien[0]);
    expect(id).toBe("stamp-2");
    expect(inhalt.foto.arbeiten.at(-1)).toEqual({ id: "stamp-2", kategorie: i.foto.kategorien[0], titel: "STAMP" });
    const geaendert = aendereArbeit(inhalt, id, { kunde: "", notiz: "" });
    expect(geaendert.foto.arbeiten.at(-1)).not.toHaveProperty("kunde");
    const geordnet = ordneArbeiten(geaendert, [id]);
    expect(geordnet.foto.arbeiten[0].id).toBe(id);
    expect(geordnet.foto.arbeiten).toHaveLength(inhalt.foto.arbeiten.length);

    const s = "arbeiten/stamp/01";
    let mitBezug = umschalteHero(i, s);
    mitBezug = umschalteAusgeblendet(mitBezug, s);
    mitBezug.startseite.highlights[0] = s;
    const ohne = entferneArbeit(mitBezug, "stamp");
    expect(ohne.foto.arbeiten.some((a) => a.id === "stamp")).toBe(false);
    expect(stabil(ohne)).not.toContain('"arbeiten/stamp');
    expect(ohne.startseite.highlights[0]).toBeNull();
  });

  it("weiß, ob eine Arbeit noch Bilder hat", () => {
    expect(hatBilder("stamp", Object.keys(BILDER))).toBe(true);
    expect(hatBilder("gibt-es-nicht", Object.keys(BILDER))).toBe(false);
    expect(hatBilder("neu", ["arbeiten/neu/01"])).toBe(true);
  });

  it("legt Filme gleich mit Kunde und Link an — ohne Fehler, die das Speichern sperren", () => {
    const i = kopie();
    const { inhalt, id } = neuerFilm(i, " Ein Film ", [], { kunde: " SWR ", link: "youtu.be/abc123" });
    expect(inhalt.filme.at(-1)).toEqual({ id, titel: "Ein Film", kunde: "SWR", link: "https://youtu.be/abc123" });
    expect(nurFehler(pruefeInhalt(inhalt, Object.keys(BILDER)))).toEqual([]);
  });

  it("ergänzt ein fehlendes https:// und lässt alles andere stehen", () => {
    expect(mitHttps("youtu.be/abc")).toBe("https://youtu.be/abc");
    expect(mitHttps("www.ardmediathek.de/x")).toBe("https://www.ardmediathek.de/x");
    expect(mitHttps("  //vimeo.com/1 ")).toBe("https://vimeo.com/1");
    expect(mitHttps("www.x.de:8080/a")).toBe("https://www.x.de:8080/a");
    expect(mitHttps("https://vimeo.com/1")).toBe("https://vimeo.com/1");
    expect(mitHttps(" HTTPS://vimeo.com/1")).toBe("HTTPS://vimeo.com/1");
    /* Ein anderes Schema bleibt — dass es nicht taugt, sagt die Prüfung. */
    expect(mitHttps("http://example.org")).toBe("http://example.org");
    expect(mitHttps("javascript:alert(1)")).toBe("javascript:alert(1)");
    expect(mitHttps("")).toBe("");
    expect(mitHttps("   ")).toBe("");
  });

  it("ergänzt https:// nur vor einem Host mit Punkt — sonst bleibt der Text, und die Prüfung meldet ihn", () => {
    /* Vorher wurde daraus „https://@jakobsax", „https://SWR" … — gültig, aber tote Links. */
    for (const w of ["@jakobsax", "SWR", "Tagesthemen", "Tagesthemen 20.10.", "@jakobsax.media", "///vimeo.com/1"]) {
      expect(mitHttps(w), w).toBe(w);
      const i = kopie();
      i.ueber.instagram.url = mitHttps(w);
      expect(fehlerText(pruefeInhalt(i, Object.keys(BILDER))), w).toEqual([
        "Über mich · Instagram · Adresse: muss eine vollständige https://-Adresse sein, ohne Leerzeichen und ohne Zeichen wie < > \" '.",
      ]);
    }
    expect(mitHttps(" @jakobsax ")).toBe("@jakobsax");
    /* Was nach Adresse aussieht, wird ergänzt und ist dann gültig. */
    for (const w of ["youtu.be/abc", "www.instagram.com/jakobsax.media/", "instagram.com/@jakobsax", "vimeo.com/1?t=3#x"]) {
      const i = kopie();
      i.ueber.instagram.url = mitHttps(w);
      expect(i.ueber.instagram.url, w).toBe(`https://${w}`);
      expect(fehlerText(pruefeInhalt(i, Object.keys(BILDER))), w).toEqual([]);
    }
  });

  it("sperrt „Film anlegen“ genau dann, wenn der Film ein Fehler wäre — und sagt, warum", () => {
    const fall = (titel: string, kunde: string, eingabe: string) => {
      const link = mitHttps(eingabe);
      const { inhalt } = neuerFilm(kopie(), titel, [], { kunde, link });
      return { grund: grundGegenFilm(titel, kunde, link), fehler: fehlerText(pruefeInhalt(inhalt, Object.keys(BILDER))) };
    };
    expect(fall("Probe", "Muster GmbH", "youtu.be/x").grund).toBe("Kunde ohne Rechtsform schreiben (GmbH, e.V. …).");
    expect(fall("Probe", "Verein e.V.", "youtu.be/x").grund).toBe("Kunde ohne Rechtsform schreiben (GmbH, e.V. …).");
    expect(fall("Probe", "SWR", "http://youtu.be/x").grund).toBe("Der Link muss mit https:// beginnen.");
    expect(fall("Probe", "SWR", "Tagesthemen").grund).toBe("Der Link muss mit https:// beginnen.");
    expect(fall("Probe", "SWR", "@jakobsax").grund).toBe("Der Link muss mit https:// beginnen.");
    expect(fall("Probe", "SWR", "https://SWR").grund).toMatch(/^Der Link ist keine vollständige Adresse/);
    expect(fall("Probe", "SWR", "https://user@host.de/x").grund).toMatch(/^Der Link ist keine vollständige Adresse/);
    expect(fall("Probe", "SWR", "https://youtu.be/a b").grund).toMatch(/^Der Link ist keine vollständige Adresse/);
    expect(fall(" ", "SWR", "youtu.be/x").grund).toMatch(/^Titel, Kunde und Link braucht jeder Film/);
    expect(fall("Probe", "", "youtu.be/x").grund).toMatch(/^Titel, Kunde und Link braucht jeder Film/);
    expect(fall("Probe", "SWR", "  ").grund).toMatch(/^Titel, Kunde und Link braucht jeder Film/);
    expect(fall("Probe", "SWR/ARD", "youtu.be/x").grund).toBeNull();
    /* Gegenprobe mit der Inhaltsprüfung: frei genau dann, wenn kein Fehler entstünde. */
    for (const [titel, kunde, link] of [
      ["Probe", "Muster GmbH", "youtu.be/x"],
      ["Probe", "Muster gGmbH", "youtu.be/x"],
      ["Probe", "Muster UG", "youtu.be/x"],
      ["Probe", "SWR", "https://SWR"],
      ["Probe", "SWR", "https://@host.de"],
      ["Probe", "SWR", "https:host.de"],
      ["Probe", "SWR", "javascript:alert(1)"],
      ["Probe", "SWR", "https://x.de/\"<"],
      ["Probe", "", "youtu.be/x"],
      ["Probe", "SWR", "youtu.be/x"],
      ["Probe", "Bayerischer Kanuverband", "www.ardmediathek.de/video/abc?t=12"],
      ["Probe", "SWR", "//vimeo.com/1"],
    ]) {
      const { grund, fehler } = fall(titel, kunde, link);
      expect(grund === null, `${kunde} ${link}`).toBe(fehler.length === 0);
    }
  });

  it("legt Filme an, ändert, ordnet und entfernt sie", () => {
    const i = kopie();
    const { inhalt, id } = neuerFilm(i, "Ein Film");
    expect(id).toBe("ein-film");
    const geaendert = aendereFilm(inhalt, id, { kunde: "SWR", link: "https://example.org", notiz: "" });
    expect(geaendert.filme.at(-1)).toEqual({ id, titel: "Ein Film", kunde: "SWR", link: "https://example.org" });
    expect(ordneFilme(geaendert, [id]).filme[0].id).toBe(id);
    const mitAusschnitt = setzeAusschnitt(geaendert, `film/${id}`, "10% 10%");
    const weg = entferneFilm(mitAusschnitt, id);
    expect(weg.filme.some((f) => f.id === id)).toBe(false);
    expect(weg.bildausschnitte[`film/${id}`]).toBeUndefined();
  });

  it("setzt Beschriftungen auf /ueber; leer entfernt", () => {
    const i = kopie();
    expect(setzeUeberBeschriftung(i, "ueber/01", "Probe").ueber.bilder["ueber/01"]).toBe("Probe");
    expect(setzeUeberBeschriftung(i, "ueber/01", "").ueber.bilder["ueber/01"]).toBeUndefined();
  });
});

describe("Vergleich", () => {
  it("ignoriert die Reihenfolge der Schlüssel in Objekten, nicht in Listen", () => {
    expect(gleich({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(gleich([1, 2], [2, 1])).toBe(false);
  });
});

describe("Datum", () => {
  it("rechnet die Resttage im Papierkorb", () => {
    expect(restTage("2026-10-17", "2026-10-17")).toBe(30);
    expect(restTage("2026-10-01", "2026-10-17")).toBe(14);
    expect(restTage("2026-08-01", "2026-10-17")).toBe(0);
    expect(tagAus(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(deutschesDatum("2026-10-17")).toBe("17.10.2026");
  });
});

describe("Speichern", () => {
  it("vergleicht Commits auch gekürzt", () => {
    const voll = "0123456789abcdef0123456789abcdef01234567";
    expect(gleicherCommit(voll, voll)).toBe(true);
    expect(gleicherCommit(voll, "0123456")).toBe(true);
    expect(gleicherCommit(voll, "fffffff")).toBe(false);
    expect(gleicherCommit(null, voll)).toBe(false);
    expect(gleicherCommit("", "")).toBe(false);
  });

  it("entfernt E-Mail-Adressen aus Nachrichten", () => {
    expect(enthaeltEmail("schreib an jakob@example.de")).toBe(true);
    expect(enthaeltEmail("Mosaik umsortiert")).toBe(false);
    expect(ohneEmail("Kontakt jakob@example.de geändert")).toBe("Kontakt [E-Mail] geändert");
  });

  it("fasst Änderungen kurz zusammen — ohne Werte", () => {
    const alt = kopie();
    expect(fasseZusammen(alt, kopie())).toBe("Inhalte bearbeitet");

    let neu = umschalteAusgeblendet(alt, "arbeiten/stamp/01");
    neu = umschalteAusgeblendet(neu, "arbeiten/stamp/02");
    neu = setzeFotoReihenfolge(neu, alleFotos(k(neu)).map((b) => b.schluessel), verschiebe(alleFotos(k(neu)).map((b) => b.schluessel), 0, 3));
    expect(fasseZusammen(alt, neu)).toBe("Mosaik umsortiert, 2 Bilder ausgeblendet");

    const mail = structuredClone(alt);
    mail.ueber.email = "neu@example.de";
    const text = fasseZusammen(alt, mail);
    expect(text).toBe("Über mich");
    expect(text).not.toContain("@");

    const { inhalt } = neueArbeit(alt, "Neue Strecke", alt.foto.kategorien[0]);
    expect(fasseZusammen(alt, inhalt)).toBe("Neue Arbeit „Neue Strecke“");
  });

  it("übernimmt die Papierkorb-Daten des Servers nur für Schlüssel, die noch im Papierkorb liegen", () => {
    const gesendet = legeInPapierkorb(kopie(), "arbeiten/stamp/01", "2000-01-01");
    // Während des Speicherns noch eins gelöscht — das bleibt beim Datum des Browsers.
    const jetzt = legeInPapierkorb(gesendet, "arbeiten/stamp/02", "2026-10-18");
    const neu = mitPapierkorbDaten(jetzt, { "arbeiten/stamp/01": "2026-10-18" });
    expect(neu.papierkorb).toEqual({ "arbeiten/stamp/01": "2026-10-18", "arbeiten/stamp/02": "2026-10-18" });
    expect(jetzt.papierkorb["arbeiten/stamp/01"]).toBe("2000-01-01"); // Kopie, nichts verändert

    // Inzwischen wiederhergestellt: kommt nicht zurück.
    const zurueck = stelleWiederHer(gesendet, "arbeiten/stamp/01");
    expect(mitPapierkorbDaten(zurueck, { "arbeiten/stamp/01": "2026-10-18" })).toBe(zurueck);
  });
});

describe("Alter Stand im Verlauf", () => {
  it("derselbe Stand wie jetzt", () => {
    expect(pruefeAltenStand(kopie(), kopie(), Object.keys(BILDER))).toEqual({ art: "gleich" });
  });

  it("ein anderes Löschdatum allein ändert nichts — das Datum von jetzt bleibt", () => {
    // Am 01.09. gelöscht, zurückgeholt, am 10.09. wieder gelöscht: Der Stand vom 05.09. ist derselbe.
    const jetzt = legeInPapierkorb(kopie(), "arbeiten/stamp/02", "2026-09-10");
    const alt = legeInPapierkorb(kopie(), "arbeiten/stamp/02", "2026-09-01");
    expect(pruefeAltenStand(jetzt, alt, Object.keys(BILDER))).toEqual({ art: "gleich" });
  });

  it("sagt, was Wiederherstellen ändert, und zählt, was zurück in den Papierkorb kommt", () => {
    const jetzt = kopie();
    let alt = umschalteAusgeblendet(jetzt, "arbeiten/stamp/01");
    alt = legeInPapierkorb(alt, "arbeiten/stamp/02", "2026-09-01");
    alt = legeInPapierkorb(alt, "arbeiten/stamp/03", "2026-09-01");
    expect(pruefeAltenStand(jetzt, alt, Object.keys(BILDER))).toEqual({
      art: "aendert",
      text: "1 Bild ausgeblendet, 2 Bilder gelöscht",
      papierkorb: 2,
    });
  });

  it("ein Stand, dem ein heute verlangtes Feld fehlt, ist unpassend — ohne dass der Vergleich wirft", () => {
    const alt: Record<string, unknown> = structuredClone(INHALT);
    delete alt.bildausschnitte;
    delete alt.papierkorb;
    const ergebnis = pruefeAltenStand(kopie(), alt, Object.keys(BILDER));
    expect(ergebnis.art).toBe("unpassend");
    expect(ergebnis.art === "unpassend" && ergebnis.fehler.map((f) => f.ort)).toEqual(["Papierkorb", "Bildausschnitte"]);
    expect(pruefeAltenStand(kopie(), "kaputt", []).art).toBe("unpassend");
  });
});

describe("Rückgängig", () => {
  /* Drei Stände hintereinander: A → B → C. */
  const a = kopie();
  const b = setzeSeite(a, "name", "B");
  const c = setzeSeite(b, "name", "C");

  it("legt den alten Stand ab — aber nicht, wenn sich nichts ändert", () => {
    const st = legeAb(LEERER_STAPEL, a, b, null);
    expect(st.rueck).toEqual([a]);
    expect(legeAb(st, b, structuredClone(b), null)).toBe(st);
    expect(LEERER_STAPEL.rueck).toEqual([]); // der leere Stapel bleibt leer
  });

  it("geht zurück und wieder vor — Schritt für Schritt", () => {
    const st = legeAb(legeAb(LEERER_STAPEL, a, b, null), b, c, null);
    const z1 = schrittZurueck(st, c)!;
    expect(z1.inhalt).toBe(b);
    const z2 = schrittZurueck(z1.stapel, z1.inhalt)!;
    expect(z2.inhalt).toBe(a);
    expect(schrittZurueck(z2.stapel, z2.inhalt)).toBeNull();
    const v1 = schrittVor(z2.stapel, z2.inhalt)!;
    expect(v1.inhalt).toBe(b);
    const v2 = schrittVor(v1.stapel, v1.inhalt)!;
    expect(v2.inhalt).toBe(c);
    expect(schrittVor(v2.stapel, v2.inhalt)).toBeNull();
    // Und wieder zurück: Wiederholen hat den Stapel richtig aufgebaut.
    expect(schrittZurueck(v2.stapel, v2.inhalt)!.inhalt).toBe(b);
  });

  it("eine neue Änderung nach Rückgängig verwirft das Wiederholen", () => {
    const st = legeAb(legeAb(LEERER_STAPEL, a, b, null), b, c, null);
    const z = schrittZurueck(st, c)!;
    expect(z.stapel.vor).toEqual([c]);
    const d = setzeSeite(b, "positioning", "D");
    const neu = legeAb(z.stapel, b, d, null);
    expect(neu.vor).toEqual([]);
    expect(schrittVor(neu, d)).toBeNull();
    expect(neu.rueck).toEqual([a, b]);
  });

  it("fasst Tippen in einem Feld zu einem Schritt zusammen", () => {
    // Jeder Buchstabe eine Änderung, alle aus demselben Besuch des Felds (Gruppe 7).
    let st = LEERER_STAPEL;
    let jetzt = a;
    for (const text of ["N", "Ne", "Neu"]) {
      const neu = setzeSeite(jetzt, "name", text);
      st = legeAb(st, jetzt, neu, 7);
      jetzt = neu;
    }
    expect(st.rueck).toEqual([a]);
    expect(schrittZurueck(st, jetzt)!.inhalt).toBe(a);
    // Ein neuer Besuch des Felds (Gruppe 8) ist ein neuer Schritt.
    const weiter = setzeSeite(jetzt, "name", "Neu!");
    expect(legeAb(st, jetzt, weiter, 8).rueck).toHaveLength(2);
    // Ein Klick dazwischen (ohne Gruppe) auch — und danach gehört Tippen nicht mehr dazu.
    const klick = legeAb(st, jetzt, umschalteHero(jetzt, "arbeiten/stamp/02"), null);
    expect(klick.rueck).toHaveLength(2);
    expect(legeAb(klick, jetzt, weiter, 7).rueck).toHaveLength(3);
  });

  it("die erste Änderung einer Gruppe legt immer ab — auch auf einen leeren Stapel", () => {
    expect(legeAb(LEERER_STAPEL, a, b, 3)).toEqual({ rueck: [a], vor: [], gruppe: 3 });
  });

  it("getippt und wieder gelöscht ist kein Schritt — und Weitertippen rutscht nicht in den fremden darunter", () => {
    const geloescht = legeInPapierkorb(a, "arbeiten/stamp/02", "2026-10-21");
    let st = legeAb(LEERER_STAPEL, a, geloescht, null); // Bild gelöscht
    const x = setzeSeite(geloescht, "name", "x");
    st = legeAb(st, geloescht, x, 5); // „x" getippt
    st = legeAb(st, x, geloescht, 5); // und wieder gelöscht
    expect(st.rueck).toEqual([a]);
    const y = setzeSeite(geloescht, "name", "y");
    st = legeAb(st, geloescht, y, 5); // weiter im selben Feld
    expect(st.rueck).toEqual([a, geloescht]);
    // Rückgängig nimmt nur das Tippen zurück, das gelöschte Bild bleibt gelöscht.
    expect(schrittZurueck(st, y)!.inhalt).toEqual(geloescht);
  });

  it("hält höchstens 50 Schritte; der älteste fällt weg", () => {
    let st = LEERER_STAPEL;
    let jetzt = a;
    const staende = [a];
    for (let n = 1; n <= STAPEL_MAX + 5; n++) {
      const neu = setzeSeite(jetzt, "name", `Stand ${n}`);
      st = legeAb(st, jetzt, neu, null);
      jetzt = neu;
      staende.push(neu);
    }
    expect(STAPEL_MAX).toBe(50);
    expect(st.rueck).toHaveLength(50);
    expect(st.rueck[0]).toBe(staende[5]);
    expect(st.rueck.at(-1)).toBe(staende.at(-2));
    expect(legeAb(LEERER_STAPEL, a, b, null, 1).rueck).toHaveLength(1);
    expect(legeAb(legeAb(LEERER_STAPEL, a, b, null, 1), b, c, null, 1).rueck).toEqual([b]);
  });

  it("verändert keinen Stapel, sondern gibt neue zurück", () => {
    const st = legeAb(LEERER_STAPEL, a, b, null);
    const kopieVorher = structuredClone(st);
    legeAb(st, b, c, null);
    schrittZurueck(st, b);
    schrittVor(schrittZurueck(st, b)!.stapel, a);
    expect(st).toEqual(kopieVorher);
  });

  it("erkennt Felder, in denen getippt wird", () => {
    expect(istTextfeld({ tagName: "TEXTAREA" })).toBe(true);
    expect(istTextfeld({ tagName: "INPUT", type: "text" })).toBe(true);
    expect(istTextfeld({ tagName: "INPUT", type: "email" })).toBe(true);
    expect(istTextfeld({ tagName: "INPUT", type: "url" })).toBe(true);
    expect(istTextfeld({ tagName: "INPUT", type: "" })).toBe(true); // ohne Typ ist es Text
    expect(istTextfeld({ tagName: "INPUT", type: "file" })).toBe(false); // Dateiknopf
    expect(istTextfeld({ tagName: "INPUT", type: "checkbox" })).toBe(false);
    expect(istTextfeld({ tagName: "SELECT" })).toBe(false); // hier hat der Browser kein Rückgängig
    expect(istTextfeld({ tagName: "BUTTON" })).toBe(false);
    expect(istTextfeld({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(istTextfeld({ tagName: "BODY", isContentEditable: false })).toBe(false);
    expect(istTextfeld(null)).toBe(false);
  });

  it("Strg/⌘+S speichert überall außer in Rückfragen — dort nur abfangen", () => {
    const strg = { key: "s", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    const cmd = { ...strg, ctrlKey: false, metaKey: true };
    const frei = { imTextfeld: false, dialog: "keiner" as const };
    expect(tastenbefehl(strg, frei)).toBe("speichern");
    expect(tastenbefehl(cmd, frei)).toBe("speichern");
    expect(tastenbefehl({ ...strg, key: "S" }, frei)).toBe("speichern"); // Feststelltaste
    expect(tastenbefehl(strg, { imTextfeld: true, dialog: "keiner" })).toBe("speichern");
    expect(tastenbefehl(strg, { imTextfeld: true, dialog: "seite" })).toBe("speichern");
    expect(tastenbefehl(strg, { imTextfeld: false, dialog: "anderer" })).toBe("abfangen");
    expect(tastenbefehl({ ...strg, ctrlKey: false }, frei)).toBeNull(); // nur „s"
    expect(tastenbefehl({ ...strg, shiftKey: true }, frei)).toBeNull();
    expect(tastenbefehl({ ...strg, altKey: true }, frei)).toBeNull(); // AltGr
  });

  it("Strg/⌘+Z nur außerhalb von Textfeldern; in Dialogen abgefangen; Umschalt oder Strg+Y wiederholt", () => {
    const z = { key: "z", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    const frei = { imTextfeld: false, dialog: "keiner" as const };
    expect(tastenbefehl(z, frei)).toBe("rueckgaengig");
    expect(tastenbefehl({ ...z, ctrlKey: false, metaKey: true }, frei)).toBe("rueckgaengig");
    expect(tastenbefehl({ ...z, key: "Z", shiftKey: true }, frei)).toBe("wiederholen");
    expect(tastenbefehl({ ...z, key: "y" }, frei)).toBe("wiederholen");
    expect(tastenbefehl({ ...z, key: "y", ctrlKey: false, metaKey: true }, frei)).toBeNull(); // ⌘Y: Verlauf am Mac
    // Im Textfeld gilt das Rückgängig des Browsers.
    expect(tastenbefehl(z, { imTextfeld: true, dialog: "keiner" })).toBeNull();
    expect(tastenbefehl({ ...z, shiftKey: true }, { imTextfeld: true, dialog: "keiner" })).toBeNull();
    // Mit offenem Panel oder offener Rückfrage nichts — auch nicht das Rückgängig des Browsers.
    expect(tastenbefehl(z, { imTextfeld: false, dialog: "seite" })).toBe("abfangen");
    expect(tastenbefehl({ ...z, shiftKey: true }, { imTextfeld: false, dialog: "anderer" })).toBe("abfangen");
    expect(tastenbefehl({ ...z, key: "y" }, { imTextfeld: false, dialog: "seite" })).toBe("abfangen");
    // Im Textfeld des Panels aber das des Browsers.
    expect(tastenbefehl(z, { imTextfeld: true, dialog: "seite" })).toBeNull();
    expect(tastenbefehl({ ...z, key: "q" }, { imTextfeld: false, dialog: "seite" })).toBeNull();
    expect(tastenbefehl({ ...z, ctrlKey: false }, frei)).toBeNull();
    expect(tastenbefehl({ ...z, altKey: true }, frei)).toBeNull();
    expect(tastenbefehl({ ...z, key: "a" }, frei)).toBeNull();
  });

  it("nach dem Speichern: leer — oder genau ein Schritt zurück auf das Gespeicherte, wenn währenddessen etwas dazukam", () => {
    const gesendet = b;
    const gespeichert = { ...b, papierkorb: {} };
    expect(stapelNachSpeichern(gesendet, gesendet, gespeichert)).toBe(LEERER_STAPEL);
    expect(stapelNachSpeichern(structuredClone(b), gesendet, gespeichert)).toBe(LEERER_STAPEL);
    const st = stapelNachSpeichern(c, gesendet, gespeichert);
    expect(st).toEqual({ rueck: [gespeichert], vor: [], gruppe: null });
    // Rückgängig führt genau auf das Gespeicherte — nichts von davor.
    const z = schrittZurueck(st, c)!;
    expect(z.inhalt).toBe(gespeichert);
    expect(schrittZurueck(z.stapel, z.inhalt)).toBeNull();
  });
});

describe("Rückgängig: Tippen und Ziehen", () => {
  /* Wie in der Verwaltung: Jede Änderung legt mit der Gruppe ab, die
     `tippgruppen` gerade nennt — getippt wird über `tippe`, gezogen nicht. */
  const ablauf = () => {
    const t = tippgruppen();
    let st = LEERER_STAPEL;
    let jetzt = kopie();
    const aendere = (f: (i: Inhalt) => Inhalt) => {
      const gruppe = t.gruppe();
      const neu = f(jetzt);
      st = legeAb(st, jetzt, neu, gruppe);
      jetzt = neu;
    };
    const tippeIn = (platz: number, text: string, imFokus = true) => {
      // Jeder Buchstabe ein `input`-Ereignis.
      const vorher = jetzt.ueber.zeilen[platz];
      for (let n = 1; n <= text.length; n++) {
        t.tippe(() => aendere((i) => setzeZeile(i, platz, vorher + text.slice(0, n))), imFokus);
      }
    };
    const ziehe = () =>
      aendere((i) => {
        const g = alleFotos(k(i)).map((x) => x.schluessel);
        return setzeFotoReihenfolge(i, g, verschiebe(g, 0, 3));
      });
    const zurueck = () => {
      const z = schrittZurueck(st, jetzt)!;
      st = z.stapel;
      jetzt = z.inhalt;
    };
    return { t, aendere, tippeIn, ziehe, zurueck, st: () => st, jetzt: () => jetzt };
  };
  const erstes = (i: Inhalt) => alleFotos(k(i))[0].schluessel;

  it("Tippen ist ein Schritt je Besuch des Felds", () => {
    const a = ablauf();
    a.t.neuerBesuch(); // Fokus ins Feld
    a.tippeIn(0, " Neuer Satz.");
    expect(a.st().rueck).toHaveLength(1);
    a.t.neuerBesuch(); // Fokus in ein anderes Feld
    a.tippeIn(1, " Noch einer.");
    expect(a.st().rueck).toHaveLength(2);
  });

  it("Ziehen bei Fokus im Feld ist ein eigener Schritt — Rückgängig lässt das Getippte stehen", () => {
    const a = ablauf();
    const vorher = a.jetzt();
    a.t.neuerBesuch();
    a.tippeIn(0, " Neuer Satz.");
    const getippt = a.jetzt();
    a.ziehe(); // kein neuer Besuch: Der Fokus steht noch im Feld
    expect(erstes(a.jetzt())).not.toBe(erstes(getippt));
    expect(a.st().rueck).toEqual([vorher, getippt]);
    a.zurueck();
    expect(a.jetzt()).toBe(getippt);
    expect(a.jetzt().ueber.zeilen[0]).toMatch(/Neuer Satz\.$/);
  });

  it("mehrere Züge sind mehrere Schritte, auch mit Fokus im Feld", () => {
    const a = ablauf();
    a.t.neuerBesuch();
    a.ziehe();
    a.ziehe();
    a.ziehe();
    expect(a.st().rueck).toHaveLength(3);
    expect(a.t.gruppe()).toBeNull();
  });

  it("Tippen nach einem Zug im selben Besuch beginnt einen neuen Schritt", () => {
    const a = ablauf();
    a.t.neuerBesuch();
    a.tippeIn(0, " A");
    a.ziehe();
    const gezogen = a.jetzt();
    a.tippeIn(0, " B");
    expect(a.st().rueck).toHaveLength(3);
    a.zurueck();
    expect(a.jetzt()).toBe(gezogen); // nur „B" zurück, der Zug bleibt
  });

  it("eine Eingabe aus einem Feld ohne Fokus ist ein eigener Schritt", () => {
    const a = ablauf();
    a.t.neuerBesuch();
    a.tippeIn(0, "xy", false);
    expect(a.st().rueck).toHaveLength(2);
  });

  it("die Gruppe gilt nur während `tippe` — auch wenn darin etwas schiefgeht", () => {
    const t = tippgruppen();
    t.neuerBesuch();
    let drin: number | null = null;
    t.tippe(() => {
      drin = t.gruppe();
    });
    expect(drin).toBe(1);
    expect(t.gruppe()).toBeNull();
    expect(() =>
      t.tippe(() => {
        throw new Error("kaputt");
      }),
    ).toThrow("kaputt");
    expect(t.gruppe()).toBeNull();
  });
});

describe("Doppelklick nach dem Wegnehmen", () => {
  const erst = { x: 400, y: 600, zeit: 1000 };

  it("der zweite Klick an derselben Stelle kurz danach zählt nicht", () => {
    expect(istDoppelklick(erst, { x: 400, y: 600, zeit: 1300 })).toBe(true);
    expect(istDoppelklick(erst, { x: 400 + DOPPELKLICK_ABSTAND, y: 600 - DOPPELKLICK_ABSTAND, zeit: 1001 })).toBe(true);
  });

  it("ein schneller Klick auf ein anderes Bild zählt", () => {
    expect(istDoppelklick(erst, { x: 400 + DOPPELKLICK_ABSTAND + 1, y: 600, zeit: 1200 })).toBe(false);
    expect(istDoppelklick(erst, { x: 620, y: 600, zeit: 1250 })).toBe(false); // Kachel daneben
    expect(istDoppelklick(erst, { x: 400, y: 930, zeit: 1250 })).toBe(false); // Kachel darunter
  });

  it("nach der Doppelklick-Zeit zählt auch derselbe Platz", () => {
    expect(DOPPELKLICK_ZEIT).toBe(600);
    expect(istDoppelklick(erst, { x: 400, y: 600, zeit: 1000 + DOPPELKLICK_ZEIT })).toBe(false);
  });

  it("per Tastatur oder ohne Wegnehmen davor nie", () => {
    expect(istDoppelklick(null, { x: 400, y: 600, zeit: 1100 })).toBe(false);
    expect(istDoppelklick(erst, null)).toBe(false);
  });
});

describe("Dialoge", () => {
  it("schließt nur bei einem Punkt außerhalb des Rechtecks", () => {
    const r = { left: 760, top: 0, right: 1280, bottom: 900 };
    expect(ausserhalb(r, 100, 450)).toBe(true); // abgedunkelter Rand links neben dem Panel
    expect(ausserhalb(r, 1000, 798)).toBe(false); // leere Fläche unter dem Inhalt
    expect(ausserhalb(r, 760, 0)).toBe(false); // genau auf der Kante
    expect(ausserhalb(r, 1000, 901)).toBe(true);
    expect(ausserhalb({ left: 0, top: 0, right: 390, bottom: 844 }, 200, 736)).toBe(false); // Handy: ganzflächig
  });
});

describe("Prüfung: „Zeigen“", () => {
  const befund = (ort: string): Befund => ({ stufe: "fehler", ort, text: "ist leer." });

  it("findet zu jedem Ort den Reiter", () => {
    const faelle: [string, string | null][] = [
      ["Startseite · Name", "startseite"],
      ["Startseite · Großes Bild oben", "startseite"],
      ["Startseite · Highlight 3", "startseite"],
      ["Hero auf /foto", "hero"],
      ["Arbeit „STAMP“ · Kunde", "arbeiten"],
      ["Arbeit „Film · Fest“", "arbeiten"],
      ["Arbeiten", "arbeiten"],
      ["Kategorien", "arbeiten"],
      ["Film „Arbeit“ · Link", "filme"],
      ["Filme", "filme"],
      ["Über mich · Absatz 2", "ueber"],
      ["Über mich · Instagram · Adresse", "ueber"],
      ["Mosaik · Reihenfolge", "fotos"],
      [ORT_BESCHREIBUNGEN, "fotos"],
      ["Papierkorb", "papierkorb"],
      ["Inhalt", null],
      ["Bildausschnitte", null],
      ["Ausgeblendet", null],
    ];
    for (const [ort, reiter] of faelle) expect(reiterFuerBefund(befund(ort)), ort).toBe(reiter);
    /* Nur Reiter, die es gibt. */
    const gibt = new Set<string>(REITER.map(([r]) => r));
    for (const [, reiter] of faelle) if (reiter) expect(gibt.has(reiter)).toBe(true);
  });

  it("liest den Namen des Felds aus dem Ort — auch, wenn der Titel „ · “ enthält", () => {
    expect(feldFuerBefund(befund("Startseite · Zeile unter dem Namen"))).toBe("Zeile unter dem Namen");
    expect(feldFuerBefund(befund("Über mich · Instagram · Adresse"))).toBe("Instagram · Adresse");
    expect(feldFuerBefund(befund("Arbeit „STAMP“ · Kunde"))).toBe("Kunde");
    expect(feldFuerBefund(befund("Arbeit „Film · Fest“ · Titel"))).toBe("Titel");
    expect(feldFuerBefund(befund("Film „X“ · Link"))).toBe("Link");
    expect(feldFuerBefund(befund("Arbeit „STAMP“"))).toBeNull();
    expect(feldFuerBefund(befund("Hero auf /foto"))).toBeNull();
    /* Ein Text eines Bilds: das Feld steht hinter dem Bild. */
    const bild = (ort: string, s: string): Befund => ({ ...befund(ort), bild: s });
    expect(feldFuerBefund(bild("Über mich · 02 · Beschriftung", "ueber/02"))).toBe("Beschriftung");
    expect(feldFuerBefund(bild("Arbeit „Film · Fest“ · Startbild · Bildtitel", "arbeiten/x"))).toBe("Bildtitel");
  });

  it("jeder Befund der Prüfung zu Startseite, Über mich, Arbeiten und Filmen nennt ein Feld, das es dort gibt", () => {
    /* Die Beschriftungen, mit denen Reiter und Bild-Panel ihre Felder
       auszeichnen — dieselben Konstanten, keine Abschrift (der Anfang
       genügt: „Kunde" für „Kunde (optional)"). */
    const felder = [
      ...Object.values(FELDNAMEN).filter((f): f is Exclude<typeof f, (n: never) => string> => typeof f === "string"),
      ...[1, 2, 3, 4, 5].map(FELDNAMEN.absatz),
    ];
    const i = kopie();
    i.seite.name = "";
    i.seite.positioning = "";
    i.seite.locations = "";
    i.startseite.heroAlt = "x".repeat(500);
    i.startseite.heroVideo = "kein Link";
    i.ueber.zeilen[1] = "";
    i.ueber.portraitAlt = "";
    i.ueber.email = "keine";
    i.ueber.instagram = { label: "", url: "http://x" };
    i.ueber.swr = { label: "", url: "" };
    i.foto.arbeiten[0].titel = "";
    i.foto.arbeiten[0].kunde = "A GmbH";
    i.foto.arbeiten[0].kategorie = "gibtsnicht";
    i.foto.arbeiten[0].notiz = "x".repeat(2000);
    i.foto.arbeiten[0].bildtitel = { leitbild: "x".repeat(200) };
    i.foto.arbeiten[0].alt = { "01": "" };
    i.ueber.bilder["ueber/02"] = "x".repeat(200);
    i.filme.push({ id: "f", titel: "F", kunde: "K e.V.", link: "http://x" });
    const befunde = nurFehler(pruefeInhalt(i, Object.keys(BILDER)));
    expect(befunde.length).toBeGreaterThan(18);
    expect(befunde.filter((b) => b.bild)).toHaveLength(3);
    for (const b of befunde) {
      const feld = feldFuerBefund(b);
      expect(feld, b.ort).not.toBeNull();
      expect(
        felder.some((f) => f.startsWith(feld as string)),
        `${b.ort}: kein Feld „${feld}“`,
      ).toBe(true);
    }
  });
});

describe("Prüfung: wohin „Zeigen“ führt", () => {
  const ohneBild = (i: Inhalt) => pruefeInhalt(i, Object.keys(BILDER));
  const finde = (b: Befund[], f: (x: Befund) => boolean) => b.find(f) as Befund;

  it("ohne Feld und Bild: nur der Reiter — dessen Anfang holt `springeZu`", () => {
    const i = kopie();
    i.ausgeblendet.push(...i.foto.hero.slice(0, 3));
    const anzahl = finde(ohneBild(i), (x) => /empfohlen sind/.test(x.text));
    expect(zeigeziel(anzahl, k(i))).toEqual({ reiter: "hero", aufklappen: null, panel: null, feld: null, bild: null });
    i.ueber.zeilen = ["a", "b", "c", "d", "e"];
    const text = finde(ohneBild(i), (x) => x.ort === "Über mich · Text");
    expect(zeigeziel(text, k(i))).toMatchObject({ reiter: "ueber", panel: null, feld: "Text", bild: null });
  });

  it("ein Text eines Bilds: das Bild-Panel, mit dem Fokus im Feld — Arbeit aufgeklappt, Blättern durch ihre Bilder", () => {
    const i = kopie();
    const a = i.foto.arbeiten.find((x) => x.id === "tete-a-tete") as (typeof i.foto.arbeiten)[number];
    a.bildtitel = { ...a.bildtitel, leitbild: "x".repeat(200) };
    i.ueber.bilder["ueber/02"] = "x".repeat(200);
    i.papierkorb["arbeiten/tete-a-tete/05"] = "2026-10-20";
    const b = ohneBild(i);
    const titel = finde(b, (x) => x.bild === "arbeiten/tete-a-tete");
    const ziel = zeigeziel(titel, k(i));
    expect(ziel).toEqual({
      reiter: "arbeiten",
      aufklappen: "tete-a-tete",
      panel: {
        schluessel: "arbeiten/tete-a-tete",
        folge: ["arbeiten/tete-a-tete", ...["01", "02", "03", "04"].map((n) => `arbeiten/tete-a-tete/${n}`)],
        feld: "Bildtitel",
      },
      feld: null,
      bild: null,
    });
    expect(FELDNAMEN.bildtitel.startsWith(ziel?.panel?.feld as string)).toBe(true);
    /* Dieselbe Folge wie im Reiter Arbeiten: ohne Papierkorb. */
    expect(bilderDerArbeit(k(i), "tete-a-tete").map((x) => x.schluessel)).toEqual(ziel?.panel?.folge);
    const ueber = finde(b, (x) => x.bild === "ueber/02");
    expect(zeigeziel(ueber, k(i))?.panel).toEqual({ schluessel: "ueber/02", folge: "mosaik", feld: "Beschriftung" });
    /* Gibt es das Bild (noch) nicht, bleibt es beim Reiter. */
    i.ueber.bilder["ueber/09"] = "x".repeat(200);
    const fehlt = finde(ohneBild(i), (x) => x.bild === "ueber/09");
    expect(zeigeziel(fehlt, k(i))).toMatchObject({ reiter: "ueber", panel: null, bild: "ueber/09" });
  });

  it("Startseite: ein Bild, das sie nicht zeigen kann, führt zu „{Platz} ändern“ — ein Foto aus /foto ins Panel", () => {
    const i = kopie();
    i.startseite.highlights = ["ueber/01", "arbeiten/stamp/09", i.foto.hero[0], null];
    i.ausgeblendet.push(i.foto.hero[0]);
    const b = ohneBild(i);
    const kein = finde(b, (x) => x.ort === "Startseite · Highlight 1");
    expect(kein.text).toMatch(/kein Foto aus \/foto/);
    expect(zeigeziel(kein, k(i))).toEqual({
      reiter: "startseite",
      aufklappen: null,
      panel: null,
      feld: "Highlight 1 ändern",
      bild: null,
    });
    expect(zeigeziel(finde(b, (x) => x.ort === "Startseite · Highlight 2"), k(i))?.feld).toBe("Highlight 2 ändern");
    /* Ausgeblendet: Im Panel lässt es sich wieder einblenden. */
    const aus = finde(b, (x) => x.ort === "Startseite · Highlight 3");
    expect(zeigeziel(aus, k(i))?.panel).toEqual({ schluessel: i.foto.hero[0], folge: undefined, feld: null });
    /* Aus dem Hero: Blättern durch den Hero. */
    const hero = finde(b, (x) => x.ort === "Hero auf /foto" && x.schluessel === i.foto.hero[0]);
    expect(zeigeziel(hero, k(i))?.panel).toEqual({ schluessel: i.foto.hero[0], folge: "hero", feld: null });
  });

  it("ein Feld einer Arbeit: aufklappen und das Feld; Bilder ohne Beschreibung: das Panel durch genau diese", () => {
    const i = kopie();
    i.foto.arbeiten[1].kunde = "Muster GmbH";
    const b = ohneBild(i);
    const kunde = finde(b, (x) => x.ort.endsWith("· Kunde"));
    expect(zeigeziel(kunde, k(i))).toEqual({
      reiter: "arbeiten",
      aufklappen: i.foto.arbeiten[1].id,
      panel: null,
      feld: "Kunde",
      bild: null,
    });
    const hinweis = finde(b, (x) => x.ort === ORT_BESCHREIBUNGEN);
    const liste = ohneBeschreibung(k(i));
    expect(zeigeziel(hinweis, k(i))?.panel).toEqual({ schluessel: liste[0], folge: liste, feld: null });
    expect(zeigeziel({ ...hinweis, schluessel: liste[2] }, k(i))?.panel?.schluessel).toBe(liste[2]);
    /* Ohne Reiter (Form kaputt): nichts. */
    expect(zeigeziel({ stufe: "fehler", ort: "Inhalt", text: "ist kein Objekt." }, k(i))).toBeNull();
  });
});

describe("Anzeige", () => {
  it("benennt Bilder für Jakob", () => {
    const i = kopie();
    const stamp = i.foto.arbeiten.find((a) => a.id === "stamp")!;
    expect(bildBezeichnung(i, "arbeiten/stamp")).toBe(`${stamp.titel} · Startbild`);
    expect(bildBezeichnung(i, "arbeiten/stamp/02")).toBe(`${stamp.titel} · 02`);
    expect(bildBezeichnung(i, "ueber/01")).toBe("Über mich · 01");
    expect(bildBezeichnung(i, "portrait")).toBe("Porträt");
  });
});

describe("Startseite und Über mich", () => {
  it("macht aus leerem Hero-Video und Alt-Text null", () => {
    const i = kopie();
    expect(setzeStartText(i, "heroVideo", "  ").startseite.heroVideo).toBeNull();
    expect(setzeStartText(i, "heroAlt", "Abendlicht").startseite.heroAlt).toBe("Abendlicht");
    expect(setzeSeite(i, "locations", "berlin").seite.locations).toBe("berlin");
    expect(i.seite.locations).toBe(INHALT.seite.locations);
  });

  it("setzt Bildplätze und hält genau vier Highlights", () => {
    const i = kopie();
    i.startseite.highlights = ["arbeiten/stamp"];
    const n = setzeStartbild(i, { highlight: 2 }, "arbeiten/stamp/01");
    expect(n.startseite.highlights).toEqual(["arbeiten/stamp", null, "arbeiten/stamp/01", null]);
    expect(startbild(n, { highlight: 2 })).toBe("arbeiten/stamp/01");
    expect(setzeStartbild(n, { highlight: 7 }, "x").startseite.highlights).toHaveLength(4);
    expect(startbild(setzeStartbild(i, "wegeFilm", null), "wegeFilm")).toBeNull();
    expect(startbild(setzeStartbild(i, "heroErsatz", "arbeiten/stamp"), "heroErsatz")).toBe("arbeiten/stamp");
    expect(startbild(setzeStartbild(i, "wegeFoto", "arbeiten/stamp"), "wegeFoto")).toBe("arbeiten/stamp");
  });

  it("bearbeitet Zeilen, Kontakt und Links", () => {
    const i = kopie();
    const mehr = neueZeile(i);
    expect(mehr.ueber.zeilen).toHaveLength(i.ueber.zeilen.length + 1);
    const geaendert = setzeZeile(mehr, mehr.ueber.zeilen.length - 1, "Neu");
    expect(geaendert.ueber.zeilen.at(-1)).toBe("Neu");
    expect(entferneZeile(geaendert, 0).ueber.zeilen[0]).toBe(i.ueber.zeilen[1]);
    expect(setzeUeberFeld(i, "portraitAlt", "x").ueber.portraitAlt).toBe("x");
    const link = setzeUeberLink(i, "swr", "label", "SWR");
    expect(link.ueber.swr).toEqual({ label: "SWR", url: i.ueber.swr.url });
  });

  it("bietet nur an, was die Startseite zeigen kann: sichtbare Fotos aus /foto, in Mosaik-Reihenfolge", () => {
    let i = umschalteAusgeblendet(kopie(), "arbeiten/stamp/01");
    i = legeInPapierkorb(i, "arbeiten/stamp/02", "2026-10-17");
    const wahl = waehlbareBilder(k(i)).map((b) => b.schluessel);
    expect(wahl.length).toBeGreaterThan(0);
    /* Was in `foto.reihenfolge` steht, kommt in deren Reihenfolge. */
    expect(wahl.filter((s) => i.foto.reihenfolge.includes(s))).toEqual(i.foto.reihenfolge.filter((s) => wahl.includes(s)));
    expect(wahl.every((s) => s.startsWith("arbeiten/"))).toBe(true);
    expect(wahl).not.toContain("arbeiten/stamp/01");
    expect(wahl).not.toContain("arbeiten/stamp/02");
    expect(wahl).not.toContain("ueber/01");
    expect(wahl).not.toContain("portrait");
    expect(Object.keys(BILDER).some((s) => s.startsWith("ueber/"))).toBe(true);
    for (const s of INHALT.ausgeblendet) expect(wahl).not.toContain(s);
  });
});

describe("Bild-Panel: Platz im Mosaik", () => {
  const fotos = (i: Inhalt) => mosaikVon(k(i), "arbeiten/stamp/01") ?? [];

  it("nummeriert wie die Kacheln im Reiter Fotos: auch Ausgeblendetes, ohne Gelöschtes", () => {
    const i = kopie();
    const reiter = alleFotos(k(i)).map((b) => b.schluessel);
    expect(fotos(i)).toEqual(reiter);
    expect(reiter.length).toBeGreaterThanOrEqual(36);
    expect(platzImMosaik(k(i), reiter[34])).toEqual({ platz: 35, anzahl: reiter.length });
    const ohne = legeInPapierkorb(i, reiter[0], "2026-10-22");
    expect(platzImMosaik(k(ohne), reiter[0])).toBeNull();
    expect(platzImMosaik(k(ohne), reiter[34])).toEqual({ platz: 34, anzahl: reiter.length - 1 });
    expect(platzImMosaik(k(i), "ueber/03")).toEqual({ platz: 3, anzahl: alleUeberBilder(k(i)).length });
    expect(mosaikVon(k(i), "portrait")).toBeNull();
    expect(mosaikVon(k(i), "film/irgendwas")).toBeNull();
    expect(platzImMosaik(k(i), "arbeiten/gibt-es-nicht/01")).toBeNull();
  });

  it("Platz 35 → 2 in einem Schritt; die anderen behalten ihre Reihenfolge", () => {
    const i = kopie();
    const vorher = fotos(i);
    const s = vorher[34];
    const neu = verschiebeAufPlatz(i, BILDER, s, 2);
    expect(fotos(neu)).toEqual([vorher[0], s, ...vorher.slice(1, 34), ...vorher.slice(35)]);
    expect(platzImMosaik(k(neu), s)).toEqual({ platz: 2, anzahl: vorher.length });
    /* Die Seite zeigt dieselbe Ordnung. */
    const seite = fotosFuerMosaik(k(neu)).map((b) => b.schluessel);
    expect(fotos(neu).filter((x) => seite.includes(x))).toEqual(seite);
    expect(nurFehler(pruefeInhalt(neu, Object.keys(BILDER)))).toEqual([]);
    expect(i).toEqual(kopie());
  });

  it("an den Anfang, ans Ende, über das Ende hinaus, unter 1", () => {
    const i = kopie();
    const vorher = fotos(i);
    const s = vorher[34];
    expect(fotos(verschiebeAufPlatz(i, BILDER, s, 1))[0]).toBe(s);
    expect(fotos(verschiebeAufPlatz(i, BILDER, s, vorher.length)).at(-1)).toBe(s);
    expect(fotos(verschiebeAufPlatz(i, BILDER, s, 999)).at(-1)).toBe(s);
    expect(fotos(verschiebeAufPlatz(i, BILDER, s, 0))[0]).toBe(s);
    expect(fotos(verschiebeAufPlatz(i, BILDER, vorher[0], 1.6))[1]).toBe(vorher[0]);
  });

  it("ändert nichts, wenn es schon dort steht, keine Zahl kommt oder das Bild in keinem Mosaik ist", () => {
    const i = kopie();
    const s = fotos(i)[34];
    expect(verschiebeAufPlatz(i, BILDER, s, 35)).toBe(i);
    /* „Ans Ende“ beim letzten, „An den Anfang“ beim ersten — auch über den Rand hinaus. */
    expect(verschiebeAufPlatz(i, BILDER, fotos(i).at(-1) as string, 999)).toBe(i);
    expect(verschiebeAufPlatz(i, BILDER, fotos(i)[0], 0)).toBe(i);
    expect(verschiebeAufPlatz(i, BILDER, s, Number.NaN)).toBe(i);
    expect(verschiebeAufPlatz(i, BILDER, "portrait", 1)).toBe(i);
    const geloescht = legeInPapierkorb(i, s, "2026-10-22");
    expect(verschiebeAufPlatz(geloescht, BILDER, s, 1)).toBe(geloescht);
  });

  it("gelöschte Bilder behalten ihren Platz in der Reihenfolge", () => {
    const i = kopie();
    const gesamt = alleFotos(k(i)).map((b) => b.schluessel);
    const weg = gesamt[1];
    const mitPapierkorb = legeInPapierkorb(i, weg, "2026-10-22");
    const s = fotos(mitPapierkorb)[33];
    const neu = verschiebeAufPlatz(mitPapierkorb, BILDER, s, 1);
    expect(neu.foto.reihenfolge).toHaveLength(gesamt.length);
    expect(neu.foto.reihenfolge[0]).toBe(s);
    expect(neu.foto.reihenfolge[1]).toBe(weg);
    /* Wiederhergestellt steht es wieder an seinem Platz. */
    expect(alleFotos(k(stelleWiederHer(neu, weg))).map((b) => b.schluessel)[1]).toBe(weg);
  });

  it("verschiebt auch Bilder auf /ueber — nur dort", () => {
    const i = kopie();
    const vorher = alleUeberBilder(k(i)).map((b) => b.schluessel);
    const s = vorher.at(-1) as string;
    const neu = verschiebeAufPlatz(i, BILDER, s, 1);
    expect(alleUeberBilder(k(neu)).map((b) => b.schluessel)).toEqual([s, ...vorher.slice(0, -1)]);
    expect(neu.foto.reihenfolge).toEqual(i.foto.reihenfolge);
  });

  it("liest das Feld „Platz“", () => {
    expect(lesePlatz("10")).toBe(10);
    expect(lesePlatz(" 3 ")).toBe(3);
    expect(lesePlatz("0")).toBe(0);
    for (const t of ["", "  ", "abc", "3.5", "-1", "1e2", "12345"]) expect(lesePlatz(t)).toBeNull();
  });
});

describe("Bild-Panel: Blättern", () => {
  it("blättert durch das Mosaik so, wie es gerade geordnet ist", () => {
    const i = kopie();
    const vorher = alleFotos(k(i)).map((b) => b.schluessel);
    const s = vorher[34];
    expect(blaettern(blaetterListe(k(i), s, "mosaik"), s)).toEqual({
      nr: 35,
      anzahl: vorher.length,
      vorher: vorher[33],
      nachher: vorher[35],
    });
    /* Nach „An den Anfang“: „1 von 38“, und „›“ führt zum bisher ersten. */
    const neu = verschiebeAufPlatz(i, BILDER, s, 1);
    expect(blaettern(blaetterListe(k(neu), s, "mosaik"), s)).toEqual({
      nr: 1,
      anzahl: vorher.length,
      vorher: null,
      nachher: vorher[0],
    });
  });

  it("an den Rändern führt nur eine Richtung weiter", () => {
    const liste = ["a", "b", "c"];
    expect(blaettern(liste, "a")).toEqual({ nr: 1, anzahl: 3, vorher: null, nachher: "b" });
    expect(blaettern(liste, "b")).toEqual({ nr: 2, anzahl: 3, vorher: "a", nachher: "c" });
    expect(blaettern(liste, "c")).toEqual({ nr: 3, anzahl: 3, vorher: "b", nachher: null });
  });

  it("blättert durch den Hero, wie er gerade ist — ein herausgenommenes Bild von seiner alten Stelle aus", () => {
    const i = kopie();
    const hero = [...i.foto.hero];
    const s = hero[1];
    expect(blaetterListe(k(i), s, "hero")).toEqual(hero);
    expect(blaettern(blaetterListe(k(i), s, "hero"), s)).toEqual({
      nr: 2,
      anzahl: hero.length,
      vorher: hero[0],
      nachher: hero[2],
    });
    /* „Im Hero — herausnehmen": Der Kopf zählt den kleineren Hero, „›“
       führt zu dem Bild, das dahinter stand, „‹“ zu dem davor. */
    const ohne = umschalteHero(i, s);
    const liste = blaetterListe(k(ohne), s, "hero");
    expect(liste).toEqual(hero.filter((x) => x !== s));
    expect(blaettern(liste, s, 1)).toEqual({ nr: null, anzahl: hero.length - 1, vorher: hero[0], nachher: hero[2] });
    /* Stand es zuletzt am Ende oder am Anfang, führt nur eine Richtung weiter. */
    const letztes = hero.at(-1) as string;
    const ohneLetztes = umschalteHero(i, letztes).foto.hero;
    expect(blaettern(ohneLetztes, letztes, hero.length - 1)).toEqual({
      nr: null,
      anzahl: hero.length - 1,
      vorher: hero.at(-2),
      nachher: null,
    });
    expect(blaettern(umschalteHero(i, hero[0]).foto.hero, hero[0], 0)?.vorher).toBeNull();
    /* Wieder hinein: Es steht am Ende und zählt wieder mit. */
    const wieder = umschalteHero(ohne, s);
    expect(blaettern(blaetterListe(k(wieder), s, "hero"), s, 1)).toEqual({
      nr: hero.length,
      anzahl: hero.length,
      vorher: hero.at(-1),
      nachher: null,
    });
  });

  it("nichts zu blättern: ohne Folge, ein einziges Bild, oder das Bild steht nicht darin", () => {
    const i = kopie();
    expect(blaetterListe(k(i), "arbeiten/stamp/01", undefined)).toEqual([]);
    expect(blaettern(blaetterListe(k(i), "arbeiten/stamp/01", undefined), "arbeiten/stamp/01")).toBeNull();
    expect(blaettern(["a"], "a")).toBeNull();
    expect(blaettern(["a", "b"], "x")).toBeNull();
    /* … und stand nie darin (keine alte Stelle), oder die Liste ist leer. */
    expect(blaettern(["a", "b"], "x", -1)).toBeNull();
    expect(blaettern([], "x", 0)).toBeNull();
    expect(blaetterListe(k(i), "portrait", "mosaik")).toEqual([]);
    /* Eine gemerkte Liste bleibt, wie sie ist. */
    expect(blaetterListe(k(i), "b", ["c", "b", "a"])).toEqual(["c", "b", "a"]);
  });

  it("← und → nur ohne Zusatztasten und nicht in Textfeldern", () => {
    const t = (key: string, extra: Partial<Record<"ctrlKey" | "metaKey" | "shiftKey" | "altKey", boolean>> = {}) => ({
      key,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      ...extra,
    });
    expect(blaetterTaste(t("ArrowLeft"), false)).toBe(-1);
    expect(blaetterTaste(t("ArrowRight"), false)).toBe(1);
    expect(blaetterTaste(t("ArrowRight"), true)).toBeNull();
    expect(blaetterTaste(t("ArrowLeft", { altKey: true }), false)).toBeNull();
    expect(blaetterTaste(t("ArrowLeft", { ctrlKey: true }), false)).toBeNull();
    expect(blaetterTaste(t("ArrowLeft", { metaKey: true }), false)).toBeNull();
    expect(blaetterTaste(t("ArrowRight", { shiftKey: true }), false)).toBeNull();
    expect(blaetterTaste(t("ArrowUp"), false)).toBeNull();
    expect(blaetterTaste(t("Enter"), false)).toBeNull();
  });
});

describe("Bild-Panel: Verwendung und Beschreibungen", () => {
  it("nennt Hero und Startseite mit den Namen der Plätze — auch für ausgeblendete Bilder", () => {
    const i = kopie();
    const reihe = alleFotos(k(i)).map((x) => x.schluessel);
    const [a, b, c] = reihe;
    i.foto.hero = [reihe[5], reihe[6], a];
    i.startseite.heroErsatz = a;
    i.startseite.wege = { foto: b, film: b };
    i.startseite.highlights = [null, a, null, b];
    expect(verwendung(k(i), a)).toEqual([
      "Hero auf /foto, Platz 3",
      "Startseite: Großes Bild oben",
      "Startseite: Highlight 2",
    ]);
    expect(verwendung(k(i), b)).toEqual([
      "Startseite: Bild zum Bereich Foto",
      "Startseite: Bild zum Bereich Film",
      "Startseite: Highlight 4",
    ]);
    expect(verwendung(k(umschalteAusgeblendet(i, a)), a)).toEqual(verwendung(k(i), a));
    expect(verwendung(k(i), c)).toEqual([]);
    expect(aufDerStartseite(k(i), a)).toBe(true);
    expect(aufDerStartseite(k(i), c)).toBe(false);
    i.foto.hero = [];
    i.startseite.heroErsatz = null;
    i.startseite.highlights = [null, null, null, null];
    expect(verwendung(k(i), a)).toEqual([]);
    expect(aufDerStartseite(k(i), a)).toBe(false);
  });

  it("nennt Rückfälle, die die Startseite zurzeit nicht zeigt — wie app/page.tsx", () => {
    const i = kopie();
    const reihe = alleFotos(k(i)).map((x) => x.schluessel);
    const [a, b, c] = reihe;
    i.foto.hero = [];
    i.startseite.heroErsatz = a;
    i.startseite.wege = { foto: null, film: b };
    i.startseite.highlights = [null, null, c, null];
    /* Der eingecheckte Stand: kein Standbild oben, kein Film mit Standbild. */
    expect(BILDER["hero/standbild"]).toBeUndefined();
    expect(filmeMitStandbild(k(i))).toEqual([]);
    expect(startplatzZuSehen(k(i), "heroErsatz")).toBe(true);
    expect(startplatzZuSehen(k(i), "wegeFilm")).toBe(true);
    expect(verwendung(k(i), a)).toEqual(["Startseite: Großes Bild oben"]);
    expect(verwendung(k(i), b)).toEqual(["Startseite: Bild zum Bereich Film"]);
    expect(aufDerStartseite(k(i), a)).toBe(true);
    expect(aufDerStartseite(k(i), b)).toBe(true);

    /* Mit eigenem Standbild oben zeigt die Seite das große Bild oben nicht. */
    const standbild = { inhalt: i, bilder: { ...BILDER, "hero/standbild": BILDER[c] } };
    expect(startplatzZuSehen(standbild, "heroErsatz")).toBe(false);
    expect(verwendung(standbild, a)).toEqual(["Startseite: Großes Bild oben (Rückfall, zurzeit nicht zu sehen)"]);
    expect(aufDerStartseite(standbild, a)).toBe(false);
    expect(aufDerStartseite(standbild, b)).toBe(true);

    /* Hat ein Film ein Standbild, nimmt die Seite das statt des Bilds zum Bereich Film. */
    const film = { inhalt: i, bilder: { ...BILDER, [`film/${i.filme[0].id}`]: BILDER[c] } };
    expect(filmeMitStandbild(film)).toHaveLength(1);
    expect(startplatzZuSehen(film, "wegeFilm")).toBe(false);
    expect(verwendung(film, b)).toEqual(["Startseite: Bild zum Bereich Film (Rückfall, zurzeit nicht zu sehen)"]);
    expect(aufDerStartseite(film, b)).toBe(false);
    expect(aufDerStartseite(film, a)).toBe(true);
    /* Ein Standbild ohne Film in der Liste zählt nicht — die Seite fände es auch nicht. */
    const fremd = { inhalt: i, bilder: { ...BILDER, "film/gibt-es-nicht": BILDER[c] } };
    expect(startplatzZuSehen(fremd, "wegeFilm")).toBe(true);
    expect(aufDerStartseite(fremd, b)).toBe(true);

    /* Steht dasselbe Bild zugleich auf einem Platz, den die Seite zeigt, bleibt es auf der Startseite. */
    i.startseite.highlights = [null, null, c, a];
    expect(verwendung(standbild, a)).toEqual([
      "Startseite: Großes Bild oben (Rückfall, zurzeit nicht zu sehen)",
      "Startseite: Highlight 4",
    ]);
    expect(aufDerStartseite(standbild, a)).toBe(true);
    /* Die anderen Plätze zeigt die Seite immer. */
    for (const p of STARTPLAETZE.filter((p) => p !== "heroErsatz" && p !== "wegeFilm")) {
      expect(startplatzZuSehen(standbild, p)).toBe(true);
      expect(startplatzZuSehen(film, p)).toBe(true);
    }
  });

  it("die Zeilen im Reiter Startseite sagen, warum ein Platz leer bleibt — und kennen die Rückfälle", () => {
    const i = kopie();
    const reihe = alleFotos(k(i)).map((x) => x.schluessel);
    const [a, b, c] = reihe;
    i.startseite.heroErsatz = a;
    i.startseite.wege = { foto: c, film: b };
    i.startseite.highlights = ["ueber/01", c, null, null];
    i.ausgeblendet.push(a);
    i.papierkorb[b] = "2026-10-20";
    const leer = "der Platz bleibt auf der Seite leer";
    expect(startplatzZustand(k(i), "heroErsatz")).toBe(` · ausgeblendet — ${leer}`);
    expect(startplatzZustand(k(i), "wegeFilm")).toBe(` · im Papierkorb — ${leer}`);
    expect(startplatzZustand(k(i), { highlight: 0 })).toBe(` · kein Foto aus /foto — ${leer}`);
    expect(startplatzZustand(k(i), { highlight: 1 })).toBe("");
    expect(startplatzZustand(k(i), { highlight: 2 })).toBe("");
    /* Zeigt die Seite den Platz zurzeit nicht, bleibt er auch nicht leer. */
    const beide = { inhalt: i, bilder: { ...BILDER, "hero/standbild": BILDER[c], [`film/${i.filme[0].id}`]: BILDER[c] } };
    expect(startplatzZustand(beide, "heroErsatz")).toBe(" · Rückfall, zurzeit nicht zu sehen");
    expect(startplatzZustand(beide, "wegeFilm")).toBe(" · Rückfall, zurzeit nicht zu sehen");
    expect(startplatzZustand(beide, { highlight: 0 })).toBe(` · kein Foto aus /foto — ${leer}`);
    /* Dieselbe Regel wie die Prüfung: Wo die Zeile „leer" sagt, warnt sie — sonst nicht. */
    for (const kontext of [k(i), beide]) {
      const warnt = pruefeInhalt(i, Object.keys(kontext.bilder))
        .filter((x) => x.stufe === "warnung" && x.ort.startsWith("Startseite · "))
        .map((x) => x.ort.slice("Startseite · ".length));
      const leerePlaetze = STARTPLAETZE.filter((p) => startplatzZustand(kontext, p).includes(leer)).map(startplatzName);
      expect([...new Set(warnt)].sort()).toEqual(leerePlaetze.sort());
    }
  });

  it("hat für jeden Bildplatz der Startseite einen Namen", () => {
    expect(STARTPLAETZE.map(startplatzName)).toEqual([
      "Großes Bild oben",
      "Bild zum Bereich Foto",
      "Bild zum Bereich Film",
      "Highlight 1",
      "Highlight 2",
      "Highlight 3",
      "Highlight 4",
    ]);
  });

  it("zählt Bilder ohne Beschreibung genau wie der Hinweis der Prüfung", () => {
    const anzahlImHinweis = (i: Inhalt) => {
      const h = pruefeInhalt(i, Object.keys(BILDER)).find((b) => b.ort === ORT_BESCHREIBUNGEN);
      return !h ? 0 : h.text.startsWith("Ein ") ? 1 : Number(h.text.match(/^(\d+)/)?.[1]);
    };
    let i = kopie();
    expect(ohneBeschreibung(k(i))).toHaveLength(anzahlImHinweis(i));
    const ohne = ohneBeschreibung(k(i));
    expect(ohne.length).toBeGreaterThan(2);
    /* In Mosaik-Reihenfolge. */
    const reihe = alleFotos(k(i)).map((b) => b.schluessel);
    expect(ohne).toEqual(reihe.filter((s) => ohne.includes(s)));
    /* Beschreiben, Ausblenden, Löschen nimmt heraus; nur Leerzeichen zählt als leer. */
    i = setzeBildtext(i, ohne[0], "alt", "Zwei Tänzer im Gegenlicht");
    i = umschalteAusgeblendet(i, ohne[1]);
    i = legeInPapierkorb(i, ohne[2], "2026-10-22");
    const mitText = reihe.find((s) => !ohne.includes(s) && !istVerborgen(i, s)) as string;
    i = setzeBildtext(i, mitText, "alt", "   ");
    const danach = ohneBeschreibung(k(i));
    expect(danach).not.toContain(ohne[0]);
    expect(danach).not.toContain(ohne[1]);
    expect(danach).not.toContain(ohne[2]);
    expect(danach).toContain(mitText);
    expect(danach).toHaveLength(anzahlImHinweis(i));
  });

  it("springt zum nächsten Bild ohne Beschreibung — nach dem letzten wieder von vorn, nie zu sich selbst", () => {
    const i = kopie();
    const ohne = ohneBeschreibung(k(i));
    expect(naechstesOhneBeschreibung(k(i), ohne[0])).toBe(ohne[1]);
    expect(naechstesOhneBeschreibung(k(i), ohne.at(-1) as string)).toBe(ohne[0]);
    /* Von einem Bild mit Beschreibung aus: das nächste dahinter. */
    const reihe = alleFotos(k(i)).map((b) => b.schluessel);
    const mit = reihe.find((s, p) => !ohne.includes(s) && p < reihe.indexOf(ohne.at(-1) as string)) as string;
    expect(naechstesOhneBeschreibung(k(i), mit)).toBe(ohne.find((s) => reihe.indexOf(s) > reihe.indexOf(mit)));
    /* Ist es das letzte ohne, gibt es kein nächstes. */
    let nurEins = i;
    for (const s of ohne.slice(1)) nurEins = setzeBildtext(nurEins, s, "alt", "Szene");
    expect(ohneBeschreibung(k(nurEins))).toEqual([ohne[0]]);
    expect(naechstesOhneBeschreibung(k(nurEins), ohne[0])).toBeNull();
  });
});

describe("Arbeit löschen, wenn nichts mehr auszublenden ist", () => {
  it("sagt nach Lage, warum nichts zu sehen ist: Verarbeitung, ausgeblendet, Papierkorb", () => {
    const i = kopie();
    const eigene = bilderDerArbeit(k(i), "stamp").map((x) => x.schluessel);
    expect(eigene.length).toBeGreaterThan(2);
    i.ausgeblendet.push(...eigene);
    expect(nichtsZuSehen(k(i), "stamp", [])).toBe("Alle ihre Bilder sind schon ausgeblendet — auf der Seite erscheint sie nicht.");
    i.papierkorb[eigene[0]] = "2026-10-20";
    expect(nichtsZuSehen(k(i), "stamp", [])).toBe(
      "Ihre Bilder sind ausgeblendet oder liegen im Papierkorb — auf der Seite erscheint sie nicht.",
    );
    for (const s of eigene) i.papierkorb[s] = "2026-10-20";
    expect(nichtsZuSehen(k(i), "stamp", [])).toBe("Alle ihre Bilder liegen im Papierkorb — auf der Seite erscheint sie nicht.");
    /* Ein neues Bild, das noch verarbeitet wird, geht vor; ein ersetztes (schon im Manifest) zählt nicht. */
    expect(nichtsZuSehen(k(i), "stamp", ["arbeiten/stamp/09", eigene[1], "arbeiten/at-tension/07"])).toBe(
      "Ein Bild wird gerade noch verarbeitet — ist es fertig, kannst du es ausblenden.",
    );
    expect(nichtsZuSehen(k(i), "stamp", ["arbeiten/stamp/09", "arbeiten/stamp/10"])).toBe(
      "2 Bilder werden gerade noch verarbeitet — sind sie fertig, kannst du sie ausblenden.",
    );
  });
});

describe("Hochladen und Verarbeitung", () => {
  it("zeigt nur neue Fotos als Platzhalter", () => {
    expect(platzhalter(["arbeiten/stamp/01", "arbeiten/stamp/99", "ueber/09", "arbeiten/stamp/99"], BILDER, "arbeiten/")).toEqual([
      "arbeiten/stamp/99",
    ]);
  });

  const lauf = (id: number, status: string, ergebnis: string | null): Lauf => ({
    id,
    status,
    ergebnis,
    gestartet: "2026-10-17T10:00:00Z",
    url: "https://github.com/x",
  });

  it("meldet nur Läufe, die seit dem letzten Blick fertig wurden", () => {
    const v = {
      wartend: [],
      laeufe: [lauf(3, "in_progress", null), lauf(2, "completed", "success"), lauf(1, "completed", "failure")],
    };
    const erst = werteAus(v, new Set());
    expect(erst.laufend).toBe(true);
    expect(erst.erfolgreich.map((l) => l.id)).toEqual([2]);
    expect(erst.fehlgeschlagen.map((l) => l.id)).toEqual([1]);
    const danach = werteAus(v, new Set([1, 2]));
    expect(danach.erfolgreich).toEqual([]);
    expect(danach.fehlgeschlagen).toEqual([]);
    expect(werteAus({ wartend: [], laeufe: [lauf(4, "completed", "cancelled")] }, new Set()).fehlgeschlagen).toEqual([]);
  });

  it("zeigt beim ersten Blick einen roten letzten Lauf — nur, wenn noch etwas wartet", () => {
    const rot = [lauf(3, "completed", "failure"), lauf(2, "completed", "success")];
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: rot })?.id).toBe(3);
    expect(letzterFehlschlag({ wartend: [], laeufe: rot })).toBeNull();
    // Läuft gerade ein neuer Lauf, zählt erst dessen Ergebnis.
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: [lauf(4, "in_progress", null), ...rot] })).toBeNull();
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: [lauf(4, "queued", null), ...rot] })).toBeNull();
    // Danach grün, abgebrochen oder gar kein Lauf: nichts melden.
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: [lauf(4, "completed", "success"), ...rot] })).toBeNull();
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: [lauf(4, "completed", "cancelled"), ...rot] })).toBeNull();
    expect(letzterFehlschlag({ wartend: ["ueber/07"], laeufe: [] })).toBeNull();
  });

  it("erwartet nach einem Lauf nur neue Bilder, die den Eingang verlassen haben", () => {
    const vorher = { "ueber/01": {}, portrait: {} };
    const bisher = ["ueber/01", "ueber/07", "ueber/08", "arbeiten/stamp/04", "ueber/07"];
    // ueber/01 ist ersetzt (steht schon im Manifest), ueber/08 liegt noch im Eingang.
    expect(erwarteteBilder(bisher, ["ueber/08"], vorher)).toEqual(["arbeiten/stamp/04", "ueber/07"]);
    expect(erwarteteBilder([], [], vorher)).toEqual([]);
  });

  it("ein Manifest gilt erst als angekommen, wenn alle erwarteten Bilder darin stehen", () => {
    const neu = { "ueber/01": {}, "ueber/07": {} };
    expect(angekommen(["ueber/07"], neu)).toBe(true);
    // GitHub liefert noch das alte Manifest: die neuen Bilder fehlen.
    expect(angekommen(["ueber/07", "arbeiten/stamp/04"], neu)).toBe(false);
    // Nichts erwartet (z. B. nur ersetzt): jedes Manifest passt.
    expect(angekommen([], {})).toBe(true);
    // Nur eigene Schlüssel zählen, nichts aus dem Prototyp.
    expect(angekommen(["toString"], {})).toBe(false);
  });

  it("wertet einen roten Lauf aus, sobald etwas angekommen ist — sonst nach ROT_RUNDEN", () => {
    const neu = { "ueber/06": {} };
    // Grün: erst, wenn alles da ist — egal, wie lange.
    expect(ausgewertet(["ueber/06", "ueber/07"], neu, false, 1)).toBe(false);
    expect(ausgewertet(["ueber/06", "ueber/07"], neu, false, 99)).toBe(false);
    expect(ausgewertet(["ueber/06"], neu, false, 1)).toBe(true);
    // Rot mit Teil-Commit: das gute ist da, das andere kommt mit diesem Lauf nie.
    expect(ausgewertet(["ueber/06", "ueber/07"], neu, true, 1)).toBe(true);
    // Rot, nichts da: GitHub hinkt vielleicht hinterher — erst nach ROT_RUNDEN aufgeben.
    expect(ausgewertet(["ueber/07"], neu, true, 1)).toBe(false);
    expect(ausgewertet(["ueber/07"], neu, true, ROT_RUNDEN - 1)).toBe(false);
    expect(ausgewertet(["ueber/07"], neu, true, ROT_RUNDEN)).toBe(true);
    // Nichts erwartet (alles liegt noch im Eingang): sofort.
    expect(ausgewertet([], {}, true, 1)).toBe(true);
    expect(ausgewertet(["toString"], {}, true, 1)).toBe(false);
  });

  it("teilt Hochgeladenes außerhalb des Eingangs in fertig und vermisst", () => {
    const manifest = { "ueber/01": {}, "ueber/06": {} };
    // ueber/07 liegt noch im Eingang, ueber/01 ist ersetzt und fertig, ueber/08 hängt dazwischen.
    expect(nachDemEingang(["ueber/01", "ueber/06", "ueber/07", "ueber/08", "ueber/08"], ["ueber/07"], manifest)).toEqual({
      fertig: ["ueber/01", "ueber/06"],
      vermisst: ["ueber/08"],
    });
    expect(nachDemEingang([], ["ueber/07"], manifest)).toEqual({ fertig: [], vermisst: [] });
    expect(nachDemEingang(["toString"], [], {}).vermisst).toEqual(["toString"]);
  });

  describe("verarbeitungsanzeige", () => {
    const ruhe = {
      github: true,
      laufend: false,
      wartend: 0,
      vermisst: 0,
      hochgeladen: 0,
      fertigeZeile: false,
      rot: false,
      anstossFehler: false,
    };

    it("sagt nichts und bietet nichts, wenn nichts ist", () => {
      expect(verarbeitungsanzeige(ruhe)).toEqual({ satz: "", rot: null, knopf: null, verwerfen: false });
    });

    it("nach dem Hochladen: startet gleich, ohne Knopf", () => {
      const a = verarbeitungsanzeige({ ...ruhe, hochgeladen: 1, fertigeZeile: true, vermisst: 1 });
      expect(a.satz).toBe("Hochgeladen. Die Verarbeitung startet gleich.");
      expect(a.knopf).toBeNull();
    });

    it("roter Lauf mit Teil-Commit: das kaputte wartet, im Eingang, mit Verwerfen", () => {
      const a = verarbeitungsanzeige({ ...ruhe, wartend: 1, hochgeladen: 1, fertigeZeile: true, rot: true });
      expect(a.satz).toBe("Ein Bild wartet auf die Verarbeitung.");
      expect(a.rot).toBe("Das Bild liegt weiter sicher im Eingang.");
      expect(a.knopf).toBe("Noch einmal versuchen");
      expect(a.verwerfen).toBe(true);
      expect(verarbeitungsanzeige({ ...ruhe, wartend: 2, rot: true }).rot).toBe("Die Bilder liegen weiter sicher im Eingang.");
    });

    it("roter Lauf, Eingang leer, Bild nicht im Manifest: kein „startet gleich“, kein „im Eingang“, aber ein Knopf", () => {
      const a = verarbeitungsanzeige({ ...ruhe, vermisst: 1, hochgeladen: 1, fertigeZeile: true, rot: true });
      expect(a.satz).toBe("");
      expect(a.rot).toBe("Verloren ist nichts — versuch es noch einmal.");
      expect(a.knopf).toBe("Noch einmal versuchen");
      expect(a.verwerfen).toBe(false);
      // Wartet daneben noch etwas, stimmt „im Eingang“ nur halb — dann der allgemeine Satz.
      expect(verarbeitungsanzeige({ ...ruhe, wartend: 1, vermisst: 1, rot: true }).rot).toBe(
        "Verloren ist nichts — versuch es noch einmal.",
      );
    });

    it("roter Lauf, der nichts mehr betrifft, oder während ein neuer läuft: kein roter Lauf", () => {
      // Alles angekommen, nichts wartet (etwa nur die Vorschaukarte gescheitert).
      expect(verarbeitungsanzeige({ ...ruhe, rot: true })).toEqual({ satz: "", rot: null, knopf: null, verwerfen: false });
      // Ein neuer Lauf läuft: dessen Ergebnis zählt, kein Knopf, kein Verwerfen.
      const a = verarbeitungsanzeige({ ...ruhe, laufend: true, wartend: 1, vermisst: 1, rot: true });
      expect(a.satz).toMatch(/^Die Bilder werden verarbeitet/);
      expect(a.rot).toBeNull();
      expect(a.knopf).toBeNull();
      expect(a.verwerfen).toBe(false);
    });

    it("Anstoß gescheitert: Grund im Satz, Knopf zum Wiederholen", () => {
      const a = verarbeitungsanzeige({ ...ruhe, hochgeladen: 1, fertigeZeile: true, anstossFehler: true });
      expect(a.satz).toBe("Hochgeladen, aber die Verarbeitung ließ sich nicht starten.");
      expect(a.knopf).toBe("Noch einmal versuchen");
      expect(verarbeitungsanzeige({ ...ruhe, wartend: 2 }).knopf).toBe("Verarbeitung starten");
    });

    it("widerspricht sich nie und lässt nichts ohne Weg weiter", () => {
      const ja = [false, true];
      for (const laufend of ja)
        for (const rot of ja)
          for (const anstossFehler of ja)
            for (const fertigeZeile of ja)
              for (const wartend of [0, 1, 2])
                for (const vermisst of [0, 1]) {
                  const l = { ...ruhe, laufend, rot, anstossFehler, fertigeZeile, wartend, vermisst, hochgeladen: vermisst };
                  const a = verarbeitungsanzeige(l);
                  // „startet gleich“ nie zusammen mit einem roten Lauf oder gescheitertem Anstoß.
                  if (a.satz.includes("startet gleich")) expect(a.rot === null && !anstossFehler).toBe(true);
                  // „im Eingang“ nur, wenn dort etwas liegt und nichts dazwischen hängt.
                  if (a.rot?.includes("im Eingang")) expect(wartend > 0 && vermisst === 0).toBe(true);
                  // Ein roter Lauf, der etwas betrifft, hat immer einen Knopf.
                  if (a.rot !== null) expect(a.knopf).toBe("Noch einmal versuchen");
                  // Ohne GitHub nie ein Knopf.
                  expect(verarbeitungsanzeige({ ...l, github: false }).knopf).toBeNull();
                }
    });
  });

  it("schreibt Größen deutsch", () => {
    expect(groesse(1024 * 1024 * 12.34)).toBe("12,3 MB");
  });
});
