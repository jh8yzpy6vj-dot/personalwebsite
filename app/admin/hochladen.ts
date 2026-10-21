import type { HochladenAntwort } from "@/lib/admin/vertrag";

/** Ohne jeden Fortschritt so lange (ms), dann gilt die Übertragung als hängengeblieben. */
export const STILLSTAND_GRENZE = 90_000;
/** So oft schaut die Wache nach (ms). */
const STILLSTAND_PRUEFUNG = 5_000;

/** Was `sendeDatei` liefert: die Antwort des Servers, bei abgelaufener Anmeldung mit `anmelden`. */
export type Sendeergebnis = HochladenAntwort | { ok: false; text: string; anmelden: true };

/**
 * Lädt **eine** Datei nach `PUT /api/admin/hochladen?ziel=…` — die Datei
 * selbst ist der Rumpf, kein Formular.
 *
 * Über `XMLHttpRequest` statt `fetch`, weil nur XHR den Fortschritt beim
 * **Senden** meldet (`upload.onprogress`). Bei 40 MB über Mobilfunk ist ein
 * Balken der Unterschied zwischen „lädt" und „hängt".
 *
 * Bewusst **kein festes Zeitlimit** — 40 MB über eine langsame Leitung
 * dürfen dauern. Stattdessen eine Wache: Kommt 90 Sekunden lang kein
 * Fortschritt, ist die Verbindung vermutlich weg, und die Übertragung wird
 * abgebrochen, statt die ganze Schlange für immer aufzuhalten. Ist alles
 * gesendet (`upload.onload`), endet die Wache; dann schreibt nur noch der
 * Server. `signal` bricht von außen ab („Abbrechen").
 *
 * Wirft nie: Jeder Ausgang ist eine Antwort mit einem Text für Jakob.
 */
export function sendeDatei(
  datei: File,
  ziel: string,
  typ: string,
  beiFortschritt: (anteil: number) => void,
  signal?: AbortSignal,
): Promise<Sendeergebnis> {
  return new Promise((fertig) => {
    if (signal?.aborted) {
      fertig({ ok: false, text: "Abgebrochen." });
      return;
    }
    const xhr = new XMLHttpRequest();
    let letzterFortschritt = Date.now();
    let stillstand = false;
    const wache = setInterval(() => {
      if (Date.now() - letzterFortschritt < STILLSTAND_GRENZE) return;
      stillstand = true;
      xhr.abort();
    }, STILLSTAND_PRUEFUNG);
    const brichAb = () => xhr.abort();
    signal?.addEventListener("abort", brichAb);
    /* Jeder Ausgang räumt auf — Wache und Abbruch gehören nur zu dieser Übertragung. */
    const ende = (ergebnis: Sendeergebnis) => {
      clearInterval(wache);
      signal?.removeEventListener("abort", brichAb);
      fertig(ergebnis);
    };

    xhr.open("PUT", `/api/admin/hochladen?ziel=${encodeURIComponent(ziel)}`);
    /* Der Typ aus der Prüfung, nicht `datei.type`: Windows meldet TIFFs oft
       ohne Typ, der Server braucht ihn aber. */
    xhr.setRequestHeader("content-type", typ);
    xhr.responseType = "text";
    xhr.upload.onprogress = (e) => {
      letzterFortschritt = Date.now();
      if (e.lengthComputable && e.total > 0) beiFortschritt(e.loaded / e.total);
    };
    xhr.upload.onload = () => clearInterval(wache);
    xhr.onload = () => {
      let antwort: unknown = null;
      try {
        antwort = JSON.parse(xhr.responseText);
      } catch {
        /* unten behandelt */
      }
      if (xhr.status === 404) {
        ende({ ok: false, text: netzText(404, null), anmelden: true });
        return;
      }
      if (antwort && typeof antwort === "object" && "ok" in antwort) {
        ende(antwort as HochladenAntwort);
        return;
      }
      ende({ ok: false, text: `Der Server hat nicht geantwortet wie erwartet (${xhr.status}).` });
    };
    xhr.onerror = () => ende({ ok: false, text: "Die Verbindung ist abgebrochen. Versuch es noch einmal." });
    xhr.onabort = () =>
      ende({
        ok: false,
        text: stillstand
          ? "Die Übertragung kam 90 Sekunden lang nicht voran — vermutlich ist die Verbindung weg. Versuch es noch einmal."
          : "Abgebrochen.",
      });
    xhr.send(datei);
  });
}

/**
 * JSON von einer Route der Verwaltung holen. `null`-Antwort bei
 * Netzfehlern, damit jede Stelle selbst sagen kann, was das für sie heißt.
 */
export async function holeJson<T>(
  pfad: string,
  init?: RequestInit,
): Promise<{ status: number; daten: T | null }> {
  try {
    const r = await fetch(pfad, { cache: "no-store", ...init });
    let daten: T | null = null;
    try {
      daten = (await r.json()) as T;
    } catch {
      daten = null;
    }
    return { status: r.status, daten };
  } catch {
    return { status: 0, daten: null };
  }
}

/** POST mit JSON-Rumpf. Same-origin — der Browser schickt `Origin` mit, das prüft der Server. */
export function sendeJson<T>(pfad: string, rumpf: unknown) {
  return holeJson<T>(pfad, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rumpf),
  });
}

/**
 * Text für Jakob, wenn etwas nicht durchkam.
 *
 * ⚠️ Bei 404 (Anmeldung abgelaufen) **nicht** zum Neuladen raten: Neu laden
 * verwirft alles Ungespeicherte. Das Sitzungs-Cookie gilt für alle Tabs —
 * nach einer Anmeldung in einem zweiten Tab klappt es hier wieder.
 */
export function netzText(status: number, daten: unknown): string {
  if (daten && typeof daten === "object" && "text" in daten && typeof daten.text === "string") return daten.text;
  if (status === 0) return "Keine Verbindung zum Server. Versuch es gleich noch einmal.";
  if (status === 404) {
    return "Die Anmeldung ist abgelaufen. Melde dich in einem neuen Tab neu an, komm hierher zurück und versuch es noch einmal — deine Änderungen hier bleiben erhalten.";
  }
  return `Unerwartete Antwort vom Server (${status}).`;
}
