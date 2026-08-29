import { CONTACT } from "@/lib/content";
import { NAV_LEGAL, NAV_MAIN } from "@/lib/nav";
import styles from "./SiteFooter.module.css";

/**
 * Footer für alle Seiten.
 *
 * Zeigt dieselben Hauptbereiche wie das Topbar-Menü — beide beziehen sie
 * aus `lib/nav.ts`, damit sie nicht auseinanderlaufen. Der Footer ist der
 * Weg für alle, die bis ans Ende gelesen haben; das Menü der für alle
 * anderen.
 */
export default function SiteFooter({
  /** Aktueller Pfad — wird nicht verlinkt, sondern markiert. */
  current,
}: {
  current?: string;
}) {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav} aria-label="Seiten">
        {NAV_MAIN.map((item) =>
          item.href === current ? (
            <span key={item.href} className={styles.current} aria-current="page">
              {item.label}
            </span>
          ) : (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          )
        )}
      </nav>

      <nav className={styles.nav} aria-label="Rechtliches und Profile">
        {NAV_LEGAL.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
        <a href={CONTACT.instagram.url} rel="noreferrer">
          {CONTACT.instagram.label}
        </a>
      </nav>
    </footer>
  );
}
