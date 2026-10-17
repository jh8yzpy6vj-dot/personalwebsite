import { fehlerText, json } from "@/lib/admin/antwort";
import { liste, ohneEndung } from "@/lib/admin/eingang";
import { laeufe } from "@/lib/admin/github";
import { eingangZugang, githubZugang, umgebung } from "@/lib/admin/umgebung";
import { zugangOder404 } from "@/lib/admin/zugang";
import type { Lauf, Verarbeitung } from "@/lib/admin/vertrag";

/**
 * `GET /api/admin/verarbeitung` — was im Eingang wartet und wie die letzten
 * Läufe der Medien-Action ausgingen. Die Verwaltung fragt das regelmäßig ab,
 * solange etwas in Arbeit ist.
 *
 * Was nicht eingerichtet ist, liefert eine leere Liste. Auch ein Fehler bei
 * einer der beiden Quellen leert nur deren Liste: Die Anzeige ist eine
 * Statusmeldung, kein Grund, die ganze Verwaltung anzuhalten.
 */
export const dynamic = "force-dynamic";

const MEDIEN_WORKFLOW = "medien.yml";

export async function GET(request: Request): Promise<Response> {
  const email = await zugangOder404(request);
  if (email instanceof Response) return email;

  const u = await umgebung();
  const gh = githubZugang(u);
  const eingang = eingangZugang(u);

  const [wartend, letzte] = await Promise.all([
    eingang
      ? liste(eingang).then(
          (keys) => [...new Set(keys.map(ohneEndung))].sort(),
          (e: unknown) => {
            console.error(`Verwaltung: Eingang nicht lesbar (${fehlerText(e)})`);
            return [] as string[];
          },
        )
      : Promise.resolve([] as string[]),
    gh
      ? laeufe(gh, MEDIEN_WORKFLOW, 10).catch((e: unknown) => {
          console.error(`Verwaltung: Läufe nicht lesbar (${fehlerText(e)})`);
          return [] as Lauf[];
        })
      : Promise.resolve([] as Lauf[]),
  ]);

  return json({ wartend, laeufe: letzte } satisfies Verarbeitung);
}
