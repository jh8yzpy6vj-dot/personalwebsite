import type { ReactNode } from "react";
import Topbar from "./Topbar";
import SiteFooter from "./SiteFooter";
import styles from "./Seite.module.css";

type Props = {
  /** Text der `<h1>`. */
  titel: string;
  /**
   * Sichtbar nur auf den Rechtsseiten und der 404-Seite — dort wird gelesen.
   * Auf `/foto`, `/film` und `/ueber` zeigt die Navigation, wo man ist; die
   * `<h1>` steht dort nur für Screenreader und Suchmaschinen (UI-SPEC,
   * „Keine sichtbaren Seitentitel").
   */
  titelSichtbar?: boolean;
  /** Pfad dieser Seite — markiert das passende Ziel in Topbar und Footer. */
  aktuell?: string;
  /** Größte Inhaltsbreite, siehe UI-SPEC, „Spacing". */
  breite: "foto" | "film" | "ueber" | "text";
  children: ReactNode;
};

const BREITE = {
  foto: styles.breiteFoto,
  film: styles.breiteFilm,
  ueber: styles.breiteUeber,
  text: styles.breiteText,
} as const;

/**
 * Der Rahmen aller Seiten außer der Startseite: Topbar, Inhalt, Footer —
 * alles auf derselben dunklen Fläche.
 */
export default function Seite({
  titel,
  titelSichtbar = false,
  aktuell,
  breite,
  children,
}: Props) {
  return (
    <div className={styles.seite}>
      <Topbar aktuell={aktuell} />
      <main
        className={`${styles.inhalt} ${BREITE[breite]}`}
        id="inhalt"
        tabIndex={-1}
      >
        <h1 className={titelSichtbar ? styles.titel : "nur-vorlesen"}>{titel}</h1>
        {children}
      </main>
      <SiteFooter aktuell={aktuell} />
    </div>
  );
}

export { styles as seitenStyles };
