/**
 * Rechtliche Pflichtangaben für Impressum und Datenschutzerklärung.
 *
 * ⚠️ **KEINE RECHTSBERATUNG.** Struktur und Textbausteine folgen den
 * üblichen Anforderungen (§ 5 DDG, § 18 Abs. 2 MStV, DSGVO), sind aber
 * **nicht anwaltlich geprüft**. Vor dem Livegang von jemandem gegenlesen
 * lassen, der das darf — besonders die Frage der ladungsfähigen Anschrift
 * und der journalistisch-redaktionellen Verantwortung.
 *
 * ⚠️ **Alle personenbezogenen Werte sind `null`.** Nichts hier erfinden —
 * ein Impressum mit erfundener Anschrift ist schlimmer als keines. Solange
 * Werte fehlen, zeigen die Seiten an der Stelle eine sichtbare Lücke.
 */

/**
 * Steht auf `false`, solange Pflichtangaben fehlen. Steuert den Hinweis
 * oben auf beiden Rechtsseiten.
 *
 * **Auf `true` setzen**, wenn alle `null`-Werte unten gefüllt sind und
 * jemand mit juristischem Sachverstand drübergeschaut hat.
 */
export const LEGAL_DATA_COMPLETE = false;

export const LEGAL = {
  /** Vollständiger Name des Diensteanbieters. */
  name: "Jakob Sax",

  /**
   * Ladungsfähige Anschrift — Pflicht nach § 5 DDG, ein Postfach genügt
   * nicht. ⚠️ Für Journalisten ein sensibler Punkt: Die Privatadresse wird
   * damit öffentlich. Übliche Lösungen sind eine Geschäftsadresse, ein
   * Coworking-Space oder ein Anbieter für ladungsfähige Adressen.
   */
  street: null as string | null,
  postalCity: null as string | null,
  country: "Deutschland",

  /** Kontakt — E-Mail ist Pflicht, Telefon üblich, aber nicht zwingend. */
  email: null as string | null,
  phone: null as string | null,

  /**
   * Umsatzsteuer-Identifikationsnummer nach § 27a UStG (Format: `DE` + neun
   * Ziffern), alternativ die Wirtschafts-Identifikationsnummer nach § 139c AO.
   *
   * § 5 DDG fordert sie nur **„soweit vorhanden"**. Ist keine da — etwa bei
   * der Kleinunternehmerregelung nach § 19 UStG —, bleibt der Wert `null`
   * und das Impressum zeigt den Abschnitt gar nicht erst an. Es muss dann
   * auch **kein** Hinweis auf § 19 UStG dastehen: Der gehört auf Rechnungen,
   * nicht ins Impressum.
   *
   * ⚠️ **Niemals die normale Steuernummer eintragen.** Die ist nicht
   * gefordert, und sie zu veröffentlichen ist ein unnötiges Risiko. Gemeint
   * ist ausschließlich die USt-IdNr.
   */
  ustId: null as string | null,

  /**
   * Verantwortlich für journalistisch-redaktionelle Inhalte nach
   * § 18 Abs. 2 MStV — mit Name und Anschrift.
   *
   * ⚠️ **Erst klären, ob das überhaupt greift.** Ein reines Portfolio ist
   * in der Regel kein journalistisch-redaktionelles Angebot. Sobald die
   * Seite aber eigene Beiträge, Reportagen oder redaktionell aufbereitete
   * Bildstrecken veröffentlicht, kann die Pflicht entstehen. Im Zweifel
   * angeben — es schadet nicht.
   */
  mstvResponsible: null as string | null,

  /**
   * Zuständige Datenschutz-Aufsichtsbehörde. Richtet sich nach dem
   * Wohn-/Geschäftssitz — bei Rastatt oder Stuttgart ist es Baden-Württemberg.
   * ⚠️ Anpassen, falls die Anschrift in einem anderen Bundesland liegt.
   */
  supervisoryAuthority: {
    name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg",
    url: "https://www.baden-wuerttemberg.datenschutz.de",
  },

  /**
   * Hoster. Bestimmt, was in der Datenschutzerklärung zur Verarbeitung von
   * Server-Logs und IP-Adressen steht.
   */
  host: {
    name: "Cloudflare, Inc.",
    address: "101 Townsend St., San Francisco, CA 94107, USA",
    privacyUrl: "https://www.cloudflare.com/privacypolicy/",
  },

  /** Datum der letzten inhaltlichen Änderung an den Rechtstexten. */
  lastUpdated: "2026-08-27",
} as const;

/**
 * Sammelt die noch fehlenden Pflichtangaben — für den Hinweis oben auf
 * beiden Seiten, damit niemand raten muss, was genau noch offen ist.
 *
 * `scope` grenzt auf die Angaben ein, die auf der jeweiligen Seite auch
 * wirklich gebraucht werden: Die Umsatzsteuer-Angabe ist eine Pflicht des
 * Impressums und hat auf der Datenschutzseite nichts zu suchen.
 */
export function missingLegalFields(
  // Aktuell fordern beide Seiten dieselben zwei Angaben. Der Parameter bleibt,
  // weil sich das mit weiteren Pflichtfeldern wieder unterscheiden kann.
  _scope: "impressum" | "datenschutz"
): string[] {
  const missing: string[] = [];
  if (!LEGAL.street || !LEGAL.postalCity) missing.push("ladungsfähige Anschrift");
  if (!LEGAL.email) missing.push("E-Mail-Adresse");
  // USt-IdNr. und § 18 Abs. 2 MStV stehen bewusst NICHT hier: Beide sind nur
  // bedingt Pflicht, ihr Fehlen ist ein gültiger Zustand. Die betreffenden
  // Abschnitte erscheinen im Impressum nur, wenn ein Wert gesetzt ist.
  return missing;
}
