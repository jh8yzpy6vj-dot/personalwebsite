import { fehlerText, INHALT_PFAD, json, logText, NICHT_EINGERICHTET } from "@/lib/admin/antwort";
import { leseDatei, verlauf } from "@/lib/admin/github";
import { githubZugang, umgebung } from "@/lib/admin/umgebung";
import { zugangOder404 } from "@/lib/admin/zugang";
import { COMMIT, type Verlauf, type VerlaufStand } from "@/lib/admin/vertrag";

/**
 * `GET /api/admin/verlauf?anzahl=30` — die letzten Commits, die
 * `lib/inhalt.json` ändern. Grundlage für „Stand von … wiederherstellen".
 * Ohne GitHub: leere Liste.
 *
 * `GET /api/admin/verlauf?commit=<sha>` — `lib/inhalt.json` aus diesem
 * Commit, damit Jakob **vor** dem Wiederherstellen sieht, was sich ändert.
 * Dieselbe Commit-Regel wie in `zuruecksetzen` (nur Hex, kein Branchname).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;

  const gh = githubZugang(await umgebung());
  const abfrage = new URL(request.url).searchParams;
  const commit = abfrage.get("commit");

  if (commit !== null) {
    if (!gh) return json(NICHT_EINGERICHTET, 503);
    if (!COMMIT.test(commit)) return json({ ok: false, text: "Unbekannter Stand." }, 400);
    let text: string;
    try {
      text = (await leseDatei(gh, INHALT_PFAD, commit)).text;
    } catch (e) {
      console.error(`Verwaltung: alter Stand nicht ladbar (${logText(e)})`);
      return json({ ok: false, text: fehlerText(e) }, 502);
    }
    try {
      return json({ inhalt: JSON.parse(text) as unknown } satisfies VerlaufStand);
    } catch (e) {
      console.error(`Verwaltung: alter Stand ${commit} ist kein gültiges JSON (${logText(e)})`);
      return json({ ok: false, text: "Dieser alte Stand ist beschädigt und lässt sich nicht zurückholen." }, 422);
    }
  }

  if (!gh) return json({ eintraege: [] } satisfies Verlauf);

  const gewuenscht = Number(abfrage.get("anzahl"));
  const anzahl = Number.isFinite(gewuenscht) && gewuenscht > 0 ? Math.min(50, gewuenscht) : 30;

  try {
    return json({ eintraege: await verlauf(gh, INHALT_PFAD, anzahl) } satisfies Verlauf);
  } catch (e) {
    console.error(`Verwaltung: Verlauf nicht ladbar (${logText(e)})`);
    return json({ ok: false, text: fehlerText(e) }, 502);
  }
}
