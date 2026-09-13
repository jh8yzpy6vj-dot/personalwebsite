/**
 * Wo der Bildausschnitt sitzt — je Bild, von Hand gewählt.
 *
 * Gilt **nur dort, wo ein Bild beschnitten werden muss**: im Hero der
 * Detailseite. Das Mosaik darunter schneidet nichts zu, dort ist der Wert
 * ohne Wirkung.
 *
 * ## Warum das eine eigene Datei ist
 *
 * `TECH-STACK.md` sagt „Konvention statt Konfiguration“, und das gilt
 * weiterhin für **Namen**: Welches Bild zu welcher Arbeit gehört, steht im
 * Dateipfad und nirgends sonst — ein zweites Feld dafür wäre eine zweite
 * Stelle, an der derselbe Name falsch stehen kann.
 *
 * Ein Bildausschnitt ist etwas anderes: Er steht **nirgendwo sonst**. Er
 * ist keine Wiederholung, sondern neue Information, und sie kann nur von
 * einem Menschen kommen, der das Foto ansieht.
 *
 * ⚠️ **Vorgänger, zwei Versuche, beide am 2026-09-13 verworfen:**
 *
 * 1. Ein fester Wert im Stylesheet (`center 38%`) — bei jedem zweiten
 *    Motiv falsch, weil er über alle Bilder derselbe ist.
 * 2. Eine Endung am Dateinamen (`-oben`, `-unten`) — drei Stufen sind zu
 *    grob, und jede Änderung verlangte Umbenennen im Bucket **und** einen
 *    neuen Medien-Lauf. Jan: „da werden wir glaub ich nicht glücklich
 *    mit.“
 *
 * Hier dagegen: jeder Wert, sofort wirksam, eine Zeile, kein
 * Bucket-Zugriff, kein `npm run medien`.
 *
 * ## Format
 *
 * Der Wert ist ein `object-position` wie in CSS: erst waagerecht, dann
 * senkrecht. `0% 0%` ist links oben, `100% 100%` rechts unten.
 *
 *     "arbeiten/wiwawo-53/02": "50% 78%",   // Lagerfeuer sitzt unten
 *
 * Der Schlüssel ist der Pfad unter `original/` ohne Endung — derselbe, der
 * auch in `lib/bilder-manifest.json` steht. Für das Leitbild einer Arbeit
 * also `arbeiten/<id>`, für die Strecke `arbeiten/<id>/01`.
 *
 * ⚠️ **Ein Test prüft, dass jeder Schlüssel hier auch im Manifest
 * existiert.** Sonst bliebe ein Eintrag nach einer Umbenennung still
 * liegen und niemand merkte, dass der Ausschnitt nicht mehr greift.
 *
 * ## Werte finden
 *
 * Nicht schätzen. Es gibt ein Werkzeug dafür — Bild laden, Punkt ziehen,
 * fertige Zeile herauskopieren. Siehe `TODO.md`, Abschnitt „Medien“.
 *
 * Ohne Eintrag gilt mittig (`50% 50%`). Das ist bei keinem Motiv grob
 * falsch und deshalb der einzige vertretbare Standard.
 */
export const BILDAUSSCHNITTE: Record<string, string> = {
  /*
   * Noch leer: Die Werte müssen von jemandem kommen, der die Fotos
   * ansieht — geraten wären sie schlechter als der mittige Standard.
   */
};
