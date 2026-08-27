import type { Metadata } from "next";
import LegalPage, { Missing, legalStyles as styles } from "../components/LegalPage";
import { LEGAL } from "@/lib/legal";

/**
 * Datenschutzerklärung nach DSGVO.
 *
 * ⚠️ KEINE RECHTSBERATUNG — siehe Hinweis in lib/legal.ts.
 *
 * ⚠️ **Wichtigste Regel für diese Datei: Sie beschreibt ausschließlich, was
 * tatsächlich passiert.** Eine Datenschutzerklärung, die Verarbeitungen
 * aufführt, die es gar nicht gibt, ist genauso falsch wie eine, die welche
 * verschweigt — und sie macht es später unmöglich zu erkennen, was wirklich
 * läuft.
 *
 * **Noch NICHT enthalten, weil noch nicht umgesetzt** (siehe TODO.md) —
 * beim Umsetzen jeweils hier ergänzen:
 * - Cloudflare Web Analytics (cookielos, aber verarbeitet Daten)
 * - Anfrageformular inkl. Versanddienstleister (Resend/Postmark)
 * - Cloudflare Turnstile (Spam-Schutz)
 * Für die externen Dienste wird jeweils ein Auftragsverarbeitungsvertrag
 * gebraucht, der hier zu nennen ist.
 */
export const metadata: Metadata = {
  title: "Datenschutz — jakob sax",
  alternates: { canonical: "/datenschutz" },
  robots: { index: false, follow: true },
};

export default function Datenschutz() {
  return (
    <LegalPage title="datenschutz." scope="datenschutz">
      <h2>Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
      <address className={styles.address}>
        {LEGAL.name}
        <br />
        {LEGAL.street ?? <Missing label="STRASSE" />}
        <br />
        {LEGAL.postalCity ?? <Missing label="PLZ UND ORT" />}
        <br />
        E-Mail: {LEGAL.email ?? <Missing label="E-MAIL" />}
      </address>

      <h2>Grundsatz</h2>
      <p>
        Diese Website ist bewusst datensparsam gebaut. Sie setzt{" "}
        <strong>keine Cookies</strong>, bindet <strong>keine Werbenetzwerke</strong>{" "}
        ein und verwendet <strong>keine Tracking-Dienste</strong>. Es gibt
        keine Nutzerkonten und keine Registrierung.
      </p>

      <h2>Server-Logfiles beim Aufruf der Website</h2>
      <p>
        Beim Aufruf dieser Seite werden durch den Hosting-Anbieter technisch
        notwendige Daten verarbeitet, ohne die eine Auslieferung der Seite
        nicht möglich wäre:
      </p>
      <ul>
        <li>IP-Adresse des anfragenden Geräts</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>aufgerufene Adresse und übertragene Datenmenge</li>
        <li>Browsertyp und Betriebssystem</li>
      </ul>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte
        Interesse liegt im sicheren und stabilen Betrieb der Website. Eine
        Zusammenführung dieser Daten mit anderen Datenquellen findet nicht
        statt.
      </p>

      <h2>Hosting</h2>
      <p>
        Die Website wird bei {LEGAL.host.name}, {LEGAL.host.address}, betrieben.
        Der Anbieter verarbeitet die oben genannten Daten in unserem Auftrag
        auf Grundlage eines Auftragsverarbeitungsvertrags nach Art. 28 DSGVO.
      </p>
      <p>
        Dabei kann es zu einer Übermittlung in die USA kommen. Der Anbieter
        stützt sich hierfür auf die Standardvertragsklauseln der Europäischen
        Kommission sowie auf seine Zertifizierung nach dem EU-US Data Privacy
        Framework. Weitere Informationen finden Sie in der{" "}
        <a href={LEGAL.host.privacyUrl} rel="noreferrer">
          Datenschutzerklärung des Anbieters
        </a>
        .
      </p>

      <h2>Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten werden{" "}
        <strong>vom eigenen Server ausgeliefert</strong>. Beim Aufruf dieser
        Seite wird <strong>keine Verbindung zu Google-Servern</strong> oder
        anderen externen Anbietern von Schriftarten aufgebaut. Es werden
        dadurch keine Daten an Dritte übertragen.
      </p>

      {/* Kein eigener Abschnitt zu HTTPS — weggelassen. Verschlüsselte
          Auslieferung ist seit Jahren Selbstverständlichkeit und keine
          Informationspflicht nach DSGVO. Der Absatz stand in Mustertexten
          aus einer Zeit, in der HTTPS noch die Ausnahme war. */}

      <h2>Kontaktaufnahme</h2>
      <p>
        Wenn Sie mich per E-Mail kontaktieren, werden Ihre Angaben zur
        Bearbeitung der Anfrage und für den Fall von Anschlussfragen
        gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern
        die Anfrage der Anbahnung oder Durchführung eines Vertrags dient,
        andernfalls Art. 6 Abs. 1 lit. f DSGVO aufgrund des berechtigten
        Interesses an der Beantwortung.
      </p>
      <p>
        Diese Daten gebe ich nicht ohne Ihre Einwilligung weiter. Ich lösche
        sie, sobald sie für den Zweck der Verarbeitung nicht mehr erforderlich
        sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>Hinweise an mich als Journalist</h2>
      <p>
        Erhalte ich Hinweise im Rahmen meiner journalistischen Tätigkeit,
        behandle ich diese vertraulich und nenne niemanden ohne vorherige
        Absprache. Für journalistisch-redaktionelle Zwecke gelten zudem die
        besonderen Regelungen des Medienprivilegs (Art. 85 DSGVO in Verbindung
        mit den landesrechtlichen Vorschriften), die den Schutz von Quellen
        sicherstellen.
      </p>

      <h2>Ihre Rechte</h2>
      <p>Sie haben jederzeit das Recht:</p>
      <ul>
        <li>Auskunft über Ihre gespeicherten Daten zu verlangen (Art. 15 DSGVO)</li>
        <li>deren Berichtigung zu verlangen (Art. 16 DSGVO)</li>
        <li>deren Löschung zu verlangen (Art. 17 DSGVO)</li>
        <li>die Verarbeitung einschränken zu lassen (Art. 18 DSGVO)</li>
        <li>Ihre Daten in einem übertragbaren Format zu erhalten (Art. 20 DSGVO)</li>
        <li>
          der Verarbeitung zu widersprechen, soweit sie auf einem berechtigten
          Interesse beruht (Art. 21 DSGVO)
        </li>
      </ul>
      <p>
        Wenden Sie sich dafür an die oben genannte Adresse. Unabhängig davon
        steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu, etwa
        bei{" "}
        <a href={LEGAL.supervisoryAuthority.url} rel="noreferrer">
          {LEGAL.supervisoryAuthority.name}
        </a>
        .
      </p>

      {/* Kein Abschnitt "Änderungen dieser Erklärung" — weggelassen. Er sagt
          nur, dass ein geänderter Text geändert wird, und das "Stand"-Datum
          unter dem Fließtext leistet dasselbe in einer Zeile. */}
    </LegalPage>
  );
}
