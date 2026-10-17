"use client";

import Bild from "../components/Bild";
import { AUSSCHNITT_MITTIG } from "@/lib/bilder";
import { ausschnittAus, leseAusschnitt, setzeAusschnitt } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import styles from "./verwaltung.module.css";

/**
 * **Bildausschnitt wählen**: Jakob tippt auf die wichtigste Stelle im Bild,
 * daneben zeigen zwei Rahmen, was davon bleibt — 16:9 (Hero am PC,
 * Film-Standbild) und 4:5 (Hero am Telefon). Gespeichert wird
 * `bildausschnitte[schluessel] = "x% y%"`, also `object-position`.
 *
 * Warum je Bild und nicht eine Regel für alle: `AUSSCHNITT_MITTIG` in
 * `lib/bilder.ts`.
 *
 * Tastatur: Pfeiltasten verschieben in 5er-Schritten, damit es auch ohne
 * Maus und Finger geht.
 */
export default function Ausschnitt({ schluessel }: { schluessel: string }) {
  const { inhalt, bilder, aendere } = useSitzung();
  const quelle = bilder[schluessel];
  if (!quelle) return <p className={styles.leise}>Für den Ausschnitt muss das Bild erst fertig verarbeitet sein.</p>;

  const wert = inhalt.bildausschnitte[schluessel];
  const { x, y } = leseAusschnitt(wert);
  const setze = (w: string | null) => aendere((i) => setzeAusschnitt(i, schluessel, w));

  return (
    <div className={styles.ausschnitt}>
      <p className={styles.leise}>Tipp auf die Stelle, die immer zu sehen sein soll.</p>
      <button
        type="button"
        className={styles.ausschnittFlaeche}
        aria-label={`Bildausschnitt, jetzt ${wert ?? "mittig"}. Pfeiltasten verschieben.`}
        onClick={(e) => {
          /* `detail === 0`: per Tastatur ausgelöst — dann gibt es keinen
             Klickpunkt, und die Pfeiltasten sind der Weg. */
          if (e.detail === 0) return;
          const r = e.currentTarget.getBoundingClientRect();
          setze(ausschnittAus((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height));
        }}
        onKeyDown={(e) => {
          const schritt: Record<string, [number, number]> = {
            ArrowLeft: [-5, 0],
            ArrowRight: [5, 0],
            ArrowUp: [0, -5],
            ArrowDown: [0, 5],
          };
          const d = schritt[e.key];
          if (!d) return;
          e.preventDefault();
          setze(ausschnittAus((x + d[0]) / 100, (y + d[1]) / 100));
        }}
      >
        {/* Das ganze Bild, unbeschnitten — die Fläche des Knopfs ist genau
            so groß wie das Bild, sonst stimmen die Prozente nicht. */}
        <img className={styles.ausschnittBild} src={quelle.fallback} alt="" width={quelle.breite} height={quelle.hoehe} />
        <span className={styles.ausschnittMarke} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
      </button>

      <div className={styles.ausschnittVorschau}>
        {(
          [
            ["16 / 9", "PC und Film (16:9)"],
            ["4 / 5", "Handy (4:5)"],
          ] as const
        ).map(([verhaeltnis, name]) => (
          <figure key={verhaeltnis} className={styles.ausschnittRahmen}>
            <div className={styles.ausschnittFenster} style={{ aspectRatio: verhaeltnis }}>
              <Bild
                quelle={quelle}
                alt=""
                sizes="240px"
                ausschnitt={wert ?? AUSSCHNITT_MITTIG}
                className={styles.daumenVoll}
              />
            </div>
            <figcaption className={styles.leise}>{name}</figcaption>
          </figure>
        ))}
      </div>

      <div className={styles.knopfreihe}>
        <span className={styles.leise}>Jetzt: {wert ?? "mittig"}</span>
        <button type="button" className={styles.knopfLeise} onClick={() => setze(null)} disabled={!wert}>
          Mittig
        </button>
      </div>
    </div>
  );
}
