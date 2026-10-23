"use client";

import { useState } from "react";
import type { Film } from "@/lib/inhalt";
import { ZIEL } from "@/lib/admin/vertrag";
import {
  aendereFilm,
  eindeutigeId,
  entferneFilm,
  FELDNAMEN,
  grundGegenFilm,
  mitHttps,
  neuerFilm,
  ordneFilme,
} from "@/lib/admin/werkzeuge";
import Ausschnitt from "./Ausschnitt";
import Ersetzen from "./Ersetzen";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { Aufklappen, Daumen, Dialog, fokussiereInZeile, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Filme** — die Filme auf `/film`, in dieser Reihenfolge. Der Film
 * selbst liegt bei YouTube, Vimeo oder in einer Mediathek; bei uns liegt
 * nur das Standbild (`film/<id>`). Ohne Standbild erscheint ein Film nicht.
 *
 * Aufklappen wie im Reiter Arbeiten: Der Stift bleibt der Stift, zu klappt
 * „Fertig"; welcher Film offen ist, hält die Verwaltung (`aufgeklappt`).
 */
export default function Filme() {
  const { inhalt, bilder, aendere, aendereMitMeldung, konfiguration, unterwegs, aufgeklappt, klappe } = useSitzung();
  const offen = aufgeklappt.filme;
  const [neuTitel, setNeuTitel] = useState("");
  const [neuKunde, setNeuKunde] = useState("");
  const [neuLink, setNeuLink] = useState("");
  const [entfernen, setEntfernen] = useState<Film | null>(null);

  /* Standbilder, die schon im Bildspeicher liegen — ein neuer Film darf
     keins davon erben. */
  const standbilder = [...Object.keys(bilder), ...unterwegs].flatMap((s) =>
    /^film\/[^/]+$/.test(s) ? [s.slice(5)] : [],
  );
  const vorschauId = neuTitel.trim() ? eindeutigeId(neuTitel, [...inhalt.filme.map((f) => f.id), ...standbilder], "film") : "";

  /* Titel, Kunde und Link sind Pflicht und müssen der Prüfung genügen — ein
     Film ohne sie oder mit „Muster GmbH" als Kunde wäre ein Fehler, der jedes
     Speichern sperrt. Fehlt nur „https://", ergänzt es sich. Was fehlt,
     steht unter dem Knopf. */
  const link = mitHttps(neuLink);
  const grund = grundGegenFilm(neuTitel, neuKunde, link);
  const vollstaendig = grund === null;

  const lege = () => {
    if (!vollstaendig) return;
    const titel = neuTitel;
    const kunde = neuKunde;
    const id = vorschauId;
    aendere((i) => neuerFilm(i, titel, standbilder, { kunde, link }).inhalt);
    setNeuTitel("");
    setNeuKunde("");
    setNeuLink("");
    klappe("filme", id);
    /* „Film anlegen" ist danach gesperrt — der Fokus geht in den Titel des neuen Films. */
    requestAnimationFrame(() => fokussiereInZeile(id, "input"));
  };

  /** „Fertig": zuklappen, der Fokus zurück auf den Stift. */
  const fertig = (id: string) => {
    klappe("filme", null);
    requestAnimationFrame(() => fokussiereInZeile(id, "[aria-expanded]"));
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
                    onClick={() => klappe("filme", ist ? null : f.id)}
                  >
                    <Zeichen name="stift" />
                  </button>
                </span>
              </div>

              {ist && (
                <div className={styles.zeileInhalt}>
                  <div className={styles.formularZwei}>
                    <Textfeld
                      bezeichnung={FELDNAMEN.titel}
                      wert={f.titel}
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { titel: w }))}
                    />
                    <Textfeld
                      bezeichnung={FELDNAMEN.kunde}
                      wert={f.kunde}
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { kunde: w }))}
                      hinweis="Ohne Rechtsform; mehrere mit Schrägstrich, „SWR/ARD“."
                    />
                    <Textfeld
                      bezeichnung={FELDNAMEN.link}
                      typ="url"
                      wert={f.link}
                      platzhalter="https://"
                      beiAenderung={(w) => aendere((i) => aendereFilm(i, f.id, { link: w }))}
                      beiVerlassen={(w) => {
                        if (mitHttps(w) !== w) aendere((i) => aendereFilm(i, f.id, { link: mitHttps(w) }));
                      }}
                      hinweis="Vollständige Adresse bei YouTube, Vimeo oder der Mediathek."
                    />
                  </div>
                  <Textfeld
                    bezeichnung={FELDNAMEN.notiz}
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
                      {/* Fragt nur, wenn es schon ein Standbild gibt — sonst ersetzt es nichts. */}
                      <Ersetzen
                        ziel={s}
                        gesperrt={!konfiguration.eingang || !ZIEL.test(s)}
                        fragen={s in bilder}
                        titel="Standbild ersetzen?"
                        was="Das bisherige Standbild"
                        bleibt="Ausschnitt, Titel und Link des Films bleiben."
                      >
                        {bilder[s] ? "Standbild ersetzen" : "Standbild hochladen"}
                      </Ersetzen>
                      <button type="button" className={styles.knopfLeise} onClick={() => setEntfernen(f)}>
                        <Zeichen name="eimer" />
                        Film entfernen
                      </button>
                    </div>
                  </div>

                  <Aufklappen titel="Technisches" leise>
                    <Textfeld
                      bezeichnung={FELDNAMEN.kennung}
                      wert={f.id}
                      nurLesen
                      hinweis="Name des Standbilds im Bildspeicher — nicht mehr änderbar."
                    />
                  </Aufklappen>

                  <div className={styles.knopfreihe}>
                    <button type="button" className={styles.knopf} onClick={() => fertig(f.id)}>
                      Fertig
                    </button>
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
            bezeichnung={FELDNAMEN.titel}
            wert={neuTitel}
            beiAenderung={setNeuTitel}
            hinweis="Der Titel lässt sich später jederzeit ändern."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.kunde}
            wert={neuKunde}
            beiAenderung={setNeuKunde}
            hinweis="Ohne Rechtsform; mehrere mit Schrägstrich, „SWR/ARD“."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.link}
            typ="url"
            wert={neuLink}
            platzhalter="https://"
            beiAenderung={setNeuLink}
            beiVerlassen={(w) => setNeuLink(mitHttps(w))}
            hinweis="Vollständige Adresse bei YouTube, Vimeo oder der Mediathek."
          />
        </div>
        <div className={`${styles.knopfreihe} ${styles.unterTitel}`}>
          <button type="button" className={styles.knopf} disabled={!vollstaendig} onClick={lege}>
            <Zeichen name="plus" />
            Film anlegen
          </button>
          {grund && <span className={styles.leise}>{grund}</span>}
        </div>
      </div>

      {entfernen && (
        <Dialog titel={`„${entfernen.titel}“ entfernen?`} beiSchliessen={() => setEntfernen(null)}>
          {(schliesse) => (
            <>
              <p className={styles.text}>
                Der Film verschwindet von /film. Das Standbild bleibt im Bildspeicher; legst du den Film später mit
                demselben Titel neu an, bekommt er eine neue Kennung.
              </p>
              <div className={styles.knopfreihe}>
                <button
                  type="button"
                  className={styles.knopfHaupt}
                  onClick={() => {
                    aendereMitMeldung((i) => entferneFilm(i, entfernen.id), `„${entfernen.titel}“ ist entfernt.`);
                    klappe("filme", null);
                    schliesse();
                  }}
                >
                  Entfernen
                </button>
                <button type="button" className={styles.knopf} onClick={schliesse}>
                  Abbrechen
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </section>
  );
}
