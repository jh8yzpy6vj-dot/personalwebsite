import { pruefeHerkunft, setzeCookie } from "@/lib/admin/zugang";

/**
 * `POST /api/admin/abmelden` — löscht das Sitzungs-Cookie und geht zurück
 * nach `/admin` (dort steht dann wieder die Anmeldung).
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/admin", request.url).toString(),
      "cache-control": "no-store",
      "set-cookie": setzeCookie(""),
    },
  });
}
