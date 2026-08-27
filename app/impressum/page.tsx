import type { Metadata } from "next";
import LegalPage, { Missing, legalStyles as styles } from "../components/LegalPage";
import { LEGAL } from "@/lib/legal";

/**
 * Impressum nach § 5 DDG (Digitale-Dienste-Gesetz, seit 2024 Nachfolger der
 * entsprechenden TMG-Regelung) und § 18 Abs. 2 MStV.
 *
 * ⚠️ KEINE RECHTSBERATUNG — siehe Hinweis in lib/legal.ts. Struktur und
 * Bausteine sind üblich, aber nicht anwaltlich geprüft.
 *
 * Pflichtseiten gehören nie in den Suchindex-Wettbewerb, aber sie müssen
 * erreichbar und crawlbar sein — deshalb hier `index: false`, aber kein
 * `nofollow` und kein Ausschluss in der robots.txt.
 */
export const metadata: Metadata = {
  title: "Impressum — jakob sax",
  alternates: { canonical: "/impressum" },
  robots: { index: false, follow: true },
};

export default function Impressum() {
  return (
    <LegalPage title="impressum." scope="impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <address className={styles.address}>
        {LEGAL.name}
        <br />
        {LEGAL.street ?? <Missing label="STRASSE" />}
        <br />
        {LEGAL.postalCity ?? <Missing label="PLZ UND ORT" />}
        <br />
        {LEGAL.country}
      </address>

      {/* Interner Hinweis, bewusst NICHT gerendert: § 5 DDG verlangt eine
          ladungsfähige Anschrift, ein Postfach genügt nicht. Für Journalisten
          heikel — siehe lib/legal.ts. */}

      <h2>Kontakt</h2>
      <address className={styles.address}>
        E-Mail: {LEGAL.email ?? <Missing label="E-MAIL" />}
        {LEGAL.phone && (
          <>
            <br />
            Telefon: {LEGAL.phone}
          </>
        )}
      </address>

      {/* Umsatzsteuer: § 5 DDG fordert die USt-IdNr. nur "soweit vorhanden".
          Gibt es keine, erscheint der Abschnitt gar nicht — ein Hinweis auf
          die Kleinunternehmerregelung ist hier NICHT nötig, der gehört auf
          Rechnungen. Siehe lib/legal.ts. */}
      {LEGAL.ustId && (
        <>
          <h2>Umsatzsteuer</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:{" "}
            {LEGAL.ustId}
          </p>
        </>
      )}

      {/* § 18 Abs. 2 MStV greift nur bei journalistisch-redaktionellen
          Angeboten. Ein reines Portfolio ist in der Regel keins — deshalb
          erscheint der Abschnitt nur, wenn `mstvResponsible` gesetzt ist.
          Sobald hier eigene Beiträge oder redaktionell aufbereitete
          Bildstrecken erscheinen, den Wert setzen. */}
      {LEGAL.mstvResponsible && (
        <>
          <h2>Verantwortlich für den Inhalt</h2>
          <p>Nach § 18 Abs. 2 Medienstaatsvertrag (MStV):</p>
          <address className={styles.address}>{LEGAL.mstvResponsible}</address>
        </>
      )}

      {/* Kein Abschnitt "Urheberrecht und Bildnachweise" mehr — auf Wunsch
          entfernt, damit das Impressum nur Pflichtangaben enthält.

          Der Inhalt ist aber nicht wertlos: Eine Rechtebehauptung wirkt dort,
          wo die Bilder stehen, ohnehin besser als in einer Rechtsseite, die
          niemand liest. Der richtige Ort ist die Detailseite einer Arbeit
          bzw. die Credits je Kachel. Falls der Absatz doch hierher soll:
          siehe Commit-Historie. */}

      {/* Kein Abschnitt zur Streitschlichtung — bewusst weggelassen, nicht
          vergessen. Zwei Gründe:

          1. § 36 Abs. 3 VSBG nimmt Unternehmer, die im Vorjahr zehn oder
             weniger Personen beschäftigt haben, von der Informationspflicht
             aus. Als Solo-Selbstständiger fällt Jakob darunter.
          2. Der früher übliche Verweis auf die OS-Plattform der EU beruhte
             auf der ODR-Verordnung und galt größenunabhängig. Die Plattform
             wurde im Juli 2025 eingestellt, die Verordnung aufgehoben.

          Es bleibt also keine Pflicht. Falls sich die Beschäftigtenzahl
          einmal ändert, wieder aufnehmen — aber nicht ungeprüft aus einem
          Muster-Impressum übernehmen. */}

      {/* Kein "Haftung für Links"-Absatz — bewusst weggelassen. Er ist nicht
          gefordert und bewirkt rechtlich nichts: Die Haftung für verlinkte
          Inhalte richtet sich nach dem Gesetz (§§ 7-10 DDG), unabhängig davon,
          was im Impressum steht. Der verbreitete Glaube, so ein Disclaimer
          schütze, geht auf ein missverstandenes Urteil aus den Neunzigern
          zurück. Nicht aus einer Vorlage wieder aufnehmen. */}
    </LegalPage>
  );
}
