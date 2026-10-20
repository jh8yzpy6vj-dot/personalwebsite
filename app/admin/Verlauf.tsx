"use client";

import { useEffect, useMemo, useState } from "react";
import type { Befund } from "@/lib/inhalt-pruefen";
import type {
  SpeichernAntwort,
  Verlauf,
  VerlaufEintrag,
  VerlaufStand,
  ZuruecksetzenAnfrage,
} from "@/lib/admin/vertrag";
import { pruefeAltenStand } from "@/lib/admin/werkzeuge";
import { Liste } from "./Befunde";
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
 * Deshalb ist `inhalt` hier zugleich der Stand auf `main`, und die Rückfrage
 * kann genau sagen, was Wiederherstellen ändert.
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

/** Der alte Stand für die Rückfrage — oder warum er nicht kam. */
type Geholt = { commit: string; inhalt: unknown } | { commit: string; fehler: string };

export default function VerlaufReiter({
  sha,
  gesperrt,
  beiWiederhergestellt,
  beiKonflikt,
}: {
  sha: string;
  /** Der Stand in der Verwaltung ist nicht der von `main` — siehe `veraltet` in `Verwaltung.tsx`. */
  gesperrt: boolean;
  /** `commit` und `sha` des neuen Commits, der den alten Stand enthält. */
  beiWiederhergestellt: (commit: string, sha: string) => Promise<void>;
  beiKonflikt: () => void;
}) {
  const { inhalt, bilder, konfiguration, ungespeichert } = useSitzung();
  const [eintraege, setEintraege] = useState<VerlaufEintrag[] | null>(null);
  const [fehler, setFehler] = useState<{ text: string; befunde: Befund[] } | null>(null);
  const [frage, setFrage] = useState<{ eintrag: VerlaufEintrag; letzte: boolean } | null>(null);
  const [geholt, setGeholt] = useState<Geholt | null>(null);
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
      } else setFehler({ text: netzText(status, daten), befunde: [] });
    });
    return () => {
      abgebrochen = true;
    };
  }, [konfiguration.github, runde]);

  /* Öffnet die Rückfrage, den alten Stand holen — damit sie sagen kann, was
     sich ändert, bevor etwas geschieht. */
  const commit = frage?.eintrag.commit;
  useEffect(() => {
    if (!commit) return;
    let abgebrochen = false;
    void holeJson<VerlaufStand>(`/api/admin/verlauf?commit=${encodeURIComponent(commit)}`).then(
      ({ status, daten }) => {
        if (abgebrochen) return;
        setGeholt(
          status === 200 && daten && "inhalt" in daten
            ? { commit, inhalt: daten.inhalt }
            : { commit, fehler: netzText(status, daten) },
        );
      },
    );
    return () => {
      abgebrochen = true;
    };
  }, [commit]);

  /* Nur, was zu genau dieser Rückfrage gehört — ein langsamer Abruf für einen
     anderen Eintrag zählt nicht. */
  const alt = geholt && geholt.commit === commit ? geholt : null;
  const vergleich = useMemo(
    () => (alt && "inhalt" in alt ? pruefeAltenStand(inhalt, alt.inhalt, Object.keys(bilder)) : null),
    [alt, inhalt, bilder],
  );

  const stelleHer = async (e: VerlaufEintrag) => {
    setLaeuft(true);
    setFehler(null);
    const { status, daten } = await sendeJson<SpeichernAntwort>("/api/admin/zuruecksetzen", {
      commit: e.commit,
      sha,
    } satisfies ZuruecksetzenAnfrage);
    if (daten?.ok === true) {
      /* Die Rückfrage bleibt mit „Stellt wieder her …" offen, bis der neue
         Stand da ist (bis zu einigen Sekunden) — sonst stünde unten so lange
         „Alles gespeichert." über dem alten Inhalt. */
      await beiWiederhergestellt(daten.commit, daten.sha);
      setFrage(null);
      setRunde((r) => r + 1);
    } else if (status === 409 || (daten?.ok === false && daten.grund === "konflikt")) {
      setFrage(null);
      beiKonflikt();
    } else {
      setFrage(null);
      const befunde = daten?.ok === false ? (daten.befunde ?? []).filter((b) => b.stufe === "fehler") : [];
      setFehler({ text: netzText(status, daten), befunde });
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
          {fehler && (
            <div>
              <p className={styles.fehlerText}>{fehler.text}</p>
              {fehler.befunde.length > 0 && <Liste befunde={fehler.befunde} />}
            </div>
          )}
          {eintraege === null && !fehler && <p className={styles.leise}>Lädt …</p>}
          {eintraege && eintraege.length === 0 && <p className={styles.leise}>Noch keine Einträge.</p>}
          {eintraege && eintraege.length > 0 && (
            <ul className={`${styles.reihen} ${styles.verlaufListe}`}>
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
                          disabled={ungespeichert || gesperrt || laeuft}
                          onClick={() => {
                            /* Frisch holen — auch bei einem Eintrag, der schon einmal offen war. */
                            setGeholt(null);
                            setFrage({ eintrag: e, letzte: n === 1 });
                          }}
                        >
                          {/* Der Eintrag direkt unter dem aktuellen ist der Stand vor der letzten Speicherung. */}
                          {n === 1 ? "Letzte Speicherung zurücknehmen" : "Diesen Stand wiederherstellen"}
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
        <Dialog
          titel={frage.letzte ? "Letzte Speicherung zurücknehmen?" : "Diesen Stand wiederherstellen?"}
          beiSchliessen={() => setFrage(null)}
        >
          <p className={styles.text}>
            Die Seite bekommt wieder den Inhalt vom {alsZeit(frage.eintrag.datum)} („{frage.eintrag.nachricht}“).
            Alles, was danach gespeichert wurde, ist dann nicht mehr zu sehen — steht aber weiter im Verlauf und lässt
            sich genauso zurückholen.
          </p>
          {!alt ? (
            <p className={styles.leise} aria-live="polite">
              Lädt …
            </p>
          ) : "fehler" in alt ? (
            <p className={styles.fehlerText}>{alt.fehler}</p>
          ) : vergleich?.art === "unpassend" ? (
            <div>
              <p className={styles.fehlerText}>
                Dieser Stand passt nicht mehr zu den heutigen Regeln und lässt sich nicht direkt zurückholen:
              </p>
              <Liste befunde={vergleich.fehler} />
              <p className={styles.text}>Wenn du ihn brauchst, gib Jan Bescheid.</p>
            </div>
          ) : vergleich?.art === "gleich" ? (
            <p className={styles.text}>Dieser Stand ist derselbe wie jetzt.</p>
          ) : vergleich?.art === "aendert" ? (
            <>
              <p className={styles.text}>
                <strong>Wiederherstellen ändert:</strong> {vergleich.text}.
              </p>
              <p className={styles.text}>
                {vergleich.papierkorb > 0
                  ? "Bilder, die mit diesem Stand wieder im Papierkorb liegen, bekommen ab heute wieder volle 30 Tage."
                  : "Die Bilddateien selbst bleiben, wie sie sind."}
              </p>
            </>
          ) : null}
          <div className={styles.knopfreihe}>
            <button
              type="button"
              className={styles.knopfHaupt}
              disabled={laeuft || vergleich?.art !== "aendert"}
              onClick={() => void stelleHer(frage.eintrag)}
            >
              {laeuft ? "Stellt wieder her …" : frage.letzte ? "Zurücknehmen" : "Wiederherstellen"}
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
