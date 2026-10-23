"use client";

import { useState } from "react";
import { AUSSCHNITT_MITTIG } from "@/lib/bilder";
import { heroArtVon } from "@/lib/inhalt";
import { MAX_UPLOAD_BYTES, VIDEO_ZIEL } from "@/lib/admin/vertrag";
import {
  bildBezeichnung,
  FELDNAMEN,
  mitHttps,
  setzeHeroArt,
  setzeSeite,
  setzeStartbild,
  setzeStartText,
  startbild,
  startplatzName,
  startplatzZustand,
  waehlbareBilder,
  type Startplatz,
} from "@/lib/admin/werkzeuge";
import Bildwahl from "./Bildwahl";
import Ersetzen from "./Ersetzen";
import { useSitzung } from "./kontext";
import { Daumen, Textfeld, VIDEO_ANNEHMEN } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Startseite** — was oben steht (Foto oder Video, seit 2026-10-23,
 * mit „Video hochladen"), Name und Zeile, die Bildplätze (das große Bild
 * oben, die Bilder zu den Bereichen Foto und Film, vier Highlights) und das
 * Video von außerhalb.
 *
 * ⚠️ „Hero" sagt hier nichts: Der Reiter Hero und der Stern meinen die
 * Blende auf /foto. Für den oberen Teil der Startseite heißt es „oben"
 * (UI-SPEC, „Startseite, Begriffe").
 */

/* Die Namen der Plätze sind überall dieselben (`startplatzName`) — auch in
   „Verwendet: …" im Bild-Panel und in der Prüfung. `erscheint`: für die
   Bildwahl („Erscheint: Startseite, ganz oben."). */
const PLAETZE = (
  [
    {
      platz: "heroErsatz",
      hinweis: "Nur Rückfall: Steht oben, solange es dort kein eigenes Standbild gibt. Querformat, keine erkennbaren Gesichter.",
      erscheint: "Startseite, ganz oben",
    },
    { platz: "wegeFoto", hinweis: "Das Bild am Link zu /foto.", erscheint: "Startseite, im Bereich Foto" },
    {
      platz: "wegeFilm",
      hinweis: "Nur Rückfall: Gibt es einen Film mit Standbild, nimmt die Seite dessen Standbild.",
      erscheint: "Startseite, im Bereich Film",
    },
    { platz: { highlight: 0 }, hinweis: "Leer zeigt „Highlight folgt“.", erscheint: "Startseite, Highlight 1" },
    { platz: { highlight: 1 }, hinweis: "", erscheint: "Startseite, Highlight 2" },
    { platz: { highlight: 2 }, hinweis: "", erscheint: "Startseite, Highlight 3" },
    { platz: { highlight: 3 }, hinweis: "", erscheint: "Startseite, Highlight 4" },
  ] satisfies { platz: Startplatz; hinweis: string; erscheint: string }[]
).map((p) => ({ ...p, name: startplatzName(p.platz) }));

const kennung = (p: Startplatz) => (typeof p === "string" ? p : `highlight-${p.highlight}`);

export default function Startseite() {
  const { inhalt, bilder, aendere, aendereMitMeldung, bearbeite, konfiguration, unterwegs } = useSitzung();
  const [wahl, setWahl] = useState<(typeof PLAETZE)[number] | null>(null);
  const st = inhalt.startseite;
  const art = heroArtVon(st);
  const auswahl = waehlbareBilder({ inhalt, bilder });
  /* Fertig ist das Video, sobald sein erstes Bild im Manifest steht
     (`scripts/eingang.mjs` legt es unter demselben Schlüssel ab). */
  const film = bilder[VIDEO_ZIEL];
  const filmUnterwegs = unterwegs.has(VIDEO_ZIEL);

  return (
    <>
      <section className={styles.abschnitt} aria-labelledby="start-oben">
        <h2 id="start-oben" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Oben auf der Startseite
        </h2>
        {/* Zwei gedrückte Knöpfe statt Optionsfeldern — wie „Vorschau" im Reiter Fotos. */}
        <div className={styles.knopfreihe} role="group" aria-label="Oben auf der Startseite">
          {(
            [
              ["foto", "Foto"],
              ["video", "Video"],
            ] as const
          ).map(([wert, name]) => (
            <button
              key={wert}
              type="button"
              className={styles.knopf}
              aria-pressed={art === wert}
              onClick={() => {
                if (art !== wert) {
                  aendereMitMeldung((i) => setzeHeroArt(i, wert), `Oben steht jetzt ${wert === "foto" ? "das Foto" : "das Video"}.`);
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <p className={`${styles.leise} ${styles.unterTitel}`}>
          {art === "foto"
            ? "Oben steht ein Foto — welches, wählst du unten unter Bilder („Großes Bild oben“)."
            : "Oben läuft das Video in Schleife, ohne Ton. Gibt es noch keins, steht dort solange das Foto."}
        </p>

        {art === "video" && (
          <ul className={`${styles.reihen} ${styles.unterTitel}`}>
            <li className={styles.zeile}>
              <div className={styles.zeileKopf}>
                <span className={styles.platzBild}>
                  {film ? (
                    <Daumen quelle={film} art="voll" breite="96px" />
                  ) : (
                    <span className={styles.daumenLeer}>{filmUnterwegs ? "kommt" : "leer"}</span>
                  )}
                </span>
                <span className={styles.zeileName}>
                  <strong>Video oben</strong>
                  <span>
                    {filmUnterwegs
                      ? "Wird hochgeladen und verarbeitet — das dauert ein paar Minuten."
                      : film
                        ? "Fertig. Das Bild links ist sein erstes Bild — es steht da, bis das Video läuft."
                        : "Noch keins. Bis dahin steht oben das Foto."}
                    {st.heroVideo ? " Zurzeit hat das Video von außerhalb (unter Texte) Vorrang." : ""}
                  </span>
                  <span>
                    MP4 oder MOV, bis {Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB. Ton und Metadaten werden
                    entfernt, und es wird fürs Handy verkleinert. Anfang und Ende sollten ineinander übergehen.
                  </span>
                </span>
                <span className={styles.zeileKnoepfe}>
                  <Ersetzen
                    ziel={VIDEO_ZIEL}
                    gesperrt={!konfiguration.eingang}
                    fragen={Boolean(film)}
                    titel="Video ersetzen?"
                    was="Das bisherige Video"
                    bleibt="„Foto oder Video“ bleibt, wie es ist."
                    annehmen={VIDEO_ANNEHMEN}
                    kennung="video-oben"
                  >
                    {film ? FELDNAMEN.videoErsetzen : FELDNAMEN.videoHochladen}
                  </Ersetzen>
                </span>
              </div>
            </li>
          </ul>
        )}
      </section>

      <section className={styles.abschnitt} aria-labelledby="start-texte">
        <h2 id="start-texte" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Texte
        </h2>
        <div className={styles.formular}>
          <Textfeld
            bezeichnung={FELDNAMEN.name}
            wert={inhalt.seite.name}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "name", w))}
            hinweis="Bewusst klein geschrieben."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.zeile}
            wert={inhalt.seite.positioning}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "positioning", w))}
          />
          <Textfeld
            bezeichnung={FELDNAMEN.orte}
            wert={inhalt.seite.locations}
            beiAenderung={(w) => aendere((i) => setzeSeite(i, "locations", w))}
          />
          <Textfeld
            bezeichnung={FELDNAMEN.heroAlt}
            mehrzeilig
            wert={st.heroAlt ?? ""}
            beiAenderung={(w) => aendere((i) => setzeStartText(i, "heroAlt", w))}
            hinweis="Leer heißt: reine Dekoration, Screenreader überspringen es."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.heroVideo}
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
            /* Warum der Platz leer bleibt — oder dass die Seite ihn gerade
               gar nicht zeigt (Rückfall). Dieselbe Regel wie in der Prüfung
               und in „Verwendet: …". */
            const zustand = startplatzZustand({ inhalt, bilder }, p.platz);
            return (
              <li key={kennung(p.platz)} className={styles.zeile}>
                <div className={styles.zeileKopf}>
                  <button
                    type="button"
                    className={styles.platzBild}
                    disabled={!s || !bilder[s]}
                    aria-label={s ? `${bildBezeichnung(inhalt, s)} bearbeiten` : `${p.name}: leer`}
                    data-bild={s ?? undefined}
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
                      {zustand}
                    </span>
                    {p.hinweis && <span>{p.hinweis}</span>}
                  </span>
                  <span className={styles.zeileKnoepfe}>
                    <button
                      type="button"
                      className={styles.knopf}
                      aria-label={FELDNAMEN.platzAendern(p.name)}
                      onClick={() => setWahl(p)}
                    >
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
          erscheint={wahl.erscheint}
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
