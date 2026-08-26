"use client";

import { useState } from "react";
import { CATEGORIES, WORKS, type Category } from "@/lib/content";
import styles from "./Works.module.css";

type Filter = Category | "alle";

export default function Works() {
  const [filter, setFilter] = useState<Filter>("alle");

  const visible =
    filter === "alle" ? WORKS : WORKS.filter((w) => w.category === filter);

  return (
    <section className={styles.works} id="arbeiten" aria-labelledby="arbeiten-titel">
      <h2 className={styles.srOnly} id="arbeiten-titel">
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

      <ul className={styles.grid}>
        {visible.map((work) => (
          <li key={work.id} className={styles.tile}>
            {work.image ? (
              <img
                className={styles.image}
                src={work.image}
                alt={work.alt ?? `${work.title}, ${work.client}, ${work.year}`}
                loading="lazy"
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
              <span className={styles.details}>
                {[work.place, work.role, work.year].filter(Boolean).join(" · ")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
