import { alleBilderDerArbeit, fotosFuerMosaik, nachWunsch, type Kontext } from "../arbeiten";
import { AUSSCHNITT_MITTIG, type Streckenbild } from "../bilder";
import { arbeitZu, bildName, type Film, type Fotoarbeit, type Inhalt, type Link } from "../inhalt";
import { ID, istHttps, nurFehler, pruefeInhalt, RECHTSFORM, type Befund } from "../inhalt-pruefen";
import { BILDTYPEN, MAX_UPLOAD_BYTES, ZIEL, type Lauf, type Verarbeitung } from "./vertrag";

/**
 * **Reine Hilfsfunktionen der Verwaltung** (`app/admin`).
 *
 * Alles, was die Oberfläche rechnet, ohne React und ohne Netz — damit es
 * getestet werden kann (`werkzeuge.test.ts`). Die Oberfläche ruft nur diese
 * Funktionen auf und hält den Zustand; sie entscheidet nichts selbst.
 *
 * Jede Änderung am Inhalt ist eine Funktion `Inhalt → Inhalt`, die **nichts
 * verändert, sondern eine Kopie zurückgibt**. React erkennt eine Änderung nur
 * an einem neuen Objekt; ein still verändertes Objekt sähe nach „nichts
 * geschehen" aus, und der Speichern-Knopf bliebe grau.
 */

/* ── Vergleichen ────────────────────────────────────────────────────── */

/**
 * JSON mit **sortierten Schlüsseln**. Grund: Wer einen Bildtitel löscht und
 * neu eintippt, hat denselben Inhalt — aber der Schlüssel steht jetzt an
 * anderer Stelle im Objekt, und ein schlichtes `JSON.stringify` meldete
 * „ungespeichert".
 */
export function stabil(wert: unknown): string {
  return JSON.stringify(wert, (_, w: unknown) =>
    w && typeof w === "object" && !Array.isArray(w)
      ? Object.fromEntries(Object.entries(w as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : w,
  );
}

export const gleich = (a: unknown, b: unknown) => stabil(a) === stabil(b);

/* ── Kennungen ──────────────────────────────────────────────────────── */

/**
 * Kennung aus einem Titel: Umlaute ausgeschrieben, klein, alles andere wird
 * Bindestrich, höchstens 60 Zeichen. „tête-à-tête 2026" → `tete-a-tete-2026`.
 * Kann leer sein (Titel nur aus Sonderzeichen) — dann `eindeutigeId`.
 */
export function slug(titel: string): string {
  return titel
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    /* é → e usw.: zerlegen, dann die Akzente fallen lassen. */
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/**
 * Eine Kennung, die es noch nicht gibt: `slug(titel)`, sonst mit `-2`, `-3` …
 * Die Kennung ist der **Ordnername im Bucket** und wird danach nicht mehr
 * geändert — deshalb muss sie gleich beim Anlegen eindeutig sein.
 */
export function eindeutigeId(titel: string, vergeben: Iterable<string>, ersatz = "neu"): string {
  const belegt = new Set(vergeben);
  const basis = slug(titel) || ersatz;
  if (!belegt.has(basis)) return basis;
  for (let n = 2; ; n++) {
    const anhang = `-${n}`;
    const kandidat = `${basis.slice(0, 60 - anhang.length).replace(/-+$/g, "")}${anhang}`;
    if (!belegt.has(kandidat)) return kandidat;
  }
}

/* ── Ziele beim Hochladen ───────────────────────────────────────────── */

export type Zielart = { arbeit: string } | "ueber";

export type Zielwahl = { ok: true; ziele: string[] } | { ok: false; text: string };

/**
 * Wohin `anzahl` neue Bilder kommen.
 *
 * - Arbeit: zuerst das Startbild `arbeiten/<id>`, falls es noch keines gibt,
 *   dann `arbeiten/<id>/NN` mit der nächsten Nummer **nach der höchsten**.
 * - Über mich: `ueber/NN`, ebenso.
 *
 * `belegt` sind Manifest + Eingang + in dieser Sitzung Hochgeladenes.
 *
 * ⚠️ Bewusst nach der höchsten Nummer statt in die erste Lücke: Eine Lücke
 * ist meist ein gelöschtes Bild, dessen Bildtitel oder Platz in der
 * Reihenfolge noch in `inhalt.json` steht — ein neues Bild erbte sie still.
 */
export function naechsteZiele(art: Zielart, anzahl: number, belegt: Iterable<string>): Zielwahl {
  const schon = new Set(belegt);
  const ordner = art === "ueber" ? "ueber" : `arbeiten/${art.arbeit}`;
  const ziele: string[] = [];
  if (art !== "ueber" && !schon.has(ordner) && anzahl > 0) ziele.push(ordner);
  const muster = new RegExp(`^${ordner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(\\d{2})$`);
  let hoechste = 0;
  for (const k of schon) {
    const t = k.match(muster);
    if (t) hoechste = Math.max(hoechste, Number(t[1]));
  }
  while (ziele.length < anzahl) {
    hoechste += 1;
    if (hoechste > 99) {
      return { ok: false, text: "Mehr als 99 Bilder passen nicht in einen Ordner. Lösch oder ersetze erst welche." };
    }
    ziele.push(`${ordner}/${String(hoechste).padStart(2, "0")}`);
  }
  if (!ziele.every((z) => ZIEL.test(z))) return { ok: false, text: "Ungültiges Ziel." };
  return { ok: true, ziele };
}

/** Der Bildtyp einer Datei — notfalls aus der Endung, weil Windows TIFFs oft ohne Typ meldet. */
export function dateiTyp(datei: { name: string; type: string }): string | null {
  if (datei.type in BILDTYPEN) return datei.type;
  if (datei.type) return null;
  const endung = datei.name.toLowerCase().split(".").pop() ?? "";
  const nachEndung: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    tif: "image/tiff",
    tiff: "image/tiff",
  };
  return nachEndung[endung] ?? null;
}

/** Prüft eine Datei **vor** dem Hochladen, damit nichts 40 MB weit umsonst reist. */
export function pruefeDatei(datei: { name: string; type: string; size: number }): { ok: true; typ: string } | { ok: false; text: string } {
  const typ = dateiTyp(datei);
  if (!typ) {
    const heic = /\.(heic|heif)$/i.test(datei.name) || /hei[cf]/i.test(datei.type);
    return {
      ok: false,
      text: heic
        ? `„${datei.name}“ ist HEIC (iPhone). Bitte als JPEG exportieren.`
        : `„${datei.name}“ ist kein JPEG, PNG, WebP oder TIFF.`,
    };
  }
  if (datei.size > MAX_UPLOAD_BYTES) {
    return { ok: false, text: `„${datei.name}“ ist größer als ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` };
  }
  if (datei.size === 0) return { ok: false, text: `„${datei.name}“ ist leer.` };
  return { ok: true, typ };
}

/* ── Reihenfolgen ───────────────────────────────────────────────────── */

/** Verschiebt ein Element von `von` nach `nach` (Kopie). */
export function verschiebe<T>(liste: T[], von: number, nach: number): T[] {
  if (von < 0 || von >= liste.length) return liste.slice();
  const ziel = Math.max(0, Math.min(liste.length - 1, nach));
  const neu = liste.slice();
  const [stueck] = neu.splice(von, 1);
  neu.splice(ziel, 0, stueck);
  return neu;
}

/**
 * Setzt eine umsortierte **Teilmenge** zurück in die ganze Folge: Die Plätze,
 * die ihre Elemente in `gesamt` hatten, bekommen sie in der neuen Ordnung;
 * alles andere bleibt, wo es ist.
 *
 * Wofür: Die Verwaltung zeigt gelöschte Bilder nicht an, ihr Platz in
 * `foto.reihenfolge` soll aber bleiben — sonst landete ein wiederhergestelltes
 * Bild am Ende statt an seinem Platz. Neues, das `gesamt` nicht kennt, kommt
 * ans Ende.
 */
export function ersetzeTeilfolge(gesamt: string[], neu: string[]): string[] {
  const teil = new Set(neu);
  const ergebnis: string[] = [];
  let n = 0;
  for (const s of gesamt) {
    if (teil.has(s)) {
      if (n < neu.length) ergebnis.push(neu[n++]);
    } else ergebnis.push(s);
  }
  while (n < neu.length) ergebnis.push(neu[n++]);
  return [...new Set(ergebnis)];
}

/**
 * **Alle** Fotos aller Arbeiten — auch ausgeblendete und gelöschte — in der
 * Reihenfolge des Mosaiks: erst, was in `foto.reihenfolge` steht, dann der
 * Rest in natürlicher Ordnung (Kategorie, Arbeit, Dateiname). Dieselbe
 * Regel wie `fotosFuerMosaik`, nur ohne Filter.
 */
export function alleFotos(k: Kontext): Streckenbild[] {
  const { kategorien, arbeiten } = k.inhalt.foto;
  const geordnet = [
    ...kategorien.flatMap((kat) => arbeiten.filter((a) => a.kategorie === kat)),
    /* Eine Arbeit mit unbekannter Kategorie ist ein Fehler, der gemeldet
       wird — ihre Bilder dürfen hier trotzdem nicht verschwinden. */
    ...arbeiten.filter((a) => !kategorien.includes(a.kategorie)),
  ];
  return nachWunsch(
    geordnet.flatMap((a) => alleBilderDerArbeit(a, k)),
    k.inhalt.foto.reihenfolge,
  );
}

/** Alle Bilder unter `ueber/` (ohne Unterordner), in der Reihenfolge von `ueber.reihenfolge`. */
export function alleUeberBilder(k: Kontext): Streckenbild[] {
  const natuerlich = Object.keys(k.bilder)
    .filter((s) => /^ueber\/[^/]+$/.test(s))
    .sort()
    .map((schluessel) => ({
      schluessel,
      quelle: k.bilder[schluessel],
      ausschnitt: k.inhalt.bildausschnitte[schluessel] ?? AUSSCHNITT_MITTIG,
    }));
  return nachWunsch(natuerlich, k.inhalt.ueber.reihenfolge);
}

/* ── Änderungen am Inhalt (alle als Kopie) ──────────────────────────── */

/** Tiefe Kopie — `inhalt.json` ist reines JSON, also genügt das. */
const kopie = (i: Inhalt): Inhalt => structuredClone(i);

export function umschalteAusgeblendet(i: Inhalt, s: string): Inhalt {
  const n = kopie(i);
  n.ausgeblendet = n.ausgeblendet.includes(s) ? n.ausgeblendet.filter((x) => x !== s) : [...n.ausgeblendet, s];
  return n;
}

export function umschalteHero(i: Inhalt, s: string): Inhalt {
  const n = kopie(i);
  n.foto.hero = n.foto.hero.includes(s) ? n.foto.hero.filter((x) => x !== s) : [...n.foto.hero, s];
  return n;
}

/**
 * In den Papierkorb: mit Datum (die Medien-Action räumt nach 30 Tagen auf).
 * Der Platz in der Reihenfolge **und im Hero bleibt**, damit Wiederherstellen
 * das Bild genau dorthin zurückbringt. Auf der Seite fehlt es trotzdem
 * sofort: `fotosFuerHero` zeigt nur Sichtbares. Nach 30 Tagen nimmt
 * `entferneSchluessel` (`lib/inhalt-regeln.mjs`) es auch aus dem Hero.
 */
export function legeInPapierkorb(i: Inhalt, s: string, datum: string): Inhalt {
  const n = kopie(i);
  n.papierkorb[s] = datum;
  return n;
}

export function stelleWiederHer(i: Inhalt, s: string): Inhalt {
  const n = kopie(i);
  delete n.papierkorb[s];
  return n;
}

/** `null` oder mittig entfernt den Eintrag — mittig ist ohnehin der Standard. */
export function setzeAusschnitt(i: Inhalt, s: string, wert: string | null): Inhalt {
  const n = kopie(i);
  if (wert === null || wert === AUSSCHNITT_MITTIG) delete n.bildausschnitte[s];
  else n.bildausschnitte[s] = wert;
  return n;
}

/** Ausschnitt aus einem Klick: Anteil 0…1 → „x% y%", ganzzahlig, im Rahmen. */
export function ausschnittAus(x: number, y: number): string {
  const p = (w: number) => Math.round(Math.max(0, Math.min(1, w)) * 100);
  return `${p(x)}% ${p(y)}%`;
}

/** „30% 70%" → { x: 30, y: 70 }; alles andere → mittig. */
export function leseAusschnitt(wert: string | undefined): { x: number; y: number } {
  const t = wert?.match(/^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/);
  return t ? { x: Number(t[1]), y: Number(t[2]) } : { x: 50, y: 50 };
}

/** Der Bildtitel bzw. Alt-Text eines Fotos, über seinen Namen in der Arbeit. */
export function bildtext(i: Inhalt, s: string, feld: "bildtitel" | "alt"): string {
  const id = arbeitZu(s);
  const a = i.foto.arbeiten.find((x) => x.id === id);
  return a?.[feld]?.[bildName(s)] ?? "";
}

/** Setzt ihn; leer löscht den Eintrag (und das Feld, wenn nichts mehr darin steht). */
export function setzeBildtext(i: Inhalt, s: string, feld: "bildtitel" | "alt", text: string): Inhalt {
  const id = arbeitZu(s);
  const n = kopie(i);
  const a = n.foto.arbeiten.find((x) => x.id === id);
  if (!a) return i;
  const name = bildName(s);
  const eintraege = { ...(a[feld] ?? {}) };
  if (text === "") delete eintraege[name];
  else eintraege[name] = text;
  if (Object.keys(eintraege).length === 0) delete a[feld];
  else a[feld] = eintraege;
  return n;
}

/** Die neue Reihenfolge des Mosaiks: **vollständig**, alle Schlüssel. */
export function setzeFotoReihenfolge(i: Inhalt, gesamt: string[], sichtbarNeu: string[]): Inhalt {
  const n = kopie(i);
  n.foto.reihenfolge = ersetzeTeilfolge(gesamt, sichtbarNeu);
  return n;
}

export function setzeHero(i: Inhalt, hero: string[]): Inhalt {
  const n = kopie(i);
  n.foto.hero = hero;
  return n;
}

export function setzeUeberReihenfolge(i: Inhalt, gesamt: string[], sichtbarNeu: string[]): Inhalt {
  const n = kopie(i);
  n.ueber.reihenfolge = ersetzeTeilfolge(gesamt, sichtbarNeu);
  return n;
}

export function setzeUeberBeschriftung(i: Inhalt, s: string, text: string): Inhalt {
  const n = kopie(i);
  if (text === "") delete n.ueber.bilder[s];
  else n.ueber.bilder[s] = text;
  return n;
}

/** Ändert Felder einer Arbeit; leerer Kunde und leere Notiz fallen weg (beide optional). */
export function aendereArbeit(
  i: Inhalt,
  id: string,
  aenderung: Partial<Pick<Fotoarbeit, "titel" | "kunde" | "kategorie" | "notiz">>,
): Inhalt {
  const n = kopie(i);
  const a = n.foto.arbeiten.find((x) => x.id === id);
  if (!a) return i;
  Object.assign(a, aenderung);
  if (a.kunde === "") delete a.kunde;
  if (a.notiz === "") delete a.notiz;
  return n;
}

/** Legt eine Arbeit an (am Ende); gibt auch ihre neue Kennung zurück. */
export function neueArbeit(
  i: Inhalt,
  titel: string,
  kategorie: string,
  weitereVergeben: Iterable<string> = [],
): { inhalt: Inhalt; id: string } {
  const id = eindeutigeId(titel, [...i.foto.arbeiten.map((a) => a.id), ...weitereVergeben], "arbeit");
  const n = kopie(i);
  n.foto.arbeiten.push({ id, kategorie, titel: titel.trim() || id });
  return { inhalt: n, id };
}

/** Alle Stellen, an denen ein Schlüssel einer Arbeit stehen kann, werden mit ihr entfernt. */
export function entferneArbeit(i: Inhalt, id: string): Inhalt {
  const n = kopie(i);
  const gehoert = (s: string | null) => s !== null && arbeitZu(s) === id;
  n.foto.arbeiten = n.foto.arbeiten.filter((a) => a.id !== id);
  n.foto.reihenfolge = n.foto.reihenfolge.filter((s) => !gehoert(s));
  n.foto.hero = n.foto.hero.filter((s) => !gehoert(s));
  n.ausgeblendet = n.ausgeblendet.filter((s) => !gehoert(s));
  for (const s of Object.keys(n.papierkorb)) if (gehoert(s)) delete n.papierkorb[s];
  for (const s of Object.keys(n.bildausschnitte)) if (gehoert(s)) delete n.bildausschnitte[s];
  const st = n.startseite;
  if (gehoert(st.heroErsatz)) st.heroErsatz = null;
  if (gehoert(st.wege.foto)) st.wege.foto = null;
  if (gehoert(st.wege.film)) st.wege.film = null;
  st.highlights = st.highlights.map((h) => (gehoert(h) ? null : h));
  return n;
}

/** Ordnet Elemente mit `id` nach einer Liste von ids (für Arbeiten und Filme). */
function nachIds<T extends { id: string }>(liste: T[], ids: string[]): T[] {
  const nachId = new Map(liste.map((x) => [x.id, x]));
  const geordnet = ids.flatMap((id) => nachId.get(id) ?? []);
  return [...geordnet, ...liste.filter((x) => !ids.includes(x.id))];
}

export function ordneArbeiten(i: Inhalt, ids: string[]): Inhalt {
  const n = kopie(i);
  n.foto.arbeiten = nachIds(n.foto.arbeiten, ids);
  return n;
}

/**
 * Legt einen Film an (am Ende). `weitereVergeben`: Standbilder, die schon im
 * Bucket liegen (`film/<id>`) — sonst erbte ein neuer Film still das
 * Standbild eines alten, gleichnamigen.
 *
 * Kunde und Link gleich mit: Beide sind Pflicht, und ein Film ohne sie wäre
 * ein Fehler, der jedes Speichern sperrt — auch das von allem anderen.
 */
export function neuerFilm(
  i: Inhalt,
  titel: string,
  weitereVergeben: Iterable<string> = [],
  { kunde = "", link = "" }: { kunde?: string; link?: string } = {},
): { inhalt: Inhalt; id: string } {
  const id = eindeutigeId(titel, [...i.filme.map((f) => f.id), ...weitereVergeben], "film");
  const n = kopie(i);
  n.filme.push({ id, titel: titel.trim() || id, kunde: kunde.trim(), link: mitHttps(link) });
  return { inhalt: n, id };
}

/** Vorne ein Host mit Punkt, ohne `@` — „youtu.be/…", „//vimeo.com/…". */
const HOST_VORNE = /^(\/\/)?[^\s/@:?#]+\.[^\s/@:?#]+/;

/**
 * Ergänzt ein fehlendes `https://` — so, wie man Adressen oft aus Apps
 * kopiert: „youtu.be/abc" → „https://youtu.be/abc". Leer bleibt leer, und
 * was schon ein Schema hat (`https:`, `http:`, `mailto:` …), bleibt, wie es
 * ist: Ob es taugt, sagt die Prüfung. Bewusst ohne Punkt im Schema, sonst
 * hielte „www.x.de:8080/a" seinen Host für eines.
 *
 * ⚠️ **Nur, wenn vorne ein Host mit Punkt steht** (`HOST_VORNE`). Vorher
 * wurde aus „@jakobsax" still „https://@jakobsax", aus „SWR" „https://SWR"
 * — für die Prüfung gültig, auf der Seite ein toter Link. So ein Text bleibt
 * jetzt stehen, und die Prüfung meldet ihn.
 */
export function mitHttps(w: string): string {
  const t = w.trim();
  if (t === "" || /^[a-z][a-z0-9+-]*:/i.test(t) || !HOST_VORNE.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

/**
 * Warum „Film anlegen" (noch) nicht geht — oder `null`, wenn es geht.
 * Dieselben Regeln wie `pruefeInhalt` für einen Film: Was hier durchgeht,
 * darf dort keinen Fehler geben, sonst sperrte der neue Film sofort jedes
 * Speichern. `link` so, wie er gespeichert würde (nach `mitHttps`).
 */
export function grundGegenFilm(titel: string, kunde: string, link: string): string | null {
  if (titel.trim() === "" || kunde.trim() === "" || link.trim() === "") {
    return "Titel, Kunde und Link braucht jeder Film. Das Standbild lädst du danach hoch.";
  }
  if (RECHTSFORM.test(kunde.trim())) return "Kunde ohne Rechtsform schreiben (GmbH, e.V. …).";
  if (!/^https:\/\//i.test(link)) return "Der Link muss mit https:// beginnen.";
  if (!istHttps(link)) return "Der Link ist keine vollständige Adresse — ohne Leerzeichen und ohne Zeichen wie < > \" '.";
  return null;
}

export function aendereFilm(i: Inhalt, id: string, aenderung: Partial<Omit<Film, "id">>): Inhalt {
  const n = kopie(i);
  const f = n.filme.find((x) => x.id === id);
  if (!f) return i;
  Object.assign(f, aenderung);
  if (f.notiz === "") delete f.notiz;
  return n;
}

/** Entfernt den Film und seinen Ausschnitt. Das Standbild bleibt im Bucket. */
export function entferneFilm(i: Inhalt, id: string): Inhalt {
  const n = kopie(i);
  n.filme = n.filme.filter((f) => f.id !== id);
  delete n.bildausschnitte[`film/${id}`];
  return n;
}

export function ordneFilme(i: Inhalt, ids: string[]): Inhalt {
  const n = kopie(i);
  n.filme = nachIds(n.filme, ids);
  return n;
}

/* ── Datum ──────────────────────────────────────────────────────────── */

/** `JJJJ-MM-TT` in **Ortszeit** — so, wie Jakob den Tag erlebt. */
export function tagAus(d: Date): string {
  const zwei = (z: number) => String(z).padStart(2, "0");
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

/** Wie lange ein Bild im Papierkorb noch wiederherstellbar ist (30 Tage ab Löschen). */
export function restTage(geloescht: string, heute: string): number {
  const ms = Date.parse(`${heute}T00:00:00Z`) - Date.parse(`${geloescht}T00:00:00Z`);
  if (Number.isNaN(ms)) return 30;
  return Math.max(0, 30 - Math.round(ms / 86_400_000));
}

/** „17.10.2026" aus `2026-10-17`. */
export function deutschesDatum(tag: string): string {
  const t = tag.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return t ? `${t[3]}.${t[2]}.${t[1]}` : tag;
}

/* ── Speichern ──────────────────────────────────────────────────────── */

/** Gleicher Commit? GitHub liefert 40 Zeichen, manche Stellen kürzen auf 7. */
export function gleicherCommit(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length < 7 || b.length < 7) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

const EMAIL = /[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}/gi;

/**
 * ⚠️ **Das Repo ist öffentlich.** Eine E-Mail-Adresse in der Commit-Nachricht
 * stünde für immer im Verlauf — Erntefutter für Spam. Deshalb fliegt sie
 * raus, bevor die Nachricht den Browser verlässt.
 */
export function ohneEmail(text: string): string {
  return text.replace(EMAIL, "[E-Mail]");
}

export function enthaeltEmail(text: string): boolean {
  return new RegExp(EMAIL.source, "i").test(text);
}

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

/**
 * Die Kurz-Nachricht zum Speichern, aus dem Unterschied zwischen geladenem
 * und aktuellem Stand: „Mosaik umsortiert, 2 Bilder ausgeblendet". Jakob kann
 * sie überschreiben.
 *
 * Bewusst nur **was** sich geändert hat, nie Werte — so kann keine
 * E-Mail-Adresse (Kontaktzeile) in den öffentlichen Verlauf rutschen. Titel
 * von Arbeiten und Filmen stehen ohnehin auf der Seite.
 */
export function fasseZusammen(alt: Inhalt, neu: Inhalt): string {
  const teile: string[] = [];
  const titel = (t: string) => `„${t.length > 30 ? `${t.slice(0, 29)}…` : t}“`;

  if (!gleich(alt.seite, neu.seite)) teile.push("Name und Zeile");
  if (!gleich(alt.startseite, neu.startseite)) teile.push("Startseite");
  if (!gleich(alt.foto.kategorien, neu.foto.kategorien)) teile.push("Kategorien");

  const altArbeiten = new Map(alt.foto.arbeiten.map((a) => [a.id, a]));
  const neuArbeiten = new Map(neu.foto.arbeiten.map((a) => [a.id, a]));
  for (const a of neu.foto.arbeiten) if (!altArbeiten.has(a.id)) teile.push(`neue Arbeit ${titel(a.titel)}`);
  for (const a of alt.foto.arbeiten) if (!neuArbeiten.has(a.id)) teile.push(`Arbeit ${titel(a.titel)} entfernt`);
  const bearbeitet = neu.foto.arbeiten.filter((a) => altArbeiten.has(a.id) && !gleich(altArbeiten.get(a.id), a));
  if (bearbeitet.length === 1) teile.push(`${titel(bearbeitet[0].titel)} bearbeitet`);
  else if (bearbeitet.length > 1) teile.push(`${bearbeitet.length} Arbeiten bearbeitet`);
  const gemeinsam = (x: string[], y: Set<string>) => x.filter((id) => y.has(id));
  const altIds = alt.foto.arbeiten.map((a) => a.id);
  const neuIds = neu.foto.arbeiten.map((a) => a.id);
  if (!gleich(gemeinsam(altIds, new Set(neuIds)), gemeinsam(neuIds, new Set(altIds)))) teile.push("Arbeiten umsortiert");

  if (!gleich(alt.foto.reihenfolge, neu.foto.reihenfolge)) teile.push("Mosaik umsortiert");
  if (!gleich(alt.foto.hero, neu.foto.hero)) teile.push("Hero");

  const altFilme = new Map(alt.filme.map((f) => [f.id, f]));
  const neuFilme = new Map(neu.filme.map((f) => [f.id, f]));
  for (const f of neu.filme) if (!altFilme.has(f.id)) teile.push(`neuer Film ${titel(f.titel)}`);
  for (const f of alt.filme) if (!neuFilme.has(f.id)) teile.push(`Film ${titel(f.titel)} entfernt`);
  const filmeBearbeitet = neu.filme.filter((f) => altFilme.has(f.id) && !gleich(altFilme.get(f.id), f));
  if (filmeBearbeitet.length === 1) teile.push(`Film ${titel(filmeBearbeitet[0].titel)} bearbeitet`);
  else if (filmeBearbeitet.length > 1) teile.push(`${filmeBearbeitet.length} Filme bearbeitet`);
  const altF = alt.filme.map((f) => f.id);
  const neuF = neu.filme.map((f) => f.id);
  if (!gleich(gemeinsam(altF, new Set(neuF)), gemeinsam(neuF, new Set(altF)))) teile.push("Filme umsortiert");

  if (!gleich(alt.ueber, neu.ueber)) teile.push("Über mich");

  const dazu = (x: string[], y: string[]) => x.filter((s) => !y.includes(s)).length;
  const aus = dazu(neu.ausgeblendet, alt.ausgeblendet);
  const ein = dazu(alt.ausgeblendet, neu.ausgeblendet);
  if (aus) teile.push(`${anzahl(aus, "Bild", "Bilder")} ausgeblendet`);
  if (ein) teile.push(`${anzahl(ein, "Bild", "Bilder")} eingeblendet`);
  const weg = dazu(Object.keys(neu.papierkorb), Object.keys(alt.papierkorb));
  const zurueck = dazu(Object.keys(alt.papierkorb), Object.keys(neu.papierkorb));
  if (weg) teile.push(`${anzahl(weg, "Bild", "Bilder")} gelöscht`);
  if (zurueck) teile.push(`${anzahl(zurueck, "Bild", "Bilder")} wiederhergestellt`);
  if (!gleich(alt.bildausschnitte, neu.bildausschnitte)) teile.push("Bildausschnitte");

  if (teile.length === 0) return "Inhalte bearbeitet";
  const satz = teile.join(", ");
  const gross = satz.charAt(0).toUpperCase() + satz.slice(1);
  return ohneEmail(gross.length > 140 ? `${gross.slice(0, 139)}…` : gross);
}

/**
 * Die Papierkorb-Daten, die der Server beim Speichern festgelegt hat, in den
 * bearbeiteten Inhalt übernehmen — nur für Schlüssel, die dort noch im
 * Papierkorb liegen. Was Jakob während des Speicherns gelöscht oder
 * wiederhergestellt hat, bleibt, wie es ist. Ohne Unterschied derselbe
 * Inhalt (kein neues Objekt).
 */
export function mitPapierkorbDaten(i: Inhalt, daten: Record<string, string>): Inhalt {
  const anders = Object.keys(i.papierkorb).filter((k) => Object.hasOwn(daten, k) && daten[k] !== i.papierkorb[k]);
  if (anders.length === 0) return i;
  const n = kopie(i);
  for (const k of anders) n.papierkorb[k] = daten[k];
  return n;
}

/** Was „Wiederherstellen" mit einem alten Stand anrichten würde. */
export type AlterStand =
  /** Bricht heutige Regeln — der Server lehnte ihn ab. */
  | { art: "unpassend"; fehler: Befund[] }
  /** Genau der Stand von jetzt. */
  | { art: "gleich" }
  /** `text` wie die Nachricht beim Speichern; `papierkorb`: so viele Bilder kämen zurück in den Papierkorb. */
  | { art: "aendert"; text: string; papierkorb: number };

/**
 * Vergleicht einen alten Stand (aus dem Verlauf, **ungeprüft**) mit dem von
 * jetzt. ⚠️ Erst prüfen, dann vergleichen: Alten Ständen können Felder
 * fehlen, die es damals noch nicht gab, und `fasseZusammen` griffe ins Leere.
 *
 * Verglichen wird, was der Server schreiben würde: Liegt ein Bild jetzt wie
 * damals im Papierkorb, behält es sein Datum von jetzt (`papierkorbDaten` in
 * `antwort.ts`). Ein anderes Löschdatum allein ist also keine Änderung.
 */
export function pruefeAltenStand(jetzt: Inhalt, alt: unknown, bilder: Iterable<string>): AlterStand {
  const fehler = nurFehler(pruefeInhalt(alt, bilder));
  if (fehler.length > 0) return { art: "unpassend", fehler };
  const a = mitPapierkorbDaten(alt as Inhalt, jetzt.papierkorb);
  if (gleich(jetzt, a)) return { art: "gleich" };
  const papierkorb = Object.keys(a.papierkorb).filter((k) => !Object.hasOwn(jetzt.papierkorb, k)).length;
  return { art: "aendert", text: fasseZusammen(jetzt, a), papierkorb };
}

/** Befunde nach Stufe. */
export function nachStufe(befunde: Befund[]) {
  return {
    fehler: befunde.filter((b) => b.stufe === "fehler"),
    warnungen: befunde.filter((b) => b.stufe === "warnung"),
    hinweise: befunde.filter((b) => b.stufe === "hinweis"),
  };
}

/* ── Rückgängig und Tasten ──────────────────────────────────────────── */

/**
 * Der Verlauf für „Rückgängig": `rueck` sind frühere Stände (der jüngste
 * zuletzt), `vor` die eben zurückgenommenen — für „Wiederholen".
 *
 * Er lebt nur im offenen Tab, nie auf dem Server. Wer neu lädt, speichert
 * oder einen alten Stand wiederherstellt, beginnt mit einem leeren: Ein
 * Stand von vorher läge sonst unter einer neuen `sha` und schriebe beim
 * Speichern still über, was inzwischen auf `main` steht.
 */
export type Stapel = {
  rueck: Inhalt[];
  vor: Inhalt[];
  /** Zu welcher Gruppe (Tippen in einem Feld) der oberste Schritt gehört — `null`: zu keiner. */
  gruppe: number | null;
};

export const LEERER_STAPEL: Stapel = { rueck: [], vor: [], gruppe: null };

/** So viele Schritte lassen sich höchstens zurücknehmen. */
export const STAPEL_MAX = 50;

/**
 * Legt `alt` ab, bevor `neu` gilt. Ändert sich nichts, bleibt alles, wie es
 * ist. Jede echte Änderung verwirft „Wiederholen".
 *
 * `gruppe`: Tippen in einem Feld trägt eine Nummer je Besuch des Felds
 * (`tippgruppen`), alles andere `null`.
 * Gehört schon der oberste Schritt zu ihr, bleibt der Stand vor dem ersten
 * Buchstaben oben liegen, statt dass jeder Buchstabe ein Schritt wird. Ist
 * danach alles wieder wie vorher (getippt und wieder gelöscht), fällt der
 * Schritt weg — und mit ihm die Gruppe: Weitertippen beginnt einen neuen,
 * statt in den fremden Schritt darunter zu rutschen.
 */
export function legeAb(st: Stapel, alt: Inhalt, neu: Inhalt, gruppe: number | null, max = STAPEL_MAX): Stapel {
  if (gleich(alt, neu)) return st;
  const oben = st.rueck.at(-1);
  if (gruppe !== null && st.gruppe === gruppe && oben) {
    return gleich(oben, neu)
      ? { rueck: st.rueck.slice(0, -1), vor: [], gruppe: null }
      : { rueck: st.rueck, vor: [], gruppe };
  }
  return { rueck: [...st.rueck, alt].slice(-max), vor: [], gruppe };
}

/** Einen Schritt zurück: der neue Stapel und der Inhalt, der dann gilt — `null`, wenn es keinen gibt. */
export function schrittZurueck(st: Stapel, jetzt: Inhalt): { stapel: Stapel; inhalt: Inhalt } | null {
  const inhalt = st.rueck.at(-1);
  if (!inhalt) return null;
  return { stapel: { rueck: st.rueck.slice(0, -1), vor: [...st.vor, jetzt], gruppe: null }, inhalt };
}

/** Einen zurückgenommenen Schritt wiederholen — `null`, wenn es keinen gibt. */
export function schrittVor(st: Stapel, jetzt: Inhalt): { stapel: Stapel; inhalt: Inhalt } | null {
  const inhalt = st.vor.at(-1);
  if (!inhalt) return null;
  return { stapel: { rueck: [...st.rueck, jetzt], vor: st.vor.slice(0, -1), gruppe: null }, inhalt };
}

/**
 * Der Stapel nach erfolgreichem Speichern. Ist `jetzt` genau das Gesendete,
 * beginnt er leer: Was gespeichert ist, nimmt der Verlauf zurück. Kam
 * während des Speicherns etwas dazu, bleibt genau ein Schritt — zurück auf
 * den eben gespeicherten Stand (`gespeichert`, mit der neuen `sha`, also
 * sicher). Ältere Stände nicht: Sie lägen unter der neuen `sha` und nähmen
 * beim nächsten Speichern still zurück, was gerade gespeichert wurde.
 */
export function stapelNachSpeichern(jetzt: Inhalt, gesendet: Inhalt, gespeichert: Inhalt): Stapel {
  return gleich(jetzt, gesendet) ? LEERER_STAPEL : { rueck: [gespeichert], vor: [], gruppe: null };
}

/**
 * Welche Änderung zu welchem Tippen gehört — die `gruppe` für `legeAb`.
 *
 * Zusammengefasst wird nur, was aus der Eingabe eines Felds selbst kommt
 * (`tippe`, aus dessen `input`), und zwar je Besuch des Felds
 * (`neuerBesuch` bei jedem Fokuswechsel). Alles andere — Ziehen, Knöpfe,
 * Tasten — ist ein eigener Schritt, auch wenn der Fokus noch in einem Feld
 * steht. Früher galt „Fokus im Textfeld" als Tippen: Ein Zug im Mosaik
 * landete dann im Schritt des Satzes davor, und „Rückgängig" nahm beides
 * zurück.
 */
export function tippgruppen() {
  let besuch = 0;
  let jetzt: number | null = null;
  return {
    /** Der Fokus ist woanders hingegangen — Tippen danach ist ein neuer Schritt. */
    neuerBesuch() {
      besuch += 1;
    },
    /**
     * Führt `f` als Tippen aus: Was `f` ändert, gehört zur Gruppe dieses
     * Besuchs. `imFokus`: Kommt die Eingabe aus einem Feld ohne Fokus
     * (Autofill), ist sie ein eigener Schritt.
     */
    tippe(f: () => void, imFokus = true) {
      jetzt = imFokus ? besuch : null;
      try {
        f();
      } finally {
        jetzt = null;
      }
    },
    /** Die Gruppe der Änderung, die gerade abgelegt wird — `null` außerhalb von `tippe`. */
    gruppe(): number | null {
      return jetzt;
    },
  };
}

/** Ein Klick mit der Maus: wo (Pixel im Fenster) und wann (ms). */
export type Klick = { x: number; y: number; zeit: number };

/** So kurz nach dem ersten (ms) … */
export const DOPPELKLICK_ZEIT = 600;
/** … und so nah daneben (px) ist ein zweiter Klick Teil eines Doppelklicks. */
export const DOPPELKLICK_ABSTAND = 10;

/**
 * Ist `jetzt` der zweite Klick eines Doppelklicks nach `vorher`? Nach
 * Löschen & Co. rückt die Liste nach, und der zweite Klick träfe an
 * derselben Stelle schon den nächsten Eintrag. Nur an derselben Stelle: Ein
 * schneller Klick auf ein anderes Bild ist gewollt. `null` (per Tastatur,
 * oder vorher nichts weggenommen) ist nie ein Doppelklick.
 */
export function istDoppelklick(vorher: Klick | null, jetzt: Klick | null): boolean {
  if (!vorher || !jetzt) return false;
  return (
    jetzt.zeit - vorher.zeit < DOPPELKLICK_ZEIT &&
    Math.abs(jetzt.x - vorher.x) <= DOPPELKLICK_ABSTAND &&
    Math.abs(jetzt.y - vorher.y) <= DOPPELKLICK_ABSTAND
  );
}

/** Eingaben, in denen man tippt. Datei, Knöpfe, Häkchen gehören nicht dazu. */
const TEXTARTEN = new Set(["text", "email", "url", "search", "tel", "password", "number"]);

/**
 * Ein Feld, in dem getippt wird — dort gilt das Rückgängig des Browsers
 * (`tastenbefehl`). Nimmt ein Element (oder alles mit denselben Feldern,
 * für die Tests).
 */
export function istTextfeld(el: { tagName: string; type?: string; isContentEditable?: boolean } | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") return TEXTARTEN.has((el.type || "text").toLowerCase());
  return el.isContentEditable === true;
}

export type Tastenbefehl = "speichern" | "rueckgaengig" | "wiederholen" | "abfangen";

/**
 * Was ein Tastendruck in der Verwaltung tut — `null`: nichts, der Browser
 * macht weiter wie immer.
 *
 * - Strg/⌘+S speichert, auch aus einem Textfeld und aus dem Seitenpanel.
 *   In einer Rückfrage (`dialog: "anderer"`) nur `abfangen`: kein Speichern
 *   hinter ihrem Rücken, aber auch kein „Seite speichern unter".
 * - Strg/⌘+Z, Strg/⌘+Umschalt+Z und Strg+Y nur außerhalb von Textfeldern —
 *   darin gilt das Rückgängig des Browsers. Ist ein Dialog oder das Panel
 *   offen, nur `abfangen`: Ein Rückgängig dahinter verschöbe, worauf sich
 *   die Rückfrage bezieht (etwa „Absatz 2"). ⌘+Y nicht: Das ist am Mac der
 *   Verlauf des Browsers.
 * - Mit Alt nie: Strg+Alt ist unter Windows AltGr, also ein Schriftzeichen.
 *
 * Der Aufrufer muss jeden Befehl abfangen (`preventDefault`) — auch ein
 * Rückgängig ohne Schritt. Sonst nähme Chrome mit Strg+Z still das letzte
 * Tippen in irgendeinem Feld zurück, auch wenn der Fokus längst woanders ist.
 */
export function tastenbefehl(
  t: { key: string; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean },
  lage: { imTextfeld: boolean; dialog: "keiner" | "seite" | "anderer" },
): Tastenbefehl | null {
  if (!(t.ctrlKey || t.metaKey) || t.altKey) return null;
  const taste = t.key.toLowerCase();
  if (taste === "s") {
    if (t.shiftKey) return null;
    return lage.dialog === "anderer" ? "abfangen" : "speichern";
  }
  if (lage.imTextfeld) return null;
  const befehl =
    taste === "z"
      ? t.shiftKey
        ? "wiederholen"
        : "rueckgaengig"
      : taste === "y" && t.ctrlKey && !t.metaKey && !t.shiftKey
        ? "wiederholen"
        : null;
  if (befehl && lage.dialog !== "keiner") return "abfangen";
  return befehl;
}

/* ── Anzeige ────────────────────────────────────────────────────────── */

/** Kurzer Name eines Bildes für Jakob: „STAMP · 02", „STAMP · Startbild", „Über mich · 01". */
export function bildBezeichnung(i: Inhalt, s: string): string {
  const id = arbeitZu(s);
  if (id) {
    const a = i.foto.arbeiten.find((x) => x.id === id);
    const name = bildName(s);
    return `${a?.titel ?? id} · ${name === "leitbild" ? "Startbild" : name}`;
  }
  if (s === "portrait") return "Porträt";
  if (s.startsWith("ueber/")) return `Über mich · ${s.slice(6)}`;
  if (s.startsWith("film/")) {
    const f = i.filme.find((x) => `film/${x.id}` === s);
    return `Film · ${f?.titel ?? s.slice(5)}`;
  }
  return s;
}

/** Ist die Kennung gültig? (Regel aus `inhalt-pruefen.ts`) */
export const istId = (id: string) => ID.test(id);

/**
 * Hat eine Arbeit Bilder — im Manifest **oder** auf dem Weg dorthin? Nur
 * ohne darf sie gelöscht werden: Sonst lägen Bilder im Bucket, zu denen es
 * keine Arbeit mehr gibt, und die Prüfung meldete ihre Schlüssel als Fehler.
 */
export function hatBilder(id: string, schluessel: Iterable<string>): boolean {
  for (const s of schluessel) if (arbeitZu(s) === id) return true;
  return false;
}

/**
 * Liegt der Punkt außerhalb des Rechtecks? Für Dialoge: Nur ein Klick auf
 * den abgedunkelten Rand schließt — nicht einer in die leere Fläche des
 * Seitenpanels, die zum Dialog selbst gehört.
 */
export function ausserhalb(
  r: { left: number; top: number; right: number; bottom: number },
  x: number,
  y: number,
): boolean {
  return x < r.left || x > r.right || y < r.top || y > r.bottom;
}

/* ── Startseite, Über mich ──────────────────────────────────────────── */

export function setzeSeite(i: Inhalt, feld: keyof Inhalt["seite"], wert: string): Inhalt {
  const n = kopie(i);
  n.seite[feld] = wert;
  return n;
}

/**
 * `heroAlt` und `heroVideo`: leer heißt `null` — nicht `""`. Ein leeres
 * Hero-Video wäre sonst ein Eintrag mit Vorrang, der auf nichts zeigt, und
 * ein leerer Alt-Text etwas anderes als „reine Dekoration".
 */
export function setzeStartText(i: Inhalt, feld: "heroAlt" | "heroVideo", wert: string): Inhalt {
  const n = kopie(i);
  n.startseite[feld] = wert.trim() === "" ? null : wert;
  return n;
}

/** Ein Bildplatz der Startseite. */
export type Startplatz = "heroErsatz" | "wegeFoto" | "wegeFilm" | { highlight: number };

export function startbild(i: Inhalt, platz: Startplatz): string | null {
  const st = i.startseite;
  if (platz === "heroErsatz") return st.heroErsatz;
  if (platz === "wegeFoto") return st.wege.foto;
  if (platz === "wegeFilm") return st.wege.film;
  return st.highlights[platz.highlight] ?? null;
}

/** Setzt ein Bild (oder `null` = leer). Die Highlights bleiben **genau vier** Plätze. */
export function setzeStartbild(i: Inhalt, platz: Startplatz, s: string | null): Inhalt {
  const n = kopie(i);
  const st = n.startseite;
  if (platz === "heroErsatz") st.heroErsatz = s;
  else if (platz === "wegeFoto") st.wege.foto = s;
  else if (platz === "wegeFilm") st.wege.film = s;
  else if (platz.highlight >= 0 && platz.highlight < 4) {
    const vier = [0, 1, 2, 3].map((p) => st.highlights[p] ?? null);
    vier[platz.highlight] = s;
    st.highlights = vier;
  }
  return n;
}

export function setzeUeberFeld(i: Inhalt, feld: "portraitAlt" | "email", wert: string): Inhalt {
  const n = kopie(i);
  n.ueber[feld] = wert;
  return n;
}

export function setzeUeberLink(i: Inhalt, link: "instagram" | "swr", teil: keyof Link, wert: string): Inhalt {
  const n = kopie(i);
  n.ueber[link] = { ...n.ueber[link], [teil]: wert };
  return n;
}

export function setzeZeile(i: Inhalt, platz: number, text: string): Inhalt {
  const n = kopie(i);
  if (platz >= 0 && platz < n.ueber.zeilen.length) n.ueber.zeilen[platz] = text;
  return n;
}

export function neueZeile(i: Inhalt): Inhalt {
  const n = kopie(i);
  n.ueber.zeilen.push("");
  return n;
}

export function entferneZeile(i: Inhalt, platz: number): Inhalt {
  const n = kopie(i);
  n.ueber.zeilen = n.ueber.zeilen.filter((_, p) => p !== platz);
  return n;
}

/**
 * Was sich auf der Startseite wählen lässt: genau die Bilder, die sie zeigen
 * kann — die sichtbaren Fotos aus `/foto`, in der Reihenfolge des Mosaiks.
 * Dieselbe Funktion, in der `app/page.tsx` jedes Startbild sucht; ein Bild
 * von „Über mich", ein Film-Standbild oder etwas Ausgeblendetes fände sie
 * nicht, und der Platz bliebe auf der Seite leer.
 */
export function waehlbareBilder(k: Kontext): Streckenbild[] {
  return fotosFuerMosaik(k);
}

/* ── Hochladen und Verarbeitung ─────────────────────────────────────── */

/**
 * Fotos, die hochgeladen sind, aber noch nicht im Manifest stehen — die
 * Verwaltung zeigt sie als Platzhalter „wird verarbeitet". Ersetzte Bilder
 * (Schlüssel schon im Manifest) gehören nicht dazu; die zeigen ihr altes
 * Bild, bis das neue fertig ist.
 */
export function platzhalter(unterwegs: Iterable<string>, bilder: Record<string, unknown>, praefix: string): string[] {
  return [...new Set(unterwegs)].filter((s) => s.startsWith(praefix) && !(s in bilder)).sort();
}

export type Auswertung = {
  /** Läuft gerade (oder wartet) ein Lauf der Medien-Action? */
  laufend: boolean;
  /** Läufe, die seit dem letzten Blick erfolgreich fertig geworden sind. */
  erfolgreich: Lauf[];
  /** Läufe, die seit dem letzten Blick fehlgeschlagen sind. */
  fehlgeschlagen: Lauf[];
};

/**
 * Wertet eine Abfrage von `/api/admin/verarbeitung` aus. `erledigt` sind die
 * Lauf-ids, die schon ausgewertet sind — beim ersten Blick alle fertigen,
 * damit ein Lauf von gestern nicht als „gerade fertig" gilt.
 *
 * Bewusst über die ids statt über die Uhrzeit: Die Uhr im Browser und die
 * von GitHub gehen nicht gleich, und ein Lauf, der vor dem Laden der Seite
 * begann und danach fertig wurde, fiele sonst durch.
 */
export function werteAus(v: Verarbeitung, erledigt: ReadonlySet<number>): Auswertung {
  const fertig = (l: Lauf) => l.status === "completed";
  const neu = v.laeufe.filter((l) => fertig(l) && !erledigt.has(l.id));
  return {
    laufend: v.laeufe.some((l) => !fertig(l)),
    erfolgreich: neu.filter((l) => l.ergebnis === "success"),
    fehlgeschlagen: neu.filter(fehlgeschlagen),
  };
}

/** Ein fertiger Lauf, der nicht geklappt hat. Abgebrochen und übersprungen zählen nicht — dann wird nachgeholt. */
function fehlgeschlagen(l: Lauf): boolean {
  return l.status === "completed" && l.ergebnis !== "success" && l.ergebnis !== "cancelled" && l.ergebnis !== "skipped";
}

/**
 * Beim **ersten Blick** nach dem Öffnen: Ist der neueste fertige Lauf
 * fehlgeschlagen und wartet noch etwas, gibt es diesen Lauf zurück, sonst
 * `null`. Ohne das sähe Jakob nach dem Neuladen nur „Ein Bild wartet" —
 * und nicht, dass es schon gescheitert ist und sich verwerfen lässt.
 * Läuft gerade ein neuer Lauf, zählt erst dessen Ergebnis (`werteAus`).
 */
export function letzterFehlschlag(v: Verarbeitung): Lauf | null {
  if (v.wartend.length === 0 || v.laeufe.some((l) => l.status !== "completed")) return null;
  const neuester = v.laeufe[0];
  return neuester && fehlgeschlagen(neuester) ? neuester : null;
}

/**
 * Welche Bilder nach einem fertigen Lauf im Manifest stehen **müssen**:
 * die, die bisher unterwegs waren (hochgeladen oder im Eingang), jetzt nicht
 * mehr im Eingang liegen und vorher nicht im Manifest standen. Ersetzte
 * Bilder zählen nicht — ihr Schlüssel steht ohnehin schon darin.
 */
export function erwarteteBilder(
  bisher: Iterable<string>,
  wartend: readonly string[],
  vorher: Record<string, unknown>,
): string[] {
  return [...new Set(bisher)].filter((s) => !wartend.includes(s) && !Object.hasOwn(vorher, s)).sort();
}

/**
 * Stehen alle erwarteten Bilder im geholten Manifest? Erst dann gilt ein
 * grüner Lauf als ausgewertet. ⚠️ Status 200 allein reicht nicht: GitHub liefert
 * kurz nach dem Commit der Action manchmal noch das alte Manifest — dann
 * verschwänden die Platzhalter, ohne dass die neuen Bilder erscheinen.
 */
export function angekommen(erwartet: readonly string[], bilder: Record<string, unknown>): boolean {
  return erwartet.every((s) => Object.hasOwn(bilder, s));
}

/** Nach einem roten Lauf: so viele Runden höchstens, in denen keins der erwarteten Bilder ankommt. */
export const ROT_RUNDEN = 3;

/**
 * Gilt ein fertiger Lauf mit diesem Manifest als ausgewertet? Grün erst,
 * wenn alle erwarteten Bilder darin stehen (`angekommen`).
 *
 * ⚠️ Auch ein **roter** Lauf committet, was fertig ist (`medien.yml`: „Eingang
 * übernehmen" mit continue-on-error, „Änderungen committen" trotz Fehlern) —
 * die guten Bilder können also schon im Manifest stehen, nur der Rest kommt
 * mit diesem Lauf nie. Rot gilt deshalb schon als ausgewertet, wenn
 * **wenigstens eins** angekommen ist: Dann ist es das neue Manifest. Kommt
 * keins, hinkt GitHub vielleicht nur hinterher — oder der Lauf hat nichts
 * geschafft; nach `ROT_RUNDEN` Runden (`runde` zählt ab 1) zählt er trotzdem.
 */
export function ausgewertet(
  erwartet: readonly string[],
  bilder: Record<string, unknown>,
  rot: boolean,
  runde: number,
): boolean {
  if (angekommen(erwartet, bilder)) return true;
  return rot && (erwartet.some((s) => Object.hasOwn(bilder, s)) || runde >= ROT_RUNDEN);
}

/**
 * Hochgeladenes, das nicht mehr im Eingang liegt: `fertig` steht im
 * Manifest, `vermisst` nicht. Nach einem grünen Lauf ist `vermisst` leer.
 * Nach einem roten kann etwas dazwischen hängen — übernommen, aber Varianten
 * oder Commit sind gescheitert. Verloren ist es nicht (das Original liegt
 * schon im Bucket, der nächste Lauf rechnet nach), es braucht nur einen
 * neuen Lauf.
 */
export function nachDemEingang(
  hochgeladen: Iterable<string>,
  wartend: readonly string[],
  bilder: Record<string, unknown>,
): { fertig: string[]; vermisst: string[] } {
  const draussen = [...new Set(hochgeladen)].filter((s) => !wartend.includes(s));
  return {
    fertig: draussen.filter((s) => Object.hasOwn(bilder, s)),
    vermisst: draussen.filter((s) => !Object.hasOwn(bilder, s)),
  };
}

/** Was der Bereich „Hochladen und Verarbeitung" sagt und anbietet. */
export type Verarbeitungsanzeige = {
  /** Der leise Satz zum Stand (`""`: keiner). */
  satz: string;
  /** Was hinter „Die Verarbeitung ist fehlgeschlagen." steht — `null`: kein roter Lauf zu zeigen. */
  rot: string | null;
  /** Die Beschriftung des Knopfs zum Anstoßen — `null`: keiner. */
  knopf: string | null;
  /** Die wartenden Bilder mit „Verwerfen" zeigen. */
  verwerfen: boolean;
};

/**
 * Satz, roter Lauf und Knopf des Bereichs an einer Stelle, damit sich nichts
 * widerspricht. Vorher stand nach einem roten Lauf zugleich „Die Verarbeitung
 * startet gleich." und „… liegen weiter sicher im Eingang" da, obwohl nichts
 * startete und der Eingang leer war — und kein Knopf führte weiter.
 *
 * Ein roter Lauf zählt nur, solange er etwas betrifft, das wartet oder
 * dazwischen hängt (wie beim ersten Blick, `letzterFehlschlag`), und nicht,
 * während ein neuer läuft — dann zählt dessen Ergebnis.
 */
export function verarbeitungsanzeige(l: {
  /** Speichern ist eingerichtet — ohne GitHub lässt sich nichts anstoßen. */
  github: boolean;
  laufend: boolean;
  wartend: number;
  /** Hochgeladen, weder im Eingang noch im Manifest (`nachDemEingang`). */
  vermisst: number;
  /** In dieser Sitzung hochgeladen, noch nicht im Manifest angekommen. */
  hochgeladen: number;
  /** Eine Zeile steht auf „hochgeladen". */
  fertigeZeile: boolean;
  /** Der letzte Lauf war rot. */
  rot: boolean;
  /** Der Anstoß ist gescheitert. */
  anstossFehler: boolean;
}): Verarbeitungsanzeige {
  const rot = l.rot && !l.laufend && (l.wartend > 0 || l.vermisst > 0);
  const satz = l.laufend
    ? "Die Bilder werden verarbeitet (Standortdaten entfernen, Größen rechnen). Das dauert ein paar Minuten — du kannst weiterarbeiten."
    : l.wartend > 0
      ? `${l.wartend === 1 ? "Ein Bild wartet" : `${l.wartend} Bilder warten`} auf die Verarbeitung.`
      : !l.fertigeZeile
        ? ""
        : l.anstossFehler
          ? "Hochgeladen, aber die Verarbeitung ließ sich nicht starten."
          : rot
            ? ""
            : "Hochgeladen. Die Verarbeitung startet gleich.";
  /* Anstoßen geht, wenn etwas wartet, wenn eben Hochgeladenes nicht
     angestoßen werden konnte — oder wenn nach einem roten Lauf etwas
     dazwischen hängt: Sonst käme es erst mit dem nächtlichen Lauf. */
  const anstossbar =
    l.github && !l.laufend && (l.wartend > 0 || (l.anstossFehler && l.hochgeladen > 0) || (rot && l.vermisst > 0));
  return {
    satz,
    rot: !rot
      ? null
      : l.vermisst > 0
        ? "Verloren ist nichts — versuch es noch einmal."
        : l.wartend === 1
          ? "Das Bild liegt weiter sicher im Eingang."
          : "Die Bilder liegen weiter sicher im Eingang.",
    knopf: !anstossbar ? null : l.anstossFehler || rot ? "Noch einmal versuchen" : "Verarbeitung starten",
    verwerfen: rot && l.wartend > 0,
  };
}

/** Megabyte, auf eine Stelle: „12,3 MB". */
export function groesse(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
}
