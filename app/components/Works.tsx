"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/content";
import { bildZurArbeit } from "@/lib/bilder";
import { byCategory, byNewest, metaLine } from "@/lib/works";
import Bild from "./Bild";
import styles from "./Works.module.css";

/**
 * Das Raster ist randlos und zweispaltig, unter 700px einspaltig — eine
 * Kachel ist also halb so breit wie das Fenster, auf dem Telefon so breit
 * wie das Fenster. Ohne diese Angabe lädt der Browser überall die Datei für
 * die volle Fensterbreite, also die doppelt zu große.
 */
const KACHEL_SIZES = "(max-width: 700px) 100vw, 50vw";

type Filter = Category | "alle";

/**
 * Kachelraster mit Kategoriefilter — das Herz des Archivs unter `/arbeiten`.
 *
 * Jede Kachel führt auf ihre eigene Seite. Das ist nicht nur Komfort: Nur
 * eine eigene URL kann für einen Festivalnamen ranken, und genau danach
 * sucht das Publikum, aus dem Auftraggeber kommen (siehe SITE-PLAN.md).
 */
export default function Works({ headingId }: { headingId: string }) {
  const [filter, setFilter] = useState<Filter>("alle");

  const visible = filter === "alle" ? byNewest() : byCategory(filter);

  return (
    <section className={styles.works} aria-labelledby={headingId}>
      <h2 className={styles.srOnly} id={headingId}>
        Arbeiten
      </h2>

      <div className={styles.filter} role="group" aria-label="Arbeiten filtern">
        <button
          type="button"
          className={styles.filterButton}
          aria-pressed={filter === "alle"}
          onClick={() => setFilter("alle")}
        >
          alle.
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles.filterButton}
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        /* Aktuell hat jede Kategorie Einträge. Der Zustand ist trotzdem
           abgedeckt, weil neue Kategorien leer starten können — siehe die
           Zustands-Tabelle in design/UI-SPEC.md. */
        <p className={styles.empty}>
          In dieser Kategorie ist noch nichts veröffentlicht.
        </p>
      ) : (
        <ul className={styles.grid}>
          {visible.map((work) => {
            const bild = bildZurArbeit(work.id);
            return (
            <li key={work.id} className={`${styles.tile} aufsteigen`}>
              <a className={styles.tileLink} href={`/arbeiten/${work.id}`}>
                {bild ? (
                  <Bild
                    className={styles.image}
                    quelle={bild}
                    alt={work.alt ?? `${work.title}, ${work.client}, ${work.year}`}
                    sizes={KACHEL_SIZES}
                    uebergang={`bild-${work.id}`}
                  />
                ) : (
                  <div className={styles.placeholder} aria-hidden="true">
                    <span className={styles.placeholderDot} />
                    <span className={styles.placeholderNote}>Bild folgt</span>
                  </div>
                )}

                <div className={styles.meta}>
                  <span className={styles.client}>{work.client}</span>
                  <span className={styles.title}>{work.title}</span>
                  <span className={styles.details}>{metaLine(work)}</span>
                </div>
              </a>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
