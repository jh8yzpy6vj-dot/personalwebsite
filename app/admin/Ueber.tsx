"use client";

import type { Streckenbild } from "@/lib/bilder";
import {
  alleUeberBilder,
  entferneZeile,
  legeInPapierkorb,
  mitHttps,
  neueZeile,
  platzhalter,
  setzeUeberBeschriftung,
  setzeUeberFeld,
  setzeUeberLink,
  setzeUeberReihenfolge,
  setzeZeile,
  umschalteAusgeblendet,
} from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { DateiKnopf, Daumen, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Über mich** — die Zeilen auf `/ueber`, Porträt, Kontaktzeile und
 * das kleine Mosaik darunter (`ueber/01`, `02` …).
 */
export default function Ueber() {
  const { inhalt, bilder, aendere, konfiguration, unterwegs, heute, ladeHoch, ladeNeueHoch, bearbeite } =
    useSitzung();
  const u = inhalt.ueber;
  const mosaik = alleUeberBilder({ inhalt, bilder }).filter((b) => !(b.schluessel in inhalt.papierkorb));
  const warten = platzhalter(unterwegs, bilder, "ueber/");

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
              <button
                type="button"
                className={styles.knopfSymbol}
                aria-label={`Absatz ${n + 1} entfernen`}
                title="Entfernen"
                onClick={() => aendere((i) => entferneZeile(i, n))}
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
            <DateiKnopf
              gesperrt={!konfiguration.eingang}
              beiDateien={(d) => ladeHoch([{ datei: d[0], ziel: "portrait" }])}
            >
              Porträt ersetzen
            </DateiKnopf>
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
                    onClick={() => bearbeite(s)}
                    aria-label={`Bild ${s.slice(6)} bearbeiten`}
                  >
                    <Daumen quelle={b.quelle} />
                    <span className={styles.marken}>
                      {aus && <span className={styles.marke}>ausgeblendet</span>}
                      {unterwegs.has(s) && <span className={styles.marke}>wird ersetzt</span>}
                    </span>
                  </button>
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
                  <div className={styles.kachelFeld}>
                    <Textfeld
                      bezeichnung="Beschriftung"
                      wert={u.bilder[s] ?? ""}
                      platzhalter="Jakob Sax"
                      beiAenderung={(w) => aendere((i) => setzeUeberBeschriftung(i, s, w))}
                    />
                  </div>
                  <div className={styles.kachelLeiste}>
                    <button
                      type="button"
                      className={styles.knopfSymbol}
                      aria-pressed={aus}
                      aria-label="Ausgeblendet"
                      title={aus ? "Einblenden" : "Ausblenden"}
                      onClick={() => aendere((i) => umschalteAusgeblendet(i, s))}
                    >
                      <Zeichen name={aus ? "augeZu" : "auge"} />
                    </button>
                    <button
                      type="button"
                      className={styles.knopfSymbol}
                      aria-label="Löschen"
                      title="Löschen (Papierkorb, 30 Tage)"
                      onClick={() => aendere((i) => legeInPapierkorb(i, s, heute))}
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
    </>
  );
}
