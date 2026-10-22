"use client";

import { useState } from "react";
import type { Streckenbild } from "@/lib/bilder";
import {
  alleUeberBilder,
  bildBezeichnung,
  entferneZeile,
  legeInPapierkorb,
  mitHttps,
  neueZeile,
  platzhalter,
  setzeUeberFeld,
  setzeUeberLink,
  setzeUeberReihenfolge,
  setzeZeile,
  umschalteAusgeblendet,
} from "@/lib/admin/werkzeuge";
import Ersetzen from "./Ersetzen";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { DateiKnopf, Daumen, Dialog, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/** So viel vom Absatz zeigt die Rückfrage vor dem Entfernen. */
const ANFANG = 120;

/**
 * **Reiter Über mich** — die Zeilen auf `/ueber`, Porträt, Kontaktzeile und
 * das kleine Mosaik darunter (`ueber/01`, `02` …).
 */
export default function Ueber() {
  const {
    inhalt,
    bilder,
    aendere,
    aendereMitMeldung,
    konfiguration,
    unterwegs,
    heute,
    ladeNeueHoch,
    bearbeite,
  } = useSitzung();
  /* Der Absatz (Platz), nach dem gerade gefragt wird. */
  const [entfernen, setEntfernen] = useState<number | null>(null);
  const u = inhalt.ueber;
  const mosaik = alleUeberBilder({ inhalt, bilder }).filter((b) => !(b.schluessel in inhalt.papierkorb));
  const warten = platzhalter(unterwegs, bilder, "ueber/");
  const name = (s: string) => bildBezeichnung(inhalt, s);

  const entferneAbsatz = (n: number) =>
    aendereMitMeldung((i) => entferneZeile(i, n), `Absatz ${n + 1} entfernt.`, true);

  return (
    <>
      <section className={styles.abschnitt} aria-labelledby="ueber-text">
        <h2 id="ueber-text" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Text
        </h2>
        <div className={styles.formular}>
          {u.zeilen.map((zeile, n) => (
            <div key={n} className={styles.zeileMitKnopf}>
              <Textfeld
                bezeichnung={`Absatz ${n + 1}`}
                mehrzeilig
                wert={zeile}
                beiAenderung={(w) => aendere((i) => setzeZeile(i, n, w))}
              />
              {/* Mit Text erst nachfragen — ein leerer Absatz geht sofort. */}
              <button
                type="button"
                className={styles.knopfSymbol}
                aria-label={`Absatz ${n + 1} entfernen`}
                title="Entfernen"
                onClick={() => (zeile.trim() === "" ? entferneAbsatz(n) : setEntfernen(n))}
              >
                <Zeichen name="eimer" />
              </button>
            </div>
          ))}
          <div className={styles.knopfreihe}>
            <button type="button" className={styles.knopf} onClick={() => aendere(neueZeile)}>
              <Zeichen name="plus" />
              Absatz hinzufügen
            </button>
            <span className={styles.leise}>Gedacht sind drei bis vier.</span>
          </div>
        </div>
      </section>

      <section className={styles.abschnitt} aria-labelledby="ueber-portrait">
        <h2 id="ueber-portrait" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Porträt
        </h2>
        <div className={styles.platz}>
          <span className={styles.platzBild}>
            <Daumen quelle={bilder.portrait} art="voll" breite="96px" />
          </span>
          <div className={styles.knopfreihe}>
            <Ersetzen
              ziel="portrait"
              gesperrt={!konfiguration.eingang}
              fragen={"portrait" in bilder}
              titel="Porträt ersetzen?"
              was="Das bisherige Porträt"
              bleibt="Die Beschreibung bleibt."
            >
              Porträt ersetzen
            </Ersetzen>
            {unterwegs.has("portrait") && <span className={styles.leise}>Neues Porträt wird verarbeitet.</span>}
          </div>
        </div>
        <div className={`${styles.formular} ${styles.unterTitel}`}>
          <Textfeld
            bezeichnung="Beschreibung des Porträts (Alt-Text)"
            mehrzeilig
            wert={u.portraitAlt}
            beiAenderung={(w) => aendere((i) => setzeUeberFeld(i, "portraitAlt", w))}
          />
        </div>
      </section>

      <section className={styles.abschnitt} aria-labelledby="ueber-kontakt">
        <h2 id="ueber-kontakt" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Kontakt
        </h2>
        <div className={styles.formularZwei}>
          <Textfeld
            bezeichnung="E-Mail"
            typ="email"
            wert={u.email}
            beiAenderung={(w) => aendere((i) => setzeUeberFeld(i, "email", w))}
          />
          <span />
          <Textfeld
            bezeichnung="Instagram · Bezeichnung"
            wert={u.instagram.label}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "instagram", "label", w))}
          />
          <Textfeld
            bezeichnung="Instagram · Adresse"
            typ="url"
            wert={u.instagram.url}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "instagram", "url", w))}
            beiVerlassen={(w) => {
              if (mitHttps(w) !== w) aendere((i) => setzeUeberLink(i, "instagram", "url", mitHttps(w)));
            }}
          />
          <Textfeld
            bezeichnung="SWR · Bezeichnung"
            wert={u.swr.label}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "swr", "label", w))}
          />
          <Textfeld
            bezeichnung="SWR · Adresse"
            typ="url"
            wert={u.swr.url}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "swr", "url", w))}
            beiVerlassen={(w) => {
              if (mitHttps(w) !== w) aendere((i) => setzeUeberLink(i, "swr", "url", mitHttps(w)));
            }}
          />
        </div>
      </section>

      <section className={styles.abschnitt} aria-labelledby="ueber-bilder">
        <div className={styles.abschnittKopf}>
          <h2 id="ueber-bilder" className={styles.abschnittTitel}>
            Bilder auf /ueber
          </h2>
          <DateiKnopf
            mehrere
            gesperrt={!konfiguration.eingang}
            beiDateien={(dateien) => ladeNeueHoch("ueber", dateien)}
          >
            Bilder hochladen
          </DateiKnopf>
        </div>
        {mosaik.length === 0 ? (
          <p className={styles.leise}>Noch keine Bilder.</p>
        ) : (
          <Sortierbar<Streckenbild>
            name="Bilder auf /ueber"
            darstellung="raster"
            eintraege={mosaik}
            schluessel={(b) => b.schluessel}
            bezeichnung={(b) => u.bilder[b.schluessel] ?? b.schluessel}
            beiNeuerReihenfolge={(neu) =>
              aendere((i) =>
                setzeUeberReihenfolge(
                  i,
                  alleUeberBilder({ inhalt: i, bilder }).map((b) => b.schluessel),
                  neu,
                ),
              )
            }
            geist={(b) => <Daumen quelle={b.quelle} breite="180px" />}
            kind={(b, st) => {
              const s = b.schluessel;
              const aus = inhalt.ausgeblendet.includes(s);
              return (
                <div className={`${styles.kachel} ${aus ? styles.kachelAus : ""}`}>
                  <button
                    type="button"
                    className={styles.kachelBild}
                    data-bild={s}
                    onClick={() => bearbeite(s, "mosaik")}
                    aria-label={`Bild ${s.slice(6)} bearbeiten`}
                  >
                    <Daumen quelle={b.quelle} />
                    <span className={styles.marken}>
                      {aus && <span className={styles.marke}>ausgeblendet</span>}
                      {unterwegs.has(s) && <span className={styles.marke}>wird ersetzt</span>}
                    </span>
                  </button>
                  {/* Bearbeitet wird die Beschriftung im Bild-Panel — in der
                      Kachel war das Feld zu schmal und schnitt sie ab. */}
                  <div className={styles.kachelName} title={u.bilder[s] ?? "Jakob Sax"}>
                    {st.platz + 1}. {u.bilder[s] ?? "Jakob Sax"}
                  </div>
                  <div className={styles.kachelLeiste}>
                    <button type="button" {...st.griff}>
                      <Zeichen name="griff" />
                    </button>
                    <button type="button" className={styles.knopfSymbol} {...st.vor}>
                      <Zeichen name="links" />
                    </button>
                    <button type="button" className={styles.knopfSymbol} {...st.zurueck}>
                      <Zeichen name="rechts" />
                    </button>
                  </div>
                  <div className={styles.kachelLeiste}>
                    <button
                      type="button"
                      className={styles.knopfSymbol}
                      aria-pressed={aus}
                      aria-label="Ausgeblendet"
                      title={aus ? "Einblenden" : "Ausblenden"}
                      onClick={() =>
                        aendereMitMeldung(
                          (i) => umschalteAusgeblendet(i, s),
                          aus ? `„${name(s)}“ ist wieder sichtbar.` : `„${name(s)}“ ist ausgeblendet.`,
                        )
                      }
                    >
                      <Zeichen name={aus ? "augeZu" : "auge"} />
                    </button>
                    <button
                      type="button"
                      className={styles.knopfSymbol}
                      aria-label="Löschen"
                      title="Löschen (Papierkorb, 30 Tage)"
                      onClick={() =>
                        aendereMitMeldung((i) => legeInPapierkorb(i, s, heute), `„${name(s)}“ liegt im Papierkorb.`, true)
                      }
                    >
                      <Zeichen name="eimer" />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        )}
        {warten.length > 0 && (
          <p className={`${styles.leise} ${styles.unterTitel}`}>
            {warten.length === 1 ? "Ein neues Bild wird" : `${warten.length} neue Bilder werden`} verarbeitet.
          </p>
        )}
        {!konfiguration.eingang && <p className={styles.leise}>Hochladen ist noch nicht eingerichtet.</p>}
      </section>

      {entfernen !== null && (
        <Dialog titel={`Absatz ${entfernen + 1} entfernen?`} beiSchliessen={() => setEntfernen(null)}>
          {(schliesse) => {
            const text = (u.zeilen[entfernen] ?? "").trim();
            return (
              <>
                <p className={styles.text}>
                  Darin steht: „{text.length > ANFANG ? `${text.slice(0, ANFANG - 1)}…` : text}“
                </p>
                <div className={styles.knopfreihe}>
                  <button
                    type="button"
                    className={styles.knopfHaupt}
                    onClick={() => {
                      entferneAbsatz(entfernen);
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
            );
          }}
        </Dialog>
      )}
    </>
  );
}
