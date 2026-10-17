import styles from "./verwaltung.module.css";

/**
 * Die Anmeldung vor der Verwaltung: ein Passwortfeld, ein Knopf. Ein
 * schlichtes HTML-Formular ohne JavaScript — es schickt an
 * `/api/admin/anmelden`, das per 303 hierher zurückleitet.
 */
export default function Anmeldung({ falsch }: { falsch: boolean }) {
  return (
    <main id="inhalt" className={styles.seite}>
      <div className={styles.mitte}>
        <form method="post" action="/api/admin/anmelden" className={styles.anmeldung}>
          <h1 className={styles.titel}>Verwaltung</h1>
          <div className={styles.feld}>
            <label htmlFor="passwort" className={styles.feldName}>
              Passwort
            </label>
            <input
              id="passwort"
              name="passwort"
              type="password"
              className={styles.eingabe}
              autoComplete="current-password"
              required
              autoFocus
              aria-describedby={falsch ? "passwort-falsch" : undefined}
            />
          </div>
          {falsch && (
            <p id="passwort-falsch" className={styles.fehlerText} role="alert">
              Das Passwort stimmt nicht.
            </p>
          )}
          <button type="submit" className={styles.knopfHaupt}>
            Anmelden
          </button>
        </form>
      </div>
    </main>
  );
}
