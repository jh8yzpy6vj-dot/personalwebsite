"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/content";
import { byCategory, byNewest } from "@/lib/works";
import Kachelraster from "./Kachelraster";
import styles from "./Works.module.css";

type Filter = Category | "alle";

/**
 * Das Archiv unter `/arbeiten`: Kategoriefilter über dem Kachelraster.
 *
 * Nur der Filter ist Zustand und macht diese Datei zur Client-Komponente —
 * das Raster selbst liegt in `Kachelraster.tsx` und wird auch von der
 * Startseite benutzt, dort ohne eine Zeile JavaScript.
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
        <Kachelraster works={visible} />
      )}
    </section>
  );
}
