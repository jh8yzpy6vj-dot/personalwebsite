import type { ReactNode } from "react";
import LightPage, { lightStyles } from "./LightPage";
import { LEGAL, LEGAL_DATA_COMPLETE, missingLegalFields } from "@/lib/legal";
import styles from "./LegalPage.module.css";

/**
 * Impressum und Datenschutz — der helle Seitenrahmen plus zwei Dinge, die
 * nur Rechtsseiten brauchen: den Hinweis auf fehlende Pflichtangaben und
 * das Stand-Datum.
 */
export default function LegalPage({
  title,
  scope,
  children,
}: {
  title: string;
  /** Bestimmt, welche fehlenden Pflichtangaben im Hinweis aufgeführt werden. */
  scope: "impressum" | "datenschutz";
  children: ReactNode;
}) {
  const missing = missingLegalFields(scope);

  return (
    <LightPage title={title}>
      {!LEGAL_DATA_COMPLETE && (
        <aside className={styles.notice}>
          <p className={styles.noticeTitle}>
            Diese Seite ist noch nicht vollständig.
          </p>
          <p className={styles.noticeText}>
            Die Pflichtangaben werden gerade zusammengestellt. Bis dahin
            erreichen Sie mich über die Kontaktseite.
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

      <div className={lightStyles.prose}>{children}</div>

      <p className={styles.updated}>Stand: {LEGAL.lastUpdated}</p>
    </LightPage>
  );
}

/**
 * Platzhalter für eine fehlende Pflichtangabe. Bewusst auffällig: Eine
 * stillschweigende Lücke im Impressum wäre schlimmer als eine sichtbare.
 */
export function Missing({ label }: { label: string }) {
  return <span className={styles.missing}>[ {label} FEHLT ]</span>;
}

export { lightStyles as legalStyles };
