import type { Metadata } from "next";
import Seite from "../components/Seite";
import Bild from "../components/Bild";
import { bild } from "@/lib/bilder";
import { ABOUT } from "@/lib/content";
import styles from "./ueber.module.css";

export const metadata: Metadata = {
  title: "über mich — jakob sax",
  description: "Jakob Sax, Journalist beim SWR, Fotos und Filme.",
  alternates: { canonical: "/ueber" },
};

/**
 * `/ueber`: Bild links, rechts 3–4 Zeilen, darunter die Kontaktzeile
 * (E6, E12). Am Telefon untereinander, Bild zuerst. Das einzige Bild von
 * Jakob auf der ganzen Seite („nicht durch meine Fresse").
 */
export default function Ueber() {
  const portrait = bild("portrait");

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
    </Seite>
  );
}
