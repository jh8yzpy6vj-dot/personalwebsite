import { fehlerText, json, leseBegrenzt, logText } from "@/lib/admin/antwort";
import { erkenneBildtyp, legeAb } from "@/lib/admin/eingang";
import { eingangZugang, umgebung } from "@/lib/admin/umgebung";
import { pruefeHerkunft, zugangOder404 } from "@/lib/admin/zugang";
import { BILDTYPEN, MAX_UPLOAD_BYTES, ZIEL, type HochladenAntwort } from "@/lib/admin/vertrag";

/**
 * `PUT /api/admin/hochladen?ziel=<schluessel>` — ein Bild in den privaten
 * Eingangs-Bucket legen. Der Rumpf ist die Datei selbst, kein Formular:
 * So muss der Worker nichts zerlegen und hält die Datei nur einmal im
 * Speicher.
 *
 * Verarbeitet wird hier nichts — das macht die Medien-Action, sobald die
 * Verwaltung `verarbeiten` aufruft (Metadaten weg, Varianten rechnen).
 */
export const dynamic = "force-dynamic";

function abgelehnt(text: string, status: number): Response {
  return json({ ok: false, text } satisfies HochladenAntwort, status);
}

export async function PUT(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;

  const eingang = eingangZugang(await umgebung());
  if (!eingang) {
    return abgelehnt("Hochladen ist noch nicht eingerichtet (Bildspeicher fehlt). Bitte Jan Bescheid geben.", 503);
  }

  /*
   * ⚠️ Das Ziel wird zum Dateinamen im Bucket. Nur was exakt auf `ZIEL`
   * passt, geht durch — kein `..`, kein führender Schrägstrich, keine
   * fremden Ordner.
   */
  const ziel = new URL(request.url).searchParams.get("ziel") ?? "";
  if (!ZIEL.test(ziel)) return abgelehnt("Unbekanntes Ziel für das Bild.", 400);

  const typ = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const endung = BILDTYPEN[typ];
  if (!endung) return abgelehnt("Nur JPEG, PNG, WebP oder TIFF.", 415);

  const megabyte = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);
  const angegeben = Number(request.headers.get("content-length"));
  if (Number.isFinite(angegeben) && angegeben > MAX_UPLOAD_BYTES) {
    return abgelehnt(`Die Datei ist größer als ${megabyte} MB.`, 413);
  }

  // Zweite Prüfung beim Lesen: Content-Length kann fehlen oder lügen.
  const bytes = await leseBegrenzt(request, MAX_UPLOAD_BYTES);
  if (!bytes) return abgelehnt(`Die Datei ist größer als ${megabyte} MB.`, 413);
  if (bytes.byteLength === 0) return abgelehnt("Die Datei ist leer.", 400);

  // Der Inhalt muss zum angegebenen Typ passen — sonst stimmt die Endung nicht.
  if (erkenneBildtyp(bytes) !== typ) {
    return abgelehnt("Die Datei ist kein Bild dieses Typs (oder beschädigt).", 415);
  }

  try {
    await legeAb(eingang, `${ziel}.${endung}`, bytes, typ);
  } catch (e) {
    console.error(`Verwaltung: Hochladen fehlgeschlagen (${logText(e)})`);
    return abgelehnt(fehlerText(e), 502);
  }
  return json({ ok: true, schluessel: ziel } satisfies HochladenAntwort);
}
