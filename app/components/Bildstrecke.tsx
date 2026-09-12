import { streckeSizes, streckenZeile, type Streckenbild } from "@/lib/bilder";
import Bild from "./Bild";
import styles from "./Bildstrecke.module.css";

type Props = {
  bilder: Streckenbild[];
  /** Für den Alt-Text, wenn die Arbeit keinen eigenen mitbringt. */
  titel: string;
};

/**
 * Die Bildstrecke einer Arbeit als waagerechter Filmstreifen.
 *
 * Das Briefing empfiehlt kuratierte Strecken statt einzelner Bilder. Ein
 * Streifen statt eines Rasters, weil Straßentheater **zeitlich** ist: Die
 * Bilder gehören in eine Reihenfolge, und die liest man von links nach
 * rechts, nicht in Zeilen.
 *
 * **Kein JavaScript.** `scroll-snap` macht das Einrasten, `overflow-x` das
 * Scrollen. Kein Karussell, keine Punkte, keine Pfeilknöpfe — die
 * angeschnittene Kante rechts ist die Einladung, und sie funktioniert auf
 * dem Telefon wie am Trackpad.
 *
 * Zwei Dinge, die eine scrollbare Fläche sonst unbedienbar machen:
 *
 * - `tabindex={0}` — ein waagerecht scrollender Bereich muss mit der
 *   Tastatur erreichbar sein, sonst kommt man ohne Maus nicht an die
 *   hinteren Bilder (WCAG 2.1.1). Deshalb auch `role`/`aria-label`, damit er
 *   im Fokus nicht als namenloser Kasten angesagt wird.
 * - `data-blaettern="aus"` — hier bewegen die Pfeiltasten den Streifen und
 *   wechseln **nicht** die Seite. Ohne diese Markierung würde die
 *   Blätterfunktion der Detailseite den Streifen unbrauchbar machen; siehe
 *   Blaettertasten.tsx.
 */
export default function Bildstrecke({ bilder, titel }: Props) {
  if (bilder.length === 0) return null;

  return (
    <section className={styles.strecke} aria-labelledby="strecke-titel">
      <h2 className={styles.srOnly} id="strecke-titel">
        Bildstrecke
      </h2>

      <div
        className={styles.streifen}
        tabIndex={0}
        role="group"
        aria-label={`Bildstrecke, ${bilder.length} Bilder — mit den Pfeiltasten blättern`}
        data-blaettern="aus"
      >
        {bilder.map(({ schluessel, quelle }, i) => {
          const zeile = streckenZeile(quelle.exif);
          return (
            <figure key={schluessel} className={styles.rahmen}>
              <Bild
                className={styles.bild}
                quelle={quelle}
                alt={`${titel}, Bild ${i + 1} von ${bilder.length}`}
                sizes={streckeSizes(quelle.breite, quelle.hoehe)}
                /* Das erste Bild steht direkt unter dem Hero und ist auf
                   großen Bildschirmen sichtbar, bevor jemand scrollt. */
                vorrang={i === 0}
              />
              {/* Nur Uhrzeit und ISO: In einer Strecke ist der Unterschied
                  zwischen den Bildern die Information, und Blende wie
                  Belichtungszeit stehen an allen acht gleich. */}
              {zeile && <figcaption className={styles.zeile}>{zeile}</figcaption>}
            </figure>
          );
        })}
      </div>

      <p className={styles.zaehler}>
        {bilder.length} bilder
      </p>
    </section>
  );
}
