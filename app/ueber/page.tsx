import type { Metadata } from "next";
import LightPage, { lightStyles as styles } from "../components/LightPage";
import { ABOUT, REFERENCES } from "@/lib/content";

/**
 * Die Person. Hier lebt der Journalismus — auffindbar und prominent, aber
 * getrennt vom Angebot.
 *
 * Der Grund für die Trennung (siehe SITE-PLAN.md): Stünden SWR-Beiträge als
 * Portfolio-Kacheln neben einem Aftermovie, verkaufte er seine Recherche.
 * Als eigener Bereich sind sie ein Beleg — und genau darin liegt ihr Wert
 * für die Fotografie-Kundschaft.
 */
export const metadata: Metadata = {
  title: "über — jakob sax",
  description:
    "Jakob Sax, Journalist beim SWR in der Klimaredaktion und Fotograf für Kultur und Theater im öffentlichen Raum.",
  alternates: { canonical: "/ueber" },
};

export default function Ueber() {
  return (
    <LightPage title="über." current="/ueber">
      <div className={styles.prose}>
        {ABOUT.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <h2>Belege</h2>
        <p>
          Meine redaktionellen Beiträge stehen bei den jeweiligen Sendern.
          Eine Übersicht führt die{" "}
          <a href={ABOUT.authorPageUrl} rel="noreferrer">
            {ABOUT.authorPageLabel}
          </a>
          .
        </p>

        <h2>Schon fotografiert für</h2>
        <p className={styles.meta}>{REFERENCES.join(" · ")}</p>
      </div>

      {/* Kein Lebenslauf-Link: Es gibt noch keinen. Sobald ein ausführlicher
          CV vorliegt (siehe TODO.md), hier verlinken — nicht erfinden. */}
    </LightPage>
  );
}
