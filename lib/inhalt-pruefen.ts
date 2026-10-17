import type { Inhalt } from "./inhalt";

/**
 * **Die eine Prüfung für `lib/inhalt.json`** — läuft an drei Stellen mit
 * denselben Regeln:
 *
 * 1. beim **Build** (`lib/content.ts`): Ein Fehler bricht den Build ab, und
 *    Cloudflare lässt dann einfach die alte Fassung online. Ein kaputter
 *    Stand geht so nie live.
 * 2. in der **Verwaltung**, live beim Bearbeiten (Hinweise am Rand) und
 *    3. **vor jedem Speichern** auf dem Server (`/api/admin/speichern`): Mit
 *    einem Fehler wird gar nicht erst committet.
 *
 * Drei Stufen:
 * - **fehler** — verhindert Speichern und Build. Nur, was die Seite kaputt
 *   machte oder eine verbindliche Regel bricht (Form, doppelte ids,
 *   Rechtsform im Kunden, kein `https`).
 * - **warnung** — wird angezeigt, Speichern geht trotzdem. Was Jakob bewusst
 *   anders wollen kann (fünf statt sechs Bilder im Hero) oder was sich
 *   gleich von selbst erledigt (Bild wird noch verarbeitet).
 * - **hinweis** — leise, z. B. fehlende Bildbeschreibungen.
 *
 * Bekommt `unknown`, weil auf dem Server ein Request-Body hereinkommt — die
 * Prüfung muss jede Form überleben und darf nie werfen.
 */

export type Befund = {
  stufe: "fehler" | "warnung" | "hinweis";
  /** Wo, in Worten für Jakob: „Arbeit „STAMP“ · Kunde". */
  ort: string;
  text: string;
};

/** Ein Bildschlüssel: Pfad unter `original/` ohne Endung. */
const SCHLUESSEL = /^[a-z0-9][a-z0-9_-]*(\/[a-z0-9][a-z0-9_-]*){0,3}$/;
/** id einer Arbeit oder eines Films = Ordner- bzw. Dateiname im Bucket. */
export const ID = /^[a-z0-9][a-z0-9-]{0,59}$/;
/** Name eines Bildes innerhalb seiner Arbeit. */
const BILDNAME = /^(leitbild|\d{2})$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const AUSSCHNITT = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/;
/** UI-SPEC, E10: keine Rechtsformzusätze in der Beschriftung. */
export const RECHTSFORM = /\b(e\.\s?V\.|gGmbH|GmbH|UG)(?=$|[\s,/)])/;

/** Obergrenzen gegen Versehen (eingefügter Roman) — keine Stilregeln. */
const MAX = { kurz: 120, zeile: 800, alt: 400, notiz: 1000, liste: 2000 };

const istText = (w: unknown): w is string => typeof w === "string";
const istObjekt = (w: unknown): w is Record<string, unknown> =>
  typeof w === "object" && w !== null && !Array.isArray(w);

function istHttps(w: unknown): boolean {
  if (!istText(w)) return false;
  try {
    return new URL(w).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Prüft den Inhalt. `bilder` sind die Schlüssel, die es im Manifest gibt —
 * was dort fehlt, ist eine **Warnung** (noch in Verarbeitung oder gelöscht),
 * nie ein Fehler: Sonst bräche ein Upload, der gerade läuft, den Build.
 */
export function pruefeInhalt(eingabe: unknown, bilder: Iterable<string>): Befund[] {
  const befunde: Befund[] = [];
  const fehler = (ort: string, text: string) => befunde.push({ stufe: "fehler", ort, text });
  const warnung = (ort: string, text: string) => befunde.push({ stufe: "warnung", ort, text });
  const hinweis = (ort: string, text: string) => befunde.push({ stufe: "hinweis", ort, text });
  const vorhanden = new Set(bilder);

  if (!istObjekt(eingabe)) {
    fehler("Inhalt", "ist kein Objekt.");
    return befunde;
  }
  const i = eingabe as Partial<Record<keyof Inhalt, unknown>>;

  /* ── Hilfen ─────────────────────────────────────────────────────── */

  function text(ort: string, w: unknown, opt: { leer?: boolean; max?: number } = {}): w is string {
    if (!istText(w)) {
      fehler(ort, "fehlt oder ist kein Text.");
      return false;
    }
    if (!opt.leer && w.trim() === "") fehler(ort, "ist leer.");
    if (w.length > (opt.max ?? MAX.kurz)) fehler(ort, `ist länger als ${opt.max ?? MAX.kurz} Zeichen.`);
    return true;
  }

  function schluesselListe(ort: string, w: unknown): string[] {
    if (!Array.isArray(w)) {
      fehler(ort, "ist keine Liste.");
      return [];
    }
    if (w.length > MAX.liste) fehler(ort, `hat mehr als ${MAX.liste} Einträge.`);
    const gesehen = new Set<string>();
    const gut: string[] = [];
    for (const k of w) {
      if (!istText(k) || !SCHLUESSEL.test(k)) {
        fehler(ort, `enthält einen ungültigen Bildschlüssel: ${JSON.stringify(k)}.`);
        continue;
      }
      if (gesehen.has(k)) fehler(ort, `nennt „${k}“ doppelt.`);
      gesehen.add(k);
      gut.push(k);
    }
    return gut;
  }

  function einSchluessel(ort: string, w: unknown, darfNull: boolean): string | null {
    if (w === null && darfNull) return null;
    if (!istText(w) || !SCHLUESSEL.test(w)) {
      fehler(ort, `ist kein gültiger Bildschlüssel: ${JSON.stringify(w)}.`);
      return null;
    }
    return w;
  }

  function link(ort: string, w: unknown) {
    if (!istObjekt(w)) {
      fehler(ort, "fehlt.");
      return;
    }
    text(`${ort} · Bezeichnung`, w.label);
    if (!istHttps(w.url)) fehler(`${ort} · Adresse`, "muss mit https:// beginnen.");
  }

  function kunde(ort: string, w: unknown, pflicht: boolean) {
    if (w === undefined && !pflicht) return;
    if (!text(ort, w)) return;
    if (RECHTSFORM.test(w)) {
      fehler(ort, `ohne Rechtsform schreiben (kein „e.V.“, keine „GmbH“) — Regel E10: „${w}“.`);
    }
  }

  /* ── Seite und Startseite ───────────────────────────────────────── */

  if (istObjekt(i.seite)) {
    text("Seite · Name", i.seite.name);
    text("Seite · Zeile im Hero", i.seite.positioning, { max: 200 });
    text("Seite · Orte", i.seite.locations);
  } else fehler("Seite", "fehlt.");

  const startNamen: [string, string | null][] = [];
  if (istObjekt(i.startseite)) {
    const s = i.startseite;
    if (s.heroVideo !== null && !istHttps(s.heroVideo)) {
      fehler("Startseite · Hero-Video", "ist weder leer noch eine https://-Adresse.");
    }
    if (s.heroAlt !== null) text("Startseite · Beschreibung des Standbilds", s.heroAlt, { max: MAX.alt });
    startNamen.push(["Startseite · Ersatzbild", einSchluessel("Startseite · Ersatzbild", s.heroErsatz, true)]);
    if (istObjekt(s.wege)) {
      startNamen.push(["Startseite · Weg „foto“", einSchluessel("Startseite · Weg „foto“", s.wege.foto, true)]);
      startNamen.push(["Startseite · Weg „film“", einSchluessel("Startseite · Weg „film“", s.wege.film, true)]);
    } else fehler("Startseite · Wege", "fehlen.");
    if (Array.isArray(s.highlights) && s.highlights.length === 4) {
      s.highlights.forEach((h, n) =>
        startNamen.push([`Startseite · Highlight ${n + 1}`, einSchluessel(`Startseite · Highlight ${n + 1}`, h, true)]),
      );
    } else fehler("Startseite · Highlights", "müssen genau vier Plätze sein (leere Plätze als null).");
  } else fehler("Startseite", "fehlt.");

  /* ── Fotoarbeiten ───────────────────────────────────────────────── */

  const arbeitIds = new Set<string>();
  let reihenfolge: string[] = [];
  let hero: string[] = [];
  if (istObjekt(i.foto)) {
    const f = i.foto;
    const kategorien = new Set<string>();
    if (Array.isArray(f.kategorien) && f.kategorien.length > 0) {
      for (const k of f.kategorien) {
        if (!istText(k) || !ID.test(k)) fehler("Kategorien", `ungültiger Name: ${JSON.stringify(k)}.`);
        else if (kategorien.has(k)) fehler("Kategorien", `„${k}“ steht doppelt da.`);
        else kategorien.add(k);
      }
    } else fehler("Kategorien", "fehlen.");

    if (Array.isArray(f.arbeiten)) {
      for (const a of f.arbeiten) {
        if (!istObjekt(a)) {
          fehler("Arbeiten", "enthalten einen Eintrag, der kein Objekt ist.");
          continue;
        }
        const ort = `Arbeit „${istText(a.titel) ? a.titel : String(a.id)}“`;
        if (!istText(a.id) || !ID.test(a.id)) {
          fehler(`${ort} · Kennung`, "nur Kleinbuchstaben, Ziffern und Bindestriche, höchstens 60 Zeichen.");
        } else if (arbeitIds.has(a.id)) fehler(`${ort} · Kennung`, `„${a.id}“ gibt es zweimal.`);
        else arbeitIds.add(a.id);
        if (!istText(a.kategorie) || !kategorien.has(a.kategorie)) {
          fehler(`${ort} · Kategorie`, `„${String(a.kategorie)}“ ist keine der Kategorien.`);
        }
        text(`${ort} · Titel`, a.titel);
        kunde(`${ort} · Kunde`, a.kunde, false);
        for (const feld of ["bildtitel", "alt"] as const) {
          const w = a[feld];
          if (w === undefined) continue;
          if (!istObjekt(w)) {
            fehler(`${ort} · ${feld}`, "ist keine Zuordnung Bild → Text.");
            continue;
          }
          for (const [name, wert] of Object.entries(w)) {
            if (!BILDNAME.test(name)) fehler(`${ort} · ${feld}`, `„${name}“ ist kein Bildname (leitbild, 01, 02 …).`);
            text(`${ort} · ${feld} „${name}“`, wert, { max: feld === "alt" ? MAX.alt : MAX.kurz });
          }
        }
        if (a.notiz !== undefined) text(`${ort} · Notiz`, a.notiz, { leer: true, max: MAX.notiz });
      }
    } else fehler("Arbeiten", "fehlen.");

    reihenfolge = schluesselListe("Mosaik · Reihenfolge", f.reihenfolge);
    for (const k of reihenfolge) {
      const id = k.split("/")[0] === "arbeiten" ? k.split("/")[1] : null;
      if (!id || !arbeitIds.has(id) || k.split("/").length > 3) {
        fehler("Mosaik · Reihenfolge", `„${k}“ gehört zu keiner Arbeit.`);
      }
    }

    hero = schluesselListe("Hero auf /foto", f.hero);
    for (const k of hero) {
      const id = k.split("/")[0] === "arbeiten" ? k.split("/")[1] : null;
      if (!id || !arbeitIds.has(id)) fehler("Hero auf /foto", `„${k}“ gehört zu keiner Arbeit.`);
    }
    if (hero.length < 6 || hero.length > 8) {
      warnung("Hero auf /foto", `hat ${hero.length} Bilder — empfohlen sind sechs bis acht (UI-SPEC).`);
    }
    if (hero.length === 0) fehler("Hero auf /foto", "braucht mindestens ein Bild.");
  } else fehler("Fotos", "fehlen.");

  /* ── Über mich ─────────────────────────────────────────────────── */

  let ueberReihenfolge: string[] = [];
  if (istObjekt(i.ueber)) {
    const u = i.ueber;
    if (Array.isArray(u.zeilen) && u.zeilen.length > 0) {
      u.zeilen.forEach((z, n) => text(`Über mich · Zeile ${n + 1}`, z, { max: MAX.zeile }));
      if (u.zeilen.length > 4) warnung("Über mich · Zeilen", `${u.zeilen.length} Zeilen — gedacht sind drei bis vier.`);
    } else fehler("Über mich · Zeilen", "fehlen.");
    text("Über mich · Beschreibung des Porträts", u.portraitAlt, { max: MAX.alt });
    if (!istText(u.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) {
      fehler("Über mich · E-Mail", "ist keine E-Mail-Adresse.");
    }
    link("Über mich · Instagram", u.instagram);
    link("Über mich · SWR", u.swr);
    if (istObjekt(u.bilder)) {
      for (const [k, w] of Object.entries(u.bilder)) {
        if (!/^ueber\/[a-z0-9_-]+$/.test(k)) fehler("Über mich · Beschriftungen", `„${k}“ ist kein Bild unter ueber/.`);
        text(`Über mich · Beschriftung „${k}“`, w);
      }
    } else fehler("Über mich · Beschriftungen", "fehlen.");
    ueberReihenfolge = schluesselListe("Über mich · Reihenfolge", u.reihenfolge);
    for (const k of ueberReihenfolge) {
      if (!/^ueber\/[a-z0-9_-]+$/.test(k)) fehler("Über mich · Reihenfolge", `„${k}“ ist kein Bild unter ueber/.`);
    }
  } else fehler("Über mich", "fehlt.");

  /* ── Filme ─────────────────────────────────────────────────────── */

  if (Array.isArray(i.filme)) {
    const ids = new Set<string>();
    for (const film of i.filme) {
      if (!istObjekt(film)) {
        fehler("Filme", "enthalten einen Eintrag, der kein Objekt ist.");
        continue;
      }
      const ort = `Film „${istText(film.titel) ? film.titel : String(film.id)}“`;
      if (!istText(film.id) || !ID.test(film.id)) {
        fehler(`${ort} · Kennung`, "nur Kleinbuchstaben, Ziffern und Bindestriche.");
      } else if (ids.has(film.id)) fehler(`${ort} · Kennung`, `„${film.id}“ gibt es zweimal.`);
      else ids.add(film.id);
      text(`${ort} · Titel`, film.titel);
      kunde(`${ort} · Kunde`, film.kunde, true);
      if (!istHttps(film.link)) fehler(`${ort} · Link`, "muss eine https://-Adresse sein.");
      if (istText(film.id) && !vorhanden.has(`film/${film.id}`)) {
        warnung(ort, "hat (noch) kein Standbild und erscheint deshalb nicht.");
      }
      if (film.notiz !== undefined) text(`${ort} · Notiz`, film.notiz, { leer: true, max: MAX.notiz });
    }
  } else fehler("Filme", "fehlen.");

  /* ── Ausgeblendet, Papierkorb, Ausschnitte ─────────────────────── */

  const ausgeblendet = new Set(schluesselListe("Ausgeblendet", i.ausgeblendet));
  const papierkorb = new Set<string>();
  if (istObjekt(i.papierkorb)) {
    for (const [k, tag] of Object.entries(i.papierkorb)) {
      if (!SCHLUESSEL.test(k)) fehler("Papierkorb", `ungültiger Bildschlüssel „${k}“.`);
      if (!istText(tag) || !DATUM.test(tag)) fehler("Papierkorb", `„${k}“: Datum muss JJJJ-MM-TT sein.`);
      papierkorb.add(k);
    }
  } else fehler("Papierkorb", "fehlt.");

  if (istObjekt(i.bildausschnitte)) {
    for (const [k, w] of Object.entries(i.bildausschnitte)) {
      if (!SCHLUESSEL.test(k)) fehler("Bildausschnitte", `ungültiger Bildschlüssel „${k}“.`);
      const t = istText(w) ? w.match(AUSSCHNITT) : null;
      if (!t || Number(t[1]) > 100 || Number(t[2]) > 100) {
        fehler("Bildausschnitte", `„${k}“: „${String(w)}“ ist kein Ausschnitt wie „50% 30%“.`);
      }
    }
  } else fehler("Bildausschnitte", "fehlen.");

  /* ── Querbezüge: was genannt wird, aber nicht zu sehen ist ─────── */

  const unsichtbar = (k: string) =>
    ausgeblendet.has(k) ? "ist ausgeblendet" : papierkorb.has(k) ? "liegt im Papierkorb" : null;

  for (const [ort, k] of [...startNamen, ...hero.map((k) => ["Hero auf /foto", k] as [string, string])]) {
    if (!k) continue;
    if (!vorhanden.has(k)) warnung(ort, `„${k}“ gibt es (noch) nicht — wird es gerade verarbeitet?`);
    const grund = unsichtbar(k);
    /* Auf der Startseite fiele ein ausgeblendetes Bild nicht weg, sondern
       bliebe stehen — im Hero von /foto fiele es still heraus. */
    if (grund) warnung(ort, `„${k}“ ${grund}.`);
  }

  /* Arbeiten, die nichts zeigen, erscheinen nicht (UI-SPEC). */
  for (const id of arbeitIds) {
    const eigene = [...vorhanden].filter((k) => k === `arbeiten/${id}` || k.startsWith(`arbeiten/${id}/`));
    if (eigene.length === 0) warnung(`Arbeit „${id}“`, "hat (noch) kein Bild und erscheint nicht.");
    else if (eigene.every((k) => unsichtbar(k))) warnung(`Arbeit „${id}“`, "alle Bilder sind ausgeblendet oder gelöscht.");
  }

  /* Leise: sichtbare Bilder ohne Beschreibung. Gesammelt statt je Bild,
     sonst ertränken 30 Hinweise jede echte Warnung. */
  if (istObjekt(i.foto) && Array.isArray(i.foto.arbeiten)) {
    let ohne = 0;
    for (const k of vorhanden) {
      const id = k.split("/")[0] === "arbeiten" ? k.split("/")[1] : null;
      const a = (i.foto.arbeiten as unknown[]).find((x) => istObjekt(x) && x.id === id) as
        | Record<string, unknown>
        | undefined;
      if (!a || unsichtbar(k)) continue;
      const name = k.split("/").length === 2 ? "leitbild" : k.split("/")[2];
      const alt = istObjekt(a.alt) ? a.alt[name] : undefined;
      if (!istText(alt) || alt.trim() === "") ohne += 1;
    }
    if (ohne > 0) hinweis("Bildbeschreibungen", `${ohne} sichtbare Bilder haben noch keine Beschreibung (Alt-Text).`);
  }

  return befunde;
}

/** Nur die Fehler — die blockieren Speichern und Build. */
export function nurFehler(befunde: Befund[]): Befund[] {
  return befunde.filter((b) => b.stufe === "fehler");
}
