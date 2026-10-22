"use client";

import { ORT_BESCHREIBUNGEN, type Befund } from "@/lib/inhalt-pruefen";
import { bildBezeichnung, nachStufe, ohneBeschreibung, reiterFuerBefund } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import { Zeichen } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * Die Leiste mit den Befunden aus `pruefeInhalt` — live, bei jeder Änderung
 * neu gerechnet, mit denselben Regeln wie beim Build und auf dem Server.
 *
 * - **Fehler** stehen immer offen da und sperren das Speichern (rot
 *   markiert — siehe Kopf von `verwaltung.module.css`).
 * - **Warnungen** offen, aber zuklappbar: Speichern geht trotzdem.
 * - **Hinweise** zugeklappt — fehlende Bildbeschreibungen sollen nicht bei
 *   jeder Sitzung schreien. Aufgeklappt stehen die Bilder ohne Beschreibung
 *   als Knöpfe darunter.
 *
 * Jeder Befund, der zu einem Reiter gehört, hat „Zeigen" (`zeige`, in
 * `Verwaltung.tsx`). „Zum Fehler" in der Leiste springt hierher
 * (`id="befunde"`).
 *
 * `server` sind die Befunde, mit denen der Server zuletzt abgelehnt hat
 * (422). Normalerweise leer — die Prüfung hier fängt dasselbe vorher ab.
 */
export default function Befunde({
  befunde,
  server,
  zeige,
}: {
  befunde: Befund[];
  server: Befund[];
  zeige: (b: Befund) => void;
}) {
  const { inhalt, bilder } = useSitzung();
  const { fehler, warnungen, hinweise } = nachStufe(befunde);
  const serverFehler = server.filter((b) => b.stufe === "fehler");
  if (fehler.length + warnungen.length + hinweise.length + serverFehler.length === 0) return null;

  const name = (s: string) => bildBezeichnung(inhalt, s);
  const ohne = hinweise.some((b) => b.ort === ORT_BESCHREIBUNGEN) ? ohneBeschreibung({ inhalt, bilder }) : [];
  const liste = (b: Befund[]) => <Liste befunde={b} name={name} zeige={zeige} ohneBeschreibung={ohne} />;

  return (
    <section id="befunde" tabIndex={-1} className={styles.befunde} aria-label="Prüfung">
      {serverFehler.length > 0 && (
        <div className={`${styles.befundGruppe} ${styles.befundFehler}`} role="alert">
          <p className={styles.befundTitel}>Der Server hat das Speichern abgelehnt:</p>
          {liste(serverFehler)}
        </div>
      )}
      {fehler.length > 0 && (
        <div className={`${styles.befundGruppe} ${styles.befundFehler}`}>
          <p className={styles.befundTitel}>
            {fehler.length === 1 ? "Ein Fehler" : `${fehler.length} Fehler`} — so lässt sich nicht speichern:
          </p>
          {liste(fehler)}
        </div>
      )}
      {warnungen.length > 0 && (
        <details className={styles.befundGruppe} open>
          <summary>
            <Zeichen name="rechts" />
            {warnungen.length === 1 ? "Eine Warnung" : `${warnungen.length} Warnungen`} — Speichern geht trotzdem
          </summary>
          {liste(warnungen)}
        </details>
      )}
      {hinweise.length > 0 && (
        <details className={styles.befundGruppe}>
          <summary className={styles.leise}>
            <Zeichen name="rechts" />
            {hinweise.length === 1 ? "Ein Hinweis" : `${hinweise.length} Hinweise`}
          </summary>
          {liste(hinweise)}
        </details>
      )}
    </section>
  );
}

/**
 * Befunde als Liste: Ort leise, dann der Text — geht es um ein Bild
 * (`schluessel`), steht sein Name davor. Auch für den Verlauf; dort ohne
 * `zeige` (die Befunde gehören zu einem alten Stand) und als Aufzählung.
 */
export function Liste({
  befunde,
  name = (s) => s,
  zeige,
  ohneBeschreibung = [],
}: {
  befunde: Befund[];
  /** Wie ein Bild heißt — ohne Sitzung (Verlauf) der Schlüssel. */
  name?: (s: string) => string;
  zeige?: (b: Befund) => void;
  /** Die Bilder, die unter dem Hinweis „Bildbeschreibungen" stehen. */
  ohneBeschreibung?: string[];
}) {
  return (
    <ul className={`${styles.befundListe} ${zeige ? styles.befundZeilen : ""}`}>
      {befunde.map((b, n) => {
        const bild = b.schluessel ? `„${name(b.schluessel)}“ ` : "";
        const bilder = b.ort === ORT_BESCHREIBUNGEN ? ohneBeschreibung : [];
        return (
          <li key={`${b.ort}-${n}`} className={zeige ? styles.befund : undefined}>
            <span className={styles.befundText}>
              <span className={styles.ort}>{b.ort}</span> {bild}
              {b.text}
            </span>
            {zeige && reiterFuerBefund(b) && (
              <button
                type="button"
                className={styles.knopfLeise}
                aria-label={`Zeigen: ${b.ort}${b.schluessel ? ` · ${name(b.schluessel)}` : ""}`}
                onClick={() => zeige(b)}
              >
                Zeigen
              </button>
            )}
            {/* Ein Tipp öffnet das Bild — das Panel blättert dann durch genau diese. */}
            {zeige && bilder.length > 0 && (
              <ul className={styles.bildKnoepfe} aria-label="Bilder ohne Beschreibung">
                {bilder.map((s) => (
                  <li key={s}>
                    <button type="button" className={styles.knopfLeise} onClick={() => zeige({ ...b, schluessel: s })}>
                      {name(s)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
