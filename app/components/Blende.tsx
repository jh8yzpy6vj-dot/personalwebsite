"use client";

import { useEffect, useRef, useState } from "react";
import Bild from "./Bild";
import { HERO_SIZES, type Bildquelle } from "@/lib/bilder";
import styles from "./Blende.module.css";

/**
 * Standzeit und Dauer sind **zwei** Entscheidungen.
 *
 * ⚠️ Im ersten Entwurf hingen sie aneinander (die Pause war fest
 * `dauer + 1600ms`), und genau deshalb sah man die Bilder nicht: Wer die
 * Blende kurz wollte, bekam zwangsweise auch ein kurzes Standbild. Jan:
 * „man sieht das bild nicht so recht und die transition ist auch zu
 * schnell". Die Werte sind am 2026-09-13 an acht Varianten ausgesucht
 * worden und stehen so in design/UI-SPEC.md.
 */
const STANDZEIT_MS = 4000;
const DAUER_MS = 1200;

/**
 * Die drei Flächen der Blockblende, als Prozent des Heros:
 * `[links, oben, breite, höhe]`.
 *
 * Ungleich groß und versetzt gesetzt — gleich große Flächen wirken nach
 * Raster, ungleiche nach Entscheidung. Das ist der Unterschied zwischen
 * „Effekt aus dem Menü" und „von Hand geschnitten".
 */
const FELDER = [
  [8, 14, 34, 30],
  [46, 40, 40, 36],
  [16, 56, 26, 28],
] as const;

type Props = {
  /** Leitbild zuerst, danach die Strecke. Mindestens ein Bild. */
  bilder: Bildquelle[];
  alt: string;
  /** `view-transition-name` für das erste Bild — siehe Bild.tsx. */
  uebergang?: string;
};

/**
 * Das Hero der Detailseite als Folge statt als Standbild.
 *
 * Jedes Bild steht 4 s, dann zeigen drei versetzte Flächen den nächsten
 * Ausschnitt, dann schlägt das ganze Bild um. Dazu eine Fahrt von 7 % über
 * die Standzeit — ein stehendes Foto wirkt nach zwei Sekunden tot, und die
 * Fahrt bemerkt man nicht als Effekt, sondern nur daran, dass das Bild lebt.
 *
 * **Was hier bewusst nicht passiert:**
 *
 * - Kein Vorladen der ganzen Strecke. Nur das erste Bild trägt `vorrang` —
 *   es ist der LCP der Seite. Alle weiteren laden erst, wenn sie an der
 *   Reihe sind; bei sieben Bildern über 10 MB Original wäre alles andere
 *   eine Zumutung für die Leitung.
 * - Kein Lauf im Hintergrund. Sobald das Hero aus dem Bild ist, steht die
 *   Folge still. Sonst brennt sie Akku, während jemand unten liest, und
 *   beim Zurückscrollen ist man mitten in einer Serie, die man nie gesehen
 *   hat.
 * - Keine Folge ohne Bewegungswunsch. Unter `prefers-reduced-motion` bleibt
 *   es beim Leitbild; dasselbe sieht, wer kein JavaScript hat, denn der
 *   erste Durchlauf rendert serverseitig genau dieses eine Bild.
 */
export default function Blende({ bilder, alt, uebergang }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"still" | "laeuft" | "fertig">("still");
  const heroRef = useRef<HTMLDivElement>(null);

  const mehrere = bilder.length > 1;

  useEffect(() => {
    if (!mehrere) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hero = heroRef.current;
    if (!hero) return;

    let takt: ReturnType<typeof setInterval> | undefined;
    let umschlag: ReturnType<typeof setTimeout> | undefined;

    const schalte = () => {
      /*
       * Zwei Bilder, zwei Schritte: Erst laufen die Blöcke auf (`laeuft`),
       * nach `DAUER_MS` deckt das ganze Bild zu (`fertig`). Erst der
       * nächste Takt zählt `index` hoch — dann ist das aufgedeckte Bild
       * das neue Standbild, ohne dass dabei etwas blitzt.
       */
      setPhase("laeuft");
      umschlag = setTimeout(() => setPhase("fertig"), DAUER_MS);
      setTimeout(() => {
        setIndex((i) => (i + 1) % bilder.length);
        setPhase("still");
      }, DAUER_MS + 40);
    };

    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        clearInterval(takt);
        if (eintrag.intersectionRatio > 0.25) {
          takt = setInterval(schalte, STANDZEIT_MS + DAUER_MS);
        }
      },
      { threshold: [0, 0.25, 0.6] },
    );
    beobachter.observe(hero);

    return () => {
      beobachter.disconnect();
      clearInterval(takt);
      clearTimeout(umschlag);
    };
  }, [bilder.length, mehrere]);

  const jetzt = bilder[index];
  const naechstes = bilder[(index + 1) % bilder.length];

  return (
    <div
      className={`${styles.buehne}${mehrere ? ` ${styles.lebt}` : ""} ${styles[phase]}`}
      ref={heroRef}
    >
      {/* Das laufende Bild. `index === 0` trägt den Vorrang und den
          Seitenübergang — beides gilt dem Leitbild, nicht der Folge. */}
      <div className={`${styles.lage} ${index % 2 ? styles.rueck : ""}`}>
        <Bild
          className={styles.bild}
          quelle={jetzt}
          alt={alt}
          sizes={HERO_SIZES}
          vorrang={index === 0}
          uebergang={index === 0 ? uebergang : undefined}
        />
      </div>

      {mehrere && phase !== "still" && (
        <>
          {/*
            ⚠️ Der Kern der Blockblende: Das Bild **im** Block ist so groß
            wie das ganze Hero und nur um die Blockposition verschoben.
            Bekäme jeder Block sein eigenes `object-fit: cover`, hätte jedes
            Viereck einen eigenen Zuschnitt — das Motiv zerfiele in Kacheln,
            statt durchzubrechen. Die Rechnung dazu steht in `feldStil`.
          */}
          <div className={styles.bloecke} aria-hidden="true">
            {FELDER.map(([l, t, b, h], i) => (
              <span
                key={i}
                className={styles.block}
                style={{
                  left: `${l}%`,
                  top: `${t}%`,
                  width: `${b}%`,
                  height: `${h}%`,
                  /* Gestaffelt über genau DAUER_MS, damit die Blende immer
                     gleich lang läuft, egal wie viele Flächen es sind. */
                  transitionDelay: `${(i * (DAUER_MS * 0.7)) / (FELDER.length - 1)}ms`,
                }}
              >
                <img
                  src={naechstes.fallback}
                  srcSet={naechstes.webp}
                  sizes={HERO_SIZES}
                  alt=""
                  style={{
                    width: `${(100 / b) * 100}%`,
                    height: `${(100 / h) * 100}%`,
                    left: `${-(l / b) * 100}%`,
                    top: `${-(t / h) * 100}%`,
                  }}
                />
              </span>
            ))}
          </div>

          <div className={`${styles.lage} ${styles.oben} ${(index + 1) % 2 ? styles.rueck : ""}`}>
            <Bild
              className={styles.bild}
              quelle={naechstes}
              alt=""
              sizes={HERO_SIZES}
            />
          </div>
        </>
      )}

      {/* Wo man in der Folge steht. Ohne das wirkt ein wechselndes Hero wie
          ein Fehler statt wie eine Strecke. */}
      {mehrere && (
        <p className={styles.zaehler}>
          <span className={styles.zaehlerText}>
            {index + 1} / {bilder.length}
          </span>
          <span className={styles.striche} aria-hidden="true">
            {bilder.map((_, i) => (
              <span key={i} className={i === index ? styles.an : undefined} />
            ))}
          </span>
        </p>
      )}
    </div>
  );
}
