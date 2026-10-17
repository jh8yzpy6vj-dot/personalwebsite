import type { HochladenAntwort } from "@/lib/admin/vertrag";

/**
 * Lädt **eine** Datei nach `PUT /api/admin/hochladen?ziel=…` — die Datei
 * selbst ist der Rumpf, kein Formular.
 *
 * Über `XMLHttpRequest` statt `fetch`, weil nur XHR den Fortschritt beim
 * **Senden** meldet (`upload.onprogress`). Bei 40 MB über Mobilfunk ist ein
 * Balken der Unterschied zwischen „lädt" und „hängt".
 *
 * Wirft nie: Jeder Ausgang ist eine `HochladenAntwort`, mit einem Text für
 * Jakob.
 */
export function sendeDatei(
  datei: File,
  ziel: string,
  typ: string,
  beiFortschritt: (anteil: number) => void,
): Promise<HochladenAntwort> {
  return new Promise((fertig) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/admin/hochladen?ziel=${encodeURIComponent(ziel)}`);
    /* Der Typ aus der Prüfung, nicht `datei.type`: Windows meldet TIFFs oft
       ohne Typ, der Server braucht ihn aber. */
    xhr.setRequestHeader("content-type", typ);
    xhr.responseType = "text";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) beiFortschritt(e.loaded / e.total);
    };
    xhr.onload = () => {
      let antwort: unknown = null;
      try {
        antwort = JSON.parse(xhr.responseText);
      } catch {
        /* unten behandelt */
      }
      if (xhr.status === 404) {
        fertig({ ok: false, text: "Kein Zugang mehr — vermutlich ist die Anmeldung abgelaufen. Lade die Seite neu." });
        return;
      }
      if (antwort && typeof antwort === "object" && "ok" in antwort) {
        fertig(antwort as HochladenAntwort);
        return;
      }
      fertig({ ok: false, text: `Der Server hat nicht geantwortet wie erwartet (${xhr.status}).` });
    };
    xhr.onerror = () => fertig({ ok: false, text: "Die Verbindung ist abgebrochen. Versuch es noch einmal." });
    xhr.onabort = () => fertig({ ok: false, text: "Abgebrochen." });
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

/** Text für Jakob, wenn etwas nicht durchkam. */
export function netzText(status: number, daten: unknown): string {
  if (daten && typeof daten === "object" && "text" in daten && typeof daten.text === "string") return daten.text;
  if (status === 0) return "Keine Verbindung zum Server. Versuch es gleich noch einmal.";
  if (status === 404) return "Kein Zugang mehr — vermutlich ist die Anmeldung abgelaufen. Lade die Seite neu.";
  return `Unerwartete Antwort vom Server (${status}).`;
}
