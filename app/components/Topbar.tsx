import { SITE } from "@/lib/content";
import { NAV_MAIN, isCurrent } from "@/lib/nav";
import styles from "./Topbar.module.css";

type Props = {
  /**
   * Pfad der aktuellen Seite. Markiert das passende Ziel mit dem ●-Punkt
   * und `aria-current`. Fehlt er (404), ist nichts markiert.
   */
  aktuell?: string;
  /**
   * Die Startseite: Die Leiste liegt durchsichtig über dem Video, und links
   * steht **nur ●REC** — der Schriftzug steht dort groß in der Mitte, ein
   * zweiter in der Ecke wäre doppelt. Über einem laufenden Video ist ●REC
   * genau das, was es auf einem Kameradisplay ist.
   */
  startseite?: boolean;
};

/**
 * Die Topbar: links „jakob sax" und ●REC, rechts die Navigation.
 *
 * **Kein Menü-Knopf.** Drei Ziele passen ausgeschrieben auch aufs Telefon;
 * wird es zu eng, rutscht die Navigation in eine zweite Zeile, statt sich
 * einzuklappen (UI-SPEC, „Topbar").
 *
 * Reine Serverkomponente: Jede Seite kennt ihren eigenen Pfad und reicht ihn
 * durch. Dafür braucht es weder `usePathname` noch ein Byte JavaScript.
 */
export default function Topbar({ aktuell, startseite = false }: Props) {
  return (
    <header
      className={styles.topbar}
      data-startseite={startseite ? "true" : undefined}
    >
      <div className={styles.links}>
        {!startseite && (
          <a className={styles.marke} href="/">
            {SITE.name}
          </a>
        )}
        {/* Die Bildmarke. Für Screenreader ohne Inhalt — „rec" vorgelesen
            sagt nichts, was die Seite betrifft. */}
        <span className={styles.rec} aria-hidden="true">
          <span className={styles.recPunkt} />
          rec
        </span>
      </div>

      <nav className={styles.nav} aria-label="Hauptnavigation">
        <ul className={styles.liste}>
          {NAV_MAIN.map((item) => (
            <li key={item.href}>
              <a
                className={styles.ziel}
                href={item.href}
                aria-current={isCurrent(aktuell, item.href) ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
