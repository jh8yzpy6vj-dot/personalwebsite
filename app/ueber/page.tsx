import type { Metadata } from "next";
import Seite from "../components/Seite";
import Bild from "../components/Bild";
import Mosaik from "../components/Mosaik";
import { bild } from "@/lib/bilder";
import { bilderFuerUeber } from "@/lib/arbeiten";
import { ABOUT } from "@/lib/content";
import styles from "./ueber.module.css";

export const metadata: Metadata = {
  title: "über mich — jakob sax",
  description: "Jakob Sax, Journalist beim SWR, Fotos und Filme.",
  alternates: { canonical: "/ueber" },
};

/**
 * `/ueber`: Bild links, rechts 3–4 Zeilen, darunter die Kontaktzeile
 * (E6, E12). Am Telefon untereinander, Bild zuerst. Darunter seit dem
 * 2026-10-14 die Bilder aus Jakobs Liste mit der Kategorie „Über mich".
 * Bilder von Jakob stehen nur hier („nicht durch meine Fresse"), plus der
 * Anriss auf `/`.
 */
export default function Ueber() {
  const portrait = bild("portrait");
  const bilder = bilderFuerUeber();

  return (
    <Seite titel="Über Jakob Sax" aktuell="/ueber" breite="ueber">
      <div className={portrait ? styles.zweispaltig : undefined}>
        {portrait && (
          <div className={styles.bildspalte}>
            <Bild
              className={styles.portrait}
              quelle={portrait}
              alt={ABOUT.portraitAlt}
              sizes="(max-width: 800px) 92vw, 460px"
              vorrang
            />
          </div>
        )}

        <div className={styles.text}>
          {ABOUT.zeilen.map((zeile) => (
            <p key={zeile} className={styles.zeile}>
              {zeile}
            </p>
          ))}

          <p className={styles.kontakt}>
            <a href={`mailto:${ABOUT.email}`}>{ABOUT.email}</a>
            <span aria-hidden="true"> · </span>
            <a href={ABOUT.instagram.url} rel="noreferrer">
              {ABOUT.instagram.label}
            </a>
            <span aria-hidden="true"> · </span>
            <a href={ABOUT.swr.url} rel="noreferrer">
              {ABOUT.swr.label}
            </a>
          </p>
        </div>
      </div>

      {/* Die Bilder, die laut Jakobs Liste „nicht unter Fotos & Startseite"
          stehen sollen — Jakob bei der Arbeit. */}
      {bilder.length > 0 && (
        <div className={styles.bilder}>
          <Mosaik bilder={bilder} />
        </div>
      )}
    </Seite>
  );
}
