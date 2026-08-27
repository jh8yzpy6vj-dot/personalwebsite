import { CONTACT } from "@/lib/content";
import styles from "./SiteFooter.module.css";

/**
 * Footer für alle Seiten. Trägt gleichzeitig die Navigation — die neue
 * Struktur ist mehrseitig (siehe SITE-PLAN.md), und die Topbar hält bewusst
 * nur die Wortmarke, damit sie über dem Hero nicht mit dem Bild konkurriert.
 */

const NAV = [
  { href: "/arbeiten", label: "arbeiten." },
  { href: "/ueber", label: "über." },
  { href: "/kontakt", label: "kontakt." },
] as const;

export default function SiteFooter({
  /** Aktueller Pfad — wird nicht verlinkt, sondern markiert. */
  current,
}: {
  current?: string;
}) {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav} aria-label="Seiten">
        {NAV.map((item) =>
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
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
        <a href={CONTACT.instagram.url} rel="noreferrer">
          {CONTACT.instagram.label}
        </a>
      </nav>
    </footer>
  );
}
