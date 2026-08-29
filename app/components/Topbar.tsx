"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/content";
import { NAV_MAIN, NAV_SERVICES, isCurrent } from "@/lib/nav";
import styles from "./Topbar.module.css";

type Props = {
  /**
   * `"halves"` (Standard) — die Startseite mit dunkler und heller Hälfte:
   * Die Topbar beobachtet, über welcher sie gerade steht.
   *
   * `"light"` — Seiten, die durchgehend hell sind (Impressum, Datenschutz).
   * Ohne diesen Wert startete die Topbar dort im Dunkel-Modus und die weiße
   * Wortmarke wäre auf Papier unlesbar.
   */
  variant?: "halves" | "light";
  /** Ziel der Wortmarke. Auf der Startseite ein Sprung nach oben, sonst zurück. */
  homeHref?: string;
};

/**
 * Die Topbar gehört optisch zu der Hälfte, über der sie gerade steht:
 * über der dunklen "sehen"-Hälfte transparent mit heller Schrift, über der
 * hellen "lesen"-Hälfte mit Papier-Hintergrund und dunkler Schrift.
 *
 * **Das Menü ist bewusst auch am Desktop eingeklappt.** Eine ausgeschriebene
 * Navigation über dem Hero würde mit dem Bild konkurrieren — und genau das
 * soll die Topbar nicht. Mit acht Seiten braucht es aber einen Zugang, der
 * nicht erst am Seitenende auftaucht.
 *
 * Umgesetzt als natives `<dialog>`: Fokusfalle, Escape-Taste und die
 * Darstellung über allem anderen bringt der Browser mit — das spart eine
 * Bibliothek und ist zuverlässiger als selbst gebaute Tastaturlogik.
 */
export default function Topbar({
  variant = "halves",
  homeHref = "#",
}: Props = {}) {
  const [onLight, setOnLight] = useState(variant === "light");
  const [offen, setOffen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Durchgehend helle Seiten brauchen keinen Beobachter — sie sind immer hell.
    if (variant === "light") return;

    const light = document.getElementById("lesen");
    if (!light) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnLight(entry.isIntersecting),
      // Nur der oberste Streifen des Viewports zählt — dort steht die Topbar.
      { rootMargin: "0px 0px -100% 0px" }
    );

    observer.observe(light);
    return () => observer.disconnect();
  }, [variant]);

  // `showModal()` statt `open`-Attribut: nur so gibt es Fokusfalle,
  // Escape-Taste und ::backdrop.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  function schliessen() {
    setOffen(false);
    // Fokus zurück auf den Knopf — sonst landet man mit der Tastatur nach
    // dem Schließen am Seitenanfang und muss sich neu orientieren.
    buttonRef.current?.focus();
  }

  return (
    <>
      <header
        className={styles.topbar}
        data-on-light={onLight ? "true" : undefined}
      >
        <a className={styles.brand} href={homeHref}>
          {SITE.name}
        </a>
        <span className={styles.chip}>
          <span className={styles.chipDot} aria-hidden="true" />
          rec
        </span>

        <button
          ref={buttonRef}
          type="button"
          className={styles.burger}
          aria-label="Menü öffnen"
          aria-haspopup="dialog"
          aria-expanded={offen}
          onClick={() => setOffen(true)}
        >
          {/* Drei Striche. `aria-hidden`, weil die Beschriftung am Knopf
              hängt — sonst kündigt ein Screenreader drei leere Elemente an. */}
          <span className={styles.burgerLine} aria-hidden="true" />
          <span className={styles.burgerLine} aria-hidden="true" />
          <span className={styles.burgerLine} aria-hidden="true" />
        </button>
      </header>

      <dialog
        ref={dialogRef}
        className={styles.menu}
        aria-label="Menü"
        // Escape schließt nativ — der State muss aber mitziehen, sonst
        // bleibt `aria-expanded` auf true stehen.
        onClose={() => setOffen(false)}
        // Klick auf den Hintergrund schließt. Der Klick landet auf dem
        // dialog selbst, nicht auf dem Inhalt darin.
        onClick={(e) => {
          if (e.target === dialogRef.current) schliessen();
        }}
      >
        <div className={styles.menuInner}>
          <button
            type="button"
            className={styles.close}
            onClick={schliessen}
            aria-label="Menü schließen"
          >
            schließen
          </button>

          <nav className={styles.menuNav} aria-label="Hauptmenü">
            <ul className={styles.menuList}>
              {NAV_MAIN.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={
                      isCurrent(pathname, item.href) ? "page" : undefined
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <p className={styles.menuGroupLabel}>buchbar.</p>
            <ul className={styles.menuSubList}>
              {NAV_SERVICES.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={
                      isCurrent(pathname, item.href) ? "page" : undefined
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}
