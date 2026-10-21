/**
 * Gemeinsame Antworten der Verwaltungs-Schnittstelle.
 *
 * ⚠️ **Jede Antwort trägt `Cache-Control: no-store`.** Die Daten hinter
 * `/api/admin` sind privat und ändern sich mit jedem Speichern; ein Cache
 * (Browser oder Cloudflare-Edge) dazwischen würde im besten Fall einen alten
 * Stand zeigen, im schlechtesten Jakobs Daten an jemand anderen ausliefern.
 * `next.config.mjs` setzt den Header zusätzlich — doppelt, weil eine
 * vergessene Zeile dort sonst still alles öffnet.
 */

import { BILDER } from "../bilder";
import { istTag, pruefeInhalt, nurFehler } from "../inhalt-pruefen";
import {
  GithubFehler,
  GithubKonflikt,
  leseBlob,
  leseDatei,
  schreibeDatei,
  verlauf,
  type GithubKonfig,
} from "./github";
import type { SpeichernAntwort } from "./vertrag";
import { gleich } from "./werkzeuge";

const KEIN_CACHE = { "cache-control": "no-store" };

/** Die Datei, die die Verwaltung schreibt — und nur diese. */
export const INHALT_PFAD = "lib/inhalt.json";
export const MANIFEST_PFAD = "lib/bilder-manifest.json";

export function json(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { ...KEIN_CACHE, "content-type": "application/json; charset=utf-8" },
  });
}

/** 404 ohne jeden Hinweis — dieselbe Antwort, ob falsch angemeldet oder nicht eingerichtet. */
export function nichtGefunden(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { ...KEIN_CACHE, "content-type": "text/plain; charset=utf-8" },
  });
}

export function verboten(text: string): Response {
  return json({ ok: false, text }, 403);
}

/**
 * Den Rumpf einer Anfrage lesen — **mit Obergrenze während des Lesens**.
 *
 * ⚠️ `Content-Length` allein reicht nicht: Der Header kann fehlen (chunked)
 * oder lügen. Wer erst `arrayBuffer()` ruft und dann misst, hat die 2 GB
 * schon im Speicher des Workers. Hier wird nach jedem Stück gezählt und
 * abgebrochen, sobald es zu viel wird.
 *
 * Gibt `null` zurück, wenn der Rumpf größer als `max` ist.
 */
export async function leseBegrenzt(
  request: Request,
  max: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const angegeben = Number(request.headers.get("content-length"));
  if (Number.isFinite(angegeben) && angegeben > max) return null;
  if (!request.body) return new Uint8Array(0);

  const leser = request.body.getReader();
  const stuecke: Uint8Array[] = [];
  let laenge = 0;
  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    laenge += value.byteLength;
    if (laenge > max) {
      await leser.cancel().catch(() => {});
      return null;
    }
    stuecke.push(value);
  }

  const alles = new Uint8Array(laenge);
  let pos = 0;
  for (const s of stuecke) {
    alles.set(s, pos);
    pos += s.byteLength;
  }
  return alles;
}

/** Ist der `Content-Type` JSON? (`application/json; charset=utf-8` zählt mit.) */
export function istJson(request: Request): boolean {
  const typ = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  return typ === "application/json";
}

// ---------------------------------------------------------------------------
// Speichern — gemeinsam für `speichern` und `zuruecksetzen`
// ---------------------------------------------------------------------------

/** Längste Betreffzeile, die aus Jakobs Beschreibung übernommen wird. */
const MAX_BETREFF = 72;

/**
 * Jakobs Beschreibung → Betreffzeile: eine Zeile, ohne Steuerzeichen, kurz.
 *
 * ⚠️ **E-Mail-Adressen fliegen raus.** Das Repo ist öffentlich; was in der
 * Commit-Nachricht steht, steht dort für immer. Tippt Jakob „Adresse auf
 * jakob@… geändert", soll seine Adresse nicht im Git-Verlauf landen.
 */
export function betreffAus(nachricht: unknown): string {
  const roh = typeof nachricht === "string" ? nachricht : "";
  let zeile = roh
    // Steuerzeichen und Unicode-Zeilentrenner — sonst bräche die „eine Zeile" doch um.
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/[^\s@<>]+@[^\s@<>]+/g, "[Adresse]")
    .replace(/\s+/g, " ")
    .trim();
  if (zeile === "") zeile = "Inhalte geändert";
  if ([...zeile].length > MAX_BETREFF) zeile = [...zeile].slice(0, MAX_BETREFF - 1).join("") + "…";
  return zeile;
}

/** Die vollständige Commit-Nachricht. Kein Name, keine Adresse — siehe `betreffAus`. */
export function commitNachricht(betreff: string): string {
  return `Verwaltung: ${betreff}\n\nGespeichert über die Verwaltung (/admin).`;
}

/** So steht die Datei im Repo — dieselbe Form wie von Hand formatiert, damit Diffs klein bleiben. */
export function alsDatei(inhalt: unknown): string {
  return JSON.stringify(inhalt, null, 2) + "\n";
}

/**
 * Die Bildschlüssel von `main` — das Manifest dort ist frischer als das des
 * laufenden Builds (gerade verarbeitete Bilder). Klappt das Lesen nicht,
 * reicht der Build-Stand: Ein fehlendes Bild ist bei der Prüfung ohnehin nur
 * eine Warnung, nie ein Fehler.
 */
export async function bilderSchluessel(gh: GithubKonfig | null): Promise<string[]> {
  if (gh) {
    try {
      const { text } = await leseDatei(gh, MANIFEST_PFAD);
      return Object.keys(JSON.parse(text) as Record<string, unknown>);
    } catch (e) {
      console.warn(`Verwaltung: Manifest von GitHub nicht lesbar, nehme den Build-Stand (${logText(e)})`);
    }
  }
  return Object.keys(BILDER);
}

/** Text eines Fehlers, der nach außen darf. Unbekanntes wird nicht durchgereicht. */
export function fehlerText(e: unknown): string {
  if (e instanceof GithubFehler) return e.message;
  if (e instanceof Error && e.name === "EingangFehler") return e.message;
  return "Unerwarteter Fehler auf dem Server.";
}

/**
 * Text eines Fehlers **fürs Log des Workers** — mit Art und Meldung, auch bei
 * Unerwartetem. Mit `fehlerText` stünde dort bei einem kaputten
 * `lib/inhalt.json` nur „Unerwarteter Fehler", und niemand fände die
 * Ursache. Das Log ist nicht öffentlich, und in diesen Meldungen steht kein
 * Token (`github.ts` und `eingang.ts` formulieren ihre Fehler selbst).
 */
export function logText(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message.slice(0, 300)}`;
  return String(e).slice(0, 300);
}

/* ── Papierkorb-Daten ─────────────────────────────────────────────────── */

const BERLIN = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `JJJJ-MM-TT` in deutscher Zeit — „sv-SE" schreibt das Datum genau so. */
export function berlinerTag(d: Date): string {
  return BERLIN.format(d);
}

/**
 * Die Papierkorb-Daten, die **geschrieben** werden — festgelegt vom Server.
 *
 * ⚠️ Nach 30 Tagen löscht die Medien-Action das Original endgültig, der
 * einzige Schritt, der sich nicht zurücknehmen lässt. Käme das Datum aus
 * dem Browser, löschte eine falsch gehende Geräteuhr (2025 statt 2026)
 * sofort; käme es aus einem zurückgeholten alten Stand, ebenso („Stand vom
 * 05.09." bringt den Eintrag vom 01.09. zurück, am 18.10. ist er
 * abgelaufen). Deshalb:
 * - Liegt der Schlüssel auf `main` schon im Papierkorb, bleibt dessen Datum
 *   (sonst verlängerte jedes Speichern die Frist).
 * - Jeder andere Schlüssel — neu gelöscht oder mit einem alten Stand
 *   zurückgekommen — bekommt `heute`, also wieder volle 30 Tage.
 *
 * Ein Datum auf `main`, das kein echtes ist oder in der Zukunft liegt, wird
 * ebenfalls `heute`: Das eine liefe nie ab, das andere zu spät.
 */
export function papierkorbDaten(
  neu: Record<string, string>,
  main: unknown,
  heute: string,
): Record<string, string> {
  const alt = typeof main === "object" && main !== null && !Array.isArray(main) ? (main as Record<string, unknown>) : {};
  const ergebnis: Record<string, string> = {};
  for (const k of Object.keys(neu)) {
    const tag = Object.hasOwn(alt, k) ? alt[k] : undefined;
    ergebnis[k] = istTag(tag) && tag <= heute ? tag : heute;
  }
  return ergebnis;
}

export const NICHT_EINGERICHTET: SpeichernAntwort = {
  ok: false,
  grund: "nicht-eingerichtet",
  text: "Speichern ist noch nicht eingerichtet (GitHub-Zugang fehlt). Bitte Jan Bescheid geben.",
};

const KONFLIKT: SpeichernAntwort = {
  ok: false,
  grund: "konflikt",
  text:
    "Inzwischen hat jemand anderes gespeichert (oder du in einem zweiten Fenster). " +
    "Bitte die Seite neu laden — deine letzten Änderungen dann noch einmal machen.",
};

/** Text als JSON — oder `null`, wenn er keins ist. */
function alsJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function papierkorbAus(stand: unknown): unknown {
  return typeof stand === "object" && stand !== null ? (stand as { papierkorb?: unknown }).papierkorb : undefined;
}

/**
 * Der Stand, auf dem der Browser aufbaut — gelesen über seine `sha`, also
 * genau diese Fassung. Nur wenn GitHub den Commit annimmt, war das `main`,
 * und dann ersetzt der Commit genau diesen Stand.
 *
 * `null`, wenn es ihn nicht gibt: leere `sha` (ohne GitHub geladen), eine
 * unbekannte oder kaputtes JSON. Der Commit scheitert dann ohnehin am
 * Konflikt — oder schreibt über Kaputtes, wofür kein Datum zählt.
 */
async function leseBasis(gh: GithubKonfig, sha: string): Promise<unknown> {
  if (sha === "") return null;
  try {
    return alsJson(await leseBlob(gh, sha, INHALT_PFAD));
  } catch (e) {
    // 404: Diesen Blob gibt es nicht; 422: Die sha ist keiner.
    if (e instanceof GithubFehler && (e.status === 404 || e.status === 422)) return null;
    throw e;
  }
}

/**
 * Prüfen und als Commit schreiben. Dieselben Regeln wie beim Build
 * (`lib/content.ts`) — was hier durchgeht, bricht den Build nicht.
 *
 * - **Geschrieben wird zuerst**, mit der `sha` des Browsers. Ob sie noch zu
 *   `main` passt, entscheidet GitHub beim Commit — nicht ein Lesen von
 *   `main` vorher: Das kann kurz nach einem Commit noch den Stand davor
 *   liefern. Nähme Jakob seine gerade gespeicherte Änderung zurück, sähe der
 *   Rückweg dann aus wie „steht schon so auf main" und würde still
 *   verschluckt.
 * - **Lehnt GitHub ab** (`GithubKonflikt`), wird `main` gelesen. Steht dort
 *   schon genau dieser Inhalt, gibt es keinen Commit, nur die aktuelle
 *   `sha`: der Fall „Antwort ging unterwegs verloren" (Mobilfunk) — Jakob
 *   speichert noch einmal, mit der alten `sha`, und bekäme sonst „jemand
 *   anderes hat gespeichert", obwohl er es selbst war. Sonst 409.
 * - Die **Papierkorb-Daten** setzt der Server (`papierkorbDaten`), gemessen
 *   an dem Stand, den der Commit ersetzt (`leseBasis`); im Fall „schon
 *   gespeichert" an `main`.
 *
 * `textUngueltig` ersetzt den Text bei 422 — beim Wiederherstellen gibt es
 * nichts zu „korrigieren".
 */
export async function speichereInhalt(
  gh: GithubKonfig,
  inhalt: unknown,
  sha: string,
  betreff: string,
  textUngueltig?: (n: number) => string,
): Promise<Response> {
  const befunde = pruefeInhalt(inhalt, await bilderSchluessel(gh));
  const fehler = nurFehler(befunde);
  if (fehler.length > 0) {
    return json(
      {
        ok: false,
        grund: "ungueltig",
        text: textUngueltig
          ? textUngueltig(fehler.length)
          : fehler.length === 1
            ? "Eine Angabe passt noch nicht — bitte korrigieren, dann speichern."
            : `${fehler.length} Angaben passen noch nicht — bitte korrigieren, dann speichern.`,
        befunde,
      } satisfies SpeichernAntwort,
      422,
    );
  }

  // Nach der Prüfung ohne Fehler ist `papierkorb` sicher eine Zuordnung Schlüssel → Datum.
  const gesendet = inhalt as { papierkorb: Record<string, string> };
  const heute = berlinerTag(new Date());
  /** Der Inhalt, wie er geschrieben wird — die Papierkorb-Daten gemessen an `stand`. */
  const mitDaten = (stand: unknown) => ({
    ...gesendet,
    papierkorb: papierkorbDaten(gesendet.papierkorb, papierkorbAus(stand), heute),
  });

  try {
    const neu = mitDaten(await leseBasis(gh, sha));
    try {
      const ergebnis = await schreibeDatei(gh, INHALT_PFAD, alsDatei(neu), sha, commitNachricht(betreff));
      return json({
        ok: true,
        sha: ergebnis.sha,
        commit: ergebnis.commit,
        befunde,
        papierkorb: neu.papierkorb,
      } satisfies SpeichernAntwort);
    } catch (e) {
      if (!(e instanceof GithubKonflikt)) throw e;
    }

    // Abgelehnt — `main` ist weiter als der Browser. Vielleicht genau um diesen Inhalt?
    const aktuell = await leseDatei(gh, INHALT_PFAD);
    const aufMain = alsJson(aktuell.text);
    const wieMain = mitDaten(aufMain);
    if (!gleich(aufMain, wieMain)) return json(KONFLIKT, 409);

    let commit = "";
    try {
      commit = (await verlauf(gh, INHALT_PFAD, 1))[0]?.commit ?? "";
    } catch (e) {
      console.warn(`Verwaltung: letzter Commit nicht lesbar (${logText(e)})`);
    }
    return json({ ok: true, sha: aktuell.sha, commit, befunde, papierkorb: wieMain.papierkorb } satisfies SpeichernAntwort);
  } catch (e) {
    console.error(`Verwaltung: Speichern fehlgeschlagen (${logText(e)})`);
    return json({ ok: false, grund: "github", text: fehlerText(e) } satisfies SpeichernAntwort, 502);
  }
}
