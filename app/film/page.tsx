import type { Metadata } from "next";
import Seite, { seitenStyles } from "../components/Seite";
import Bild from "../components/Bild";
import { filmeMitStandbild } from "@/lib/arbeiten";
import { FILM_SIZES } from "@/lib/bilder";
import styles from "./film.module.css";

export const metadata: Metadata = {
  title: "film — jakob sax",
  description: "Filme von Jakob Sax.",
  alternates: { canonical: "/film" },
};

/** Die ersten zwei Standbilder sofort, der Rest verzögert (UI-SPEC). */
const SOFORT = 2;

/**
 * `/film`: Standbilder, jedes ein Link nach außen (YouTube, Vimeo,
 * Mediathek). **Kein Film liegt auf der Seite selbst, kein eingebetteter
 * Player** — die Standbilder liegen bei uns, damit beim Aufruf keine Anfrage
 * an Dritte geht.
 *
 * Selber Tab (E11): Der Zurück-Knopf führt zurück; ungefragt neue Tabs zu
 * öffnen ist eine Barriere.
 */
export default function Filme() {
  const filme = filmeMitStandbild();

  return (
    <Seite titel="Filme von Jakob Sax" aktuell="/film" breite="film">
      {filme.length > 0 ? (
        <ul className={styles.raster}>
          {filme.map((film, i) => (
            <li key={film.id}>
              <a className={styles.kachel} href={film.link} rel="noreferrer">
                <span className={styles.rahmen}>
                  <Bild
                    className={styles.bild}
                    quelle={film.standbild}
                    alt=""
                    sizes={FILM_SIZES}
                    ausschnitt={film.ausschnitt}
                    vorrang={i < SOFORT}
                  />
                </span>
                <span className={styles.zeile}>
                  {film.beschriftung}
                  <span className="nur-vorlesen">, {film.ziel}</span>
                  <span className={styles.pfeil} aria-hidden="true">
                    ↗
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={seitenStyles.leer}>Filme folgen.</p>
      )}
    </Seite>
  );
}
