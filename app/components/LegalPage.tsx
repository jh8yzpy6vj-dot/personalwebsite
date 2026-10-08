import type { ReactNode } from "react";
import Seite, { seitenStyles } from "./Seite";
import { LEGAL, LEGAL_DATA_COMPLETE, missingLegalFields } from "@/lib/legal";
import styles from "./LegalPage.module.css";

/**
 * Impressum und Datenschutz — der Seitenrahmen mit sichtbarem Titel plus
 * zwei Dinge, die nur Rechtsseiten brauchen: den Hinweis auf fehlende
 * Pflichtangaben und das Stand-Datum.
 */
export default function LegalPage({
  title,
  scope,
  aktuell,
  children,
}: {
  title: string;
  /** Bestimmt, welche fehlenden Pflichtangaben im Hinweis aufgeführt werden. */
  scope: "impressum" | "datenschutz";
  /** Pfad dieser Seite — markiert sie im Footer. */
  aktuell: string;
  children: ReactNode;
}) {
  const missing = missingLegalFields(scope);

  return (
    <Seite titel={title} titelSichtbar aktuell={aktuell} breite="text">
      {!LEGAL_DATA_COMPLETE && (
        <aside className={styles.notice}>
          <p className={styles.noticeTitle}>
            Diese Seite ist noch nicht vollständig.
          </p>
          <p className={styles.noticeText}>
            Die Pflichtangaben werden gerade zusammengestellt.
          </p>
          {missing.length > 0 && (
            <ul className={styles.noticeList}>
              {missing.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          )}
        </aside>
      )}

      <div className={seitenStyles.prose}>{children}</div>

      <p className={styles.updated}>Stand: {LEGAL.lastUpdated}</p>
    </Seite>
  );
}

/**
 * Platzhalter für eine fehlende Pflichtangabe. Bewusst auffällig: Eine
 * stillschweigende Lücke im Impressum wäre schlimmer als eine sichtbare.
 */
export function Missing({ label }: { label: string }) {
  return <span className={styles.missing}>[ {label} FEHLT ]</span>;
}

export { seitenStyles as legalStyles };
