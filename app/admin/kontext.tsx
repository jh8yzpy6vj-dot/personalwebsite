"use client";

import { createContext, useContext } from "react";
import type { Bildquelle } from "@/lib/bilder";
import type { Inhalt } from "@/lib/inhalt";
import type { Konfiguration } from "@/lib/admin/vertrag";
import type { Zielart } from "@/lib/admin/werkzeuge";

/**
 * Was jeder Reiter der Verwaltung braucht — einmal von der Wurzel
 * (`Verwaltung.tsx`) bereitgestellt, statt durch jede Ebene gereicht.
 *
 * ⚠️ Nur Daten und Funktionen, die schon im Browser sind. Server-Module
 * (`lib/admin/zugang`, `github`, `eingang`, `umgebung`) gehören **nie**
 * hierher: Sie tragen Secrets, und alles, was eine Client-Komponente
 * importiert, landet im Bündel für den Browser.
 */
export type Sitzung = {
  /** Der bearbeitete, (noch) ungespeicherte Inhalt. */
  inhalt: Inhalt;
  /** Das Manifest von `main` — welche Bilder es gibt. */
  bilder: Record<string, Bildquelle>;
  konfiguration: Konfiguration;
  /**
   * Ändert den Inhalt — immer über eine Funktion `Inhalt → Inhalt` aus
   * `lib/admin/werkzeuge.ts`. Jede Änderung lässt sich rückgängig machen;
   * Tippen in einem Feld zählt als ein Schritt.
   */
  aendere: (f: (i: Inhalt) => Inhalt) => void;
  /**
   * Wie `aendere`, dazu eine kurze Meldung über der Leiste mit „Rückgängig"
   * — für alles, was etwas verschwinden lässt oder sichtbar umstellt
   * (Löschen, Ausblenden, Hero, Wiederherstellen). `nimmtWeg`: Der Eintrag
   * verschwindet aus seiner Liste, die anderen rücken nach. Dann zählt ein
   * zweiter solcher Aufruf direkt danach (600 ms, nichts dazwischen) nicht —
   * der zweite Klick eines Doppelklicks träfe schon den nächsten Eintrag.
   */
  aendereMitMeldung: (f: (i: Inhalt) => Inhalt, text: string, nimmtWeg?: boolean) => void;
  /** Schlüssel, die hochgeladen sind oder im Eingang warten, aber noch nicht fertig verarbeitet. */
  unterwegs: Set<string>;
  /** Lädt Dateien auf feste Ziele hoch (Ersetzen, Porträt, Standbild). */
  ladeHoch: (auftraege: { datei: File; ziel: string }[]) => void;
  /** Lädt neue Bilder hoch; die Ziele (nächste freie Nummer) rechnet die Wurzel. */
  ladeNeueHoch: (art: Zielart, dateien: File[]) => void;
  /** Heute als `JJJJ-MM-TT` (für den Papierkorb). */
  heute: string;
  /** Öffnet das Seitenpanel „Bild bearbeiten". */
  bearbeite: (schluessel: string) => void;
  /** Gibt es Ungespeichertes? */
  ungespeichert: boolean;
};

export const SitzungKontext = createContext<Sitzung | null>(null);

export function useSitzung(): Sitzung {
  const s = useContext(SitzungKontext);
  if (!s) throw new Error("useSitzung außerhalb der Verwaltung");
  return s;
}
