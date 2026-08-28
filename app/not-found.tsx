import type { Metadata } from "next";
import LightPage, { lightStyles as styles } from "./components/LightPage";

/**
 * Eigene 404-Seite.
 *
 * Ohne diese Datei landet man auf der Next.js-Standardseite: weißer Grund,
 * englischer Text, kein Bezug zur Seite. Bei einer Struktur mit eigenen
 * URLs je Arbeit (`/arbeiten/[slug]`) passiert das zwangsläufig — durch
 * Tippfehler, alte Links oder eine Arbeit, die wieder entfernt wurde.
 *
 * Sie führt bewusst weiter statt sich zu entschuldigen: Wer hier landet,
 * suchte etwas Bestimmtes und braucht den nächsten Schritt, keine
 * Fehlermeldung.
 */
export const metadata: Metadata = {
  title: "Seite nicht gefunden — jakob sax",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <LightPage title="hier ist nichts.">
      <div className={styles.prose}>
        <p>
          Die Adresse führt ins Leere. Vielleicht ein Tippfehler, vielleicht
          ein alter Link.
        </p>
        <p>
          Weiter geht es bei den <a href="/arbeiten">Arbeiten</a>, auf der{" "}
          <a href="/">Startseite</a> oder direkt über den{" "}
          <a href="/kontakt">Kontakt</a>.
        </p>
      </div>
    </LightPage>
  );
}
