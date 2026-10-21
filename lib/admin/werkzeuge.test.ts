import { describe, expect, it } from "vitest";
import manifest from "../bilder-manifest.json";
import type { Bildquelle } from "../bilder";
import { INHALT, type Inhalt } from "../inhalt";
import { nurFehler, pruefeInhalt } from "../inhalt-pruefen";
import { fotosFuerHero, fotosFuerMosaik } from "../arbeiten";
import {
  aendereArbeit,
  aendereFilm,
  alleFotos,
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
  hatBilder,
  legeInPapierkorb,
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
  setzeAusschnitt,
  setzeBildtext,
  setzeFotoReihenfolge,
  setzeUeberBeschriftung,
  slug,
  stabil,
  stelleWiederHer,
  tagAus,
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
} from "./werkzeuge";
import type { Lauf } from "./vertrag";

/**
 * Die Rechnungen der Verwaltung. Die Oberfläche ruft nur diese Funktionen
 * auf — was hier stimmt, stimmt dort.
 */

const BILDER = manifest as Record<string, Bildquelle>;
const kopie = (): Inhalt => structuredClone(INHALT);
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
    /* Dieselbe Liste, in der `app/page.tsx` jedes Startbild sucht. */
    expect(wahl).toEqual(fotosFuerMosaik(k(i)).map((b) => b.schluessel));
    expect(wahl.length).toBeGreaterThan(0);
    expect(wahl.every((s) => s.startsWith("arbeiten/"))).toBe(true);
    expect(wahl).not.toContain("arbeiten/stamp/01");
    expect(wahl).not.toContain("arbeiten/stamp/02");
    expect(wahl).not.toContain("ueber/01");
    expect(wahl).not.toContain("portrait");
    expect(Object.keys(BILDER).some((s) => s.startsWith("ueber/"))).toBe(true);
    for (const s of INHALT.ausgeblendet) expect(wahl).not.toContain(s);
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

  it("schreibt Größen deutsch", () => {
    expect(groesse(1024 * 1024 * 12.34)).toBe("12,3 MB");
  });
});
