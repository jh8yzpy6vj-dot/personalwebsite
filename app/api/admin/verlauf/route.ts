import { fehlerText, INHALT_PFAD, json } from "@/lib/admin/antwort";
import { verlauf } from "@/lib/admin/github";
import { githubZugang, umgebung } from "@/lib/admin/umgebung";
import { zugangOder404 } from "@/lib/admin/zugang";
import type { Verlauf } from "@/lib/admin/vertrag";

/**
 * `GET /api/admin/verlauf?anzahl=30` — die letzten Commits, die
 * `lib/inhalt.json` ändern. Grundlage für „Stand von … wiederherstellen".
 * Ohne GitHub: leere Liste.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;

  const gh = githubZugang(await umgebung());
  if (!gh) return json({ eintraege: [] } satisfies Verlauf);

  const gewuenscht = Number(new URL(request.url).searchParams.get("anzahl"));
  const anzahl = Number.isFinite(gewuenscht) && gewuenscht > 0 ? Math.min(50, gewuenscht) : 30;

  try {
    return json({ eintraege: await verlauf(gh, INHALT_PFAD, anzahl) } satisfies Verlauf);
  } catch (e) {
    console.error(`Verwaltung: Verlauf nicht ladbar (${fehlerText(e)})`);
    return json({ ok: false, text: fehlerText(e) }, 502);
  }
}
