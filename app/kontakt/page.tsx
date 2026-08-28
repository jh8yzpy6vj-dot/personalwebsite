import type { Metadata } from "next";
import LightPage from "../components/LightPage";
import AnfrageForm from "../components/AnfrageForm";
import { CONTACT } from "@/lib/content";
import { LEGAL_DATA_COMPLETE } from "@/lib/legal";
import kontakt from "./kontakt.module.css";

/**
 * Kontakt, getrennt nach Absicht.
 *
 * Eine Festivalleitung und eine Quelle brauchen nicht denselben Kanal — die
 * eine will buchen, die andere vertraulich reden. Beides in ein Formular zu
 * werfen wäre bequem und falsch.
 *
 * Die `mailto:`-Schaltfläche hängt an `LEGAL_DATA_COMPLETE`: Solange keine
 * echte Adresse hinterlegt ist, erscheint statt eines toten Knopfes ein
 * ehrlicher Hinweis. Seit 2026-08-27 ist die Adresse echt, der Knopf also
 * aktiv. Die Verzweigung bleibt bestehen — sie ist die Sicherung dagegen,
 * dass je wieder ein Platzhalter als klickbarer Kontakt ausgeliefert wird.
 */
export const metadata: Metadata = {
  title: "kontakt — jakob sax",
  description:
    "Buchungsanfragen und vertrauliche Hinweise an Jakob Sax, Fotograf und Journalist.",
  alternates: { canonical: "/kontakt" },
};

export default function Kontakt() {
  return (
    <LightPage title="kontakt." current="/kontakt">
      <div className={kontakt.columns}>
        <section>
          <h2 className={kontakt.heading}>{CONTACT.booking.heading}</h2>
          <p className={kontakt.note}>{CONTACT.booking.note}</p>

          {LEGAL_DATA_COMPLETE ? (
            <>
              <AnfrageForm email={CONTACT.booking.email} />

              {/* Der mailto:-Weg bleibt sichtbar, aber als schlichter
                  Textlink: Der Absende-Button des Formulars ist auf dieser
                  Seite der einzige gefüllte Button (siehe UI-SPEC). Zwei
                  rote Knöpfe wären zwei konkurrierende Aufforderungen. */}
              <p className={kontakt.direkt}>
                Lieber ohne Formular?{" "}
                <a href={`mailto:${CONTACT.booking.email}`}>
                  {CONTACT.booking.email}
                </a>
              </p>
            </>
          ) : (
            /* Kein totes Formular und kein mailto: auf eine erfundene
               Adresse — greift, falls die echten Daten je entfernt werden. */
            <p className={kontakt.pending}>
              Die Kontaktadresse wird gerade eingerichtet.
            </p>
          )}
        </section>

        <section>
          <h2 className={kontakt.heading}>{CONTACT.confidential.heading}</h2>
          <p className={kontakt.note}>{CONTACT.confidential.note}</p>
          <ul className={kontakt.channels}>
            {CONTACT.confidential.channels.map((channel) => (
              <li key={channel}>{channel}</li>
            ))}
          </ul>
        </section>
      </div>
    </LightPage>
  );
}
