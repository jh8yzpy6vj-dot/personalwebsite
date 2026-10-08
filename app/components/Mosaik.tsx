"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Bild from "./Bild";
import { MOSAIK_SIZES } from "@/lib/bilder";
import type { Mosaikbild } from "@/lib/arbeiten";
import styles from "./Mosaik.module.css";

type Props = {
  /** Alle Bilder der Seite, in Anzeigereihenfolge (lib/arbeiten.ts). */
  bilder: Mosaikbild[];
};

/** Wie viele Bilder sofort laden — der Rest lädt, wenn er in die Nähe kommt. */
const SOFORT = 3;

/**
 * Das Mosaik auf `/foto`: alle Fotos aller Arbeiten in Spalten, jedes Bild
 * in seiner eigenen Form, **nichts beschnitten**, **keine Zwischenzeilen**
 * (E4). „Titel – Kunde" erscheint erst beim Überfahren bzw. bei
 * Tastaturfokus und im Lichtkasten.
 *
 * ⚠️ **Der erste Anlauf war ein Zeilensatz und ist am 2026-09-13
 * gescheitert.** Ein Zeilensatz reiht die Bilder in Dateireihenfolge
 * aneinander und kann Formate nicht mischen — bei fünf Hochformaten und
 * einem Querformat ein Streifen plus Einzelbild. Jan: „das mosaik ist
 * geordnet … das ist kein mosaik." Spalten mischen von selbst, weil jede
 * unabhängig gefüllt wird.
 *
 * **Kein JavaScript im Layout.** Der Spaltensatz ist reines CSS und trägt
 * auch ohne Skript; der Lichtkasten obendrauf ist eine Aufwertung, ohne ihn
 * ist jede Kachel ein gewöhnlicher Link auf die Bilddatei.
 */
export default function Mosaik({ bilder }: Props) {
  const [offen, setOffen] = useState<number | null>(null);
  /* Wohin der Fokus zurückgeht. Das hält zugleich die Scrollposition —
     siehe `schliesse`. */
  const ausloeser = useRef<HTMLAnchorElement | null>(null);

  const schliesse = useCallback(() => {
    setOffen(null);
    /*
     * ⚠️ Behebung von Jans Fehlerbild („beim schließen von einem bild in
     * großer ansicht landet man wieder ganz oben"). Ursache war ein Kasten
     * mit `position: absolute` im scrollenden Element. Der Kasten ist jetzt
     * `fixed`, und der Fokus geht auf die Kachel zurück, von der er kam.
     */
    ausloeser.current?.focus({ preventScroll: true });
  }, []);

  /* Blättert über **alle** Bilder der Seite, nicht nur innerhalb einer
     Arbeit — das Mosaik hat keine Grenzen zwischen den Arbeiten. */
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
       * `overflow: hidden` bekanntlich zurück. Deshalb wird die Position
       * ausdrücklich zurückgesetzt: im geprüften Browser wirkungslos, im
       * ungeprüften die Absicherung.
       */
      window.scrollTo(0, hoehe);
    };
  }, [offen, schliesse, blaettere]);

  if (bilder.length === 0) return null;

  const bildImKasten = offen === null ? null : bilder[offen];

  /*
   * Reihum verteilt, nicht spaltenweise: Bild 1 in Spalte 1, Bild 2 in
   * Spalte 2, Bild 3 in Spalte 3, Bild 4 wieder in Spalte 1. Damit liest
   * sich die obere Reihe 1-2-3 statt 1-3-5. Genau das kann der
   * Mehrspaltensatz des Browsers (`column-count`) nicht.
   */
  const spalten: { bild: Mosaikbild; i: number }[][] = [[], [], []];
  bilder.forEach((bild, i) => spalten[i % spalten.length].push({ bild, i }));

  return (
    <>
      {/*
        Eine Liste für Screenreader, drei Spalten fürs Auge. Die Spalten
        sind `role="presentation"`, damit sie nicht als drei Listen
        angesagt werden. Vorgelesen wird in DOM-Reihenfolge, also
        spaltenweise (1, 4, 7, 2, …) — jedes Bild nennt seine Arbeit im
        Alt-Text, deshalb bleibt die Zuordnung trotzdem klar.
      */}
      <div className={styles.mosaik} role="list">
        {spalten.map((spalte, s) => (
          <div key={s} className={styles.spalte} role="presentation">
            {spalte.map(({ bild, i }) => (
              <div
                role="listitem"
                key={bild.schluessel}
                className={styles.figur}
                /*
                 * ⚠️ **Nur auf dem Telefon wirksam, dort aber
                 * entscheidend.** Die Spalten sind schmal `display:
                 * contents`; die Bilder werden damit direkte Kinder des
                 * Mosaiks und lägen sonst in der Reihenfolge
                 * 1, 4, 2, 5, 3, 6 untereinander.
                 */
                style={{ order: i }}
              >
                {/*
                  Ein echter Link, kein `button`: Ohne JavaScript öffnet er
                  die Bilddatei, und im Kontextmenü steht „Link in neuem Tab
                  öffnen" — beides das, was man bei einem Foto erwartet.
                */}
                <a
                  className={styles.griff}
                  href={bild.quelle.fallback}
                  style={{ aspectRatio: `${bild.quelle.breite} / ${bild.quelle.hoehe}` }}
                  onClick={(e) => {
                    /* Mit Zusatztaste oder mittlerer Maustaste darf der
                       Link Link bleiben. */
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    ausloeser.current = e.currentTarget;
                    setOffen(i);
                  }}
                >
                  <Bild
                    className={styles.bild}
                    quelle={bild.quelle}
                    alt={bild.alt}
                    sizes={MOSAIK_SIZES}
                    vorrang={i < SOFORT}
                  />
                  {/* Für Sehende beim Überfahren. Vorgelesen wird sie nicht —
                      die Beschriftung steckt schon im Alt-Text. */}
                  <span className={styles.beschriftung} aria-hidden="true">
                    {bild.beschriftung}
                  </span>
                  <span className={styles.nurVorlesen}>, groß ansehen</span>
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>

      {bildImKasten && (
        <div
          className={styles.kasten}
          role="dialog"
          aria-modal="true"
          aria-label={bildImKasten.alt}
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
              alt={bildImKasten.alt}
              width={bildImKasten.quelle.breite}
              height={bildImKasten.quelle.hoehe}
            />
          </div>

          <p className={styles.kastenZeile}>{bildImKasten.beschriftung}</p>

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
