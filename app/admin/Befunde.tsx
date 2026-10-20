"use client";

import type { Befund } from "@/lib/inhalt-pruefen";
import { nachStufe } from "@/lib/admin/werkzeuge";
import styles from "./verwaltung.module.css";

/**
 * Die Leiste mit den Befunden aus `pruefeInhalt` — live, bei jeder Änderung
 * neu gerechnet, mit denselben Regeln wie beim Build und auf dem Server.
 *
 * - **Fehler** stehen immer offen da und sperren das Speichern (rot
 *   markiert — siehe Kopf von `verwaltung.module.css`).
 * - **Warnungen** offen, aber zuklappbar: Speichern geht trotzdem.
 * - **Hinweise** zugeklappt — fehlende Bildbeschreibungen sollen nicht bei
 *   jeder Sitzung schreien.
 *
 * `server` sind die Befunde, mit denen der Server zuletzt abgelehnt hat
 * (422). Normalerweise leer — die Prüfung hier fängt dasselbe vorher ab.
 */
export default function Befunde({ befunde, server }: { befunde: Befund[]; server: Befund[] }) {
  const { fehler, warnungen, hinweise } = nachStufe(befunde);
  const serverFehler = server.filter((b) => b.stufe === "fehler");
  if (fehler.length + warnungen.length + hinweise.length + serverFehler.length === 0) return null;

  return (
    <section className={styles.befunde} aria-label="Prüfung">
      {serverFehler.length > 0 && (
        <div className={`${styles.befundGruppe} ${styles.befundFehler}`} role="alert">
          <p className={styles.befundTitel}>Der Server hat das Speichern abgelehnt:</p>
          <Liste befunde={serverFehler} />
        </div>
      )}
      {fehler.length > 0 && (
        <div className={`${styles.befundGruppe} ${styles.befundFehler}`}>
          <p className={styles.befundTitel}>
            {fehler.length === 1 ? "Ein Fehler" : `${fehler.length} Fehler`} — so lässt sich nicht speichern:
          </p>
          <Liste befunde={fehler} />
        </div>
      )}
      {warnungen.length > 0 && (
        <details className={styles.befundGruppe} open>
          <summary>
            {warnungen.length === 1 ? "Eine Warnung" : `${warnungen.length} Warnungen`} — Speichern geht trotzdem
          </summary>
          <Liste befunde={warnungen} />
        </details>
      )}
      {hinweise.length > 0 && (
        <details className={styles.befundGruppe}>
          <summary className={styles.leise}>
            {hinweise.length === 1 ? "Ein Hinweis" : `${hinweise.length} Hinweise`}
          </summary>
          <Liste befunde={hinweise} />
        </details>
      )}
    </section>
  );
}

/** Befunde als Liste: Ort leise, dann der Text. Auch für den Verlauf. */
export function Liste({ befunde }: { befunde: Befund[] }) {
  return (
    <ul className={styles.befundListe}>
      {befunde.map((b, n) => (
        <li key={`${b.ort}-${n}`}>
          <span className={styles.ort}>{b.ort}</span> {b.text}
        </li>
      ))}
    </ul>
  );
}
