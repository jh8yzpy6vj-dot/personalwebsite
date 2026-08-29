import type { Metadata } from "next";
import LightPage, { lightStyles as styles } from "../components/LightPage";
import Bild from "../components/Bild";
import { bild } from "@/lib/bilder";
import { ABOUT, REFERENCES } from "@/lib/content";
import portraitStyles from "./portrait.module.css";

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
  const portrait = bild("portrait");

  return (
    <LightPage title="über." current="/ueber">
      {/*
        Das Porträt steht **vor** dem Text, nicht daneben: Wer wissen will,
        wer da schreibt, schaut zuerst. Danebengestellt wäre es Dekoration
        neben einer Textspalte; darüber ist es die Antwort auf die Frage,
        mit der man diese Seite öffnet.

        Fehlt die Datei, erscheint hier nichts — kein Platzhalter. Auf der
        Startseite ist einer nötig, weil das Raster sonst ein Loch hätte;
        hier folgt einfach der Text.
      */}
      {portrait && (
        <figure className={portraitStyles.figur}>
          <Bild
            className={portraitStyles.bild}
            quelle={portrait}
            alt={ABOUT.portraitAlt}
            sizes="(max-width: 800px) 100vw, 720px"
            vorrang
            /* Derselbe Name wie im Anriss auf der Startseite: Das Porträt
               wandert beim Klick auf „mehr erfahren" mit. */
            uebergang="portrait"
          />
        </figure>
      )}

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
