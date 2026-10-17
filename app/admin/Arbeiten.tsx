"use client";

import { useState } from "react";
import { alleBilderDerArbeit } from "@/lib/arbeiten";
import { arbeitZu, istVerborgen, type Fotoarbeit } from "@/lib/inhalt";
import {
  aendereArbeit,
  bildBezeichnung,
  eindeutigeId,
  entferneArbeit,
  hatBilder,
  neueArbeit,
  ordneArbeiten,
  platzhalter,
} from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { Auswahl, DateiKnopf, Daumen, Dialog, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Arbeiten** — Titel, Kunde, Kategorie und Notiz je Arbeit, neue
 * Arbeiten, Bilder hochladen.
 *
 * Die Reihenfolge hier ordnet nur noch Bilder, die (noch) nicht in der
 * Mosaik-Reihenfolge stehen — die eigentliche Ordnung auf `/foto` macht der
 * Reiter Fotos.
 */
export default function Arbeiten() {
  const { inhalt, bilder, aendere, konfiguration, unterwegs, ladeNeueHoch, bearbeite } = useSitzung();
  const [offen, setOffen] = useState<string | null>(null);
  const [neuTitel, setNeuTitel] = useState("");
  const [neuKategorie, setNeuKategorie] = useState(inhalt.foto.kategorien[0] ?? "");
  const [loeschen, setLoeschen] = useState<Fotoarbeit | null>(null);

  const arbeiten = inhalt.foto.arbeiten;
  /* Ordner, die es im Bildspeicher schon gibt — auch ohne Arbeit dazu. Eine
     neue Arbeit darf keinen davon erben. */
  const ordner = [...Object.keys(bilder), ...unterwegs].flatMap((s) => arbeitZu(s) ?? []);
  const vorschauId = neuTitel.trim() ? eindeutigeId(neuTitel, [...arbeiten.map((a) => a.id), ...ordner], "arbeit") : "";

  const lege = () => {
    if (!neuTitel.trim()) return;
    /* Dieselbe Rechnung wie in `neueArbeit` — so lässt sich die neue Arbeit
       gleich aufklappen, ohne auf das nächste Rendern zu warten. */
    const titel = neuTitel;
    aendere((i) => neueArbeit(i, titel, neuKategorie, ordner).inhalt);
    setNeuTitel("");
    setOffen(vorschauId);
  };

  return (
    <section className={styles.abschnitt} aria-labelledby="arbeiten-titel">
      <div className={styles.abschnittKopf}>
        <h2 id="arbeiten-titel" className={styles.abschnittTitel}>
          Arbeiten
        </h2>
      </div>
      <p className={styles.text}>
        {arbeiten.length} Arbeiten. Tipp auf eine, um sie zu bearbeiten oder Bilder hochzuladen. Die Reihenfolge hier
        bestimmt nur, wo neue Bilder im Mosaik landen.
      </p>

      <Sortierbar<Fotoarbeit>
        name="Arbeiten"
        darstellung="liste"
        eintraege={arbeiten}
        schluessel={(a) => a.id}
        bezeichnung={(a) => a.titel}
        beiNeuerReihenfolge={(neu) => aendere((i) => ordneArbeiten(i, neu))}
        kind={(a, st) => {
          const alle = alleBilderDerArbeit(a, { inhalt, bilder });
          const vorhanden = alle.filter((b) => !(b.schluessel in inhalt.papierkorb));
          const sichtbar = vorhanden.filter((b) => !istVerborgen(inhalt, b.schluessel));
          const warten = platzhalter(unterwegs, bilder, `arbeiten/${a.id}`).filter((s) => arbeitZu(s) === a.id);
          const ist = offen === a.id;
          return (
            <div className={styles.zeile}>
              <div className={styles.zeileKopf}>
                <button type="button" {...st.griff}>
                  <Zeichen name="griff" />
                </button>
                <span className={styles.zeileBild}>
                  <Daumen quelle={sichtbar[0]?.quelle ?? vorhanden[0]?.quelle} art="voll" breite="72px" />
                </span>
                <span className={styles.zeileName}>
                  <strong>{a.titel || a.id}</strong>
                  <span>
                    {a.kategorie} · {sichtbar.length} von {vorhanden.length} Bildern sichtbar
                    {warten.length > 0 ? ` · ${warten.length} in Verarbeitung` : ""}
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
                    aria-label={`${a.titel} bearbeiten`}
                    title="Bearbeiten"
                    onClick={() => setOffen(ist ? null : a.id)}
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
                      wert={a.titel}
                      beiAenderung={(w) => aendere((i) => aendereArbeit(i, a.id, { titel: w }))}
                      hinweis="So, wie er auf der Seite stehen soll. Gehört das Jahr dazu, hier mit hinein."
                    />
                    <Textfeld
                      bezeichnung="Kunde (optional)"
                      wert={a.kunde ?? ""}
                      beiAenderung={(w) => aendere((i) => aendereArbeit(i, a.id, { kunde: w }))}
                      hinweis="Ohne „e.V.“ oder „GmbH“."
                    />
                    <Auswahl
                      bezeichnung="Kategorie"
                      wert={a.kategorie}
                      optionen={inhalt.foto.kategorien}
                      beiAenderung={(w) => aendere((i) => aendereArbeit(i, a.id, { kategorie: w }))}
                    />
                    <Textfeld
                      bezeichnung="Kennung"
                      wert={a.id}
                      nurLesen
                      hinweis="Der Ordnername im Bildspeicher. Lässt sich nicht ändern — sonst fänden sich die Bilder nicht mehr."
                    />
                  </div>
                  <Textfeld
                    bezeichnung="Notiz (nur hier sichtbar, nie auf der Seite)"
                    mehrzeilig
                    wert={a.notiz ?? ""}
                    beiAenderung={(w) => aendere((i) => aendereArbeit(i, a.id, { notiz: w }))}
                  />

                  <div>
                    <h3 className={styles.abschnittTitel}>Bilder</h3>
                    {vorhanden.length === 0 && warten.length === 0 ? (
                      <p className={styles.leise}>Noch keine Bilder. Ohne Bild erscheint die Arbeit nicht.</p>
                    ) : (
                      <ul className={styles.bildreihe}>
                        {vorhanden.map((b) => (
                          <li key={b.schluessel}>
                            <button
                              type="button"
                              className={`${styles.zeileBild} ${istVerborgen(inhalt, b.schluessel) ? styles.kachelAus : ""}`}
                              aria-label={`${bildBezeichnung(inhalt, b.schluessel)} bearbeiten`}
                              title={bildBezeichnung(inhalt, b.schluessel)}
                              onClick={() => bearbeite(b.schluessel)}
                            >
                              <Daumen quelle={b.quelle} art="voll" breite="72px" />
                            </button>
                          </li>
                        ))}
                        {warten.map((s) => (
                          <li key={s}>
                            <span className={styles.wartet}>neu</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className={styles.knopfreihe}>
                    <DateiKnopf
                      mehrere
                      gesperrt={!konfiguration.eingang}
                      beiDateien={(dateien) => ladeNeueHoch({ arbeit: a.id }, dateien)}
                    >
                      Bilder hochladen
                    </DateiKnopf>
                    <button type="button" className={styles.knopfLeise} onClick={() => setLoeschen(a)}>
                      <Zeichen name="eimer" />
                      Arbeit löschen
                    </button>
                  </div>
                  {!konfiguration.eingang && <p className={styles.leise}>Hochladen ist noch nicht eingerichtet.</p>}
                </div>
              )}
            </div>
          );
        }}
      />

      <div className={styles.nachtrag}>
        <h3 className={styles.abschnittTitel}>Neue Arbeit</h3>
        <div className={styles.formularZwei}>
          <Textfeld
            bezeichnung="Titel"
            wert={neuTitel}
            beiAenderung={setNeuTitel}
            hinweis={vorschauId ? `Kennung wird „${vorschauId}“ — danach nicht mehr änderbar.` : undefined}
          />
          <Auswahl
            bezeichnung="Kategorie"
            wert={neuKategorie}
            optionen={inhalt.foto.kategorien}
            beiAenderung={setNeuKategorie}
          />
        </div>
        <div className={`${styles.knopfreihe} ${styles.unterTitel}`}>
          <button type="button" className={styles.knopf} disabled={!neuTitel.trim()} onClick={lege}>
            <Zeichen name="plus" />
            Arbeit anlegen
          </button>
        </div>
      </div>

      {loeschen && (
        <LoeschDialog arbeit={loeschen} beiSchliessen={() => setLoeschen(null)} beiLoeschen={() => setOffen(null)} />
      )}
    </section>
  );
}

function LoeschDialog({
  arbeit,
  beiSchliessen,
  beiLoeschen,
}: {
  arbeit: Fotoarbeit;
  beiSchliessen: () => void;
  beiLoeschen: () => void;
}) {
  const { bilder, unterwegs, aendere } = useSitzung();
  const nochBilder = hatBilder(arbeit.id, [...Object.keys(bilder), ...unterwegs]);
  return (
    <Dialog titel={`„${arbeit.titel}“ löschen?`} beiSchliessen={beiSchliessen}>
      {nochBilder ? (
        <>
          <p className={styles.text}>
            Das geht erst, wenn keine Bilder dieser Arbeit mehr im Bildspeicher liegen. Gelöschte Bilder bleiben dort
            noch bis zu 30 Tage (Papierkorb).
          </p>
          <p className={styles.text}>
            Soll die Arbeit sofort verschwinden: Blende alle ihre Bilder aus — ohne sichtbares Bild erscheint sie nicht.
          </p>
          <div className={styles.knopfreihe}>
            <button type="button" className={styles.knopf} onClick={beiSchliessen}>
              Verstanden
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.text}>Die Arbeit hat keine Bilder mehr. Titel, Kunde und Notiz gehen dabei verloren.</p>
          <div className={styles.knopfreihe}>
            <button
              type="button"
              className={styles.knopfHaupt}
              onClick={() => {
                aendere((i) => entferneArbeit(i, arbeit.id));
                beiLoeschen();
                beiSchliessen();
              }}
            >
              Löschen
            </button>
            <button type="button" className={styles.knopf} onClick={beiSchliessen}>
              Abbrechen
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
