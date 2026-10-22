"use client";

import { useState } from "react";
import Mosaik from "../components/Mosaik";
import { fotosFuerMosaik } from "@/lib/arbeiten";
import type { Streckenbild } from "@/lib/bilder";
import {
  alleFotos,
  bildBezeichnung,
  legeInPapierkorb,
  platzhalter,
  setzeFotoReihenfolge,
  umschalteAusgeblendet,
  umschalteHero,
} from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { Auswahl, DateiKnopf, Daumen, Legende, LEGENDE, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Fotos** — das Mosaik auf `/foto`, frei sortierbar über alle
 * Arbeiten hinweg.
 *
 * Gezeigt werden alle Bilder aller Arbeiten, auch ausgeblendete (gedimmt) —
 * nur Gelöschtes nicht, das steht im Papierkorb. Beim Sortieren wird
 * `foto.reihenfolge` zur **vollständigen** neuen Liste; gelöschte Bilder
 * behalten dabei ihren Platz (`ersetzeTeilfolge`), damit Wiederherstellen
 * sie dorthin zurückbringt.
 */
export default function Fotos() {
  const { inhalt, bilder, aendere, aendereMitMeldung, unterwegs, heute, bearbeite, konfiguration, ladeNeueHoch } =
    useSitzung();
  const [vorschau, setVorschau] = useState(false);
  const [ziel, setZiel] = useState(inhalt.foto.arbeiten[0]?.id ?? "");

  const fotos = alleFotos({ inhalt, bilder }).filter((b) => !(b.schluessel in inhalt.papierkorb));
  const warten = platzhalter(unterwegs, bilder, "arbeiten/");
  const name = (s: string) => bildBezeichnung(inhalt, s);
  const sichtbar = fotos.filter((b) => !inhalt.ausgeblendet.includes(b.schluessel)).length;

  return (
    <section className={styles.abschnitt} aria-labelledby="fotos-titel">
      <div className={styles.abschnittKopf}>
        <h2 id="fotos-titel" className={styles.abschnittTitel}>
          Mosaik auf /foto
        </h2>
        <button
          type="button"
          className={styles.knopf}
          aria-pressed={vorschau}
          onClick={() => setVorschau((v) => !v)}
        >
          {vorschau ? "Zurück zum Sortieren" : "Vorschau"}
        </button>
      </div>

      {vorschau ? (
        <>
          <p className={styles.text}>
            So sieht das Mosaik nach dem Speichern aus ({sichtbar} Bilder). Tipp auf ein Bild öffnet es groß.
          </p>
          <div className={styles.vorschau}>
            <Mosaik bilder={fotosFuerMosaik({ inhalt, bilder })} spaltenMax={4} />
          </div>
        </>
      ) : (
        <>
          <p className={styles.text}>
            Zieh ein Bild am Griff an seinen Platz, oder nimm die Pfeile. Tipp aufs Bild für Titel, Beschreibung und
            Ausschnitt — dort kommt es auch mit einem Schritt an den Anfang oder auf einen bestimmten Platz.{" "}
            {sichtbar} von {fotos.length} Bildern sind sichtbar.
          </p>
          <Legende eintraege={[LEGENDE.auge, LEGENDE.stern, LEGENDE.eimer]} />

          <Sortierbar<Streckenbild>
            name="Mosaik auf /foto"
            darstellung="raster"
            eintraege={fotos}
            schluessel={(b) => b.schluessel}
            bezeichnung={(b) => name(b.schluessel)}
            beiNeuerReihenfolge={(neu) =>
              aendere((i) =>
                setzeFotoReihenfolge(
                  i,
                  alleFotos({ inhalt: i, bilder }).map((b) => b.schluessel),
                  neu,
                ),
              )
            }
            geist={(b) => <Daumen quelle={b.quelle} breite="180px" />}
            kind={(b, st) => {
              const s = b.schluessel;
              const aus = inhalt.ausgeblendet.includes(s);
              const hero = inhalt.foto.hero.includes(s);
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
                      {hero && <span className={styles.marke}>Hero</span>}
                      {unterwegs.has(s) && <span className={styles.marke}>wird ersetzt</span>}
                    </span>
                  </button>
                  <div className={styles.kachelName} title={name(s)}>
                    {st.platz + 1}. {name(s)}
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
                  {/* Die Namen bleiben gleich, der Zustand steht in
                      `aria-pressed`; ein Tooltip fehlt bewusst — die Legende
                      über dem Raster sagt, was die Zeichen bedeuten. */}
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
                      aria-pressed={hero}
                      aria-label={`${name(s)}: im Hero auf /foto`}
                      onClick={() =>
                        aendereMitMeldung(
                          (i) => umschalteHero(i, s),
                          hero ? `„${name(s)}“ ist nicht mehr im Hero.` : `„${name(s)}“ ist jetzt im Hero.`,
                        )
                      }
                    >
                      <Zeichen name="stern" voll={hero} />
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

          {warten.length > 0 && (
            <>
              <h3 className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
                Neu, wird verarbeitet
              </h3>
              <ul className={styles.raster}>
                {warten.map((s) => (
                  <li key={s}>
                    <div className={styles.wartet}>
                      {name(s)}
                      <br />
                      wird verarbeitet
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <div className={styles.nachtrag}>
        <h3 className={styles.abschnittTitel}>Neue Bilder</h3>
        <p className={styles.text}>
          Jedes Bild gehört zu einer Arbeit. Neue kommen ans Ende des Mosaiks; tipp danach aufs Bild, dann holt „An den
          Anfang“ es mit einem Schritt nach vorn.
          {!konfiguration.eingang && " Hochladen ist noch nicht eingerichtet."}
        </p>
        {inhalt.foto.arbeiten.length > 0 && (
          <div className={styles.formularZwei}>
            <Auswahl
              bezeichnung="Zu welcher Arbeit?"
              wert={ziel}
              optionen={inhalt.foto.arbeiten.map((a) => a.id)}
              beschriftung={(id) => inhalt.foto.arbeiten.find((a) => a.id === id)?.titel ?? id}
              beiAenderung={setZiel}
            />
            <div className={`${styles.feld} ${styles.feldUnten}`}>
              <DateiKnopf
                mehrere
                gesperrt={!konfiguration.eingang || !ziel}
                beiDateien={(dateien) => ladeNeueHoch({ arbeit: ziel }, dateien)}
              >
                Bilder hochladen
              </DateiKnopf>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
