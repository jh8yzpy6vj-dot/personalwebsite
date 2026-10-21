import { AwsClient } from "aws4fetch";

/**
 * **Der private Eingangs-Bucket** — hier landen hochgeladene Bilder, bevor
 * die Medien-Action (`.github/workflows/medien.yml`) sie verarbeitet.
 *
 * Warum nicht gleich in den öffentlichen Bucket: Fotos aus der Kamera tragen
 * GPS-Koordinaten und Seriennummern. Was im öffentlichen Bucket liegt, ist
 * sofort abrufbar — auch, bevor jemand die Metadaten entfernt hat. Der
 * Eingang ist privat; erst die Action legt eine bereinigte Fassung nach
 * `original/`.
 *
 * Gesprochen wird S3 über `aws4fetch`, wie in `scripts/r2.mjs`. Jenes Modul
 * lässt sich hier nicht wiederverwenden: Es liest `.dev.vars` über `node:fs`
 * und läuft nur lokal.
 */

export type EingangKonfig = {
  /** Cloudflare-Konto-ID (`R2_ACCOUNT_ID`). */
  konto: string;
  /** Kürzel wie `eu`, falls der Bucket mit Jurisdiction angelegt wurde. */
  jurisdiktion?: string;
  bucket: string;
  schluesselId: string;
  geheimnis: string;
  /** Für Tests; sonst das globale `fetch`. */
  fetch?: typeof fetch;
};

/** Ein Fehler beim Bucket; `text` ist für Jakob formuliert und frei von Zugangsdaten. */
export class EingangFehler extends Error {
  constructor(
    text: string,
    readonly status: number,
  ) {
    super(text);
    this.name = "EingangFehler";
  }
}

const KONTO = /^[A-Za-z0-9]{1,64}$/;
const JURISDIKTION = /^[a-z]{2,8}$/;
const BUCKET = /^[a-z0-9][a-z0-9-]{1,62}$/;

/**
 * Die S3-Adresse des Buckets, Pfad-Stil (`/<bucket>`).
 *
 * ⚠️ Mit Jurisdiction ist der Endpunkt ein anderer
 * (`<konto>.eu.r2.cloudflarestorage.com`) — ohne das `.eu.` geht jede
 * Anfrage ins Leere. Ausführlich in `scripts/r2.mjs`, `endpunkt()`.
 */
export function bucketAdresse(cfg: EingangKonfig): string {
  if (!KONTO.test(cfg.konto)) throw new EingangFehler("R2_ACCOUNT_ID hat keine gültige Form.", 500);
  if (!BUCKET.test(cfg.bucket)) throw new EingangFehler("EINGANG_BUCKET hat keine gültige Form.", 500);
  const j = cfg.jurisdiktion?.trim().toLowerCase();
  if (j && !JURISDIKTION.test(j)) throw new EingangFehler("R2_JURISDICTION hat keine gültige Form.", 500);
  return `https://${cfg.konto}${j ? `.${j}` : ""}.r2.cloudflarestorage.com/${cfg.bucket}`;
}

function client(cfg: EingangKonfig): AwsClient {
  return new AwsClient({
    accessKeyId: cfg.schluesselId,
    secretAccessKey: cfg.geheimnis,
    service: "s3",
    region: "auto",
  });
}

/**
 * Signiert und schickt. Signiert wird ohne Prüfsumme des Rumpfs
 * (`UNSIGNED-PAYLOAD`, Standard von aws4fetch bei S3): 40 MB zu hashen
 * kostete im Worker spürbar Rechenzeit, und TLS schützt den Inhalt ohnehin.
 */
async function sende(cfg: EingangKonfig, adresse: string, init: RequestInit): Promise<Response> {
  const anfrage = await client(cfg).sign(adresse, init);
  try {
    return await (cfg.fetch ?? fetch)(anfrage);
  } catch {
    throw new EingangFehler("Der Bildspeicher ist gerade nicht erreichbar.", 502);
  }
}

/** Schlüssel → URL-Pfad. Jeder Abschnitt einzeln kodiert; Prüfung auf `ZIEL` macht der Aufrufer. */
function schluesselTeil(key: string): string {
  const teile = key.split("/");
  if (teile.some((t) => t === "" || t === "." || t === "..")) {
    throw new EingangFehler("Ungültiger Dateiname.", 400);
  }
  return teile.map(encodeURIComponent).join("/");
}

/** Eine Datei in den Eingang legen. Gleicher Schlüssel = ersetzt. */
export async function legeAb(
  cfg: EingangKonfig,
  key: string,
  bytes: ArrayBuffer | Uint8Array<ArrayBuffer>,
  typ: string,
): Promise<void> {
  const antwort = await sende(cfg, `${bucketAdresse(cfg)}/${schluesselTeil(key)}`, {
    method: "PUT",
    body: bytes,
    headers: { "content-type": typ },
  });
  if (!antwort.ok) {
    // ⚠️ Den Rumpf nicht weiterreichen: S3-Fehler-XML nennt u. a. die Access-Key-ID.
    throw new EingangFehler(`Hochladen in den Bildspeicher fehlgeschlagen (${antwort.status}).`, 502);
  }
}

/**
 * Eine Datei aus dem Eingang löschen („Verwerfen"). Gab es sie nicht mehr,
 * ist das kein Fehler — das Ziel ist erreicht.
 */
export async function entferne(cfg: EingangKonfig, key: string): Promise<void> {
  const antwort = await sende(cfg, `${bucketAdresse(cfg)}/${schluesselTeil(key)}`, { method: "DELETE" });
  if (!antwort.ok && antwort.status !== 404) {
    // ⚠️ Den Rumpf nicht weiterreichen: S3-Fehler-XML nennt u. a. die Access-Key-ID.
    throw new EingangFehler(`Löschen im Bildspeicher fehlgeschlagen (${antwort.status}).`, 502);
  }
}

function entschluessele(xml: string): string {
  return xml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Alle Schlüssel im Eingang. Blättert selbst: S3 liefert höchstens 1000 je
 * Antwort — ohne Blättern fehlten danach still welche.
 */
export async function liste(cfg: EingangKonfig): Promise<string[]> {
  const keys: string[] = [];
  let weiter: string | undefined;
  let runden = 0;

  do {
    const u = new URL(bucketAdresse(cfg));
    u.searchParams.set("list-type", "2");
    if (weiter) u.searchParams.set("continuation-token", weiter);

    const antwort = await sende(cfg, u.toString(), { method: "GET" });
    if (!antwort.ok) {
      throw new EingangFehler(`Bildspeicher auflisten fehlgeschlagen (${antwort.status}).`, 502);
    }
    const xml = await antwort.text();

    for (const eintrag of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = eintrag[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1];
      if (key && !key.endsWith("/")) keys.push(entschluessele(key));
    }

    const gekuerzt = xml.match(/<IsTruncated>(true|false)<\/IsTruncated>/)?.[1] === "true";
    const token = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
    weiter = gekuerzt && token ? entschluessele(token) : undefined;
    // Notbremse gegen einen Fortsetzungspunkt, der nie endet.
    runden++;
  } while (weiter && runden < 100);

  return keys;
}

/** `arbeiten/x/01.jpg` → `arbeiten/x/01` — so heißen die Bilder überall sonst. */
export function ohneEndung(key: string): string {
  return key.replace(/\.[A-Za-z0-9]{1,5}$/, "");
}

/**
 * Welcher Bildtyp steckt wirklich in den Bytes? Nach den ersten Bytes der
 * Datei („Magic Bytes"), nicht nach dem, was der Browser behauptet.
 *
 * ⚠️ `Content-Type` setzt der Absender selbst. Ohne diese Prüfung ließe sich
 * eine beliebige Datei als „image/jpeg" in den Eingang legen, und die
 * Pipeline würde sie anfassen.
 */
export function erkenneBildtyp(bytes: Uint8Array): string | null {
  const b = (i: number) => bytes[i];
  const ascii = (von: number, text: string) =>
    [...text].every((z, i) => bytes[von + i] === z.charCodeAt(0));

  if (bytes.length >= 3 && b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (bytes.length >= 4 && b(0) === 0x89 && ascii(1, "PNG")) return "image/png";
  if (bytes.length >= 12 && ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (bytes.length >= 4 && ascii(0, "II") && b(2) === 0x2a && b(3) === 0x00) return "image/tiff";
  if (bytes.length >= 4 && ascii(0, "MM") && b(2) === 0x00 && b(3) === 0x2a) return "image/tiff";
  return null;
}
