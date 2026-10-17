import { json } from "@/lib/admin/antwort";
import { zugangOder404 } from "@/lib/admin/zugang";
import type { Live } from "@/lib/admin/vertrag";

/**
 * `GET /api/admin/live` — aus welchem Commit die laufende Seite gebaut ist.
 * Die Verwaltung vergleicht das mit dem Commit ihrer letzten Speicherung und
 * meldet „ist online", sobald beide übereinstimmen.
 *
 * `BUILD_COMMIT` setzt `next.config.mjs` beim Build fest ein — der Wert
 * gehört zum Build, nicht zur Laufzeit-Umgebung.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;
  return json({ commit: process.env.BUILD_COMMIT || null } satisfies Live);
}
