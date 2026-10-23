"use client";

import { useState, type ReactNode } from "react";
import { pruefeDatei } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import { DateiKnopf, Dialog } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Ersetzen mit Rückfrage**: der Knopf zur Dateiwahl und danach „Bild
 * ersetzen?". Erst „Ersetzen" lädt hoch.
 *
 * ⚠️ Ersetzen ist endgültig: Die Medien-Action schreibt `original/<ziel>.jpg`
 * neu und räumt die alten Varianten weg; einen Papierkorb oder Verlauf für
 * Bilddateien gibt es nicht (TECH-STACK, „Hochladen und Ersetzen").
 *
 * Eine Datei, die ohnehin nicht angenommen wird (HEIC, zu groß …), geht
 * ohne Rückfrage durch — ersetzt wird dann nichts, und die Hochlade-Zeile
 * sagt, warum. `fragen={false}`: Es gibt noch kein Bild (erstes Standbild).
 *
 * `was` und `bleibt` ergeben den Satz der Rückfrage: „{was} wird durch
 * „{Datei}" ersetzt … {bleibt}".
 */
export default function Ersetzen({
  ziel,
  gesperrt = false,
  fragen = true,
  titel,
  was,
  bleibt,
  annehmen,
  kennung,
  children,
}: {
  ziel: string;
  gesperrt?: boolean;
  fragen?: boolean;
  titel: string;
  was: string;
  bleibt: string;
  /** Weiter an `DateiKnopf`. */
  annehmen?: string;
  kennung?: string;
  children: ReactNode;
}) {
  const { ladeHoch } = useSitzung();
  /* Das Ziel gleich mit merken: Es gilt, was bei der Dateiwahl gezeigt wurde. */
  const [frage, setFrage] = useState<{ datei: File; ziel: string } | null>(null);

  return (
    <>
      <DateiKnopf
        gesperrt={gesperrt}
        annehmen={annehmen}
        kennung={kennung}
        beiDateien={(dateien) => {
          const datei = dateien[0];
          if (fragen && pruefeDatei(datei, ziel).ok) setFrage({ datei, ziel });
          else ladeHoch([{ datei, ziel }]);
        }}
      >
        {children}
      </DateiKnopf>

      {frage && (
        <Dialog titel={titel} beiSchliessen={() => setFrage(null)}>
          {(schliesse) => (
            <>
              <p className={styles.text}>
                {was} wird durch „{frage.datei.name}“ ersetzt und lässt sich danach nicht zurückholen — nur neu
                hochladen. {bleibt}
              </p>
              <div className={styles.knopfreihe}>
                <button
                  type="button"
                  className={styles.knopfHaupt}
                  onClick={() => {
                    ladeHoch([{ datei: frage.datei, ziel: frage.ziel }]);
                    schliesse();
                  }}
                >
                  Ersetzen
                </button>
                <button type="button" className={styles.knopf} onClick={schliesse}>
                  Abbrechen
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
