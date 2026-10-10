import { bild } from "@/lib/bilder";
import { ABOUT } from "@/lib/content";
import Bild from "./Bild";
import styles from "./UeberAnriss.module.css";

/**
 * Kurzvorstellung auf der Startseite: Porträt, zwei Sätze, ein Weiterweg.
 *
 * Seit dem 2026-10-10 wieder da, im Aufbau von vor dem Umbau (Jans
 * Entscheidung, UI-SPEC „Startseite"): heller Grund, Porträt links, „jakob."
 * und die zwei Sätze rechts. Die Sätze kommen aus `ABOUT.zeilen` — dieselben
 * wie auf `/ueber`, damit es keine zweite Fassung gibt, die auseinanderläuft.
 */
export default function UeberAnriss() {
  const portrait = bild("portrait");

  return (
    <section className={styles.anriss} aria-labelledby="ueber-anriss">
      <div className={styles.innen}>
        <div className={styles.bildSpalte}>
          {portrait ? (
            <Bild
              className={styles.portrait}
              quelle={portrait}
              alt={ABOUT.portraitAlt}
              sizes="(max-width: 800px) 92vw, 420px"
            />
          ) : (
            /* Ein ehrlicher Platzhalter statt einer leeren Spalte, die
               aussieht wie ein Fehler. */
            <div className={styles.platzhalter} aria-hidden="true">
              <span className={styles.platzhalterPunkt} />
              <span className={styles.platzhalterNotiz}>Porträt folgt</span>
            </div>
          )}
        </div>

        <div className={styles.textSpalte}>
          <h2 className={styles.titel} id="ueber-anriss">
            jakob.
          </h2>
          {ABOUT.zeilen.map((satz) => (
            <p key={satz} className={styles.satz}>
              {satz}
            </p>
          ))}
          <p className={styles.mehrZeile}>
            <a className={styles.mehr} href="/ueber">
              → mehr erfahren
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
