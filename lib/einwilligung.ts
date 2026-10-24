import { useSyncExternalStore } from "react";

/**
 * Einwilligung für eingebettete YouTube-Filme (seit 2026-10-24).
 *
 * Die Seite selbst setzt weiterhin **kein Cookie**. Gemerkt wird nur die
 * Entscheidung, und zwar im `localStorage` dieses Browsers — das ist nach
 * § 25 Abs. 2 Nr. 2 TDDDG „unbedingt erforderlich", weil sich die Seite sonst
 * bei jedem Aufruf neu erkundigen müsste. Nichts davon geht an einen Server.
 *
 * - `"ja"`: Vorschaubilder und Player von YouTube dürfen laden.
 * - `"nein"`: abgelehnt — der Hinweis kommt nicht wieder, ▶ fragt je Film.
 * - `"offen"`: noch nicht entschieden — auf `/film` steht der Hinweis.
 * - `"unbekannt"`: auf dem Server und während der Hydration. Dann weiß die
 *   Seite es nicht und zeigt, was auch ohne Skript stimmt: Links.
 *
 * Nur aus Client-Komponenten benutzen (`useEinwilligung`).
 */
export type Einwilligung = "ja" | "nein" | "offen" | "unbekannt";

export const SCHLUESSEL = "einwilligung-youtube";

/** Geändert in diesem Tab — `storage` meldet nur Änderungen aus anderen Tabs. */
const EREIGNIS = "einwilligung-geaendert";

/** Liest die Entscheidung aus einem Speicher; alles Unbekannte heißt „offen". */
export function ausSpeicher(speicher: Pick<Storage, "getItem"> | undefined): Einwilligung {
  try {
    const wert = speicher?.getItem(SCHLUESSEL);
    return wert === "ja" || wert === "nein" ? wert : "offen";
  } catch {
    /* Gesperrter Speicher (manche private Fenster): wie unentschieden. */
    return "offen";
  }
}

function lesen(): Einwilligung {
  try {
    return ausSpeicher(window.localStorage);
  } catch {
    return "offen";
  }
}

/**
 * Speichert die Entscheidung. Lässt sie sich nicht speichern (Speicher
 * gesperrt), gilt sie trotzdem für diese Seite — über `notbehelf`.
 */
let notbehelf: Einwilligung | null = null;

export function setzeEinwilligung(wert: "ja" | "nein") {
  notbehelf = null;
  try {
    window.localStorage.setItem(SCHLUESSEL, wert);
  } catch {
    notbehelf = wert;
  }
  window.dispatchEvent(new Event(EREIGNIS));
}

function abonniere(neu: () => void): () => void {
  window.addEventListener("storage", neu);
  window.addEventListener(EREIGNIS, neu);
  return () => {
    window.removeEventListener("storage", neu);
    window.removeEventListener(EREIGNIS, neu);
  };
}

/** Die aktuelle Entscheidung, in allen Komponenten und Tabs gleich. */
export function useEinwilligung(): Einwilligung {
  return useSyncExternalStore(
    abonniere,
    () => notbehelf ?? lesen(),
    () => "unbekannt",
  );
}
