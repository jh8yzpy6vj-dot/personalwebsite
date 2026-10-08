import { NAV_LEGAL } from "@/lib/nav";
import styles from "./SiteFooter.module.css";

/**
 * Footer für alle Seiten außer der Startseite: Impressum · Datenschutz.
 * Sonst nichts — die Navigation steht oben, Kontakt auf `/ueber`.
 *
 * Die Startseite hat keinen Footer, weil sie nicht scrollt; dort stehen
 * dieselben zwei Links klein unten links im Video (app/page.tsx). Beide
 * lesen aus `NAV_LEGAL`, damit sie nicht auseinanderlaufen.
 */
export default function SiteFooter({
  /** Aktueller Pfad — wird nicht verlinkt, sondern markiert. */
  aktuell,
}: {
  aktuell?: string;
}) {
  return (
    <footer className={styles.footer}>
      <nav aria-label="Rechtliches">
        <ul className={styles.liste}>
          {NAV_LEGAL.map((item) => (
            <li key={item.href}>
              {item.href === aktuell ? (
                <span className={styles.aktuell} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
