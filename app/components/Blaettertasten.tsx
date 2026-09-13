"use client";

import { useEffect } from "react";

type Props = {
  /** Ziel der Pfeiltaste nach links. Fehlt am Anfang der Kategorie. */
  prev?: string;
  /** Ziel der Pfeiltaste nach rechts. Fehlt am Ende der Kategorie. */
  next?: string;
};

/**
 * Mit ← und → durch die Arbeiten blättern.
 *
 * Warum gerade hier: Wer Fotos anschaut, kommt aus Lightroom, Capture One
 * oder der Vorschau des Betriebssystems — überall blättern die Pfeiltasten.
 * Die Geste ist bei genau diesem Publikum schon gelernt; sie nicht anzubieten
 * ist die Überraschung, nicht umgekehrt.
 *
 * Rendert nichts. Die sichtbaren Links `vorherige / nächste` stehen ohnehin
 * auf der Seite — das hier ist eine Abkürzung dorthin, kein Ersatz. Deshalb
 * bleibt die Seite ohne JavaScript vollständig bedienbar.
 *
 * Drei Bedingungen, ohne die so etwas ärgerlich wird:
 *
 * 1. **Nicht in Eingabefeldern.** Wer in einem Textfeld den Cursor bewegt,
 *    will nicht die Seite wechseln. Gilt auch für `contenteditable`.
 * 2. **Nicht bei offenem Menü oder Lichtkasten.** Was den Fokus fängt, fängt
 *    auch die Pfeiltasten; ein Seitenwechsel im Hintergrund wäre Unfug.
 *    ⚠️ Geprüft wird `dialog[open]` **und** `[role="dialog"]`: Der
 *    Lichtkasten des Mosaiks ist kein `<dialog>`-Element, blättert aber
 *    selbst mit ← und →. Ohne die zweite Abfrage sprang er beim ersten
 *    Druck auf die nächste Arbeit — beim Messen gegen den echten Server
 *    aufgefallen, im Code sieht man es nicht.
 * 3. **Nicht mit Zusatztaste.** `Alt+←` ist im Browser „zurück", `Cmd+←`
 *    auf dem Mac ebenfalls. Diese Bedeutung darf die Seite nicht überschreiben.
 * 4. **Nicht in etwas, das selbst waagerecht scrollt.** Die Bildstrecke ist
 *    ein Bereich, den man mit den Pfeiltasten durchblättert — dort muss die
 *    Taste den Streifen bewegen und nicht die Seite wechseln. Solche Bereiche
 *    markieren sich mit `data-blaettern="aus"`.
 */
export default function Blaettertasten({ prev, next }: Props) {
  useEffect(() => {
    function bei(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const ziel = e.target as HTMLElement | null;
      if (ziel?.closest("input, textarea, select, [contenteditable]")) return;
      if (ziel?.closest('[data-blaettern="aus"]')) return;
      if (document.querySelector('dialog[open], [role="dialog"]')) return;

      const wohin = e.key === "ArrowLeft" ? prev : next;
      if (!wohin) return;

      e.preventDefault();
      /*
       * `location.assign` statt des Client-Routers von Next: Nur eine echte
       * Navigation löst den seitenübergreifenden View Transition aus, bei dem
       * das Foto mitwandert (siehe globals.css). Mit dem Router bliebe der
       * Effekt aus — und genau der ist hier die halbe Miete.
       */
      location.assign(wohin);
    }

    window.addEventListener("keydown", bei);
    return () => window.removeEventListener("keydown", bei);
  }, [prev, next]);

  return null;
}
