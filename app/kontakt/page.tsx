import type { Metadata } from "next";
import LightPage, { lightStyles as styles } from "../components/LightPage";
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
 * ⚠️ Die Adresse in `content.ts` ist ein Platzhalter. Solange
 * `LEGAL_DATA_COMPLETE` false ist, wird sie hier **nicht** als anklickbarer
 * `mailto:`-Link ausgegeben — eine erfundene Adresse anzubieten wäre
 * schlimmer, als vorübergehend keinen Knopf zu haben.
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
              <p className={kontakt.ctaRow}>
                <a
                  className={kontakt.cta}
                  href={`mailto:${CONTACT.booking.email}`}
                >
                  {CONTACT.booking.cta}
                </a>
              </p>
              <p className={styles.meta}>{CONTACT.booking.email}</p>
            </>
          ) : (
            /* Kein toter mailto:-Link auf eine erfundene Adresse. */
            <p className={kontakt.pending}>
              Die Kontaktadresse wird gerade eingerichtet.
            </p>
          )}

          {/* Hier landet später das Anfrageformular mit strukturierten
              Feldern (Datum, Ort, Art der Veranstaltung, Budgetrahmen) —
              siehe TODO.md und TECH-STACK.md. Der mailto:-Link bleibt dann
              als sichtbarer Fallback daneben stehen. */}
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
