"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Bild from "./Bild";
import { MOSAIK_SIZES, aufnahmeZeile, type Streckenbild } from "@/lib/bilder";
import styles from "./Mosaik.module.css";

type Props = {
  bilder: Streckenbild[];
  titel: string;
};

/**
 * Die Bildstrecke als Spaltenmosaik: jedes Bild in seiner eigenen Form,
 * **nichts beschnitten**.
 *
 * Das ist der Punkt der ganzen Komponente. Eine Strecke mischt Hoch- und
 * Querformat — bei `wiwawo-53` fünf zu eins —, und jedes Raster mit festen
 * Zellen schneidet dabei irgendwo einen Kopf ab.
 *
 * ⚠️ **Der erste Anlauf war ein Zeilensatz und ist am 2026-09-13
 * gescheitert.** Er rechnete Zeilen gleicher Höhe, bündig an beiden
 * Rändern — sauber, aber das falsche Werkzeug: Ein Zeilensatz reiht die
 * Bilder in Dateireihenfolge aneinander und kann Formate nicht mischen.
 * Bei fünf Hochformaten gefolgt von einem Querformat kam genau das heraus:
 * ein Streifen aus fünf schmalen Bildern, darunter ein einzelnes breites.
 * Jan: „das mosaik ist geordnet … das ist kein mosaik."
 *
 * Spalten mischen von selbst, weil jede unabhängig gefüllt wird. Die
 * Begründung und der Preis (senkrechte Reihenfolge) stehen im Kopf von
 * `Mosaik.module.css`.
 *
 * Weiterhin: **kein JavaScript im Layout.** Der Spaltensatz ist reines CSS
 * und trägt auch ohne Skript; der Lichtkasten obendrauf ist eine
 * Aufwertung, und ohne ihn ist jede Kachel ein gewöhnlicher Link auf die
 * Bilddatei.
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

  /*
   * Reihum verteilt, nicht spaltenweise: Bild 1 in Spalte 1, Bild 2 in
   * Spalte 2, Bild 3 in Spalte 3, Bild 4 wieder in Spalte 1. Damit liest
   * sich die obere Reihe 1-2-3 statt 1-3-5.
   *
   * Genau das kann der Mehrspaltensatz des Browsers (`column-count`)
   * nicht — er füllt Spalte für Spalte — und war der Grund, die Spalten
   * hier selbst zu bilden.
   */
  const spalten: { bild: Streckenbild; i: number }[][] = [[], [], []];
  bilder.forEach((bild, i) => spalten[i % spalten.length].push({ bild, i }));

  return (
    <>
      <div className={styles.mosaik}>
        {spalten.map((spalte, s) => (
          <div key={s} className={styles.spalte}>
            {spalte.map(({ bild, i }) => {
              const zeile = aufnahmeZeile(bild.quelle.exif);
              return (
                <figure
                  key={bild.schluessel}
                  className={styles.figur}
                  /*
                   * ⚠️ **Nur auf dem Telefon wirksam, dort aber
                   * entscheidend.** Die Spalten sind schmal `display:
                   * contents`; die Bilder werden damit direkte Kinder des
                   * Mosaiks und lägen sonst in der Reihenfolge
                   * 1, 4, 2, 5, 3, 6 untereinander. Genau dieser Fehler
                   * ist schon einmal in den Flanken aufgetreten.
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
              );
            })}
          </div>
        ))}
      </div>

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
