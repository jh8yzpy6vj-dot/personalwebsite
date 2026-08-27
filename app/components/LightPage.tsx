import type { ReactNode } from "react";
import Topbar from "./Topbar";
import SiteFooter from "./SiteFooter";
import styles from "./LightPage.module.css";

/**
 * Rahmen für alle durchgehend hellen Seiten.
 *
 * `variant="light"` an der Topbar ist Pflicht: Ohne das startet sie im
 * Dunkel-Modus und die weiße Wortmarke wäre auf Papier unlesbar.
 */
export default function LightPage({
  title,
  current,
  children,
}: {
  title: string;
  /** Pfad dieser Seite — markiert den aktiven Punkt im Footer. */
  current?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <Topbar variant="light" homeHref="/" />
      <main className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </main>
      <SiteFooter current={current} />
    </div>
  );
}

export { styles as lightStyles };
