"use client";

import { useState } from "react";
import type { Film } from "@/lib/inhalt";
import { ZIEL } from "@/lib/admin/vertrag";
import { aendereFilm, eindeutigeId, entferneFilm, neuerFilm, ordneFilme } from "@/lib/admin/werkzeuge";
import Ausschnitt from "./Ausschnitt";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { DateiKnopf, Daumen, Dialog, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Filme** — die Filme auf `/film`, in dieser Reihenfolge. Der Film
 * selbst liegt bei YouTube, Vimeo oder in einer Mediathek; bei uns liegt
 * nur das Standbild (`film/<id>`). Ohne Standbild erscheint ein Film nicht.
 */
export default function Filme() {
  const { inhalt, bilder, aendere, konfiguration, unterwegs, ladeHoch } = useSitzung();
  const [offen, setOffen] = useState<string | null>(null);
  const [neuTitel, setNeuTitel] = useState("");
  const [entfernen, setEntfernen] = useState<Film | null>(null);

  /* Standbilder, die schon im Bildspeicher liegen — ein neuer Film darf
     keins davon erben. */
  const standbilder = [...Object.keys(bilder), ...unterwegs].flatMap((s) =>
    /^film\/[^/]+$/.test(s) ? [s.slice(5)] : [],
  );
  const vorschauId = neuTitel.trim() ? eindeutigeId(neuTitel, [...inhalt.filme.map((f) => f.id), ...standbilder], "film") : "";

  const lege = () => {
    if (!neuTitel.trim()) return;
    const titel = neuTitel;
    aendere((i) => neuerFilm(i, titel, standbilder).inhalt);
    setNeuTitel("");
    setOffen(vorschauId);
  };

  return (
    <section className={styles.abschnitt} aria-labelledby="filme-titel">
      <h2 id="filme-titel" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
        Filme auf /film
      </h2>
      {inhalt.filme.length === 0 ? (
        <p className={styles.text}>Noch keine Filme. Leg unten den ersten an.</p>
      ) : (
        <p className={styles.text}>In dieser Reihenfolge stehen sie auf der Seite.</p>
      )}

      <Sortierbar<Film>
        name="Filme"
        darstellung="liste"
        eintraege={inhalt.filme}
        schluessel={(f) => f.id}
        bezeichnung={(f) => f.titel}
        beiNeuerReihenfolge={(neu) => aendere((i) => ordneFilme(i, neu))}
        kind={(f, st) => {
          const s = `film/${f.id}`;
          const ist = offen === f.id;
          return (
            <div className={styles.zeile}>
              <div className={styles.zeileKopf}>
                <button type="button" {...st.griff}>
                  <Zeichen name="griff" />
                </button>
                <span className={styles.zeileBild}>
                  <Daumen quelle={bilder[s]} art="voll" ausschnitt={inhalt.bildausschnitte[s]} breite="72px" />
                </span>
                <span className={styles.zeileName}>
                  <strong>{f.titel || f.id}</strong>
                  <span>
                    {f.kunde || "ohne Kunde"}
                    {!bilder[s] ? (unterwegs.has(s) ? " · Standbild wird verarbeitet" : " · ohne Standbild, erscheint nicht") : ""}
                  </span>
                </span>
                <span className={styles.zeileKnoepfe}>
                  <button type="button" className={styles.knopfSymbol} {...st.vor}>
                    <Zeichen name="hoch" />
                  </button>
                  <button type="button" className={styles.knopfSymbol} {...st.zurueck}>
                    <Zeichen name="runter" />
                  </button>
                  <button
                    type="button"
                    className={styles.knopfSymbol}
                    aria-expanded={ist}
                    aria-label={`${f.titel} bearbeiten`}
                    title="Bearbeiten"
                    onClick={() => setOffen(ist ? null : f.id)}
                  >
                    <Zeichen name={ist ? "hoch" : "stift"} />
                  </button>
                </span>
              </div>

              {ist && (
                <div className={styles.zeileInhalt}>
                  <div className={styles.formularZwei}>
                    <Textfeld
                      bezeichnung="Titel"
                      wert={f.titel}
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { titel: w }))}
                    />
                    <Textfeld
                      bezeichnung="Kunde"
                      wert={f.kunde}
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { kunde: w }))}
                      hinweis="Ohne Rechtsform; mehrere mit Schrägstrich, „SWR/ARD“."
                    />
                    <Textfeld
                      bezeichnung="Link zum Film"
                      typ="url"
                      wert={f.link}
                      platzhalter="https://"
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { link: w }))}
                      hinweis="Vollständige Adresse bei YouTube, Vimeo oder der Mediathek."
                    />
                    <Textfeld
                      bezeichnung="Kennung"
                      wert={f.id}
                      nurLesen
                      hinweis="Name des Standbilds im Bildspeicher — nicht mehr änderbar."
                    />
                  </div>
                  <Textfeld
                    bezeichnung="Notiz (nur hier sichtbar, nie auf der Seite)"
                    mehrzeilig
                    wert={f.notiz ?? ""}
                    beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { notiz: w }))}
                  />

                  <div>
                    <h3 className={styles.abschnittTitel}>Standbild</h3>
                    {bilder[s] ? (
                      <Ausschnitt schluessel={s} />
                    ) : (
                      <p className={styles.leise}>
                        {unterwegs.has(s) ? "Wird verarbeitet." : "Noch keins. Ohne Standbild erscheint der Film nicht."}
                      </p>
                    )}
                    <div className={`${styles.knopfreihe} ${styles.unterTitel}`}>
                      <DateiKnopf
                        gesperrt={!konfiguration.eingang || !ZIEL.test(s)}
                        beiDateien={(d) => ladeHoch([{ datei: d[0], ziel: s }])}
                      >
                        {bilder[s] ? "Standbild ersetzen" : "Standbild hochladen"}
                      </DateiKnopf>
                      <button type="button" className={styles.knopfLeise} onClick={() => setEntfernen(f)}>
                        <Zeichen name="eimer" />
                        Film entfernen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />

      <div className={styles.nachtrag}>
        <h3 className={styles.abschnittTitel}>Neuer Film</h3>
        <div className={styles.formularZwei}>
          <Textfeld
            bezeichnung="Titel"
            wert={neuTitel}
            beiAenderung={setNeuTitel}
            hinweis={vorschauId ? `Kennung wird „${vorschauId}“ — danach nicht mehr änderbar.` : undefined}
          />
          <div className={`${styles.feld} ${styles.feldUnten}`}>
            <button type="button" className={styles.knopf} disabled={!neuTitel.trim()} onClick={lege}>
              <Zeichen name="plus" />
              Film anlegen
            </button>
          </div>
        </div>
      </div>

      {entfernen && (
        <Dialog titel={`„${entfernen.titel}“ entfernen?`} beiSchliessen={() => setEntfernen(null)}>
          <p className={styles.text}>
            Der Film verschwindet von /film. Das Standbild bleibt im Bildspeicher; legst du den Film später mit
            demselben Titel neu an, bekommt er eine neue Kennung.
          </p>
          <div className={styles.knopfreihe}>
            <button
              type="button"
              className={styles.knopfHaupt}
              onClick={() => {
                aendere((i) => entferneFilm(i, entfernen.id));
                setOffen(null);
                setEntfernen(null);
              }}
            >
              Entfernen
            </button>
            <button type="button" className={styles.knopf} onClick={() => setEntfernen(null)}>
              Abbrechen
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
