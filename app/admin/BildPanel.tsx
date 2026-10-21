"use client";

import { arbeitZu, istVerborgen } from "@/lib/inhalt";
import { ZIEL } from "@/lib/admin/vertrag";
import {
  bildBezeichnung,
  bildtext,
  legeInPapierkorb,
  setzeBildtext,
  setzeUeberBeschriftung,
  stelleWiederHer,
  umschalteAusgeblendet,
  umschalteHero,
} from "@/lib/admin/werkzeuge";
import Ausschnitt from "./Ausschnitt";
import { useSitzung } from "./kontext";
import { DateiKnopf, Daumen, Dialog, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Seitenpanel „Bild bearbeiten"**: Texte, Ausschnitt, Ersetzen — alles, was
 * zu genau einem Bild gehört. Öffnet sich aus jedem Reiter über
 * `bearbeite(schluessel)`.
 *
 * Bildtitel und Alt-Text hängen an der **Arbeit**, nicht am Bild
 * (`bildtitel`/`alt` mit dem Namen `leitbild`, `01` …) — so steht es in
 * `lib/inhalt.json`, und `bildtext`/`setzeBildtext` übersetzen.
 */
export default function BildPanel({ schluessel, beiSchliessen }: { schluessel: string; beiSchliessen: () => void }) {
  const { inhalt, bilder, aendere, konfiguration, ladeHoch, unterwegs, heute } = useSitzung();
  const arbeit = arbeitZu(schluessel);
  const ueber = schluessel.startsWith("ueber/");
  const film = schluessel.startsWith("film/");
  const ausgeblendet = inhalt.ausgeblendet.includes(schluessel);
  const imHero = inhalt.foto.hero.includes(schluessel);
  const geloescht = schluessel in inhalt.papierkorb;
  const titel = arbeit ? inhalt.foto.arbeiten.find((a) => a.id === arbeit)?.titel : undefined;

  return (
    <Dialog titel={bildBezeichnung(inhalt, schluessel)} beiSchliessen={beiSchliessen} art="seite">
      {(schliesse) => (
        <>
          <div className={styles.panelBild}>
            <Daumen quelle={bilder[schluessel]} breite="(max-width: 520px) 100vw, 520px" />
          </div>

          {unterwegs.has(schluessel) && (
            <p className={styles.leise}>Ein neues Bild für diesen Platz wird gerade verarbeitet.</p>
          )}
          {/* Kein Fehlertext: Rot gehört Fehlern, die das Speichern sperren. */}
          {geloescht && (
            <div className={styles.band}>
              <p>Dieses Bild liegt im Papierkorb. Wiederhergestellt steht es wieder an seinem Platz.</p>
              <div className={styles.knopfreihe}>
                <button
                  type="button"
                  className={styles.knopf}
                  onClick={() => aendere((i) => stelleWiederHer(i, schluessel))}
                >
                  <Zeichen name="zurueck" />
                  Wiederherstellen
                </button>
              </div>
            </div>
          )}

          {arbeit && (
            <div className={styles.formular}>
              <Textfeld
                bezeichnung="Bildtitel (optional)"
                wert={bildtext(inhalt, schluessel, "bildtitel")}
                beiAenderung={(w) => aendere((i) => setzeBildtext(i, schluessel, "bildtitel", w))}
                hinweis={`Meist die Compagnie. Die Beschriftung wird dann „Bildtitel – ${titel ?? "Titel"}“.`}
              />
              <Textfeld
                bezeichnung="Bildbeschreibung (Alt-Text)"
                mehrzeilig
                wert={bildtext(inhalt, schluessel, "alt")}
                beiAenderung={(w) => aendere((i) => setzeBildtext(i, schluessel, "alt", w))}
                hinweis="Was ist zu sehen? Für Menschen, die das Bild nicht sehen können, und für Suchmaschinen."
              />
            </div>
          )}

          {ueber && (
            <Textfeld
              bezeichnung="Beschriftung"
              wert={inhalt.ueber.bilder[schluessel] ?? ""}
              platzhalter="Jakob Sax"
              beiAenderung={(w) => aendere((i) => setzeUeberBeschriftung(i, schluessel, w))}
              hinweis="Ohne Eintrag steht „Jakob Sax“ darunter."
            />
          )}

          {(arbeit || film) && (
            <section>
              <h3 className={styles.abschnittTitel}>Bildausschnitt</h3>
              <p className={styles.leise}>
                Gilt überall, wo das Bild beschnitten wird: im Hero, auf der Startseite
                {film ? ", beim Film-Standbild" : ""}. Im Mosaik steht es immer ganz.
              </p>
              <Ausschnitt schluessel={schluessel} />
            </section>
          )}

          {(arbeit || ueber) && !geloescht && (
            <div className={styles.knopfreihe}>
              <button
                type="button"
                className={styles.knopf}
                aria-pressed={ausgeblendet}
                onClick={() => aendere((i) => umschalteAusgeblendet(i, schluessel))}
              >
                <Zeichen name={ausgeblendet ? "augeZu" : "auge"} />
                {ausgeblendet ? "Ausgeblendet — einblenden" : "Ausblenden"}
              </button>
              {arbeit && (
                <button
                  type="button"
                  className={styles.knopf}
                  aria-pressed={imHero}
                  onClick={() => aendere((i) => umschalteHero(i, schluessel))}
                >
                  <Zeichen name="stern" voll={imHero} />
                  {imHero ? "Im Hero — herausnehmen" : "In den Hero"}
                </button>
              )}
              <button
                type="button"
                className={styles.knopf}
                onClick={() => {
                  aendere((i) => legeInPapierkorb(i, schluessel, heute));
                  schliesse();
                }}
              >
                <Zeichen name="eimer" />
                Löschen
              </button>
            </div>
          )}
          {istVerborgen(inhalt, schluessel) && !geloescht && (
            <p className={styles.leise}>Ausgeblendete Bilder bleiben im Bildspeicher, nur die Seite zeigt sie nicht.</p>
          )}

          {/* Ein gelöschtes Bild erst wiederherstellen: Ein neues unter
              demselben Schlüssel bliebe sonst verborgen — und die
              Medien-Action löschte es nach 30 Tagen womöglich mit. */}
          {ZIEL.test(schluessel) && !geloescht && (
            <section>
              <h3 className={styles.abschnittTitel}>Ersetzen</h3>
              <p className={styles.leise}>
                Das neue Bild übernimmt Platz, Texte und Ausschnitt des alten. Prüf danach den Ausschnitt.
                {!konfiguration.eingang && " Hochladen ist noch nicht eingerichtet."}
              </p>
              <div className={styles.knopfreihe}>
                <DateiKnopf
                  gesperrt={!konfiguration.eingang}
                  beiDateien={(dateien) => ladeHoch([{ datei: dateien[0], ziel: schluessel }])}
                >
                  Neue Datei wählen
                </DateiKnopf>
              </div>
            </section>
          )}
        </>
      )}
    </Dialog>
  );
}
