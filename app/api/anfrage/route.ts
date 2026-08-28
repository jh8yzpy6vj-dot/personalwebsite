import { BESCHRIFTUNG, LEERE_ANFRAGE, istGueltig, pruefe, type AnfrageFelder } from "@/lib/anfrage";
import { sendeMail } from "@/lib/mailer";

/**
 * Endpunkt für das Anfrageformular.
 *
 * Läuft im Worker, nicht statisch — deshalb die Laufzeitangabe unten.
 *
 * **Regel:** Der Anfragende erfährt immer, woran es lag. Eine stillschweigend
 * verschluckte Anfrage ist der schlimmste Ausgang — der Absender glaubt,
 * er habe geschrieben, und wartet auf eine Antwort, die nie kommt.
 */
export const runtime = "edge";
export const dynamic = "force-dynamic";

/** Mindestzeit zwischen Seitenaufruf und Absenden. Bots sind schneller. */
const MIN_SEKUNDEN = 3;

function antwort(status: number, daten: Record<string, unknown>) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  let roh: unknown;
  try {
    roh = await request.json();
  } catch {
    return antwort(400, { fehler: "Die Anfrage war nicht lesbar." });
  }

  const eingabe = roh as Partial<AnfrageFelder> & { gestartet?: number };
  const felder: AnfrageFelder = { ...LEERE_ANFRAGE };
  for (const schluessel of Object.keys(LEERE_ANFRAGE) as (keyof AnfrageFelder)[]) {
    const wert = eingabe[schluessel];
    felder[schluessel] = typeof wert === "string" ? wert.trim() : "";
  }

  /*
   * Spam-Grundschutz, zweistufig. Beide Fälle antworten bewusst mit einem
   * Erfolg: Wer automatisiert absendet, soll nicht erfahren, woran es
   * gescheitert ist — sonst wird die Prüfung umgangen.
   */
  if (felder.webseite) return antwort(200, { ok: true });

  const gestartet = typeof eingabe.gestartet === "number" ? eingabe.gestartet : 0;
  if (gestartet && (Date.now() - gestartet) / 1000 < MIN_SEKUNDEN) {
    return antwort(200, { ok: true });
  }

  // Erneut prüfen, obwohl das Formular es schon tut: Auf Browser-Validierung
  // ist kein Verlass, Anfragen können direkt hierher gehen.
  const fehler = pruefe(felder);
  if (!istGueltig(fehler)) return antwort(422, { fehler: "Bitte prüfen Sie die Angaben.", felder: fehler });

  const zeilen = (Object.keys(BESCHRIFTUNG) as (keyof AnfrageFelder)[])
    .filter((k) => k !== "webseite" && felder[k])
    .map((k) => `${BESCHRIFTUNG[k]}: ${felder[k]}`);

  const ergebnis = await sendeMail(
    {
      betreff: `Anfrage über jakobsax.de — ${felder.name}`,
      text: zeilen.join("\n"),
      antwortAn: felder.email,
    },
    process.env as Record<string, string | undefined>
  );

  if (ergebnis.ok) return antwort(200, { ok: true });

  // 503, nicht 500: Der Dienst ist nicht verfügbar bzw. nicht eingerichtet —
  // an der Anfrage selbst liegt es nicht. Die Meldung nennt den Ausweg.
  return antwort(503, {
    fehler:
      ergebnis.grund === "nicht_konfiguriert"
        ? "Der Versand ist noch nicht eingerichtet. Bitte schreiben Sie mir direkt eine E-Mail."
        : "Die Anfrage konnte gerade nicht zugestellt werden. Bitte versuchen Sie es später noch einmal oder schreiben Sie mir direkt.",
  });
}
