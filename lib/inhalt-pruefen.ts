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
  /**
   * Wo, in Worten für Jakob — so, wie es in den Reitern heißt: „Arbeit
   * „STAMP“ · Kunde", „Startseite · Großes Bild oben". Was nach dem Ort
   * steht, ist der Name des Felds (für „Zeigen" in der Verwaltung).
   */
  ort: string;
  text: string;
  /**
   * Das Bild, um das es geht. Dann nennt `text` es **nicht** — die
   * Verwaltung setzt seinen Namen davor („„STAMP · 02“ ist ausgeblendet …")
   * und öffnet es über „Zeigen". Nur bei Warnungen: Die Build-Ausgabe
   * (`lib/content.ts`) zeigt nur Fehler, nur `ort` und `text`.
   */
  schluessel?: string;
  /** Die Kennung der Arbeit bzw. des Films, um die es geht — „Zeigen" klappt sie auf. */
  kennung?: string;
};

/** Der Ort des leisen Hinweises auf Bilder ohne Beschreibung — die Verwaltung listet sie dort auf. */
export const ORT_BESCHREIBUNGEN = "Bildbeschreibungen";

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

/**
 * Die Bildplätze der Startseite in Worten für Jakob — überall dieselben
 * (Reiter Startseite, „Verwendet: …" im Bild-Panel). Highlights zählen ab 1.
 */
export const STARTPLATZ_NAMEN = {
  heroErsatz: "Großes Bild oben",
  wegeFoto: "Bild zum Bereich Foto",
  wegeFilm: "Bild zum Bereich Film",
  highlight: (n: number) => `Highlight ${n}`,
} as const;

/** Obergrenzen gegen Versehen (eingefügter Roman) — keine Stilregeln. */
const MAX = { kurz: 120, zeile: 800, alt: 400, notiz: 1000, liste: 2000 };

const istText = (w: unknown): w is string => typeof w === "string";
const istObjekt = (w: unknown): w is Record<string, unknown> =>
  typeof w === "object" && w !== null && !Array.isArray(w);

/**
 * Ein **echtes** Datum `JJJJ-MM-TT` — nicht nur die Form. ⚠️ „2026-99-99"
 * hat die Form, liefe im Papierkorb aber nie ab (`utcTag` in
 * `inhalt-regeln.mjs` gibt dafür `null` zurück), und die Verwaltung zeigte
 * dauerhaft „noch 30 Tage".
 */
export function istTag(w: unknown): w is string {
  if (!istText(w) || !DATUM.test(w)) return false;
  const d = new Date(`${w}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === w;
}

/** `https://`, dann der Host bis `/`, `?`, `#` oder zum Ende — ohne `@`. */
const ANFANG = /^https:\/\/[^/?#@]+(?:[/?#]|$)/i;

/**
 * Eine https-Adresse mit Host — und ohne Leerraum, Anführungszeichen,
 * spitze Klammern und Backslash. ⚠️ Das ist mehr als Form: Die Links von
 * „Über mich“ stehen im JSON-LD jeder Seite (`app/StructuredData.tsx`), und
 * `new URL` nimmt auch `https://x/</script><script>…` an. Bewusst kein
 * Vergleich mit `u.href`: Der lehnte schon `https://host` ohne
 * abschließenden Schrägstrich ab.
 *
 * Seit 2026-10-21 außerdem:
 * - **wörtlich `https://` vorne** (`ANFANG`). `new URL` nimmt auch
 *   `https:host.de` an — im Link auf der Seite ist das aber ein Pfad
 *   relativ zur Seite.
 * - **kein Benutzerteil, auch kein leerer** (`ANFANG`, dazu `username`
 *   und `password`): Bei `https://user@host.de` sieht man vorne den
 *   falschen Host.
 * - **ein Punkt im Host, ohne leere Teile.** `https://SWR` und
 *   `https://@jakobsax` sind für `new URL` gültig, führen aber nirgendwohin.
 */
export function istHttps(w: unknown): boolean {
  if (!istText(w) || !ANFANG.test(w) || /[\s<>"'`\\]/.test(w)) return false;
  try {
    const u = new URL(w);
    return u.protocol === "https:" && /^[^.]+(\.[^.]+)+$/.test(u.hostname) && u.username === "" && u.password === "";
  } catch {
    return false;
  }
}

/** Für die Fehlertexte, wenn `istHttps` nein sagt — für Jakob, ohne Fachwörter. */
const OHNE_ZEICHEN = "ohne Leerzeichen und ohne Zeichen wie < > \" '";
const KEINE_ADRESSE = `muss eine vollständige https://-Adresse sein, ${OHNE_ZEICHEN}.`;

/**
 * Prüft den Inhalt. `bilder` sind die Schlüssel, die es im Manifest gibt —
 * was dort fehlt, ist eine **Warnung** (noch in Verarbeitung oder gelöscht),
 * nie ein Fehler: Sonst bräche ein Upload, der gerade läuft, den Build.
 */
export function pruefeInhalt(eingabe: unknown, bilder: Iterable<string>): Befund[] {
  const befunde: Befund[] = [];
  type Bezug = Pick<Befund, "schluessel" | "kennung">;
  const fehler = (ort: string, text: string) => befunde.push({ stufe: "fehler", ort, text });
  const warnung = (ort: string, text: string, bezug: Bezug = {}) =>
    befunde.push({ stufe: "warnung", ort, text, ...bezug });
  const hinweis = (ort: string, text: string) => befunde.push({ stufe: "hinweis", ort, text });
  /** Alles, was seit `ab` dazukam, gehört zu dieser Arbeit bzw. diesem Film. */
  const gehoertZu = (ab: number, kennung: unknown) => {
    if (istText(kennung)) for (const b of befunde.slice(ab)) b.kennung = kennung;
  };
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
    if (!istHttps(w.url)) fehler(`${ort} · Adresse`, KEINE_ADRESSE);
  }

  function kunde(ort: string, w: unknown, pflicht: boolean) {
    if (w === undefined && !pflicht) return;
    if (!text(ort, w)) return;
    if (RECHTSFORM.test(w)) {
      fehler(ort, `ohne Rechtsform schreiben (kein „e.V.“, keine „GmbH“) — Regel E10: „${w}“.`);
    }
  }

  /* ── Seite und Startseite ───────────────────────────────────────── */

  /* Name, Zeile und Orte stehen in der Verwaltung im Reiter Startseite —
     dort heißen sie auch hier so. */
  if (istObjekt(i.seite)) {
    text("Startseite · Name", i.seite.name);
    text("Startseite · Zeile unter dem Namen", i.seite.positioning, { max: 200 });
    text("Startseite · Orte", i.seite.locations);
  } else fehler("Seite", "fehlt.");

  const startNamen: [string, string | null][] = [];
  const platz = (name: string, w: unknown) => {
    const ort = `Startseite · ${name}`;
    startNamen.push([ort, einSchluessel(ort, w, true)]);
  };
  if (istObjekt(i.startseite)) {
    const s = i.startseite;
    if (s.heroVideo !== null && !istHttps(s.heroVideo)) {
      fehler("Startseite · Video oben", `muss leer sein oder eine https://-Adresse, ${OHNE_ZEICHEN}.`);
    }
    if (s.heroAlt !== null) {
      text("Startseite · Beschreibung des großen Bilds oben", s.heroAlt, { max: MAX.alt });
    }
    platz(STARTPLATZ_NAMEN.heroErsatz, s.heroErsatz);
    if (istObjekt(s.wege)) {
      platz(STARTPLATZ_NAMEN.wegeFoto, s.wege.foto);
      platz(STARTPLATZ_NAMEN.wegeFilm, s.wege.film);
    } else fehler("Startseite · Bilder zu Foto und Film", "fehlen.");
    if (Array.isArray(s.highlights) && s.highlights.length === 4) {
      s.highlights.forEach((h, n) => platz(STARTPLATZ_NAMEN.highlight(n + 1), h));
    } else fehler("Startseite · Highlights", "müssen genau vier Plätze sein (leere Plätze als null).");
  } else fehler("Startseite", "fehlt.");

  /* ── Fotoarbeiten ───────────────────────────────────────────────── */

  const arbeitIds = new Set<string>();
  /* So heißt eine Arbeit in den Befunden: beim Titel — die Kennung nur, wenn er fehlt. */
  const arbeitName = new Map<string, string>();
  const nameVon = (eintrag: Record<string, unknown>) =>
    istText(eintrag.titel) && eintrag.titel.trim() !== "" ? eintrag.titel : String(eintrag.id);
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
        const ab = befunde.length;
        const ort = `Arbeit „${nameVon(a)}“`;
        if (!istText(a.id) || !ID.test(a.id)) {
          fehler(`${ort} · Kennung`, "nur Kleinbuchstaben, Ziffern und Bindestriche, höchstens 60 Zeichen.");
        } else if (arbeitIds.has(a.id)) fehler(`${ort} · Kennung`, `„${a.id}“ gibt es zweimal.`);
        else {
          arbeitIds.add(a.id);
          arbeitName.set(a.id, nameVon(a));
        }
        if (!istText(a.kategorie) || !kategorien.has(a.kategorie)) {
          fehler(`${ort} · Kategorie`, `„${String(a.kategorie)}“ ist keine der Kategorien.`);
        }
        text(`${ort} · Titel`, a.titel);
        kunde(`${ort} · Kunde`, a.kunde, false);
        for (const feld of ["bildtitel", "alt"] as const) {
          const w = a[feld];
          const wort = feld === "alt" ? "Bildbeschreibung" : "Bildtitel";
          if (w === undefined) continue;
          if (!istObjekt(w)) {
            fehler(`${ort} · ${wort}`, "ist keine Zuordnung Bild → Text.");
            continue;
          }
          for (const [name, wert] of Object.entries(w)) {
            if (!BILDNAME.test(name)) fehler(`${ort} · ${wort}`, `„${name}“ ist kein Bildname (leitbild, 01, 02 …).`);
            text(`${ort} · ${wort} „${name}“`, wert, { max: feld === "alt" ? MAX.alt : MAX.kurz });
          }
        }
        if (a.notiz !== undefined) text(`${ort} · Notiz`, a.notiz, { leer: true, max: MAX.notiz });
        gehoertZu(ab, a.id);
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
    /* Wie viele Bilder es sind, zählt erst unten — dafür muss klar sein,
       was ausgeblendet oder gelöscht ist. */
  } else fehler("Fotos", "fehlen.");

  /* ── Über mich ─────────────────────────────────────────────────── */

  let ueberReihenfolge: string[] = [];
  if (istObjekt(i.ueber)) {
    const u = i.ueber;
    /* In der Verwaltung heißen die Zeilen „Absatz 1", „Absatz 2" … */
    if (Array.isArray(u.zeilen) && u.zeilen.length > 0) {
      u.zeilen.forEach((z, n) => text(`Über mich · Absatz ${n + 1}`, z, { max: MAX.zeile }));
      if (u.zeilen.length > 4) warnung("Über mich · Text", `${u.zeilen.length} Absätze — gedacht sind drei bis vier.`);
    } else fehler("Über mich · Text", "fehlt.");
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
      const ab = befunde.length;
      const ort = `Film „${nameVon(film)}“`;
      if (!istText(film.id) || !ID.test(film.id)) {
        fehler(`${ort} · Kennung`, "nur Kleinbuchstaben, Ziffern und Bindestriche.");
      } else if (ids.has(film.id)) fehler(`${ort} · Kennung`, `„${film.id}“ gibt es zweimal.`);
      else ids.add(film.id);
      text(`${ort} · Titel`, film.titel);
      kunde(`${ort} · Kunde`, film.kunde, true);
      if (!istHttps(film.link)) fehler(`${ort} · Link`, KEINE_ADRESSE);
      if (istText(film.id) && !vorhanden.has(`film/${film.id}`)) {
        warnung(ort, "hat (noch) kein Standbild und erscheint deshalb nicht.");
      }
      if (film.notiz !== undefined) text(`${ort} · Notiz`, film.notiz, { leer: true, max: MAX.notiz });
      gehoertZu(ab, film.id);
    }
  } else fehler("Filme", "fehlen.");

  /* ── Ausgeblendet, Papierkorb, Ausschnitte ─────────────────────── */

  const ausgeblendet = new Set(schluesselListe("Ausgeblendet", i.ausgeblendet));
  const papierkorb = new Set<string>();
  if (istObjekt(i.papierkorb)) {
    for (const [k, tag] of Object.entries(i.papierkorb)) {
      if (!SCHLUESSEL.test(k)) fehler("Papierkorb", `ungültiger Bildschlüssel „${k}“.`);
      if (!istText(tag) || !DATUM.test(tag)) fehler("Papierkorb", `„${k}“: Datum muss JJJJ-MM-TT sein.`);
      else if (!istTag(tag)) fehler("Papierkorb", `„${k}“: „${tag}“ ist kein gültiges Datum.`);
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

  /* Diese Warnungen nennen das Bild nicht im Text, sondern als `schluessel`
     — die Verwaltung setzt den Namen davor, den Jakob aus den Reitern kennt. */
  const leer = "der Platz bleibt auf der Seite leer";
  for (const [ort, k, folge] of [
    ...startNamen.map(([ort, k]) => [ort, k, leer] as const),
    ...hero.map((k) => ["Hero auf /foto", k, "im Hero erscheint es nicht"] as const),
  ]) {
    if (!k) continue;
    if (!vorhanden.has(k)) warnung(ort, "gibt es (noch) nicht — wird es gerade verarbeitet?", { schluessel: k });
    const grund = unsichtbar(k);
    /* Auf der Startseite bleibt der Platz eines verborgenen Bildes leer, im
       Hero von /foto fällt es still heraus. */
    if (grund) warnung(ort, `${grund} — ${folge}.`, { schluessel: k });
  }

  /* Die Startseite sucht jedes Bild unter den Fotos von /foto
     (`fotosFuerMosaik` in `app/page.tsx`) — ein Bild von „Über mich" oder
     ein Film-Standbild fände sie nie. */
  for (const [ort, k] of startNamen) {
    if (k && !k.startsWith("arbeiten/")) warnung(ort, `ist kein Foto aus /foto — ${leer}.`, { schluessel: k });
  }

  /* Gezählt wird, was im Hero zu sehen ist. Ob das Bild schon im Manifest
     steht, zählt bewusst nicht — sonst bräche ein laufender Upload den
     Build. */
  if (istObjekt(i.foto)) {
    const sichtbar = hero.filter((k) => !unsichtbar(k)).length;
    if (sichtbar < 6 || sichtbar > 8) {
      const zahl = sichtbar === 1 ? "ein sichtbares Bild" : `${sichtbar} sichtbare Bilder`;
      warnung("Hero auf /foto", `hat ${zahl} — empfohlen sind sechs bis acht.`);
    }
    if (sichtbar === 0) fehler("Hero auf /foto", "braucht mindestens ein sichtbares Bild.");
  }

  /* Arbeiten, die nichts zeigen, erscheinen nicht (UI-SPEC). */
  for (const id of arbeitIds) {
    const ort = `Arbeit „${arbeitName.get(id) ?? id}“`;
    const eigene = [...vorhanden].filter((k) => k === `arbeiten/${id}` || k.startsWith(`arbeiten/${id}/`));
    if (eigene.length === 0) warnung(ort, "hat (noch) kein Bild und erscheint nicht.", { kennung: id });
    else if (eigene.every((k) => unsichtbar(k))) {
      warnung(ort, "hat kein sichtbares Bild und erscheint nicht — alle sind ausgeblendet oder gelöscht.", {
        kennung: id,
      });
    }
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
    if (ohne > 0) {
      const wer = ohne === 1 ? "Ein sichtbares Bild hat" : `${ohne} sichtbare Bilder haben`;
      hinweis(ORT_BESCHREIBUNGEN, `${wer} noch keine Beschreibung (Alt-Text).`);
    }
  }

  return befunde;
}

/** Nur die Fehler — die blockieren Speichern und Build. */
export function nurFehler(befunde: Befund[]): Befund[] {
  return befunde.filter((b) => b.stufe === "fehler");
}
