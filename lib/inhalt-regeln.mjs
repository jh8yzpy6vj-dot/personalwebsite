/**
 * Regeln rund um `lib/inhalt.json`, die **Node-Skripte** brauchen — der
 * Papierkorb, der Eingang und die Zuordnung von Bucket-Schlüsseln.
 *
 * Bewusst reines JavaScript mit JSDoc, aus demselben Grund wie
 * `lib/bilder-regeln.mjs`: Die Skripte der Medien-Action
 * (`scripts/eingang.mjs`, `scripts/papierkorb.mjs`) laufen mit blankem Node
 * und können kein TypeScript mit Importen ohne Endung laden. Die Tests
 * (`lib/inhalt-regeln.test.ts`) prüfen, dass die doppelt geführten Teile —
 * `ZIEL`, `bildName`, `arbeitZu`, `istSichtbaresFoto` — mit
 * `lib/admin/vertrag.ts`, `lib/inhalt.ts` und `lib/arbeiten.ts`
 * übereinstimmen.
 *
 * @typedef {import("./inhalt").Inhalt} Inhalt
 */

/**
 * Erlaubte Ziele beim Hochladen — **dieselbe Regel wie `ZIEL` in
 * `lib/admin/vertrag.ts`.**
 *
 * ⚠️ Doppelt geführt, weil Node die TS-Datei nicht laden kann. Ein Test
 * vergleicht beide; wer hier etwas ändert, ändert es dort mit, sonst nimmt
 * der Worker Dateien an, die die Action liegen lässt (oder umgekehrt).
 */
export const ZIEL =
  /^(arbeiten\/[a-z0-9][a-z0-9-]{0,59}(\/\d{2})?|ueber\/\d{2}|film\/[a-z0-9][a-z0-9-]{0,59}|portrait|hero\/film)$/;

/**
 * Das einzige Ziel für ein **Video** — wie `VIDEO_ZIEL` in
 * `lib/admin/vertrag.ts` (ein Test vergleicht beide).
 */
export const VIDEO_ZIEL = "hero/film";

/**
 * Endungen, unter denen ein Video im Eingang oder unter `original/` liegen
 * kann. Die Verwaltung schreibt nur `mp4` und `mov` (`VIDEOTYPEN`).
 */
export const VIDEO_ENDUNGEN = new Set(["mp4", "mov", "m4v", "webm"]);

/**
 * Endungen, unter denen ein Bild im Bucket liegen kann — klein geschrieben.
 * Die Verwaltung schreibt nur `jpg`, `png`, `webp`, `tif` (`BILDTYPEN`);
 * von Hand Abgelegtes kann auch `.jpeg` oder `.tiff` heißen.
 */
export const BILD_ENDUNGEN = new Set(["jpg", "jpeg", "png", "webp", "tif", "tiff"]);

/** Wie lange ein gelöschtes Bild im Papierkorb bleibt, in Tagen. */
export const PAPIERKORB_TAGE = 30;

const TAG_MS = 86_400_000;

/**
 * Taugt der Text als Bildschlüssel (Pfad unter `original/` ohne Endung)?
 *
 * ⚠️ Nicht `ZIEL`: Im Bucket liegen auch Bilder, die die Verwaltung nicht
 * hochladen kann (`hero/standbild`, `arbeiten/<id>/serie/03`). Geprüft wird
 * hier nur, dass nichts Leeres, kein `.`/`..` und kein führender oder
 * doppelter Schrägstrich drinsteht — so kann ein kaputter Eintrag in
 * `inhalt.json` beim Löschen nie mehr treffen als genau sein Bild.
 *
 * @param {unknown} s
 * @returns {s is string}
 */
export function istSchluessel(s) {
  if (typeof s !== "string" || s.length === 0 || s.length > 300) return false;
  if (/[\u0000-\u001f\\]/.test(s)) return false;
  return s.split("/").every((teil) => teil.length > 0 && teil !== "." && teil !== "..");
}

/**
 * Der Dateiname eines Bildes innerhalb seiner Arbeit — wie `bildName` in
 * `lib/inhalt.ts`: `"leitbild"` für `arbeiten/<id>`, sonst der letzte
 * Pfadteil.
 *
 * @param {string} schluessel
 */
export function bildName(schluessel) {
  const teile = schluessel.split("/");
  return teile[0] === "arbeiten" && teile.length === 2 ? "leitbild" : teile[teile.length - 1];
}

/**
 * Zu welcher Fotoarbeit ein Schlüssel gehört — wie `arbeitZu` in
 * `lib/inhalt.ts`.
 *
 * @param {string} schluessel
 * @returns {string | null}
 */
export function arbeitZu(schluessel) {
  const teile = schluessel.split("/");
  if (teile[0] !== "arbeiten") return null;
  if (teile.length === 2 || teile.length === 3) return teile[1];
  return null;
}

/**
 * Ist das Bild ein **sichtbares Foto aus `/foto`** — eines, das die
 * Startseite zeigen kann? Dieselbe Regel wie `fotosFuerMosaik`
 * (`lib/arbeiten.ts`), in der `app/page.tsx` jedes Startbild sucht; ein Test
 * vergleicht beide. Für `scripts/og.mjs`: Die Vorschaukarte nimmt dasselbe
 * Ersatzfoto wie die Startseite — kein ausgeblendetes, kein gelöschtes.
 *
 * @param {Pick<Inhalt, "foto" | "ausgeblendet" | "papierkorb">} inhalt
 * @param {Record<string, unknown>} bilder  das Manifest
 * @param {string} schluessel
 * @returns {boolean}
 */
export function istSichtbaresFoto(inhalt, bilder, schluessel) {
  const id = arbeitZu(schluessel);
  const arbeit = id === null ? undefined : inhalt.foto.arbeiten.find((a) => a.id === id);
  return (
    arbeit !== undefined &&
    inhalt.foto.kategorien.includes(arbeit.kategorie) &&
    Object.hasOwn(bilder, schluessel) &&
    !inhalt.ausgeblendet.includes(schluessel) &&
    !(schluessel in inhalt.papierkorb)
  );
}

/**
 * Einen Bildschlüssel **restlos** aus dem Inhalt entfernen — für Bilder,
 * deren Original endgültig gelöscht wird (Papierkorb nach 30 Tagen).
 *
 * ⚠️ **Jeder Bezug, nicht nur der Papierkorbeintrag.** Bliebe der Schlüssel
 * etwa in `foto.hero` oder `startseite.highlights` stehen, zeigte die Seite
 * auf ein Bild, das es nicht mehr gibt. Und die Build-Prüfung
 * (`pruefeInhalt`) meldet unbekannte Schlüssel teils als Fehler — dann
 * bräche der nächste Deploy ab, ausgelöst von einem Aufräumlauf, den niemand
 * beobachtet.
 *
 * Plätze mit fester Anzahl (`highlights`, die Startseiten-Bilder) werden
 * `null` statt gestrichen: Ein Highlight-Platz ohne Bild zeigt „Highlight
 * folgt", und die übrigen rücken nicht ungewollt nach.
 *
 * Gibt eine **Kopie** zurück; die Eingabe bleibt unberührt.
 *
 * @template {Inhalt} T
 * @param {T} inhalt
 * @param {string} schluessel
 * @returns {T}
 */
export function entferneSchluessel(inhalt, schluessel) {
  const neu = structuredClone(inhalt);
  /** @param {unknown} liste */
  const ohne = (liste) =>
    Array.isArray(liste) ? liste.filter((s) => s !== schluessel) : liste;
  /** @param {unknown} feld */
  const ohneEintrag = (feld) => {
    if (feld && typeof feld === "object" && !Array.isArray(feld)) {
      delete (/** @type {Record<string, unknown>} */ (feld))[schluessel];
    }
  };

  if (neu.foto) {
    neu.foto.reihenfolge = ohne(neu.foto.reihenfolge);
    neu.foto.hero = ohne(neu.foto.hero);

    // Bildtitel und Alt-Text hängen am Dateinamen innerhalb der Arbeit.
    const id = arbeitZu(schluessel);
    const arbeit = id ? neu.foto.arbeiten?.find((a) => a.id === id) : undefined;
    if (arbeit) {
      const name = bildName(schluessel);
      for (const feld of /** @type {const} */ (["bildtitel", "alt"])) {
        const werte = arbeit[feld];
        if (!werte) continue;
        delete werte[name];
        // Ein leeres Objekt ist kein Inhalt — das optionale Feld fällt weg,
        // statt als `{}` in der Datei zu stehen.
        if (Object.keys(werte).length === 0) delete arbeit[feld];
      }
    }
  }

  if (neu.ueber) {
    neu.ueber.reihenfolge = ohne(neu.ueber.reihenfolge);
    ohneEintrag(neu.ueber.bilder);
  }

  if (neu.startseite) {
    const s = neu.startseite;
    if (s.heroErsatz === schluessel) s.heroErsatz = null;
    if (s.wege) {
      if (s.wege.foto === schluessel) s.wege.foto = null;
      if (s.wege.film === schluessel) s.wege.film = null;
    }
    if (Array.isArray(s.highlights)) {
      s.highlights = s.highlights.map((h) => (h === schluessel ? null : h));
    }
  }

  neu.ausgeblendet = ohne(neu.ausgeblendet);
  ohneEintrag(neu.papierkorb);
  ohneEintrag(neu.bildausschnitte);
  return neu;
}

/**
 * Ein Tag `JJJJ-MM-TT` als Zahl der UTC-Tage seit 1970 — oder `null`, wenn
 * es kein echtes Datum ist (`2026-02-30` zählt nicht).
 *
 * @param {unknown} text
 */
function utcTag(text) {
  if (typeof text !== "string") return null;
  const treffer = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!treffer) return null;
  const [j, m, t] = treffer.slice(1).map(Number);
  const ms = Date.UTC(j, m - 1, t);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== j || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== t) return null;
  return ms / TAG_MS;
}

/**
 * Welche Papierkorbeinträge endgültig weg dürfen: deren Tag **mehr als**
 * `tage` UTC-Tage vor `heute` liegt. Am 31. Tag nach dem Löschen also ja,
 * am 30. noch nicht.
 *
 * ⚠️ Ein unlesbares Datum zählt als **nicht** abgelaufen. Lieber bleibt ein
 * Bild zu lange liegen, als dass ein Tippfehler in der Datei ein Original
 * sofort löscht — das ist der einzige Schritt im ganzen Ablauf, der sich
 * nicht zurücknehmen lässt.
 *
 * @param {Record<string, string> | null | undefined} papierkorb
 * @param {Date} heute
 * @param {number} [tage]
 * @returns {string[]} sortiert
 */
export function abgelaufen(papierkorb, heute, tage = PAPIERKORB_TAGE) {
  const heuteTag = Math.floor(heute.getTime() / TAG_MS);
  return Object.entries(papierkorb ?? {})
    .filter(([schluessel, datum]) => {
      const tag = utcTag(datum);
      return istSchluessel(schluessel) && tag !== null && heuteTag - tag > tage;
    })
    .map(([schluessel]) => schluessel)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Die Originale zu einem Schlüssel unter den Bucket-Schlüsseln:
 * `original/<schluessel>.<bildendung>` — **genau** dieser Name, keine
 * Unterordner. `arbeiten/x` trifft also `original/arbeiten/x.jpg`, aber nie
 * `original/arbeiten/x/01.jpg`.
 *
 * `endungen`: welche zählen — sonst die Bildendungen. Für das Video oben
 * `VIDEO_ENDUNGEN`: `original/hero/film.jpg` (sein Standbild) ist dann
 * kein Original des Videos und bleibt.
 *
 * @param {Iterable<string>} keys
 * @param {string} schluessel
 * @param {Set<string>} [endungen]
 */
export function originaleVon(keys, schluessel, endungen = BILD_ENDUNGEN) {
  if (!istSchluessel(schluessel)) return [];
  const praefix = `original/${schluessel}.`;
  return [...keys].filter((key) => {
    if (!key.startsWith(praefix)) return false;
    const endung = key.slice(praefix.length);
    return endungen.has(endung.toLowerCase());
  });
}

/**
 * Einen Schlüssel im Eingangs-Bucket zerlegen: `arbeiten/x/03.png` →
 * `{ ziel: "arbeiten/x/03", endung: "png" }`. Alles, was nicht zu `ZIEL`
 * und einer Bildendung passt, gibt `null` — die Action lässt es liegen und
 * meldet es. Ausnahme `VIDEO_ZIEL` (`hero/film`): Dort gilt umgekehrt nur
 * eine Videoendung.
 *
 * @param {string} key
 * @returns {{ ziel: string; endung: string } | null}
 */
export function zerlegeEingang(key) {
  const punkt = key.lastIndexOf(".");
  if (punkt <= 0) return null;
  const ziel = key.slice(0, punkt);
  const endung = key.slice(punkt + 1).toLowerCase();
  const endungen = ziel === VIDEO_ZIEL ? VIDEO_ENDUNGEN : BILD_ENDUNGEN;
  if (!endungen.has(endung) || !ZIEL.test(ziel)) return null;
  return { ziel, endung };
}

/**
 * Den Inhalt des Eingangs ordnen: je Ziel die **neueste** Datei samt den
 * älteren zum selben Ziel (sie sind überholt), dazu alles Unbekannte.
 *
 * Zwei Dateien zum selben Ziel entstehen, wenn Jakob ein Bild zweimal
 * hochlädt, bevor die Action lief — einmal als JPEG, einmal als PNG. Es
 * gilt das zuletzt hochgeladene; das ist, was er zuletzt gesehen hat.
 *
 * ⚠️ Die überholten hängen **am Ziel**, nicht in einer flachen Liste:
 * `scripts/eingang.mjs` löscht sie erst, wenn das neueste Bild sicher unter
 * `original/` liegt. Ist das neueste kaputt, bleibt so wenigstens das ältere
 * im Eingang, statt dass beide verloren gehen.
 *
 * Bei gleichem (oder unlesbarem) Zeitpunkt entscheidet der Schlüssel, damit
 * jeder Lauf dasselbe Ergebnis liefert.
 *
 * @param {{ key: string; geaendert?: string }[]} objekte
 * @returns {{ dateien: { key: string; ziel: string; ueberholt: string[] }[];
 *   unbekannt: string[] }}
 */
export function ordneEingang(objekte) {
  /** @type {Map<string, { key: string; ziel: string; zeit: number }[]>} */
  const jeZiel = new Map();
  /** @type {string[]} */
  const unbekannt = [];

  for (const o of objekte) {
    const teile = zerlegeEingang(o.key);
    if (!teile) {
      unbekannt.push(o.key);
      continue;
    }
    const zeit = Date.parse(o.geaendert ?? "");
    const liste = jeZiel.get(teile.ziel) ?? [];
    liste.push({ key: o.key, ziel: teile.ziel, zeit: Number.isNaN(zeit) ? 0 : zeit });
    jeZiel.set(teile.ziel, liste);
  }

  const dateien = [...jeZiel.values()]
    .map((liste) => {
      // Neueste zuerst; bei Gleichstand der größere Schlüssel — Hauptsache fest.
      const [neueste, ...rest] = [...liste].sort(
        (a, b) => b.zeit - a.zeit || b.key.localeCompare(a.key),
      );
      return { key: neueste.key, ziel: neueste.ziel, ueberholt: rest.map((r) => r.key).sort() };
    })
    .sort((a, b) => a.ziel.localeCompare(b.ziel));

  return { dateien, unbekannt: unbekannt.sort() };
}

/**
 * Was der Papierkorb heute tun soll — rein, damit der einzige
 * unumkehrbare Schritt der ganzen Pipeline unter Test steht.
 *
 * - `loeschen`: Bucket-Schlüssel der Originale, die endgültig weg dürfen.
 * - `entfernen`: Bildschlüssel, die restlos aus dem Inhalt fallen
 *   (`entferneSchluessel`).
 * - `ersetzt`: abgelaufene Einträge, zu denen **nach** dem Löschtag ein
 *   neues Original hochgeladen wurde. Die Datei bleibt, nur der
 *   Papierkorbeintrag fällt weg (`ausPapierkorb`).
 *
 * ⚠️ **Warum `ersetzt`.** Lädt Jakob in einen Platz, dessen altes Bild im
 * Papierkorb liegt, ein neues hoch (dasselbe Ziel, etwa `ueber/03`), trägt
 * das neue Original denselben Schlüssel. Ohne diese Prüfung löschte der
 * Papierkorb 30 Tage nach dem *alten* Bild das *neue* — still und
 * endgültig. Maßgeblich ist, wann das Original zuletzt geschrieben wurde
 * (`LastModified` im Bucket): an einem **späteren** UTC-Tag als dem
 * Löschtag. Am selben Tag lässt sich nicht sagen, was zuerst war; dann gilt
 * der Papierkorb.
 *
 * @param {Record<string, string> | null | undefined} papierkorb
 * @param {{ key: string; geaendert?: string }[]} originale die Objekte unter `original/`
 * @param {Date} heute
 * @param {number} [tage]
 */
export function planePapierkorb(papierkorb, originale, heute, tage = PAPIERKORB_TAGE) {
  /** @type {string[]} */
  const loeschen = [];
  /** @type {string[]} */
  const entfernen = [];
  /** @type {string[]} */
  const ersetzt = [];
  const keys = originale.map((o) => o.key);
  const zeitVon = new Map(originale.map((o) => [o.key, Date.parse(o.geaendert ?? "")]));

  for (const schluessel of abgelaufen(papierkorb, heute, tage)) {
    const dateien = originaleVon(keys, schluessel);
    const geloeschtAm = utcTag(papierkorb?.[schluessel]);
    const neuer = dateien.some((key) => {
      const zeit = zeitVon.get(key);
      return (
        typeof zeit === "number" &&
        !Number.isNaN(zeit) &&
        geloeschtAm !== null &&
        Math.floor(zeit / TAG_MS) > geloeschtAm
      );
    });
    if (neuer) {
      ersetzt.push(schluessel);
    } else {
      loeschen.push(...dateien);
      entfernen.push(schluessel);
    }
  }
  return { loeschen: loeschen.sort(), entfernen, ersetzt };
}

/**
 * Nur den Papierkorbeintrag streichen — Bildtitel, Reihenfolge und alles
 * andere bleiben. Für `ersetzt` aus `planePapierkorb`. Gibt eine Kopie.
 *
 * @template {Inhalt} T
 * @param {T} inhalt
 * @param {string} schluessel
 * @returns {T}
 */
export function ausPapierkorb(inhalt, schluessel) {
  const neu = structuredClone(inhalt);
  if (neu.papierkorb && typeof neu.papierkorb === "object") delete neu.papierkorb[schluessel];
  return neu;
}
