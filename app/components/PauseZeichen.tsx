import styles from "./PauseZeichen.module.css";

/**
 * Das Zeichen im Pause-Knopf (Hero-Video, Blende). Beide Fassungen stehen
 * immer übereinander und blenden ineinander, statt hart umzuspringen
 * (UI-SPEC, „Motion" → „Zeichen wechseln").
 */
export default function PauseZeichen({ laeuft }: { laeuft: boolean }) {
  return (
    <span className={styles.zeichen} aria-hidden="true">
      <svg className={laeuft ? undefined : styles.aus} viewBox="0 0 16 16" width="16" height="16">
        <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
        <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
      </svg>
      <svg className={laeuft ? styles.aus : undefined} viewBox="0 0 16 16" width="16" height="16">
        <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
      </svg>
    </span>
  );
}
