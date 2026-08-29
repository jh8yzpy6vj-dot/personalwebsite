import { bildZurArbeit } from "@/lib/bilder";
import type { Work } from "@/lib/content";
import { metaLine } from "@/lib/works";
import Bild from "./Bild";
import styles from "./Kachelraster.module.css";

/**
 * Das Raster ist randlos und zweispaltig, unter 700px einspaltig — eine
 * Kachel ist also halb so breit wie das Fenster, auf dem Telefon so breit
 * wie das Fenster. Ohne diese Angabe lädt der Browser überall die Datei für
 * die volle Fensterbreite, also die doppelt zu große.
 */
const KACHEL_SIZES = "(max-width: 700px) 100vw, 50vw";

/**
 * Das randlose Kachelraster — im Archiv unter `/arbeiten` **und** im
 * Materialblock der Startseite.
 *
 * Reine Serverkomponente: Der Filter auf `/arbeiten` ist Zustand und lebt
 * deshalb in `Works.tsx`; das Raster selbst braucht keinen. So kann die
 * Startseite es ohne Client-JavaScript benutzen.
 *
 * Jede Kachel führt auf ihre eigene Seite. Das ist nicht nur Komfort: Nur
 * eine eigene URL kann für einen Festivalnamen ranken, und genau danach
 * sucht das Publikum, aus dem Auftraggeber kommen (siehe SITE-PLAN.md).
 */
export default function Kachelraster({ works }: { works: Work[] }) {
  return (
    <ul className={styles.grid}>
      {works.map((work) => {
        const bild = bildZurArbeit(work.id);
        return (
          <li key={work.id} className={`${styles.tile} aufsteigen`}>
            <a className={styles.tileLink} href={`/arbeiten/${work.id}`}>
              {bild ? (
                <Bild
                  className={styles.image}
                  quelle={bild}
                  alt={work.alt ?? `${work.title}, ${work.client}, ${work.year}`}
                  sizes={KACHEL_SIZES}
                  /* Trägt die Kachel denselben Namen wie das Bild auf der
                     Zielseite, wandert das Foto beim Klick dorthin.
                     Siehe globals.css. */
                  uebergang={`bild-${work.id}`}
                />
              ) : (
                <div className={styles.placeholder} aria-hidden="true">
                  <span className={styles.placeholderDot} />
                  <span className={styles.placeholderNote}>Bild folgt</span>
                </div>
              )}

              <div className={styles.meta}>
                <span className={styles.client}>{work.client}</span>
                <span className={styles.title}>{work.title}</span>
                <span className={styles.details}>{metaLine(work)}</span>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
