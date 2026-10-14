import type { Metadata } from "next";
import Seite, { seitenStyles } from "../components/Seite";
import Bild from "../components/Bild";
import { uebersicht } from "@/lib/arbeiten";
import { UEBERSICHT_SIZES } from "@/lib/bilder";
import styles from "./foto.module.css";

export const metadata: Metadata = {
  title: "foto — jakob sax",
  description: "Fotos von Jakob Sax: Festival, Theater, Paddeln, Journalismus.",
  alternates: { canonical: "/foto" },
};

/** Wie viele Startbilder sofort laden — die erste Reihe auf dem Laptop. */
const SOFORT = 3;

/**
 * `/foto`: die Übersicht. Je Kategorie die Arbeiten mit ihrem **Startbild**,
 * darunter „Titel – Kunde"; jede Kachel führt auf die Detailseite
 * (`/foto/<id>`), dort stehen alle Bilder (UI-SPEC, „Seitenstruktur").
 *
 * ⚠️ Bis zum 2026-10-14 stand hier ein einziges Mosaik aus allen Fotos (E4).
 * Mit Jakobs Bilderliste sind es elf Arbeiten in vier Kategorien — ein
 * Mosaik aus 40 Bildern ohne Zuordnung trägt das nicht mehr. Jan: „ein
 * startbild, dann detailseite".
 */
export default function Foto() {
  const bloecke = uebersicht();
  let nr = 0;

  return (
    <Seite titel="Fotos von Jakob Sax" aktuell="/foto" breite="foto">
      {bloecke.length > 0 ? (
        bloecke.map((block) => (
          <section key={block.id} className={styles.block} aria-labelledby={`kat-${block.id}`}>
            <h2 className={styles.kategorie} id={`kat-${block.id}`}>
              {block.label}
            </h2>
            <ul className={styles.raster}>
              {block.arbeiten.map(({ arbeit, beschriftung, startbild }) => {
                const vorrang = nr++ < SOFORT;
                return (
                  <li key={arbeit.id}>
                    <a className={styles.kachel} href={`/foto/${arbeit.id}`}>
                      <span className={styles.rahmen}>
                        <Bild
                          className={styles.bild}
                          quelle={startbild.quelle}
                          alt={startbild.alt}
                          sizes={UEBERSICHT_SIZES}
                          ausschnitt={startbild.ausschnitt}
                          vorrang={vorrang}
                          /* Dasselbe Foto steht auf der Detailseite als erstes
                             im Hero — mit demselben Namen wächst es beim Klick
                             von der Kachel dorthin (UI-SPEC, „Motion"). */
                          uebergang={`start-${arbeit.id}`}
                        />
                      </span>
                      <span className={styles.zeile}>
                        {beschriftung}
                        <span className={styles.pfeil} aria-hidden="true">
                          →
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      ) : (
        <p className={seitenStyles.leer}>Fotos folgen.</p>
      )}
    </Seite>
  );
}
