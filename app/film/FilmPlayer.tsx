"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { setzeEinwilligung, useEinwilligung } from "@/lib/einwilligung";
import { youtubePlayer, youtubeVorschau } from "@/lib/youtube";
import styles from "./film.module.css";

type Props = {
  /** Kennung des YouTube-Videos. */
  id: string;
  /** Der Link aus `lib/inhalt.json` — ohne Skript und ohne Einwilligung der Weg nach außen. */
  link: string;
  /** „Titel – Kunde". */
  beschriftung: string;
  /** Jakobs eigenes Standbild (auf dem Server gerendert), sonst `null`. */
  standbild: ReactNode;
};

/** Das ▶ der Wege-Kachel auf `/` — dasselbe Zeichen für „Film". */
function Play() {
  return (
    <svg className={styles.play} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M26 20 L46 32 L26 44 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Vorschaubild von YouTube — erst nach Einwilligung. Fällt von 1280 px auf
 * 480 px zurück, wenn es die große Stufe nicht gibt (YouTube antwortet dann
 * mit einem 120 px breiten Ersatzbild statt mit einem Fehler).
 */
function Vorschau({ id }: { id: string }) {
  const [klein, setKlein] = useState(false);
  return (
    <img
      className={styles.bild}
      src={youtubeVorschau(id, klein ? "hqdefault" : "maxresdefault")}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={(e) => {
        if (!klein && e.currentTarget.naturalWidth <= 120) setKlein(true);
      }}
      onError={() => {
        if (!klein) setKlein(true);
      }}
    />
  );
}

/**
 * Ein YouTube-Film auf `/film` (UI-SPEC, „Filme einbetten").
 *
 * - **Ohne Skript / vor der Hydration:** die bisherige Kachel, ein Link nach
 *   außen. So stimmt die Seite auch, bevor sie weiß, was entschieden ist.
 * - **Mit Einwilligung:** Vorschaubild (eigenes Standbild, sonst YouTubes);
 *   ▶ ersetzt die Kachel durch den Player, der sofort spielt.
 * - **Ohne Einwilligung:** eigenes Standbild bzw. die dunkle Fläche. ▶ fragt
 *   in der Kachel nach, statt ungefragt etwas von YouTube zu laden.
 */
export default function FilmPlayer({ id, link, beschriftung, standbild }: Props) {
  const einwilligung = useEinwilligung();
  const [spielt, setSpielt] = useState(false);
  const [fragt, setFragt] = useState(false);
  const erlaubenRef = useRef<HTMLButtonElement>(null);
  const kachelRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  /** Erst nach einer Rückfrage zurück auf die Kachel — nicht beim Laden der Seite. */
  const warGefragt = useRef(false);

  /* Der Fokus folgt dem, was an der Stelle der Kachel steht — sonst stünde
     er auf einem Knopf, den es nicht mehr gibt, und Tastatur-Nutzer fingen
     oben auf der Seite wieder an. */
  useEffect(() => {
    if (spielt) playerRef.current?.focus();
    else if (fragt) {
      warGefragt.current = true;
      erlaubenRef.current?.focus();
    } else if (warGefragt.current) {
      warGefragt.current = false;
      kachelRef.current?.focus();
    }
  }, [fragt, spielt]);

  const flaeche = (mitYoutube: boolean) => (
    <span className={styles.rahmen}>
      {standbild ?? (mitYoutube ? <Vorschau id={id} /> : <span className={styles.leer} />)}
      <span className={styles.abspielen}>
        <Play />
      </span>
    </span>
  );

  if (einwilligung === "unbekannt") {
    return (
      <a className={styles.kachel} href={link} rel="noreferrer" aria-label={`${beschriftung}, auf YouTube`}>
        {flaeche(false)}
      </a>
    );
  }

  if (einwilligung === "ja" && spielt) {
    return (
      <span className={styles.rahmen}>
        <iframe
          ref={playerRef}
          className={styles.player}
          src={youtubePlayer(id)}
          title={beschriftung}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </span>
    );
  }

  if (einwilligung !== "ja" && fragt) {
    return (
      <span className={`${styles.rahmen} ${styles.frage}`} role="group" aria-label={`${beschriftung} abspielen`}>
        <span className={styles.frageText}>
          Der Film liegt bei YouTube. Beim Abspielen gehen Daten an YouTube (Google).{" "}
          <a href="/datenschutz#youtube">Datenschutz</a>
        </span>
        <span className={styles.frageKnoepfe}>
          <button
            ref={erlaubenRef}
            type="button"
            className={styles.knopf}
            onClick={() => {
              setzeEinwilligung("ja");
              setSpielt(true);
            }}
          >
            Erlauben und abspielen
          </button>
          <a className={styles.knopf} href={link} rel="noreferrer">
            Auf YouTube <span aria-hidden="true">↗</span>
          </a>
          <button type="button" className={styles.knopfLeise} onClick={() => setFragt(false)}>
            Abbrechen
          </button>
        </span>
      </span>
    );
  }

  return (
    <button
      ref={kachelRef}
      type="button"
      className={styles.kachel}
      aria-label={`${beschriftung} abspielen`}
      onClick={() => (einwilligung === "ja" ? setSpielt(true) : setFragt(true))}
    >
      {flaeche(einwilligung === "ja")}
    </button>
  );
}
