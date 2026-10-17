import { leseBegrenzt, nichtGefunden } from "@/lib/admin/antwort";
import { umgebung } from "@/lib/admin/umgebung";
import {
  neueSitzung,
  passwortAus,
  passwortRichtig,
  pruefeHerkunft,
  setzeCookie,
} from "@/lib/admin/zugang";

/**
 * `POST /api/admin/anmelden` — das Formular auf `/admin` schickt das
 * Passwort hierher (`application/x-www-form-urlencoded`, Feld `passwort`).
 * Stimmt es, setzt die Antwort das Sitzungs-Cookie; in beiden Fällen geht
 * es per 303 zurück nach `/admin`, bei falschem Passwort mit `?falsch=1`.
 */
export const dynamic = "force-dynamic";

/** Ein Passwort braucht keine 4 KB. */
const MAX_RUMPF = 4 * 1024;
/** Bremse je Fehlversuch (ms) — macht Durchprobieren langsam, stört Jakob nicht. */
const FEHLVERSUCH_PAUSE = 1500;

function zurueck(request: Request, falsch: boolean, cookie?: string): Response {
  const ziel = new URL(falsch ? "/admin?falsch=1" : "/admin", request.url);
  const headers = new Headers({ location: ziel.toString(), "cache-control": "no-store" });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(request: Request): Promise<Response> {
  const passwort = passwortAus(await umgebung());
  if (!passwort) return nichtGefunden();
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;

  const rumpf = await leseBegrenzt(request, MAX_RUMPF);
  const eingabe = rumpf
    ? (new URLSearchParams(new TextDecoder().decode(rumpf)).get("passwort") ?? "")
    : "";

  if (eingabe === "" || !(await passwortRichtig(eingabe, passwort))) {
    console.warn("Verwaltung: Anmeldung mit falschem Passwort");
    await new Promise((fertig) => setTimeout(fertig, FEHLVERSUCH_PAUSE));
    return zurueck(request, true);
  }
  const sitzung = await neueSitzung(passwort, Math.floor(Date.now() / 1000));
  return zurueck(request, false, setzeCookie(sitzung));
}
