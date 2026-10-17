"use client";

import { bildBezeichnung, deutschesDatum, restTage, stelleWiederHer } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import { Daumen, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Papierkorb** — gelöschte Bilder, 30 Tage lang wiederherstellbar.
 * Danach entfernt die Medien-Action das Original aus dem Bildspeicher und
 * den Eintrag aus `papierkorb`.
 *
 * Wiederherstellen streicht nur den Eintrag: Der Platz im Mosaik ist beim
 * Löschen stehen geblieben, das Bild kehrt dorthin zurück. Nur der Hero
 * nicht — dort war es sofort herausgenommen.
 */
export default function Papierkorb() {
  const { inhalt, bilder, aendere, heute } = useSitzung();
  const eintraege = Object.entries(inhalt.papierkorb).sort(([a, x], [b, y]) =>
    x === y ? (a < b ? -1 : 1) : x < y ? 1 : -1,
  );

  return (
    <section className={styles.abschnitt} aria-labelledby="papierkorb-titel">
      <h2 id="papierkorb-titel" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
        Papierkorb
      </h2>
      <p className={styles.text}>
        Gelöschte Bilder sind sofort von der Seite verschwunden (nach dem Speichern) und lassen sich 30 Tage lang
        wiederherstellen. Danach sind sie endgültig weg.
      </p>
      {eintraege.length === 0 ? (
        <p className={styles.leise}>Der Papierkorb ist leer.</p>
      ) : (
        <ul className={styles.reihen}>
          {eintraege.map(([s, tag]) => {
            const rest = restTage(tag, heute);
            return (
              <li key={s} className={styles.zeile}>
                <div className={styles.zeileKopf}>
                  <span className={styles.zeileBild}>
                    <Daumen quelle={bilder[s]} art="voll" breite="72px" />
                  </span>
                  <span className={styles.zeileName}>
                    <strong>{bildBezeichnung(inhalt, s)}</strong>
                    <span>
                      gelöscht am {deutschesDatum(tag)} ·{" "}
                      {rest === 0 ? "wird beim nächsten Aufräumen entfernt" : `noch ${rest} ${rest === 1 ? "Tag" : "Tage"}`}
                    </span>
                  </span>
                  <span className={styles.zeileKnoepfe}>
                    <button type="button" className={styles.knopf} onClick={() => aendere((i) => stelleWiederHer(i, s))}>
                      <Zeichen name="zurueck" />
                      Wiederherstellen
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
