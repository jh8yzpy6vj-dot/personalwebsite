import type { Metadata } from "next";
import Seite from "./components/Seite";
import styles from "./not-found.module.css";

/**
 * Eigene 404-Seite. Führt weiter, statt sich zu entschuldigen (UI-SPEC,
 * „Copywriting Contract"): eine Zeile, zwei Wege.
 */
export const metadata: Metadata = {
  title: "Seite nicht gefunden — jakob sax",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Seite titel="Hier ist nichts." titelSichtbar breite="text">
      <ul className={styles.wege}>
        <li>
          <a href="/foto">foto</a>
        </li>
        <li>
          <a href="/film">film</a>
        </li>
      </ul>
    </Seite>
  );
}
