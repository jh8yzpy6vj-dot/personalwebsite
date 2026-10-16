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
import { pruefeInhalt, nurFehler } from "../inhalt-pruefen";
import { GithubFehler, GithubKonflikt, leseDatei, schreibeDatei, type GithubKonfig } from "./github";
import type { SpeichernAntwort } from "./vertrag";

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
      console.warn(`Verwaltung: Manifest von GitHub nicht lesbar, nehme den Build-Stand (${fehlerText(e)})`);
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

export const NICHT_EINGERICHTET: SpeichernAntwort = {
  ok: false,
  grund: "nicht-eingerichtet",
  text: "Speichern ist noch nicht eingerichtet (GitHub-Zugang fehlt). Bitte Jan Bescheid geben.",
};

/**
 * Prüfen und als Commit schreiben. Dieselben Regeln wie beim Build
 * (`lib/content.ts`) — was hier durchgeht, bricht den Build nicht.
 */
export async function speichereInhalt(
  gh: GithubKonfig,
  inhalt: unknown,
  sha: string,
  betreff: string,
): Promise<Response> {
  const befunde = pruefeInhalt(inhalt, await bilderSchluessel(gh));
  const fehler = nurFehler(befunde);
  if (fehler.length > 0) {
    return json(
      {
        ok: false,
        grund: "ungueltig",
        text:
          fehler.length === 1
            ? "Eine Angabe passt noch nicht — bitte korrigieren, dann speichern."
            : `${fehler.length} Angaben passen noch nicht — bitte korrigieren, dann speichern.`,
        befunde,
      } satisfies SpeichernAntwort,
      422,
    );
  }

  try {
    const neu = await schreibeDatei(gh, INHALT_PFAD, alsDatei(inhalt), sha, commitNachricht(betreff));
    return json({ ok: true, sha: neu.sha, commit: neu.commit, befunde } satisfies SpeichernAntwort);
  } catch (e) {
    if (e instanceof GithubKonflikt) {
      return json(
        {
          ok: false,
          grund: "konflikt",
          text:
            "Inzwischen hat jemand anderes gespeichert (oder du in einem zweiten Fenster). " +
            "Bitte die Seite neu laden — deine letzten Änderungen dann noch einmal machen.",
        } satisfies SpeichernAntwort,
        409,
      );
    }
    console.error(`Verwaltung: Speichern fehlgeschlagen (${fehlerText(e)})`);
    return json({ ok: false, grund: "github", text: fehlerText(e) } satisfies SpeichernAntwort, 502);
  }
}
