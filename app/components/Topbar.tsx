"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/content";
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
 * hellen "lesen"-Hälfte mit Papier-Hintergrund und dunkler Schrift. Sonst
 * wäre die weiße Wortmarke auf hellem Grund unlesbar.
 */
export default function Topbar({
  variant = "halves",
  homeHref = "#",
}: Props = {}) {
  const [onLight, setOnLight] = useState(variant === "light");

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

  return (
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
    </header>
  );
}
