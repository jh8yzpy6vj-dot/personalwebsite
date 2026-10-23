import { describe, expect, it } from "vitest";

import { VIDEO_ZIEL as VIDEO_ZIEL_VERTRAG, VIDEOTYPEN, ZIEL as ZIEL_VERTRAG } from "./admin/vertrag";
import { fotosFuerMosaik } from "./arbeiten";
import type { Bildquelle } from "./bilder";
import manifest from "./bilder-manifest.json";
import { arbeitZu as arbeitZuTs, bildName as bildNameTs, INHALT, type Inhalt } from "./inhalt";
import { nurFehler, pruefeInhalt } from "./inhalt-pruefen";
import {
  abgelaufen,
  arbeitZu,
  ausPapierkorb,
  bildName,
  entferneSchluessel,
  istSchluessel,
  istSichtbaresFoto,
  ordneEingang,
  originaleVon,
  planePapierkorb,
  VIDEO_ENDUNGEN,
  VIDEO_ZIEL,
  ZIEL,
  zerlegeEingang,
} from "./inhalt-regeln.mjs";

/**
 * Regeln der Medien-Action rund um `lib/inhalt.json`.
 *
 * ⚠️ Die ersten beiden Blöcke halten **doppelt geführte** Regeln gleich:
 * `ZIEL` steht in `lib/admin/vertrag.ts` (Worker) und in
 * `lib/inhalt-regeln.mjs` (Node), `bildName`/`arbeitZu` in `lib/inhalt.ts`
 * und in der `.mjs`, `istSichtbaresFoto` spiegelt `fotosFuerMosaik`
 * (`lib/arbeiten.ts`). Node kann die TS-Dateien nicht laden, vitest schon —
 * also wird hier verglichen.
 */
describe("doppelt geführte Regeln", () => {
  it("ZIEL ist dieselbe Regel wie im Vertrag", () => {
    expect(ZIEL.source).toBe(ZIEL_VERTRAG.source);
    expect(ZIEL.flags).toBe(ZIEL_VERTRAG.flags);
  });

  it("das Video-Ziel ist dasselbe, und jede Endung des Worker kennt die Action", () => {
    expect(VIDEO_ZIEL).toBe(VIDEO_ZIEL_VERTRAG);
    expect(ZIEL.test(VIDEO_ZIEL)).toBe(true);
    for (const endung of Object.values(VIDEOTYPEN)) expect(VIDEO_ENDUNGEN.has(endung), endung).toBe(true);
  });

  it("bildName und arbeitZu stimmen mit lib/inhalt.ts überein", () => {
    const proben = [
      "arbeiten/at-tension",
      "arbeiten/at-tension/03",
      "arbeiten/wiwawo-52/serie/03",
      "ueber/01",
      "film/goldbarren",
      "portrait",
      "hero/standbild",
      ...Object.keys(manifest),
    ];
    for (const s of proben) {
      expect(bildName(s), s).toBe(bildNameTs(s));
      expect(arbeitZu(s), s).toBe(arbeitZuTs(s));
    }
  });

  it("istSichtbaresFoto sagt genau für die Fotos ja, die fotosFuerMosaik zeigt", () => {
    const bilder = manifest as Record<string, Bildquelle>;
    const verborgen = structuredClone(INHALT);
    const [erstes, zweites] = fotosFuerMosaik({ inhalt: INHALT, bilder }).map((b) => b.schluessel);
    verborgen.ausgeblendet.push(erstes);
    verborgen.papierkorb[zweites] = "2026-10-21";
    const ohneArbeit = structuredClone(INHALT);
    ohneArbeit.foto.arbeiten = ohneArbeit.foto.arbeiten.slice(1);
    const proben = [...Object.keys(bilder), "arbeiten/gibt-es-nicht/01", "arbeiten/wiwawo-52/serie/03", "ueber/01", "portrait"];
    for (const inhalt of [INHALT, verborgen, ohneArbeit]) {
      const mosaik = new Set(fotosFuerMosaik({ inhalt, bilder }).map((b) => b.schluessel));
      for (const s of proben) expect(istSichtbaresFoto(inhalt, bilder, s), s).toBe(mosaik.has(s));
    }
    expect(istSichtbaresFoto(verborgen, bilder, erstes)).toBe(false);
    expect(istSichtbaresFoto(verborgen, bilder, zweites)).toBe(false);
    expect(istSichtbaresFoto(INHALT, bilder, erstes)).toBe(true);
  });
});

describe("ZIEL und zerlegeEingang", () => {
  it("nimmt die sechs Formen an", () => {
    for (const z of ["arbeiten/at-tension", "arbeiten/at-tension/03", "ueber/01", "film/gold-2026", "portrait", "hero/film"]) {
      expect(ZIEL.test(z), z).toBe(true);
    }
  });

  it("lehnt Pfad-Ausbrüche und Fremdes ab", () => {
    for (const z of [
      "../original/portrait",
      "arbeiten/../portrait",
      "arbeiten/x/../../y",
      "/portrait",
      "portrait/",
      "arbeiten/X",
      "arbeiten/x/3",
      "arbeiten/x/serie/03",
      "hero/standbild",
      "hero/film/01",
      "hero",
      "ueber/1",
      "original/portrait",
      "portrait\n",
    ]) {
      expect(ZIEL.test(z), JSON.stringify(z)).toBe(false);
    }
  });

  it("zerlegt Schlüssel des Eingangs", () => {
    expect(zerlegeEingang("arbeiten/x/03.png")).toEqual({ ziel: "arbeiten/x/03", endung: "png" });
    expect(zerlegeEingang("portrait.JPG")).toEqual({ ziel: "portrait", endung: "jpg" });
    expect(zerlegeEingang("portrait")).toBeNull();
    expect(zerlegeEingang("portrait.exe")).toBeNull();
    expect(zerlegeEingang("../portrait.jpg")).toBeNull();
    expect(zerlegeEingang("hero/standbild.jpg")).toBeNull();
    expect(zerlegeEingang(".jpg")).toBeNull();
  });

  it("hero/film nimmt nur Videos, alle anderen Ziele nur Bilder", () => {
    expect(zerlegeEingang("hero/film.mov")).toEqual({ ziel: "hero/film", endung: "mov" });
    expect(zerlegeEingang("hero/film.MP4")).toEqual({ ziel: "hero/film", endung: "mp4" });
    expect(zerlegeEingang("hero/film.jpg")).toBeNull();
    expect(zerlegeEingang("portrait.mp4")).toBeNull();
    expect(zerlegeEingang("film/gold.mov")).toBeNull();
  });

  it("originaleVon trennt Video und Standbild unter demselben Schlüssel", () => {
    const keys = ["original/hero/film.mp4", "original/hero/film.mov", "original/hero/film.jpg"];
    expect(originaleVon(keys, "hero/film")).toEqual(["original/hero/film.jpg"]);
    expect(originaleVon(keys, "hero/film", VIDEO_ENDUNGEN)).toEqual(["original/hero/film.mp4", "original/hero/film.mov"]);
  });
});

describe("ordneEingang", () => {
  it("nimmt je Ziel die neueste Datei, die älteren hängen daran", () => {
    const { dateien, unbekannt } = ordneEingang([
      { key: "portrait.jpg", geaendert: "2026-10-17T10:00:00.000Z" },
      { key: "portrait.png", geaendert: "2026-10-17T11:00:00.000Z" },
      { key: "ueber/02.webp", geaendert: "2026-10-17T09:00:00.000Z" },
      { key: "notizen.txt", geaendert: "2026-10-17T09:00:00.000Z" },
      { key: "../boese.jpg" },
    ]);
    expect(dateien).toEqual([
      { key: "portrait.png", ziel: "portrait", ueberholt: ["portrait.jpg"] },
      { key: "ueber/02.webp", ziel: "ueber/02", ueberholt: [] },
    ]);
    expect(unbekannt).toEqual(["../boese.jpg", "notizen.txt"]);
  });

  it("entscheidet bei gleichem Zeitpunkt fest, unabhängig von der Reihenfolge", () => {
    const a = { key: "portrait.jpg", geaendert: "2026-10-17T10:00:00.000Z" };
    const b = { key: "portrait.png", geaendert: "2026-10-17T10:00:00.000Z" };
    expect(ordneEingang([a, b]).dateien).toEqual(ordneEingang([b, a]).dateien);
  });
});

describe("abgelaufen", () => {
  const heute = new Date("2026-10-17T03:17:00Z");

  it("erst ab dem 31. Tag", () => {
    expect(
      abgelaufen(
        {
          "ueber/01": "2026-09-16", // 31 Tage
          "ueber/02": "2026-09-17", // 30 Tage
          "ueber/03": "2026-10-17", // heute
          "ueber/04": "2025-01-01",
        },
        heute,
      ),
    ).toEqual(["ueber/01", "ueber/04"]);
  });

  it("zählt UTC-Tage, nicht Stunden", () => {
    // Kurz nach Mitternacht UTC zählt der neue Tag schon voll.
    expect(abgelaufen({ portrait: "2026-09-16" }, new Date("2026-10-17T00:00:01Z"))).toEqual(["portrait"]);
    expect(abgelaufen({ portrait: "2026-09-16" }, new Date("2026-10-16T23:59:59Z"))).toEqual([]);
  });

  it("lässt Unlesbares und kaputte Schlüssel stehen", () => {
    expect(
      abgelaufen(
        {
          "ueber/01": "2026-02-30",
          "ueber/02": "gestern",
          "ueber/03": "2026-9-1",
          "../original": "2020-01-01",
          "": "2020-01-01",
        },
        heute,
      ),
    ).toEqual([]);
  });

  it("verträgt einen fehlenden Papierkorb", () => {
    expect(abgelaufen(undefined, heute)).toEqual([]);
    expect(abgelaufen(null, heute)).toEqual([]);
  });

  it("nimmt eine andere Frist", () => {
    expect(abgelaufen({ portrait: "2026-10-10" }, heute, 5)).toEqual(["portrait"]);
  });
});

describe("originaleVon und istSchluessel", () => {
  const keys = [
    "original/arbeiten/x.jpg",
    "original/arbeiten/x.PNG",
    "original/arbeiten/x/01.jpg",
    "original/arbeiten/xy.jpg",
    "original/arbeiten/x.mp4",
    "original/arbeiten/x.jpg.bak",
  ];

  it("trifft genau die Originale dieses Schlüssels, keine Unterordner", () => {
    expect(originaleVon(keys, "arbeiten/x")).toEqual(["original/arbeiten/x.jpg", "original/arbeiten/x.PNG"]);
    expect(originaleVon(keys, "arbeiten/x/01")).toEqual(["original/arbeiten/x/01.jpg"]);
  });

  it("trifft bei kaputten Schlüsseln nichts", () => {
    for (const s of ["", "arbeiten/", "/arbeiten/x", "arbeiten//x", "..", "arbeiten/../x"]) {
      expect(istSchluessel(s), s).toBe(false);
      expect(originaleVon(keys, s), s).toEqual([]);
    }
  });
});

describe("entferneSchluessel", () => {
  function beispiel(): Inhalt {
    const i = structuredClone(INHALT);
    const arbeit = i.foto.arbeiten[0];
    arbeit.bildtitel = { "03": "Cie. A", leitbild: "Cie. B" };
    arbeit.alt = { "03": "Szene" };
    const s = `arbeiten/${arbeit.id}/03`;
    i.foto.reihenfolge = [s, "ueber/01", `arbeiten/${arbeit.id}`];
    i.foto.hero = [s, `arbeiten/${arbeit.id}`];
    i.ueber.reihenfolge = ["ueber/01", s];
    i.ueber.bilder = { ...i.ueber.bilder, [s]: "egal" };
    i.ausgeblendet = [s, "ueber/02"];
    i.papierkorb = { [s]: "2026-09-01", "ueber/04": "2026-10-01" };
    i.bildausschnitte = { [s]: "50% 20%", "ueber/01": "50% 50%" };
    i.startseite.heroErsatz = s;
    i.startseite.wege = { foto: s, film: s };
    i.startseite.highlights = ["ueber/01", s, null, s];
    return i;
  }

  it("entfernt jeden Bezug und lässt alles andere stehen", () => {
    const vorher = beispiel();
    const id = vorher.foto.arbeiten[0].id;
    const s = `arbeiten/${id}/03`;
    const nachher = entferneSchluessel(vorher, s);

    expect(JSON.stringify(nachher)).not.toContain(`"${s}"`);
    expect(nachher.foto.reihenfolge).toEqual(["ueber/01", `arbeiten/${id}`]);
    expect(nachher.foto.hero).toEqual([`arbeiten/${id}`]);
    expect(nachher.ueber.reihenfolge).toEqual(["ueber/01"]);
    expect(nachher.ausgeblendet).toEqual(["ueber/02"]);
    expect(nachher.papierkorb).toEqual({ "ueber/04": "2026-10-01" });
    expect(nachher.bildausschnitte).toEqual({ "ueber/01": "50% 50%" });
    expect(nachher.startseite.heroErsatz).toBeNull();
    expect(nachher.startseite.wege).toEqual({ foto: null, film: null });
    // Feste Plätze werden leer, nichts rückt nach.
    expect(nachher.startseite.highlights).toEqual(["ueber/01", null, null, null]);
    // Titel und Alt-Text hängen am Bildnamen; leere Objekte fallen weg.
    expect(nachher.foto.arbeiten[0].bildtitel).toEqual({ leitbild: "Cie. B" });
    expect(nachher.foto.arbeiten[0].alt).toBeUndefined();
    // Andere Arbeiten unberührt.
    expect(nachher.foto.arbeiten.slice(1)).toEqual(vorher.foto.arbeiten.slice(1));
  });

  it("verändert die Eingabe nicht", () => {
    const vorher = beispiel();
    const kopie = structuredClone(vorher);
    entferneSchluessel(vorher, `arbeiten/${vorher.foto.arbeiten[0].id}/03`);
    expect(vorher).toEqual(kopie);
  });

  it("trifft beim Startbild einer Arbeit den Bildnamen „leitbild“", () => {
    const vorher = beispiel();
    const id = vorher.foto.arbeiten[0].id;
    const nachher = entferneSchluessel(vorher, `arbeiten/${id}`);
    expect(nachher.foto.arbeiten[0].bildtitel).toEqual({ "03": "Cie. A" });
  });

  /*
   * Der Ernstfall: Der Papierkorb läuft nachts, niemand schaut zu, und der
   * nächste Deploy prüft den Inhalt mit `pruefeInhalt`. Entsteht dabei ein
   * Fehler, bricht der Build ab — ausgelöst vom Aufräumen.
   */
  it("hinterlässt für jedes Bild des echten Inhalts keinen neuen Prüffehler", () => {
    const alleBilder = Object.keys(manifest);
    const vorher = nurFehler(pruefeInhalt(INHALT, alleBilder)).length;
    for (const s of alleBilder) {
      const nachher = entferneSchluessel(INHALT, s);
      const fehler = nurFehler(pruefeInhalt(nachher, alleBilder.filter((b) => b !== s)));
      expect(fehler.length, `${s}: ${fehler.map((f) => f.text).join(" | ")}`).toBeLessThanOrEqual(vorher);
    }
  });

  it("bleibt im Schreibformat stabil (keine leeren Objekte, keine undefined)", () => {
    const nachher = entferneSchluessel(INHALT, "ueber/01");
    expect(JSON.parse(JSON.stringify(nachher))).toEqual(nachher);
  });
});

describe("planePapierkorb", () => {
  const heute = new Date("2026-10-17T03:17:00Z");

  it("löscht abgelaufene Originale samt Eintrag", () => {
    const plan = planePapierkorb(
      { "ueber/01": "2026-09-01", "ueber/02": "2026-10-10" },
      [
        { key: "original/ueber/01.jpg", geaendert: "2026-08-01T10:00:00Z" },
        { key: "original/ueber/01.png", geaendert: "2026-08-01T10:00:00Z" },
        { key: "original/ueber/02.jpg", geaendert: "2026-08-01T10:00:00Z" },
        { key: "original/ueber/010.jpg", geaendert: "2026-08-01T10:00:00Z" },
      ],
      heute,
    );
    expect(plan).toEqual({
      loeschen: ["original/ueber/01.jpg", "original/ueber/01.png"],
      entfernen: ["ueber/01"],
      ersetzt: [],
    });
  });

  it("entfernt den Eintrag auch, wenn das Original schon fehlt", () => {
    // Ein früherer Lauf hat gelöscht, konnte aber nicht mehr committen.
    expect(planePapierkorb({ portrait: "2026-09-01" }, [], heute)).toEqual({
      loeschen: [],
      entfernen: ["portrait"],
      ersetzt: [],
    });
  });

  it("verschont ein nach dem Löschtag neu hochgeladenes Bild", () => {
    expect(
      planePapierkorb(
        { "ueber/03": "2026-09-01" },
        [{ key: "original/ueber/03.jpg", geaendert: "2026-09-02T08:00:00Z" }],
        heute,
      ),
    ).toEqual({ loeschen: [], entfernen: [], ersetzt: ["ueber/03"] });
  });

  it("am Löschtag selbst gilt der Papierkorb", () => {
    expect(
      planePapierkorb(
        { "ueber/03": "2026-09-01" },
        [{ key: "original/ueber/03.jpg", geaendert: "2026-09-01T23:00:00Z" }],
        heute,
      ).entfernen,
    ).toEqual(["ueber/03"]);
  });

  it("ausPapierkorb streicht nur den Eintrag", () => {
    const vorher = { ...structuredClone(INHALT), papierkorb: { "ueber/03": "2026-09-01" } };
    const nachher = ausPapierkorb(vorher, "ueber/03");
    expect(nachher.papierkorb).toEqual({});
    expect({ ...nachher, papierkorb: vorher.papierkorb }).toEqual(vorher);
  });
});
