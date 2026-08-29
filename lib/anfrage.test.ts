import { describe, expect, it } from "vitest";
import { LEERE_ANFRAGE, istGueltig, pruefe, type AnfrageFelder } from "./anfrage";

/**
 * Tests für die Validierung des Anfrageformulars.
 *
 * **Warum ausgerechnet hier:** Diese Regeln laufen an zwei Orten — im
 * Browser für die sofortige Rückmeldung und im Worker, weil auf
 * Browser-Validierung kein Verlass ist. Ein Fehler darin macht still
 * Anfragen kaputt: Entweder werden gültige abgewiesen oder unbrauchbare
 * durchgelassen. Beides merkt niemand, bis eine Buchung ausbleibt.
 */

function anfrage(felder: Partial<AnfrageFelder> = {}): AnfrageFelder {
  return { ...LEERE_ANFRAGE, ...felder };
}

const gueltig = {
  name: "Marie Beispiel",
  email: "marie@example.com",
  nachricht: "Wir suchen Fotografie für unser Festival im Juli.",
};

describe("pruefe", () => {
  it("lässt eine vollständige Anfrage durch", () => {
    expect(istGueltig(pruefe(anfrage(gueltig)))).toBe(true);
  });

  it("verlangt genau drei Felder — alles andere ist freiwillig", () => {
    // Datum, Ort, Anlass und Budget fehlen: trotzdem gültig. Jedes
    // zusätzliche Pflichtfeld kostet Anfragen.
    const fehler = pruefe(anfrage(gueltig));
    expect(Object.keys(fehler)).toHaveLength(0);
  });

  it("beanstandet fehlenden Namen, Adresse und Nachricht einzeln", () => {
    const fehler = pruefe(anfrage());
    expect(fehler.name).toBeTruthy();
    expect(fehler.email).toBeTruthy();
    expect(fehler.nachricht).toBeTruthy();
  });

  it("wertet reine Leerzeichen nicht als Eingabe", () => {
    const fehler = pruefe(anfrage({ ...gueltig, name: "   ", nachricht: "  " }));
    expect(fehler.name).toBeTruthy();
    expect(fehler.nachricht).toBeTruthy();
  });

  describe("E-Mail", () => {
    // Bewusst grob geprüft: Strenge Regeln weisen mehr gültige Adressen ab,
    // als sie ungültige fangen. Ob sie zustellbar ist, zeigt der Versand.
    it.each([
      "marie@example.com",
      "vorname.nachname@festival-rastatt.de",
      "a+b@x.co",
      "büro@jakobsax.de",
    ])("akzeptiert %s", (email) => {
      expect(pruefe(anfrage({ ...gueltig, email })).email).toBeUndefined();
    });

    it.each(["marie", "marie@", "@example.com", "marie@example", "a b@c.de"])(
      "weist %s ab",
      (email) => {
        expect(pruefe(anfrage({ ...gueltig, email })).email).toBeTruthy();
      }
    );
  });

  describe("Längenbegrenzungen", () => {
    it("weist eine überlange Nachricht ab", () => {
      const fehler = pruefe(anfrage({ ...gueltig, nachricht: "x".repeat(4001) }));
      expect(fehler.nachricht).toBeTruthy();
    });

    it("lässt eine Nachricht an der Grenze zu", () => {
      const fehler = pruefe(anfrage({ ...gueltig, nachricht: "x".repeat(4000) }));
      expect(fehler.nachricht).toBeUndefined();
    });

    it("weist einen überlangen Namen ab", () => {
      expect(pruefe(anfrage({ ...gueltig, name: "x".repeat(121) })).name).toBeTruthy();
    });

    it("beanstandet einen überlangen Ort, verlangt ihn aber nicht", () => {
      expect(pruefe(anfrage(gueltig)).ort).toBeUndefined();
      expect(pruefe(anfrage({ ...gueltig, ort: "x".repeat(121) })).ort).toBeTruthy();
    });
  });

  it("prüft das Honeypot-Feld NICHT — das ist Sache der Route", () => {
    // Die Validierung kennt nur Eingabefehler. Ein gefülltes Honeypot-Feld
    // ist kein Eingabefehler, sondern ein Bot — und wird in der Route mit
    // einem vorgetäuschten Erfolg beantwortet, damit er nichts lernt.
    const fehler = pruefe(anfrage({ ...gueltig, webseite: "http://spam" }));
    expect(istGueltig(fehler)).toBe(true);
  });
});
