"use client";

import { setzeEinwilligung, useEinwilligung } from "@/lib/einwilligung";
import styles from "./Einwilligung.module.css";

/**
 * Der Hinweis zu YouTube („Cookie-Banner", seit 2026-10-24) — UI-SPEC,
 * „Filme einbetten".
 *
 * Steht **nur auf `/film`**, solange nichts entschieden ist: Nur dort lädt
 * die Seite etwas von einem Dritten. Auf allen anderen Seiten gibt es nichts
 * einzuwilligen, also auch nichts zu fragen.
 *
 * Nicht modal: Die Seite bleibt bedienbar, die Filme fragen sonst einzeln.
 * „Ablehnen" und „Erlauben" sind gleich gestaltet — keine Wahl wird nahegelegt.
 */
export function Hinweis() {
  const einwilligung = useEinwilligung();
  if (einwilligung !== "offen") return null;

  return (
    <section className={styles.hinweis} aria-label="YouTube-Filme">
      <p className={styles.text}>
        Die Filme auf dieser Seite liegen bei YouTube. Erst wenn Sie es erlauben, lädt die Seite
        Vorschaubilder und Player von YouTube — dabei gehen Daten wie Ihre IP-Adresse an Google, und
        YouTube kann Cookies setzen. <a href="/datenschutz#youtube">Mehr dazu</a>
      </p>
      <div className={styles.knoepfe}>
        <button type="button" className={styles.knopf} onClick={() => setzeEinwilligung("nein")}>
          Ablehnen
        </button>
        <button type="button" className={styles.knopf} onClick={() => setzeEinwilligung("ja")}>
          Erlauben
        </button>
      </div>
    </section>
  );
}

/**
 * Die Entscheidung ansehen und ändern — unten auf `/film` und in der
 * Datenschutzerklärung. Widerrufen muss so leicht sein wie Erlauben.
 *
 * Vor der Hydration (Entscheidung unbekannt) steht nur der Satz ohne Knopf.
 */
export function Schalter({ className }: { className?: string }) {
  const einwilligung = useEinwilligung();
  const erlaubt = einwilligung === "ja";

  return (
    <p className={`${styles.schalter} ${className ?? ""}`} aria-live="polite">
      YouTube-Filme:{" "}
      {einwilligung === "unbekannt" ? (
        "werden erst nach Einwilligung geladen."
      ) : (
        <>
          {erlaubt ? "erlaubt" : "nicht erlaubt"} ·{" "}
          <button
            type="button"
            className={styles.schalterKnopf}
            onClick={() => setzeEinwilligung(erlaubt ? "nein" : "ja")}
          >
            {erlaubt ? "Einwilligung widerrufen" : "Erlauben"}
          </button>
        </>
      )}
    </p>
  );
}
