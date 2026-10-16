import { fehlerText, json } from "@/lib/admin/antwort";
import { starteWorkflow } from "@/lib/admin/github";
import { githubZugang, umgebung } from "@/lib/admin/umgebung";
import { pruefeHerkunft, zugangOder404 } from "@/lib/admin/zugang";
import type { VerarbeitenAntwort } from "@/lib/admin/vertrag";

/**
 * `POST /api/admin/verarbeiten` — die Medien-Action anstoßen. Sie holt die
 * Bilder aus dem Eingang, entfernt die Metadaten, rechnet die Varianten und
 * committet das Manifest; daraufhin baut Cloudflare.
 */
export const dynamic = "force-dynamic";

/** Muss so heißen wie die Datei unter `.github/workflows/`. */
const MEDIEN_WORKFLOW = "medien.yml";

export async function POST(request: Request): Promise<Response> {
  const email = await zugangOder404(request);
  if (email instanceof Response) return email;
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;

  const gh = githubZugang(await umgebung());
  if (!gh) {
    return json(
      {
        ok: false,
        text: "Verarbeiten ist noch nicht eingerichtet (GitHub-Zugang fehlt). Bitte Jan Bescheid geben.",
      } satisfies VerarbeitenAntwort,
      503,
    );
  }

  try {
    await starteWorkflow(gh, MEDIEN_WORKFLOW, gh.branch);
  } catch (e) {
    console.error(`Verwaltung: Verarbeitung nicht gestartet (${fehlerText(e)})`);
    return json({ ok: false, text: fehlerText(e) } satisfies VerarbeitenAntwort, 502);
  }
  return json({ ok: true } satisfies VerarbeitenAntwort);
}
