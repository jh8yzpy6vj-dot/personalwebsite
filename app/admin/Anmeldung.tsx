import styles from "./verwaltung.module.css";

/**
 * Die Anmeldung vor der Verwaltung: ein Passwortfeld, ein Knopf. Ein
 * schlichtes HTML-Formular ohne JavaScript — es schickt an
 * `/api/admin/anmelden`, das per 303 hierher zurückleitet, bei einem
 * Fehler mit `?falsch=1` bzw. nach zu vielen Versuchen mit `?gesperrt=1`.
 */
export default function Anmeldung({ falsch, gesperrt }: { falsch: boolean; gesperrt: boolean }) {
  const fehler = gesperrt
    ? "Zu viele Versuche. Warte eine Minute und versuch es dann noch einmal."
    : falsch
      ? "Das Passwort stimmt nicht."
      : null;
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
              aria-describedby={fehler ? "anmeldung-fehler" : undefined}
            />
          </div>
          {fehler && (
            <p id="anmeldung-fehler" className={styles.fehlerText} role="alert">
              {fehler}
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
