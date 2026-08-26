"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/content";
import styles from "./Topbar.module.css";

/**
 * Die Topbar gehört optisch zu der Hälfte, über der sie gerade steht:
 * über der dunklen "sehen"-Hälfte transparent mit heller Schrift, über der
 * hellen "lesen"-Hälfte mit Papier-Hintergrund und dunkler Schrift. Sonst
 * wäre die weiße Wortmarke auf hellem Grund unlesbar.
 */
export default function Topbar() {
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    const light = document.getElementById("lesen");
    if (!light) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOnLight(entry.isIntersecting),
      // Nur der oberste Streifen des Viewports zählt — dort steht die Topbar.
      { rootMargin: "0px 0px -100% 0px" }
    );

    observer.observe(light);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={styles.topbar}
      data-on-light={onLight ? "true" : undefined}
    >
      <a className={styles.brand} href="#">
        {SITE.name}
      </a>
      <span className={styles.chip}>
        <span className={styles.chipDot} aria-hidden="true" />
        rec
      </span>
    </header>
  );
}
