import { bild } from "@/lib/bilder";
import { ABOUT } from "@/lib/content";
import Bild from "./Bild";
import styles from "./UeberAnriss.module.css";

/**
 * Kurzvorstellung auf der Startseite: Porträt, zwei Sätze, ein Weiterweg.
 *
 * **Warum das direkt hinter den Hero gehört:** Wer auf einer Fotografenseite
 * landet, will als Erstes wissen, wer das ist. Vorher stand hier das
 * Angebot — das ist die Antwort auf eine Frage, die noch niemand gestellt
 * hat. Erst Person, dann Material, dann Angebot; so ist die Seite jetzt
 * sortiert (siehe SITE-PLAN.md).
 *
 * **Liegt in der dunklen Hälfte.** Nicht, weil Text dorthin gehörte, sondern
 * weil die Seite genau **eine** Naht dunkel → hell hat. Hero, Porträt und
 * Material sind zusammen das „Sehen", das Angebot darunter das „Lesen".
 * Zwei Sätze auf dunklem Grund sind vertretbar; ein Textblock wäre es nicht.
 *
 * Die Sätze stehen **nicht** eigens hier, sondern kommen aus denselben
 * Absätzen wie `/ueber` (`ABOUT.anriss` wählt aus). Eine zweite Fassung
 * desselben Inhalts läuft auseinander, sobald jemand nur eine ändert.
 */
export default function UeberAnriss() {
  const portrait = bild("portrait");
  const saetze = ABOUT.anriss.map((i) => ABOUT.paragraphs[i]).filter(Boolean);

  return (
    <section className={styles.anriss} aria-labelledby="ueber-anriss">
      {portrait ? (
        <div className={styles.bildSpalte}>
          <Bild
            className={styles.portrait}
            quelle={portrait}
            alt={ABOUT.portraitAlt}
            sizes="(max-width: 800px) 100vw, 420px"
            uebergang="portrait"
          />
        </div>
      ) : (
        /* Derselbe ehrliche Platzhalter wie bei den Kacheln, statt einer
           leeren Spalte, die aussieht wie ein Fehler. */
        <div className={styles.bildSpalte}>
          <div className={styles.platzhalter} aria-hidden="true">
            <span className={styles.platzhalterPunkt} />
            <span className={styles.platzhalterNotiz}>Porträt folgt</span>
          </div>
        </div>
      )}

      <div className={styles.textSpalte}>
        <h2 className={styles.titel} id="ueber-anriss">
          jakob.
        </h2>
        {saetze.map((satz) => (
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
    </section>
  );
}
