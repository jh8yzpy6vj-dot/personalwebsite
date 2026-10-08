"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroVideo.module.css";

type Props = {
  src: string;
  /** Standbild — Poster, solange das Video nicht läuft. */
  poster?: string;
  className?: string;
};

/** Die Wahl bleibt für die Sitzung, damit das Video nach einem Seitenwechsel
    nicht wieder anläuft (UI-SPEC, „Motion"). */
const SCHLUESSEL = "hero-pausiert";

function gemerkt(): boolean {
  try {
    return window.sessionStorage.getItem(SCHLUESSEL) === "1";
  } catch {
    return false;
  }
}

function merke(pausiert: boolean) {
  try {
    if (pausiert) window.sessionStorage.setItem(SCHLUESSEL, "1");
    else window.sessionStorage.removeItem(SCHLUESSEL);
  } catch {
    /* Privates Fenster o. Ä. — dann gilt die Wahl eben nur für diese Seite. */
  }
}

/**
 * Das Hero-Video der Startseite mit Pause-Knopf.
 *
 * - **Pause-Knopf ist Pflicht** (WCAG 2.2.2): Was sich länger als fünf
 *   Sekunden von selbst bewegt, muss sich anhalten lassen.
 * - `prefers-reduced-motion: reduce` → kein Autoplay, das Standbild steht.
 * - Im Hintergrund-Tab pausiert (`visibilitychange`).
 *
 * ⚠️ `autoPlay` steht bewusst **nicht** am Element: Sonst liefe das Video
 * an, bevor dieses Skript reduzierte Bewegung oder die gemerkte Pause
 * prüfen kann. Gestartet wird ausschließlich hier.
 */
export default function HeroVideo({ src, poster, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  /* Vom Nutzer angehalten (oder reduzierte Bewegung) — dann startet auch
     die Rückkehr in den Tab nichts. */
  const angehalten = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    angehalten.current = ruhig || gemerkt();

    const spiele = () => {
      /* iOS im Energiesparmodus verweigert das — dann bleibt das Poster
         stehen und der Knopf zeigt „abspielen". Gültiger Zustand. */
      video.play().catch(() => setLaeuft(false));
    };

    const onPlay = () => setLaeuft(true);
    const onPause = () => setLaeuft(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    const sichtbarkeit = () => {
      if (document.hidden) video.pause();
      else if (!angehalten.current) spiele();
    };
    document.addEventListener("visibilitychange", sichtbarkeit);

    if (!angehalten.current) spiele();

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", sichtbarkeit);
    };
  }, []);

  const umschalten = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      angehalten.current = false;
      merke(false);
      video.play().catch(() => setLaeuft(false));
    } else {
      angehalten.current = true;
      merke(true);
      video.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <button
        type="button"
        className={styles.knopf}
        onClick={umschalten}
        aria-label={laeuft ? "Video anhalten" : "Video abspielen"}
      >
        {laeuft ? (
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
            <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
          </svg>
        )}
      </button>
    </>
  );
}
