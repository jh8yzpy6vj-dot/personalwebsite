import {
  betreffAus,
  istJson,
  json,
  leseBegrenzt,
  NICHT_EINGERICHTET,
  speichereInhalt,
} from "@/lib/admin/antwort";
import { githubZugang, umgebung } from "@/lib/admin/umgebung";
import { pruefeHerkunft, zugangOder404 } from "@/lib/admin/zugang";
import type { SpeichernAntwort } from "@/lib/admin/vertrag";

/**
 * `POST /api/admin/speichern` — Inhalt prüfen und als Commit auf `main`
 * schreiben. Cloudflare baut danach von selbst.
 */
export const dynamic = "force-dynamic";

/** `lib/inhalt.json` hat heute rund 30 kB; 1 MB ist Luft für Jahre, kein Einfallstor. */
const MAX_RUMPF = 1024 * 1024;

/** Blob-SHA von GitHub — oder leer, wenn ohne GitHub geladen wurde. */
const SHA = /^([0-9a-f]{40}|)$/;

function abgelehnt(text: string, status: number): Response {
  return json({ ok: false, grund: "ungueltig", text } satisfies SpeichernAntwort, status);
}

export async function POST(request: Request): Promise<Response> {
  const email = await zugangOder404(request);
  if (email instanceof Response) return email;
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;

  const gh = githubZugang(await umgebung());
  if (!gh) return json(NICHT_EINGERICHTET, 503);

  if (!istJson(request)) return abgelehnt("Erwartet wird JSON.", 415);
  const rumpf = await leseBegrenzt(request, MAX_RUMPF);
  if (!rumpf) return abgelehnt("Die Daten sind zu groß.", 413);

  let anfrage: unknown;
  try {
    anfrage = JSON.parse(new TextDecoder().decode(rumpf));
  } catch {
    return abgelehnt("Die Daten sind kein gültiges JSON.", 400);
  }
  if (typeof anfrage !== "object" || anfrage === null) {
    return abgelehnt("Die Daten haben nicht die erwartete Form.", 400);
  }
  const { inhalt, sha, nachricht } = anfrage as Record<string, unknown>;
  if (typeof sha !== "string" || !SHA.test(sha)) {
    return abgelehnt("Der geladene Stand fehlt — bitte die Seite neu laden.", 400);
  }

  return speichereInhalt(gh, inhalt, sha, betreffAus(nachricht));
}
