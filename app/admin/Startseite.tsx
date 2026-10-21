"use client";

import { useState } from "react";
import { istVerborgen } from "@/lib/inhalt";
import { AUSSCHNITT_MITTIG } from "@/lib/bilder";
import {
  bildBezeichnung,
  mitHttps,
  setzeSeite,
  setzeStartbild,
  setzeStartText,
  startbild,
  waehlbareBilder,
  type Startplatz,
} from "@/lib/admin/werkzeuge";
import Bildwahl from "./Bildwahl";
import { useSitzung } from "./kontext";
import { Daumen, Textfeld } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Startseite** — Name und Zeile, die Bildplätze (Ersatzbild im
 * Hero, die beiden Wege, vier Highlights) und das Hero-Video.
 */

const PLAETZE: { platz: Startplatz; name: string; hinweis: string }[] = [
  {
    platz: "heroErsatz",
    name: "Hero-Bild",
    hinweis: "Trägt die Startseite, solange es kein Hero-Video gibt. Querformat, keine erkennbaren Gesichter.",
  },
  { platz: "wegeFoto", name: "Weg „foto“", hinweis: "Das Bild zum Weg nach /foto." },
  {
    platz: "wegeFilm",
    name: "Weg „film“",
    hinweis: "Nur Rückfall: Gibt es einen Film mit Standbild, nimmt die Seite dessen Standbild.",
  },
  { platz: { highlight: 0 }, name: "Highlight 1", hinweis: "Leer zeigt „Highlight folgt“." },
  { platz: { highlight: 1 }, name: "Highlight 2", hinweis: "" },
  { platz: { highlight: 2 }, name: "Highlight 3", hinweis: "" },
  { platz: { highlight: 3 }, name: "Highlight 4", hinweis: "" },
];

const kennung = (p: Startplatz) => (typeof p === "string" ? p : `highlight-${p.highlight}`);

export default function Startseite() {
  const { inhalt, bilder, aendere, bearbeite } = useSitzung();
  const [wahl, setWahl] = useState<(typeof PLAETZE)[number] | null>(null);
  const st = inhalt.startseite;
  const auswahl = waehlbareBilder({ inhalt, bilder });

  return (
    <>
      <section className={styles.abschnitt} aria-labelledby="start-texte">
        <h2 id="start-texte" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Texte
        </h2>
        <div className={styles.formular}>
          <Textfeld
            bezeichnung="Name (Schriftzug)"
            wert={inhalt.seite.name}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "name", w))}
            hinweis="Bewusst klein geschrieben."
          />
          <Textfeld
            bezeichnung="Zeile im Hero"
            wert={inhalt.seite.positioning}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "positioning", w))}
          />
          <Textfeld
            bezeichnung="Orte"
            wert={inhalt.seite.locations}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "locations", w))}
          />
          <Textfeld
            bezeichnung="Beschreibung des Hero-Bilds (optional)"
            mehrzeilig
            wert={st.heroAlt ?? ""}
            beiAenderung={(w) => aendere((i) => setzeStartText(i, "heroAlt", w))}
            hinweis="Leer heißt: reine Dekoration, Screenreader überspringen es."
          />
          <Textfeld
            bezeichnung="Hero-Video von außerhalb (optional)"
            typ="url"
            wert={st.heroVideo ?? ""}
            platzhalter="https://"
            beiAenderung={(w) => aendere((i) => setzeStartText(i, "heroVideo", w))}
            beiVerlassen={(w) => {
              if (mitHttps(w) !== w) aendere((i) => setzeStartText(i, "heroVideo", mitHttps(w)));
            }}
            hinweis="Nur ausnahmsweise. Leer lassen, dann kommt das Video aus dem Bildspeicher."
          />
        </div>
      </section>

      <section className={styles.abschnitt} aria-labelledby="start-bilder">
        <h2 id="start-bilder" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Bilder
        </h2>
        <ul className={styles.reihen}>
          {PLAETZE.map((p) => {
            const s = startbild(inhalt, p.platz);
            /* Die Seite sucht jedes Bild unter den sichtbaren Fotos von /foto
               (`waehlbareBilder`); alles andere lässt den Platz leer. */
            const bleibtLeer =
              s === null
                ? ""
                : s in inhalt.papierkorb
                  ? " · im Papierkorb — der Platz bleibt auf der Seite leer"
                  : istVerborgen(inhalt, s)
                    ? " · ausgeblendet — der Platz bleibt auf der Seite leer"
                    : !s.startsWith("arbeiten/")
                      ? " · kein Foto aus /foto — der Platz bleibt auf der Seite leer"
                      : "";
            return (
              <li key={kennung(p.platz)} className={styles.zeile}>
                <div className={styles.zeileKopf}>
                  <button
                    type="button"
                    className={styles.platzBild}
                    disabled={!s || !bilder[s]}
                    aria-label={s ? `${bildBezeichnung(inhalt, s)} bearbeiten` : "Leer"}
                    onClick={() => s && bearbeite(s)}
                  >
                    {s ? (
                      <Daumen
                        quelle={bilder[s]}
                        art="voll"
                        ausschnitt={inhalt.bildausschnitte[s] ?? AUSSCHNITT_MITTIG}
                        breite="96px"
                      />
                    ) : (
                      <span className={styles.daumenLeer}>leer</span>
                    )}
                  </button>
                  <span className={styles.zeileName}>
                    <strong>{p.name}</strong>
                    <span>
                      {s ? bildBezeichnung(inhalt, s) : "leer"}
                      {bleibtLeer}
                    </span>
                    {p.hinweis && <span>{p.hinweis}</span>}
                  </span>
                  <span className={styles.zeileKnoepfe}>
                    <button type="button" className={styles.knopf} onClick={() => setWahl(p)}>
                      Ändern
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <p className={`${styles.leise} ${styles.unterTitel}`}>
          Tipp aufs Bild, um seinen Ausschnitt zu wählen — die Startseite beschneidet.
        </p>
      </section>

      {wahl && (
        <Bildwahl
          titel={wahl.name}
          auswahl={auswahl}
          aktuell={startbild(inhalt, wahl.platz)}
          leer
          beiWahl={(s) => aendere((i) => setzeStartbild(i, wahl.platz, s))}
          beiSchliessen={() => setWahl(null)}
        />
      )}
    </>
  );
}
