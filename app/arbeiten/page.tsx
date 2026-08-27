import type { Metadata } from "next";
import Topbar from "../components/Topbar";
import SiteFooter from "../components/SiteFooter";
import Works from "../components/Works";
import styles from "./arbeiten.module.css";

/**
 * Das Archiv. Gehört zur dunklen „sehen"-Hälfte (siehe SITE-PLAN.md):
 * randlose Bilder, minimale Typografie.
 *
 * **Kategorie ist die primäre Achse, das Jahr ein Label.** Niemand fragt
 * „was hat er 2024 gemacht?", gefragt wird „hat er sowas wie meins schon
 * gemacht?" — und je größer der Bestand, desto teurer wäre das Scrollen
 * durch Jahre ohne das eigene Thema.
 */
export const metadata: Metadata = {
  title: "arbeiten — jakob sax",
  description:
    "Arbeiten von Jakob Sax: Festivalfotografie, Bewegtbild und redaktionelle Beiträge.",
  alternates: { canonical: "/arbeiten" },
};

export default function Arbeiten() {
  return (
    <div className={styles.page}>
      <Topbar homeHref="/" />

      <main className={styles.main}>
        <h1 className={styles.title}>arbeiten.</h1>
        <Works headingId="arbeiten-titel" />
      </main>

      <div className={styles.light}>
        <SiteFooter current="/arbeiten" />
      </div>
    </div>
  );
}
