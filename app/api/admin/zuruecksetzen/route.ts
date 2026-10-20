import {
  fehlerText,
  INHALT_PFAD,
  istJson,
  json,
  leseBegrenzt,
  logText,
  NICHT_EINGERICHTET,
  speichereInhalt,
} from "@/lib/admin/antwort";
import { holeCommit, leseDatei } from "@/lib/admin/github";
import { githubZugang, umgebung } from "@/lib/admin/umgebung";
import { pruefeHerkunft, zugangOder404 } from "@/lib/admin/zugang";
import { COMMIT, type SpeichernAntwort } from "@/lib/admin/vertrag";

/**
 * `POST /api/admin/zuruecksetzen` — `lib/inhalt.json` aus einem älteren
 * Commit als **neuen** Commit wiederherstellen.
 *
 * Bewusst kein `git revert` und kein Zurücksetzen des Branches: Der Verlauf
 * bleibt vollständig, und auch das Wiederherstellen lässt sich wieder
 * rückgängig machen. Geprüft wird der alte Stand wie jeder andere — die
 * Regeln können sich seitdem geändert haben. Die Papierkorb-Daten setzt
 * `speichereInhalt` neu: Was mit dem alten Stand zurück in den Papierkorb
 * kommt, bekommt wieder volle 30 Tage, statt sofort abzulaufen.
 */
export const dynamic = "force-dynamic";

const SHA = /^([0-9a-f]{40}|)$/;

/** Für 422: Beim Wiederherstellen gibt es nichts zu „korrigieren". */
function passtNicht(n: number): string {
  return (
    `Dieser alte Stand passt nicht mehr zu den heutigen Regeln (${n} ${n === 1 ? "Punkt" : "Punkte"}) ` +
    "und lässt sich nicht direkt zurückholen. Gib Jan Bescheid."
  );
}

function abgelehnt(text: string, status: number): Response {
  return json({ ok: false, grund: "ungueltig", text } satisfies SpeichernAntwort, status);
}

/** „17.10.2026, 14:05" — in deutscher Zeit, so wie Jakob den Stand in der Liste sieht. */
function alsDatum(iso: string): string {
  const zeit = new Date(iso);
  if (Number.isNaN(zeit.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(zeit);
}

export async function POST(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;
  const fremd = pruefeHerkunft(request);
  if (fremd) return fremd;

  const gh = githubZugang(await umgebung());
  if (!gh) return json(NICHT_EINGERICHTET, 503);

  if (!istJson(request)) return abgelehnt("Erwartet wird JSON.", 415);
  const rumpf = await leseBegrenzt(request, 16 * 1024);
  if (!rumpf) return abgelehnt("Die Daten sind zu groß.", 413);

  let anfrage: unknown;
  try {
    anfrage = JSON.parse(new TextDecoder().decode(rumpf));
  } catch {
    return abgelehnt("Die Daten sind kein gültiges JSON.", 400);
  }
  const { commit, sha } = (typeof anfrage === "object" && anfrage !== null ? anfrage : {}) as Record<
    string,
    unknown
  >;
  if (typeof commit !== "string" || !COMMIT.test(commit)) {
    return abgelehnt("Unbekannter Stand.", 400);
  }
  if (typeof sha !== "string" || !SHA.test(sha)) {
    return abgelehnt("Der geladene Stand fehlt — bitte die Seite neu laden.", 400);
  }

  let text: string;
  let datum: string;
  try {
    const [datei, eintrag] = await Promise.all([leseDatei(gh, INHALT_PFAD, commit), holeCommit(gh, commit)]);
    text = datei.text;
    datum = alsDatum(eintrag.datum);
  } catch (e) {
    console.error(`Verwaltung: alter Stand nicht ladbar (${logText(e)})`);
    return json({ ok: false, grund: "github", text: fehlerText(e) } satisfies SpeichernAntwort, 502);
  }

  let alt: unknown;
  try {
    alt = JSON.parse(text);
  } catch (e) {
    console.error(`Verwaltung: alter Stand ${commit} ist kein gültiges JSON (${logText(e)})`);
    return abgelehnt("Dieser alte Stand ist beschädigt und lässt sich nicht zurückholen.", 422);
  }

  return speichereInhalt(gh, alt, sha, `Stand vom ${datum} wiederhergestellt`, passtNicht);
}
