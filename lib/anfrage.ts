/**
 * Anfrageformular — Felder, Validierung und Typen.
 *
 * Bewusst **geteilt zwischen Browser und Worker**: Dieselben Regeln laufen
 * im Formular (für sofortige Rückmeldung) und in der Route (weil auf
 * Browser-Validierung kein Verlass ist — Anfragen können direkt an den
 * Endpunkt gehen). Zwei getrennte Regelsätze würden auseinanderlaufen.
 */

/**
 * Budgetrahmen als Auswahl statt Freitext. Beantwortet die Preisfrage,
 * ohne dass ein Preis festgelegt sein muss — und liefert Jakob Marktdaten,
 * bevor er sich auf einen Tagessatz festlegt (siehe TODO.md).
 *
 * „weiß ich noch nicht" ist ausdrücklich dabei: Ohne diese Option klicken
 * Unsichere irgendetwas an, und die Angabe wird wertlos.
 */
export const BUDGET_BAENDER = [
  "weiß ich noch nicht",
  "unter 500 €",
  "500 – 1.500 €",
  "über 1.500 €",
] as const;

export const ANLAESSE = [
  "Festival / Straßentheater",
  "Bühne / Aufführung",
  "Film / Aftermovie",
  "Filmworkshop",
  "etwas anderes",
] as const;

export type AnfrageFelder = {
  anlass: string;
  datum: string;
  ort: string;
  budget: string;
  nachricht: string;
  name: string;
  email: string;
  /** Honeypot — muss leer bleiben. Für Menschen unsichtbar. */
  webseite: string;
};

export const LEERE_ANFRAGE: AnfrageFelder = {
  anlass: "",
  datum: "",
  ort: "",
  budget: "",
  nachricht: "",
  name: "",
  email: "",
  webseite: "",
};

/** Feldname → Fehlermeldung. Leeres Objekt heißt gültig. */
export type Fehler = Partial<Record<keyof AnfrageFelder, string>>;

const MAX = { name: 120, email: 200, ort: 120, nachricht: 4000 } as const;

/**
 * Pflicht sind nur Name, E-Mail und Nachricht. Jedes zusätzliche
 * Pflichtfeld kostet Anfragen — Datum, Ort, Anlass und Budget helfen beim
 * Einordnen, sind aber kein Grund, jemanden abzuweisen.
 */
export function pruefe(f: AnfrageFelder): Fehler {
  const fehler: Fehler = {};

  if (!f.name.trim()) fehler.name = "Bitte tragen Sie Ihren Namen ein.";
  else if (f.name.length > MAX.name) fehler.name = "Das ist zu lang.";

  if (!f.email.trim()) {
    fehler.email = "Ohne Adresse kann ich nicht antworten.";
  } else if (f.email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    // Bewusst grob: Strenge E-Mail-Regeln weisen mehr gültige Adressen ab,
    // als sie ungültige fangen. Ob sie zustellbar ist, zeigt der Versand.
    fehler.email = "Diese Adresse sieht nicht vollständig aus.";
  }

  if (!f.nachricht.trim()) {
    fehler.nachricht = "Worum geht es? Zwei Sätze genügen.";
  } else if (f.nachricht.length > MAX.nachricht) {
    fehler.nachricht = "Das ist zu lang — bitte kürzen.";
  }

  if (f.ort.length > MAX.ort) fehler.ort = "Das ist zu lang.";

  return fehler;
}

export function istGueltig(fehler: Fehler): boolean {
  return Object.keys(fehler).length === 0;
}

/** Beschriftungen an einer Stelle, damit Formular und E-Mail übereinstimmen. */
export const BESCHRIFTUNG: Record<keyof AnfrageFelder, string> = {
  anlass: "Art der Veranstaltung",
  datum: "Datum",
  ort: "Ort",
  budget: "Budgetrahmen",
  nachricht: "Nachricht",
  name: "Name",
  email: "E-Mail",
  webseite: "Webseite",
};
