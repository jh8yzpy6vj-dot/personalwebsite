"use client";

import { useState } from "react";
import { istVerborgen } from "@/lib/inhalt";
import { AUSSCHNITT_MITTIG } from "@/lib/bilder";
import { alleFotos, bildBezeichnung, setzeHero, umschalteHero } from "@/lib/admin/werkzeuge";
import Ausschnitt from "./Ausschnitt";
import Bildwahl from "./Bildwahl";
import { useSitzung } from "./kontext";
import Sortierbar from "./Sortierbar";
import { Daumen, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Hero** — die Bilder, durch die oben auf `/foto` geblendet wird,
 * in dieser Reihenfolge. Das erste steht da, bevor ein Skript läuft.
 *
 * Je Bild lässt sich der Ausschnitt wählen: Das Hero ist randlos und
 * beschneidet — am PC breit, am Telefon hoch.
 */
export default function Hero() {
  const { inhalt, bilder, aendere, aendereMitMeldung } = useSitzung();
  const [offen, setOffen] = useState<string | null>(null);
  const [waehlen, setWaehlen] = useState(false);
  const hero = inhalt.foto.hero;
  const name = (s: string) => bildBezeichnung(inhalt, s);
  /* Gezählt wird, was zu sehen ist — wie in der Prüfung. Ausgeblendete und
     gelöschte Bilder behalten ihren Platz und kehren dorthin zurück. */
  const sichtbar = hero.filter((s) => !istVerborgen(inhalt, s)).length;
  const verborgen = hero.length - sichtbar;

  /* Zur Wahl: sichtbare Fotos, die noch nicht im Hero sind. */
  const auswahl = alleFotos({ inhalt, bilder }).filter(
    (b) => !hero.includes(b.schluessel) && !istVerborgen(inhalt, b.schluessel),
  );

  return (
    <section className={styles.abschnitt} aria-labelledby="hero-titel">
      <div className={styles.abschnittKopf}>
        <h2 id="hero-titel" className={styles.abschnittTitel}>
          Hero auf /foto
        </h2>
        <button type="button" className={styles.knopf} onClick={() => setWaehlen(true)}>
          <Zeichen name="plus" />
          Bild hinzufügen
        </button>
      </div>
      <p className={styles.text}>
        {sichtbar === 1 ? "Ein sichtbares Bild" : `${sichtbar} sichtbare Bilder`}
        {verborgen > 0 ? ` (dazu ${verborgen} ausgeblendet oder gelöscht)` : ""} — gut sind sechs bis acht. Das erste
        erscheint zuerst. Mit dem Stern im Reiter Fotos geht es auch.
      </p>

      {sichtbar === 0 && <p className={styles.fehlerText}>Der Hero braucht mindestens ein sichtbares Bild.</p>}
      {hero.length > 0 && (
        <Sortierbar<string>
          name="Hero auf /foto"
          darstellung="liste"
          eintraege={hero}
          schluessel={(s) => s}
          bezeichnung={name}
          beiNeuerReihenfolge={(neu) => aendere((i) => setzeHero(i, neu))}
          kind={(s, st) => (
            <div className={styles.zeile}>
              <div className={styles.zeileKopf}>
                <button type="button" {...st.griff}>
                  <Zeichen name="griff" />
                </button>
                <span className={styles.zeileBild}>
                  <Daumen
                    quelle={bilder[s]}
                    art="voll"
                    ausschnitt={inhalt.bildausschnitte[s] ?? AUSSCHNITT_MITTIG}
                    breite="72px"
                  />
                </span>
                <span className={styles.zeileName}>
                  <strong>
                    {st.platz + 1}. {name(s)}
                  </strong>
                  <span>
                    {s in inhalt.papierkorb
                      ? "im Papierkorb — erscheint nicht"
                      : !bilder[s]
                        ? "Bild fehlt"
                        : istVerborgen(inhalt, s)
                          ? "ausgeblendet — erscheint nicht"
                          : `Ausschnitt ${inhalt.bildausschnitte[s] ?? "mittig"}`}
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
                    aria-expanded={offen === s}
                    aria-label="Ausschnitt wählen"
                    title="Ausschnitt wählen"
                    onClick={() => setOffen((o) => (o === s ? null : s))}
                  >
                    <Zeichen name="stift" />
                  </button>
                  <button
                    type="button"
                    className={styles.knopfSymbol}
                    aria-label="Aus dem Hero nehmen"
                    title="Aus dem Hero nehmen"
                    onClick={() =>
                      aendereMitMeldung((i) => umschalteHero(i, s), `„${name(s)}“ ist nicht mehr im Hero.`, true)
                    }
                  >
                    <Zeichen name="zu" />
                  </button>
                </span>
              </div>
              {offen === s && (
                <div className={styles.zeileInhalt}>
                  <Ausschnitt schluessel={s} />
                </div>
              )}
            </div>
          )}
        />
      )}

      {waehlen && (
        <Bildwahl
          titel="Bild für den Hero"
          auswahl={auswahl}
          aktuell={null}
          beiWahl={(s) => {
            if (s) {
              aendereMitMeldung(
                (i) => (i.foto.hero.includes(s) ? i : setzeHero(i, [...i.foto.hero, s])),
                `„${name(s)}“ ist jetzt im Hero.`,
              );
            }
          }}
          beiSchliessen={() => setWaehlen(false)}
        />
      )}
    </section>
  );
}
