"use client";

import { useEffect, useState } from "react";
import type { SpeichernAntwort, Verlauf, VerlaufEintrag, ZuruecksetzenAnfrage } from "@/lib/admin/vertrag";
import { holeJson, netzText, sendeJson } from "./hochladen";
import { useSitzung } from "./kontext";
import { Dialog, Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Verlauf** — jede Speicherung ist ein Commit von `lib/inhalt.json`;
 * hier stehen die letzten. „Diesen Stand wiederherstellen" legt den alten
 * Inhalt als **neuen** Commit obenauf — nichts wird gelöscht, auch das
 * Wiederherstellen lässt sich wieder rückgängig machen.
 *
 * Nur ohne ungespeicherte Änderungen: Der wiederhergestellte Stand ersetzt
 * den in der Verwaltung, und was Jakob gerade bearbeitet, wäre sonst weg.
 */

const zeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function alsZeit(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : zeit.format(d);
}

export default function VerlaufReiter({
  sha,
  beiWiederhergestellt,
  beiKonflikt,
}: {
  sha: string;
  beiWiederhergestellt: (commit: string) => Promise<void>;
  beiKonflikt: () => void;
}) {
  const { konfiguration, ungespeichert } = useSitzung();
  const [eintraege, setEintraege] = useState<VerlaufEintrag[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [frage, setFrage] = useState<VerlaufEintrag | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [runde, setRunde] = useState(0);

  useEffect(() => {
    if (!konfiguration.github) return;
    let abgebrochen = false;
    void holeJson<Verlauf>("/api/admin/verlauf").then(({ status, daten }) => {
      if (abgebrochen) return;
      if (status === 200 && daten && Array.isArray(daten.eintraege)) {
        setEintraege(daten.eintraege);
        setFehler(null);
      } else setFehler(netzText(status, daten));
    });
    return () => {
      abgebrochen = true;
    };
  }, [konfiguration.github, runde]);

  const stelleHer = async (e: VerlaufEintrag) => {
    setLaeuft(true);
    setFehler(null);
    const { status, daten } = await sendeJson<SpeichernAntwort>("/api/admin/zuruecksetzen", {
      commit: e.commit,
      sha,
    } satisfies ZuruecksetzenAnfrage);
    setFrage(null);
    if (daten?.ok === true) {
      await beiWiederhergestellt(daten.commit);
      setRunde((r) => r + 1);
    } else if (status === 409 || (daten?.ok === false && daten.grund === "konflikt")) {
      beiKonflikt();
    } else {
      setFehler(netzText(status, daten));
    }
    setLaeuft(false);
  };

  return (
    <section className={styles.abschnitt} aria-labelledby="verlauf-titel">
      <div className={styles.abschnittKopf}>
        <h2 id="verlauf-titel" className={styles.abschnittTitel}>
          Verlauf
        </h2>
        {konfiguration.github && (
          <button type="button" className={styles.knopfLeise} onClick={() => setRunde((r) => r + 1)}>
            <Zeichen name="zurueck" />
            Aktualisieren
          </button>
        )}
      </div>
      <p className={styles.text}>
        Jede Speicherung — auch Jans Änderungen im Code — steht hier. Ein alter Stand lässt sich zurückholen; er wird
        dann als neue Speicherung obenauf gelegt.
      </p>
      {!konfiguration.github ? (
        <p className={styles.leise}>Der Verlauf braucht die Verbindung zu GitHub, die noch nicht eingerichtet ist.</p>
      ) : (
        <>
          {ungespeichert && (
            <p className={styles.band}>Erst speichern (oder neu laden), dann lässt sich ein alter Stand wiederherstellen.</p>
          )}
          {fehler && <p className={styles.fehlerText}>{fehler}</p>}
          {eintraege === null && !fehler && <p className={styles.leise}>Lädt …</p>}
          {eintraege && eintraege.length === 0 && <p className={styles.leise}>Noch keine Einträge.</p>}
          {eintraege && eintraege.length > 0 && (
            <ul className={styles.reihen}>
              {eintraege.map((e, n) => (
                <li key={e.commit} className={styles.zeile}>
                  <div className={styles.zeileKopf}>
                    <span className={styles.zeileName}>
                      <strong>{e.nachricht}</strong>
                      <span>
                        {alsZeit(e.datum)} · {e.autor}
                        {n === 0 ? " · aktueller Stand" : ""}
                      </span>
                    </span>
                    {n > 0 && (
                      <span className={styles.zeileKnoepfe}>
                        <button
                          type="button"
                          className={styles.knopf}
                          disabled={ungespeichert || laeuft}
                          onClick={() => setFrage(e)}
                        >
                          Diesen Stand wiederherstellen
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {frage && (
        <Dialog titel="Diesen Stand wiederherstellen?" beiSchliessen={() => setFrage(null)}>
          <p className={styles.text}>
            Die Seite bekommt wieder den Inhalt vom {alsZeit(frage.datum)} („{frage.nachricht}“). Alles, was danach
            gespeichert wurde, ist dann nicht mehr zu sehen — steht aber weiter im Verlauf und lässt sich genauso
            zurückholen.
          </p>
          <p className={styles.text}>Bilder bleiben, wie sie sind; es geht nur um Texte, Reihenfolgen und Auswahl.</p>
          <div className={styles.knopfreihe}>
            <button type="button" className={styles.knopfHaupt} disabled={laeuft} onClick={() => void stelleHer(frage)}>
              {laeuft ? "Stellt wieder her …" : "Wiederherstellen"}
            </button>
            <button type="button" className={styles.knopf} disabled={laeuft} onClick={() => setFrage(null)}>
              Abbrechen
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
