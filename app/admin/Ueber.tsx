"use client";

import { useState } from "react";
import Mosaik from "../components/Mosaik";
import { bilderFuerUeber } from "@/lib/arbeiten";
import type { Streckenbild } from "@/lib/bilder";
import {
  alleUeberBilder,
  bildBezeichnung,
  entferneZeile,
  FELDNAMEN,
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
import { DateiKnopf, Daumen, Dialog, Legende, LEGENDE, Textfeld, Zeichen } from "./teile";
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
  const [vorschau, setVorschau] = useState(false);
  const u = inhalt.ueber;
  const mosaik = alleUeberBilder({ inhalt, bilder }).filter((b) => !(b.schluessel in inhalt.papierkorb));
  const warten = platzhalter(unterwegs, bilder, "ueber/");
  /* „Über mich · 01" — überall gleich: Kachel, Griff, Pfeile, Panel. Die
     Beschriftung („Tödliches Gold – …") steht als Text in der Kachel. */
  const name = (s: string) => bildBezeichnung(inhalt, s);
  /* Für die Vorschau: genau das, was /ueber zeigen wird. */
  const aufDerSeite = bilderFuerUeber({ inhalt, bilder });

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
                bezeichnung={FELDNAMEN.absatz(n + 1)}
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
            bezeichnung={FELDNAMEN.portraitAlt}
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
            bezeichnung={FELDNAMEN.email}
            typ="email"
            wert={u.email}
            beiAenderung={(w) => aendere((i) => setzeUeberFeld(i, "email", w))}
          />
          <span />
          <Textfeld
            bezeichnung={FELDNAMEN.instagramBezeichnung}
            wert={u.instagram.label}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "instagram", "label", w))}
          />
          <Textfeld
            bezeichnung={FELDNAMEN.instagramAdresse}
            typ="url"
            wert={u.instagram.url}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "instagram", "url", w))}
            beiVerlassen={(w) => {
              if (mitHttps(w) !== w) aendere((i) => setzeUeberLink(i, "instagram", "url", mitHttps(w)));
            }}
          />
          <Textfeld
            bezeichnung={FELDNAMEN.swrBezeichnung}
            wert={u.swr.label}
            beiAenderung={(w) => aendere((i) => setzeUeberLink(i, "swr", "label", w))}
          />
          <Textfeld
            bezeichnung={FELDNAMEN.swrAdresse}
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
          <div className={styles.knopfreihe}>
            {mosaik.length > 0 && (
              <button
                type="button"
                className={styles.knopf}
                aria-pressed={vorschau}
                onClick={() => setVorschau((v) => !v)}
              >
                {vorschau ? "Zurück zum Sortieren" : "Vorschau"}
              </button>
            )}
            <DateiKnopf
              mehrere
              gesperrt={!konfiguration.eingang}
              beiDateien={(dateien) => ladeNeueHoch("ueber", dateien)}
            >
              Bilder hochladen
            </DateiKnopf>
          </div>
        </div>
        {/* Wie im Reiter Fotos: Das Mosaik setzt in Spalten, das Raster hier
            in Zeilen — die echte Anordnung zeigt nur die Vorschau. */}
        {vorschau && mosaik.length > 0 ? (
          <>
            <p className={styles.text}>
              So sieht das Mosaik auf /ueber nach dem Speichern aus ({aufDerSeite.length}{" "}
              {aufDerSeite.length === 1 ? "Bild" : "Bilder"}). Tipp auf ein Bild öffnet es groß.
            </p>
            {aufDerSeite.length === 0 ? (
              <p className={styles.leise}>Kein Bild ist sichtbar — auf /ueber steht dann kein Mosaik.</p>
            ) : (
              <div className={styles.vorschau}>
                <Mosaik bilder={aufDerSeite} />
              </div>
            )}
          </>
        ) : mosaik.length === 0 ? (
          <p className={styles.leise}>Noch keine Bilder.</p>
        ) : (
          <>
            <Legende eintraege={[LEGENDE.auge, LEGENDE.eimer]} />
            <Sortierbar<Streckenbild>
              name="Bilder auf /ueber"
              darstellung="raster"
              eintraege={mosaik}
              schluessel={(b) => b.schluessel}
              bezeichnung={(b) => name(b.schluessel)}
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
                      aria-label={`${name(s)} bearbeiten`}
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
                        aria-label={`${name(s)}: ausgeblendet`}
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
                        aria-label={`${name(s)} löschen`}
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
          </>
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
