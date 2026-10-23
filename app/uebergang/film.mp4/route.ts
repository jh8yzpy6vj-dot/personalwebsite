import { getCloudflareContext } from "@opennextjs/cloudflare";
import { bereich } from "@/lib/bereich";
import { UEBERGANG_DATEI } from "@/lib/uebergang";

/**
 * `GET /uebergang/film.mp4` — die Übergangsfassung des Videos oben
 * (`lib/uebergang.ts`), **mit `Range`**.
 *
 * ⚠️ Warum nicht einfach die Datei aus `public/`: Die statischen Dateien
 * des Workers beantworten `Range` nicht (immer 200 mit allem, im lokalen
 * Worker nachgeprüft). Safari und jedes iPhone spielen ein Video aber nur,
 * wenn der Server Teile liefert (206) — sonst bliebe dort das Standbild
 * stehen. Hier wird die Datei über die Bindung `ASSETS` geholt und der
 * verlangte Teil herausgeschnitten. 7 MB im Speicher sind für den Worker
 * kein Problem; der Bucket kann das von selbst, sobald das Video dort liegt.
 */
export const dynamic = "force-dynamic";

async function datei(request: Request): Promise<Response> {
  const adresse = new URL(UEBERGANG_DATEI, request.url);
  try {
    const { env } = await getCloudflareContext({ async: true });
    const assets = (env as unknown as { ASSETS?: { fetch: (u: string) => Promise<Response> } }).ASSETS;
    if (assets) return await assets.fetch(adresse.toString());
  } catch {
    // Kein Worker-Kontext (`next dev`) — dann liefert der Entwicklungsserver die Datei selbst.
  }
  return fetch(adresse);
}

async function antworte(request: Request, mitRumpf: boolean): Promise<Response> {
  const quelle = await datei(request);
  if (!quelle.ok) return new Response("Nicht gefunden.", { status: 404 });
  const bytes = new Uint8Array(await quelle.arrayBuffer());
  const kopf = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    // Die Adresse trägt einen Fingerabdruck (`?v=`) — ändert sich die Datei, ändert sie sich mit.
    "cache-control": "public, max-age=31536000, immutable",
  };
  const teil = bereich(request.headers.get("range"), bytes.length);
  if (teil === "ungueltig") {
    return new Response(null, { status: 416, headers: { ...kopf, "content-range": `bytes */${bytes.length}` } });
  }
  const { von, bis } = teil ?? { von: 0, bis: bytes.length - 1 };
  const stueck = bytes.subarray(von, bis + 1);
  return new Response(mitRumpf ? stueck : null, {
    status: teil ? 206 : 200,
    headers: {
      ...kopf,
      "content-length": String(stueck.length),
      ...(teil ? { "content-range": `bytes ${von}-${bis}/${bytes.length}` } : {}),
    },
  });
}

export function GET(request: Request): Promise<Response> {
  return antworte(request, true);
}

export function HEAD(request: Request): Promise<Response> {
  return antworte(request, false);
}
