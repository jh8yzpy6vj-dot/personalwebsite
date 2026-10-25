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
 * Läuft das Video, blinkt der ●REC-Punkt in der Topbar (UI-SPEC, „Motion").
 * Die Topbar ist eine Serverkomponente und weiß davon nichts — sie liest den
 * Zustand über dieses Attribut am `<html>`.
 */
function aufnahme(laeuft: boolean) {
  if (laeuft) document.documentElement.dataset.aufnahme = "laeuft";
  else delete document.documentElement.dataset.aufnahme;
}

/**
 * Das Hero-Video der Startseite mit Pause-Knopf.
 *
 * - **Pause-Knopf ist Pflicht** (WCAG 2.2.2): Was sich länger als fünf
 *   Sekunden von selbst bewegt, muss sich anhalten lassen.
 * - `prefers-reduced-motion: reduce` → kein Autoplay, das Standbild steht.
 * - Im Hintergrund-Tab pausiert (`visibilitychange`).
 * - **Verweigert der Browser den Start** (iPhone im Stromsparmodus, Safari
 *   mit „Automatische Wiedergabe: Nie", Datensparmodus), läuft das Video
 *   beim ersten Antippen, Klicken oder Tastendruck irgendwo auf der Seite an
 *   (seit 2026-10-25) — statt nur über den Knopf unten rechts.
 *
 * ⚠️ `autoPlay` steht bewusst **nicht** am Element: Sonst liefe das Video
 * an, bevor dieses Skript reduzierte Bewegung oder die gemerkte Pause
 * prüfen kann. Gestartet wird ausschließlich hier.
 */
export default function HeroVideo({ src, poster, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  /* Vom Nutzer angehalten (oder reduzierte Bewegung) — dann startet auch
     die Rückkehr in den Tab nichts. */
  const angehalten = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    angehalten.current = ruhig || gemerkt();

    /* Stumm muss es sein, sonst verweigern alle Browser den Start ohne
       Klick. Das Attribut allein reicht nicht überall, wenn React das
       Element erst beim Seitenwechsel anlegt — deshalb auch die Eigenschaft. */
    video.muted = true;
    video.defaultMuted = true;

    const ereignisse = ["pointerdown", "keydown", "touchend"] as const;
    const beimErstenAntippen = (e: Event) => {
      for (const art of ereignisse) document.removeEventListener(art, beimErstenAntippen);
      /* Der Knopf schaltet selbst — sonst startete das hier das Video, und
         sein Klick hielte es gleich wieder an. */
      if (e.target instanceof Node && knopf.current?.contains(e.target)) return;
      if (!angehalten.current && video.paused) spiele();
    };

    const spiele = () => {
      /* iOS im Energiesparmodus verweigert das — dann bleibt das Poster
         stehen und der Knopf zeigt „abspielen". Gültiger Zustand. Mit der
         ersten Berührung der Seite gilt das Abspielen als vom Nutzer
         gewollt, und der Browser lässt es zu. */
      video.play().catch((fehler: unknown) => {
        setLaeuft(false);
        if (fehler instanceof DOMException && fehler.name === "NotAllowedError") {
          for (const e of ereignisse) document.addEventListener(e, beimErstenAntippen, { passive: true });
        }
      });
    };

    const onPlay = () => {
      setLaeuft(true);
      aufnahme(true);
    };
    const onPause = () => {
      setLaeuft(false);
      aufnahme(false);
    };
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
      for (const e of ereignisse) document.removeEventListener(e, beimErstenAntippen);
      /* Beim Verlassen der Startseite: Auf den Unterseiten steht der Punkt. */
      aufnahme(false);
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
        ref={knopf}
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
