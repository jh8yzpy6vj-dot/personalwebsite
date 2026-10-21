"use client";

import type { Streckenbild } from "@/lib/bilder";
import { bildBezeichnung } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import { Daumen, Dialog } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * Ein Bild wählen — für die Plätze der Startseite und zum Ergänzen des
 * Heros. Ein Tipp wählt und schließt. `leer` bietet zusätzlich „kein Bild"
 * an (`null`).
 */
export default function Bildwahl({
  titel,
  auswahl,
  aktuell,
  leer = false,
  beiWahl,
  beiSchliessen,
}: {
  titel: string;
  auswahl: Streckenbild[];
  aktuell: string | null;
  leer?: boolean;
  beiWahl: (s: string | null) => void;
  beiSchliessen: () => void;
}) {
  const { inhalt } = useSitzung();
  return (
    <Dialog titel={titel} beiSchliessen={beiSchliessen}>
      {(schliesse) => (
        <>
          {leer && (
            <div className={styles.knopfreihe}>
              <button
                type="button"
                className={styles.knopf}
                aria-pressed={aktuell === null}
                onClick={() => {
                  beiWahl(null);
                  schliesse();
                }}
              >
                Leer lassen
              </button>
            </div>
          )}
          {auswahl.length === 0 ? (
            <p className={styles.leise}>Keine passenden Bilder.</p>
          ) : (
            <ul className={styles.wahlRaster}>
              {auswahl.map((b) => (
                <li key={b.schluessel}>
                  <button
                    type="button"
                    className={styles.wahlKachel}
                    aria-pressed={aktuell === b.schluessel}
                    aria-label={bildBezeichnung(inhalt, b.schluessel)}
                    title={bildBezeichnung(inhalt, b.schluessel)}
                    onClick={() => {
                      beiWahl(b.schluessel);
                      schliesse();
                    }}
                  >
                    <Daumen quelle={b.quelle} art="voll" ausschnitt={b.ausschnitt} breite="120px" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Dialog>
  );
}
