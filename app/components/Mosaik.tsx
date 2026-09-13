"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Bild from "./Bild";
import {
  MOSAIK_SIZES,
  MOSAIK_ZEILENHOEHE,
  aufnahmeZeile,
  type Streckenbild,
} from "@/lib/bilder";
import styles from "./Mosaik.module.css";

type Props = {
  bilder: Streckenbild[];
  titel: string;
};

/**
 * Die Bildstrecke als Zeilensatz: Zeilen gleicher Höhe, jedes Bild in
 * seiner eigenen Breite, **nichts beschnitten**.
 *
 * Das ist der Punkt der ganzen Komponente. Eine Strecke mischt Hoch- und
 * Querformat — bei `wiwawo-53` fünf zu zwei —, und jedes Raster mit festen
 * Zellen schneidet dabei irgendwo einen Kopf ab.
 *
 * ⚠️ **Gerechnet wird in CSS, nicht hier.** Jede Kachel bekommt
 * `flex-grow: ar` und `flex-basis: ar × Zeilenhöhe`. Weil Zuwachs *und*
 * Grundbreite am Seitenverhältnis hängen, bleibt nach dem Verteilen des
 * freien Platzes jede Breite proportional zu `ar`:
 *
 *     breite = ar·C + (ar/Σar)·rest = ar · (C + rest/Σar)
 *     höhe   = breite / ar          = C + rest/Σar     ← für alle gleich
 *
 * Der naheliegende Weg wäre gewesen, die Zeilen in JavaScript aus der
 * gemessenen Containerbreite zu rechnen (`ResizeObserver`). Das tut
 * dasselbe, ist aber ohne Skript leer, rendert serverseitig nicht und
 * springt beim ersten Bild sichtbar. Deshalb CSS.
 *
 * Der Lichtkasten obendrauf ist eine **Aufwertung**: Ohne JavaScript ist
 * jede Kachel ein gewöhnlicher Link auf die Bilddatei.
 */
export default function Mosaik({ bilder, titel }: Props) {
  const [offen, setOffen] = useState<number | null>(null);
  /* Wohin der Fokus zurückgeht. Das hält zugleich die Scrollposition —
     siehe `schliesse`. */
  const ausloeser = useRef<HTMLAnchorElement | null>(null);

  const schliesse = useCallback(() => {
    setOffen(null);
    /*
     * ⚠️ Das ist die Behebung von Jans Fehlerbild („beim schließen von
     * einem bild in großer ansicht landet man wieder ganz oben"). Ursache
     * war ein Kasten mit `position: absolute` im scrollenden Element: Er
     * lag am Anfang des Inhalts, der Browser scrollte beim Fokussieren
     * dorthin, und nach dem Schließen stand man oben. Der Kasten ist jetzt
     * `fixed`, und der Fokus geht auf die Kachel zurück, von der er kam.
     */
    ausloeser.current?.focus({ preventScroll: true });
  }, []);

  const blaettere = useCallback(
    (schritt: number) =>
      setOffen((i) => {
        if (i === null) return i;
        const neu = i + schritt;
        return neu >= 0 && neu < bilder.length ? neu : i;
      }),
    [bilder.length],
  );

  useEffect(() => {
    if (offen === null) return;

    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); schliesse(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); blaettere(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); blaettere(1); }
    };
    document.addEventListener("keydown", taste);

    /*
     * Hintergrund festhalten, solange der Kasten offen ist. Die
     * Breitenkompensation ist kein Beiwerk: Verschwindet die Bildlaufleiste
     * ersatzlos, springt die ganze Seite darunter um deren Breite zur
     * Seite — sichtbar als Ruck beim Öffnen **und** beim Schließen.
     */
    const leiste = window.innerWidth - document.documentElement.clientWidth;
    const vorher = document.body.style.cssText;
    const hoehe = window.scrollY;
    document.body.style.overflow = "hidden";
    if (leiste > 0) document.body.style.paddingRight = `${leiste}px`;

    return () => {
      document.removeEventListener("keydown", taste);
      document.body.style.cssText = vorher;
      /*
       * ⚠️ Chromium behält die Scrollposition über das Sperren hinweg —
       * gemessen. Safari und iOS setzen sie beim Aufheben von
       * `overflow: hidden` bekanntlich zurück, und genau das wäre wieder
       * Jans Fehlerbild. Hier kann ich nur Chromium prüfen, deshalb wird
       * die Position ausdrücklich zurückgesetzt: im geprüften Browser ein
       * Sprung auf denselben Wert, also wirkungslos; im ungeprüften die
       * Absicherung. Gescrollt werden kann dazwischen nicht, der
       * Hintergrund ist gesperrt.
       */
      window.scrollTo(0, hoehe);
    };
  }, [offen, schliesse, blaettere]);

  if (bilder.length === 0) return null;

  const bildImKasten = offen === null ? null : bilder[offen];

  return (
    <>
      <ul className={styles.mosaik}>
        {bilder.map((bild, i) => {
          const ar = bild.quelle.breite / bild.quelle.hoehe;
          const zeile = aufnahmeZeile(bild.quelle.exif);
          return (
            <li
              key={bild.schluessel}
              className={styles.kachel}
              style={{
                flexGrow: ar,
                flexBasis: `${ar * MOSAIK_ZEILENHOEHE}px`,
              }}
            >
              <figure className={styles.figur}>
                {/*
                  Ein echter Link, kein `button`: Ohne JavaScript öffnet er
                  die Bilddatei, und im Kontextmenü steht „Link in neuem Tab
                  öffnen" — beides das, was man bei einem Foto erwartet.
                */}
                <a
                  className={styles.griff}
                  href={bild.quelle.fallback}
                  style={{ aspectRatio: `${bild.quelle.breite} / ${bild.quelle.hoehe}` }}
                  aria-label={`Bild ${i + 1} von ${bilder.length} groß öffnen${zeile ? `: ${zeile}` : ""}`}
                  onClick={(e) => {
                    /* Mit Zusatztaste oder mittlerer Maustaste darf der
                       Link Link bleiben — sonst nimmt man Leuten das
                       Öffnen in einem neuen Tab weg. */
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    ausloeser.current = e.currentTarget;
                    setOffen(i);
                  }}
                >
                  <Bild
                    className={styles.bild}
                    quelle={bild.quelle}
                    alt={`${titel}, Bild ${i + 1} von ${bilder.length}`}
                    sizes={MOSAIK_SIZES}
                  />
                </a>
                {/* Die **volle** Zeile, nicht die kurze — so von Jan am
                    2026-09-13 festgelegt, siehe „Aufnahmezeile" im
                    UI-SPEC. */}
                {zeile && <figcaption className={styles.zeile}>{zeile}</figcaption>}
              </figure>
            </li>
          );
        })}

        {/*
          ⚠️ Ohne diese Füller wächst die **letzte** Zeile auf die volle
          Breite auf: Zwei übriggebliebene Bilder würden riesig, und die
          Seite endete mit einem Knall, den niemand gemeint hat. Die Füller
          haben Höhe 0 und einen sehr hohen Zuwachs, schlucken also den
          freien Platz der letzten Zeile — in allen vollen Zeilen davor gibt
          es keinen, sie ändern dort also nichts.
        */}
        {[0, 1, 2].map((i) => (
          <li key={`fueller-${i}`} className={styles.fueller} aria-hidden="true" />
        ))}
      </ul>

      {bildImKasten && (
        <div
          className={styles.kasten}
          role="dialog"
          aria-modal="true"
          aria-label={`${titel}, Bild ${offen! + 1} von ${bilder.length}`}
          /* Hier blättern ← und → durch die Bilder, nicht durch die
             Arbeiten — siehe Blaettertasten.tsx. */
          data-blaettern="aus"
          onClick={(e) => {
            /* Klick neben das Bild schließt — aber nur, wenn wirklich der
               Grund getroffen wurde und nicht ein Kind davon. */
            if (e.target === e.currentTarget) schliesse();
          }}
        >
          <div className={styles.kastenBild}>
            <img
              src={bildImKasten.quelle.fallback}
              srcSet={bildImKasten.quelle.webp}
              sizes="100vw"
              alt={`${titel}, Bild ${offen! + 1} von ${bilder.length}`}
              width={bildImKasten.quelle.breite}
              height={bildImKasten.quelle.hoehe}
            />
          </div>

          <p className={styles.kastenZeile}>
            <span>{aufnahmeZeile(bildImKasten.quelle.exif)}</span>
            <span className={styles.kastenZahl}>
              {offen! + 1} / {bilder.length}
            </span>
          </p>

          <button
            type="button"
            className={styles.zu}
            onClick={schliesse}
            /* Der Fokus muss beim Öffnen in den Kasten — sonst tabbt man
               hinter ihm weiter durch die Seite. `autoFocus` ist hier
               richtig: Der Dialog erscheint erst auf eine Nutzeraktion. */
            autoFocus
          >
            <span aria-hidden="true">✕</span>
            <span className={styles.nurVorlesen}>Schließen</span>
          </button>

          <button
            type="button"
            className={`${styles.pfeil} ${styles.zurueck}`}
            onClick={() => blaettere(-1)}
            disabled={offen === 0}
          >
            <span aria-hidden="true">‹</span>
            <span className={styles.nurVorlesen}>Vorheriges Bild</span>
          </button>
          <button
            type="button"
            className={`${styles.pfeil} ${styles.vor}`}
            onClick={() => blaettere(1)}
            disabled={offen === bilder.length - 1}
          >
            <span aria-hidden="true">›</span>
            <span className={styles.nurVorlesen}>Nächstes Bild</span>
          </button>
        </div>
      )}
    </>
  );
}
