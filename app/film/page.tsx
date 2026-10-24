import type { Metadata } from "next";
import Seite, { seitenStyles } from "../components/Seite";
import Bild from "../components/Bild";
import { filmeFuerSeite } from "@/lib/arbeiten";
import { FILM_SIZES } from "@/lib/bilder";
import { Hinweis, Schalter } from "../components/Einwilligung";
import FilmPlayer from "./FilmPlayer";
import styles from "./film.module.css";

export const metadata: Metadata = {
  title: "film — jakob sax",
  description: "Filme von Jakob Sax.",
  alternates: { canonical: "/film" },
};

/** Die ersten zwei Standbilder sofort, der Rest verzögert (UI-SPEC). */
const SOFORT = 2;

/**
 * `/film`: die Filme im Raster.
 *
 * - **YouTube-Filme laufen auf der Seite selbst** (seit 2026-10-24,
 *   `FilmPlayer`) — aber erst nach Einwilligung. Bis dahin geht beim Aufruf
 *   keine Anfrage an YouTube; der Hinweis unten fragt einmal, ▶ je Film.
 * - **Alles andere** (Mediathek, Vimeo) bleibt ein Link nach außen, im
 *   selben Tab (E11): Der Zurück-Knopf führt zurück; ungefragt neue Tabs zu
 *   öffnen ist eine Barriere.
 *
 * Siehe UI-SPEC, „Filme einbetten".
 */
export default function Filme() {
  const filme = filmeFuerSeite();
  const eingebettet = filme.some((f) => f.youtube);

  return (
    <Seite titel="Filme von Jakob Sax" aktuell="/film" breite="film">
      {filme.length > 0 ? (
        <ul className={styles.raster}>
          {filme.map((film, i) => {
            const standbild = film.standbild ? (
              <Bild
                className={styles.bild}
                quelle={film.standbild}
                alt=""
                sizes={FILM_SIZES}
                ausschnitt={film.ausschnitt}
                vorrang={i < SOFORT}
              />
            ) : null;

            if (film.youtube) {
              return (
                <li key={film.id}>
                  <FilmPlayer id={film.youtube} link={film.link} beschriftung={film.beschriftung} standbild={standbild} />
                  <p className={styles.zeile}>{film.beschriftung}</p>
                </li>
              );
            }

            return (
              <li key={film.id}>
                <a className={styles.kachel} href={film.link} rel="noreferrer">
                  <span className={styles.rahmen}>
                    {standbild ?? (
                      /* Noch kein Standbild: die dunkle Fläche mit ▶ wie bei
                         der Wege-Kachel auf / (UI-SPEC, „Ausnahme: Film ohne
                         Standbild"). */
                      <span className={styles.leer} aria-hidden="true">
                        <svg className={styles.play} viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M26 20 L46 32 L26 44 Z" fill="currentColor" />
                        </svg>
                      </span>
                    )}
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
            );
          })}
        </ul>
      ) : (
        <p className={seitenStyles.leer}>Filme folgen.</p>
      )}
      {eingebettet && (
        <>
          <Schalter className={styles.einwilligung} />
          <Hinweis />
        </>
      )}
    </Seite>
  );
}
