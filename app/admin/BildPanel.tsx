"use client";

import { useRef, useState, type ReactNode } from "react";
import { arbeitZu } from "@/lib/inhalt";
import { ZIEL } from "@/lib/admin/vertrag";
import {
  aufDerStartseite,
  bildBezeichnung,
  bildtext,
  blaetterListe,
  blaettern,
  blaetterTaste,
  FELDNAMEN,
  istTextfeld,
  legeInPapierkorb,
  lesePlatz,
  naechstesOhneBeschreibung,
  ohneBeschreibung,
  platzImMosaik,
  setzeBildtext,
  setzeUeberBeschriftung,
  stelleWiederHer,
  umschalteAusgeblendet,
  umschalteHero,
  verschiebeAufPlatz,
  verwendung,
  type Folge,
} from "@/lib/admin/werkzeuge";
import Ausschnitt from "./Ausschnitt";
import Ersetzen from "./Ersetzen";
import { useSitzung } from "./kontext";
import { Daumen, Dialog, Textfeld, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Seitenpanel „Bild bearbeiten"**: alles, was zu genau einem Bild gehört.
 * Öffnet sich aus jedem Reiter über `bearbeite(schluessel, folge)`.
 *
 * Von oben nach unten (UI-SPEC, „Bild-Panel"): Blättern im Kopf, Bild,
 * Aktionen, „Verwendet: …", Platz im Mosaik, Texte, Ausschnitt zum
 * Aufklappen, Ersetzen, „Fertig".
 *
 * Bildtitel und Alt-Text hängen an der **Arbeit**, nicht am Bild
 * (`bildtitel`/`alt` mit dem Namen `leitbild`, `01` …) — so steht es in
 * `lib/inhalt.json`, und `bildtext`/`setzeBildtext` übersetzen.
 *
 * Beim Blättern bleibt das Panel dasselbe, nur `schluessel` wechselt. Die
 * Textfelder tragen den Schlüssel als `key`: Jedes Bild bekommt frische
 * Felder, das Rückgängig des Browsers darin reicht nie ins Bild davor.
 *
 * `meldung`: die Meldung mit „Rückgängig" — solange das Panel offen ist,
 * steht sie unten darin statt in der Leiste, die es verdeckt.
 *
 * `beiSchliessen(nachbar)`: `nachbar` ist nach „Löschen" das Bild daneben
 * in der Folge — gibt es die Kachel des gelöschten nicht mehr, zeigt die
 * Verwaltung dessen Kachel statt der, die das Panel geöffnet hat.
 */
export default function BildPanel({
  schluessel,
  folge,
  beiSchliessen,
  meldung,
}: {
  schluessel: string;
  folge: Folge | undefined;
  beiSchliessen: (nachbar: string | null) => void;
  meldung: ReactNode;
}) {
  const { inhalt, bilder, aendere, aendereMitMeldung, konfiguration, unterwegs, heute, bearbeite } = useSitzung();
  const k = { inhalt, bilder };
  const name = bildBezeichnung(inhalt, schluessel);
  const arbeit = arbeitZu(schluessel);
  const ueber = schluessel.startsWith("ueber/");
  const film = schluessel.startsWith("film/");
  const ausgeblendet = inhalt.ausgeblendet.includes(schluessel);
  const imHero = inhalt.foto.hero.includes(schluessel);
  const geloescht = schluessel in inhalt.papierkorb;
  const titel = arbeit ? inhalt.foto.arbeiten.find((a) => a.id === arbeit)?.titel : undefined;
  const orte = verwendung(k, schluessel);
  const liste = blaetterListe(k, schluessel, folge);
  const hier = liste.indexOf(schluessel);
  const platz = platzImMosaik(k, schluessel);
  const ohne = arbeit ? ohneBeschreibung(k) : [];
  const naechstesOhne = arbeit ? naechstesOhneBeschreibung(k, schluessel) : null;

  /* Wo das Bild zuletzt in der Folge stand: Nimmt Jakob es aus dem Hero,
     blättert das Panel von dort aus weiter (`blaettern`). */
  const [zuletzt, setZuletzt] = useState({ fuer: schluessel, platz: hier });
  if (hier >= 0 && (zuletzt.fuer !== schluessel || zuletzt.platz !== hier)) {
    setZuletzt({ fuer: schluessel, platz: hier });
  }
  const stelle = blaettern(liste, schluessel, zuletzt.fuer === schluessel ? zuletzt.platz : null);
  /* Nach „Löschen": das Bild daneben (siehe `beiSchliessen`). */
  const nachbar = useRef<string | null>(null);
  /* Das Bild, zu dem „Nächstes Bild ohne Beschreibung" eben sprang — dort
     steht der Fokus dann im Feld Bildbeschreibung. Blättern setzt es
     zurück, sonst spränge der Fokus beim nächsten Besuch wieder hinein. */
  const [sprung, setSprung] = useState<string | null>(null);

  /* Was im Feld „Platz" getippt, aber noch nicht übernommen ist — nur für
     das Bild, zu dem es getippt wurde; nach dem Blättern steht dort wieder
     dessen Platz. */
  const [entwurf, setEntwurf] = useState<{ fuer: string; text: string } | null>(null);
  /* „Ausschnitt anpassen" — je Bild zuerst offen, wenn schon einer gesetzt
     ist; danach, wie Jakob es auf- oder zuklappt. Neu bestimmt beim
     Blättern, nicht bei jeder Änderung: Sonst klappte „Mittig" den Bereich
     unter der Hand zu. */
  const [ausschnittOffen, setAusschnittOffen] = useState({
    fuer: schluessel,
    offen: schluessel in inhalt.bildausschnitte,
  });
  if (ausschnittOffen.fuer !== schluessel) {
    setAusschnittOffen({ fuer: schluessel, offen: schluessel in inhalt.bildausschnitte });
  }

  const geheZu = (ziel: string | null) => {
    if (!ziel) return;
    setSprung(null);
    bearbeite(ziel, folge);
  };

  const setzePlatz = (ziel: number) => {
    setEntwurf(null);
    if (!platz) return;
    const p = Math.min(Math.max(ziel, 1), platz.anzahl);
    if (p === platz.platz) return;
    aendereMitMeldung((i) => verschiebeAufPlatz(i, bilder, schluessel, p), `„${name}“ steht jetzt auf Platz ${p}.`);
  };
  /* Keine Zahl: Die alte steht wieder da. */
  const uebernimmPlatz = (text: string) => {
    const p = lesePlatz(text);
    if (p === null) setEntwurf(null);
    else setzePlatz(p);
  };

  /* ← und → blättern — nicht in Textfeldern, nicht mit Zusatztasten, nicht
     auf der Ausschnitt-Fläche (die fängt ihre Pfeile vorher ab). */
  const beiTaste = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing || !stelle) return;
    const richtung = blaetterTaste(e, istTextfeld(document.activeElement));
    if (richtung === null) return;
    e.preventDefault();
    geheZu(richtung < 0 ? stelle.vorher : stelle.nachher);
  };

  /* Gesperrt über `aria-disabled` statt `disabled`: Ein gesperrter Knopf
     verlöre den Fokus — nach „Nächstes Bild" am Ende oder „An den Anfang"
     stünde man sonst am Seitenanfang. */
  const gesperrt = (an: boolean) => (an ? { "aria-disabled": true } : {});

  const kopf = stelle && (
    <div className={styles.blaettern}>
      <button
        type="button"
        className={styles.knopfSymbol}
        aria-label="Vorheriges Bild"
        {...gesperrt(!stelle.vorher)}
        onClick={() => geheZu(stelle.vorher)}
      >
        <Zeichen name="links" />
      </button>
      <span className={styles.leise} aria-live="polite">
        {stelle.nr !== null
          ? `${stelle.nr} von ${stelle.anzahl}`
          : folge === "hero"
            ? "nicht mehr im Hero"
            : "nicht mehr dabei"}
        <span className="nur-vorlesen">: {name}</span>
      </span>
      <button
        type="button"
        className={styles.knopfSymbol}
        aria-label="Nächstes Bild"
        {...gesperrt(!stelle.nachher)}
        onClick={() => geheZu(stelle.nachher)}
      >
        <Zeichen name="rechts" />
      </button>
    </div>
  );

  return (
    <Dialog
      titel={name}
      beiSchliessen={() => beiSchliessen(nachbar.current)}
      art="seite"
      kopf={kopf}
      beiTaste={beiTaste}
      fuss={
        /* Immer da, auch leer — wie in der Leiste: Eine Live-Region, die
           erst mit ihrem Text erscheint, lesen Screenreader oft nicht vor. */
        <div className={styles.panelMeldung} role="status">
          {meldung}
        </div>
      }
    >
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
                  onClick={() =>
                    aendereMitMeldung((i) => stelleWiederHer(i, schluessel), `„${name}“ ist wiederhergestellt.`)
                  }
                >
                  <Zeichen name="zurueck" />
                  Wiederherstellen
                </button>
              </div>
            </div>
          )}

          {(arbeit || ueber) && !geloescht && (
            <div className={styles.panelAktionen}>
              <div className={styles.knopfreihe}>
                <button
                  type="button"
                  className={styles.knopf}
                  aria-pressed={ausgeblendet}
                  onClick={() =>
                    aendereMitMeldung(
                      (i) => umschalteAusgeblendet(i, schluessel),
                      ausgeblendet ? `„${name}“ ist wieder sichtbar.` : `„${name}“ ist ausgeblendet.`,
                    )
                  }
                >
                  <Zeichen name={ausgeblendet ? "augeZu" : "auge"} />
                  {ausgeblendet ? "Ausgeblendet — einblenden" : "Ausblenden"}
                </button>
                {arbeit && (
                  <button
                    type="button"
                    className={styles.knopf}
                    aria-pressed={imHero}
                    onClick={() =>
                      aendereMitMeldung(
                        (i) => umschalteHero(i, schluessel),
                        imHero ? `„${name}“ ist nicht mehr im Hero.` : `„${name}“ ist jetzt im Hero.`,
                      )
                    }
                  >
                    <Zeichen name="stern" voll={imHero} />
                    {imHero ? "Im Hero — herausnehmen" : "In den Hero"}
                  </button>
                )}
                {/* Das Panel schließt: Die Meldung mit „Rückgängig" steht dann in der Leiste. */}
                <button
                  type="button"
                  className={styles.knopf}
                  onClick={() => {
                    nachbar.current = stelle?.nachher ?? stelle?.vorher ?? null;
                    aendereMitMeldung(
                      (i) => legeInPapierkorb(i, schluessel, heute),
                      `„${name}“ liegt im Papierkorb.`,
                      true,
                    );
                    schliesse();
                  }}
                >
                  <Zeichen name="eimer" />
                  Löschen
                </button>
              </div>
              {/* Die Startseite zeigt nur sichtbare Fotos — ein verborgenes
                  lässt seinen Platz dort leer. */}
              {aufDerStartseite(k, schluessel) ? (
                <p className={styles.leise}>
                  Ausgeblendet oder gelöscht bleibt sein Platz auf der Startseite leer — dort dann ein anderes Bild
                  wählen.
                </p>
              ) : (
                ausgeblendet && (
                  <p className={styles.leise}>
                    Ausgeblendete Bilder bleiben im Bildspeicher, nur die Seite zeigt sie nicht.
                  </p>
                )
              )}
            </div>
          )}

          {orte.length > 0 && <p className={styles.leise}>Verwendet: {orte.join(" · ")}</p>}

          {platz && (
            <section className={styles.panelAbschnitt}>
              <h3 className={styles.abschnittTitel}>Platz im Mosaik</h3>
              <div className={styles.platzZeile}>
                <Textfeld
                  bezeichnung="Platz"
                  zahl
                  wert={entwurf?.fuer === schluessel ? entwurf.text : String(platz.platz)}
                  beiAenderung={(w) => setEntwurf({ fuer: schluessel, text: w })}
                  beiEnter={uebernimmPlatz}
                  beiVerlassen={uebernimmPlatz}
                  beiEsc={() => setEntwurf(null)}
                />
                <span className={styles.leise}>von {platz.anzahl}</span>
                <button
                  type="button"
                  className={styles.knopfLeise}
                  {...gesperrt(platz.platz === 1)}
                  onClick={() => setzePlatz(1)}
                >
                  An den Anfang
                </button>
                <button
                  type="button"
                  className={styles.knopfLeise}
                  {...gesperrt(platz.platz === platz.anzahl)}
                  onClick={() => setzePlatz(platz.anzahl)}
                >
                  Ans Ende
                </button>
              </div>
            </section>
          )}

          {arbeit && (
            <div className={styles.formular}>
              <Textfeld
                key={`${schluessel}:bildtitel`}
                bezeichnung={FELDNAMEN.bildtitel}
                wert={bildtext(inhalt, schluessel, "bildtitel")}
                beiAenderung={(w) => aendere((i) => setzeBildtext(i, schluessel, "bildtitel", w))}
                hinweis={`Meist die Compagnie. Die Beschriftung wird dann „Bildtitel – ${titel ?? "Titel"}“.`}
              />
              <Textfeld
                key={`${schluessel}:alt`}
                bezeichnung={FELDNAMEN.alt}
                mehrzeilig
                autoFokus={sprung === schluessel}
                wert={bildtext(inhalt, schluessel, "alt")}
                beiAenderung={(w) => aendere((i) => setzeBildtext(i, schluessel, "alt", w))}
                hinweis="Was ist zu sehen? Für Menschen, die das Bild nicht sehen können, und für Suchmaschinen."
              />
              {/* Blättert danach durch genau diese Bilder — so lässt sich eine
                  Lücke nach der anderen schließen. */}
              {naechstesOhne && (
                <div className={styles.knopfreihe}>
                  <button
                    type="button"
                    className={styles.knopfLeise}
                    onClick={() => {
                      setSprung(naechstesOhne);
                      bearbeite(naechstesOhne, ohne);
                    }}
                  >
                    Nächstes Bild ohne Beschreibung ({ohne.filter((s) => s !== schluessel).length})
                  </button>
                </div>
              )}
            </div>
          )}

          {ueber && (
            <Textfeld
              key={`${schluessel}:beschriftung`}
              bezeichnung={FELDNAMEN.beschriftung}
              wert={inhalt.ueber.bilder[schluessel] ?? ""}
              platzhalter="Jakob Sax"
              beiAenderung={(w) => aendere((i) => setzeUeberBeschriftung(i, schluessel, w))}
              hinweis="Ohne Eintrag steht „Jakob Sax“ darunter."
            />
          )}

          {(arbeit || film) && (
            <details
              className={styles.aufklappen}
              open={ausschnittOffen.offen}
              onToggle={(e) => setAusschnittOffen({ fuer: schluessel, offen: e.currentTarget.open })}
            >
              <summary className={styles.aufklappenKopf}>
                <Zeichen name="rechts" />
                Ausschnitt anpassen
              </summary>
              <div className={styles.aufklappenInhalt}>
                <p className={styles.leise}>
                  Gilt überall, wo das Bild beschnitten wird: im Hero auf /foto, auf der Startseite
                  {film ? ", beim Film-Standbild" : ""}. Im Mosaik steht es immer ganz.
                </p>
                <Ausschnitt schluessel={schluessel} />
              </div>
            </details>
          )}

          {/* Ein gelöschtes Bild erst wiederherstellen: Ein neues unter
              demselben Schlüssel bliebe sonst verborgen — und die
              Medien-Action löschte es nach 30 Tagen womöglich mit. */}
          {ZIEL.test(schluessel) && !geloescht && (
            <section className={styles.panelAbschnitt}>
              <h3 className={styles.abschnittTitel}>Ersetzen</h3>
              <p className={styles.leise}>
                Das neue Bild übernimmt Platz, Texte und Ausschnitt des alten. Prüf danach den Ausschnitt.
                {!konfiguration.eingang && " Hochladen ist noch nicht eingerichtet."}
              </p>
              <div className={styles.knopfreihe}>
                <Ersetzen
                  ziel={schluessel}
                  gesperrt={!konfiguration.eingang}
                  titel="Bild ersetzen?"
                  was="Das bisherige Bild"
                  bleibt="Platz, Texte und Ausschnitt bleiben."
                >
                  Neue Datei wählen
                </Ersetzen>
              </div>
            </section>
          )}

          <div className={styles.knopfreihe}>
            <button type="button" className={styles.knopfHaupt} onClick={schliesse}>
              Fertig
            </button>
            <span className={styles.leise}>Änderungen gehen erst mit „Speichern“ unten online.</span>
          </div>
        </>
      )}
    </Dialog>
  );
}
