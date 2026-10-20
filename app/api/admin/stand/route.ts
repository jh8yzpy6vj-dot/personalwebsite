import { BILDER, type Bildquelle } from "@/lib/bilder";
import { INHALT, type Inhalt } from "@/lib/inhalt";
import { fehlerText, INHALT_PFAD, json, logText, MANIFEST_PFAD } from "@/lib/admin/antwort";
import { leseDatei } from "@/lib/admin/github";
import { githubZugang, konfiguration, umgebung } from "@/lib/admin/umgebung";
import { zugangOder404 } from "@/lib/admin/zugang";
import type { Stand } from "@/lib/admin/vertrag";

/**
 * `GET /api/admin/stand` — alles, was die Verwaltung zum Start braucht.
 *
 * Mit GitHub kommen Inhalt und Manifest **von `main`**, nicht aus dem
 * laufenden Build: Zwischen Speichern und fertigem Deploy liegen ein, zwei
 * Minuten, und wer in der Zeit neu lädt, soll seine eigene Änderung sehen —
 * nicht den Stand davor, auf dem er dann weiterarbeitet.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ohneZugang = await zugangOder404(request);
  if (ohneZugang) return ohneZugang;

  const u = await umgebung();
  const gh = githubZugang(u);

  let inhalt: Inhalt = INHALT;
  let bilder: Record<string, Bildquelle> = BILDER;
  let sha = "";

  if (gh) {
    /*
     * ⚠️ Kein stiller Rückfall auf den Build-Stand: Mit `sha: ""` könnte
     * Jakob dann zwar arbeiten, aber nie speichern — und merkte es erst
     * nach getaner Arbeit. Lieber gleich sagen, dass etwas nicht stimmt.
     */
    let datei: { text: string; sha: string };
    let manifest: { text: string; sha: string };
    try {
      [datei, manifest] = await Promise.all([leseDatei(gh, INHALT_PFAD), leseDatei(gh, MANIFEST_PFAD)]);
    } catch (e) {
      console.error(`Verwaltung: Stand nicht ladbar (${logText(e)})`);
      return json({ ok: false, grund: "github", text: fehlerText(e) }, 502);
    }
    /* Eine kaputte Datei auf main (etwa Konfliktmarker nach einem Merge von
       Hand) blockiert die ganze Verwaltung — dann soll wenigstens dastehen,
       welche und an wen man sich wendet. */
    const werte: unknown[] = [];
    for (const [pfad, text] of [
      [INHALT_PFAD, datei.text],
      [MANIFEST_PFAD, manifest.text],
    ]) {
      try {
        werte.push(JSON.parse(text));
      } catch (e) {
        console.error(`Verwaltung: ${pfad} auf main ist kein gültiges JSON (${logText(e)})`);
        return json(
          { ok: false, grund: "github", text: `${pfad} auf GitHub ist kein gültiges JSON — bitte Jan Bescheid geben.` },
          502,
        );
      }
    }
    inhalt = werte[0] as Inhalt;
    bilder = werte[1] as Record<string, Bildquelle>;
    sha = datei.sha;
  }

  const stand: Stand = {
    inhalt,
    sha,
    bilder,
    konfiguration: konfiguration(u),
    live: process.env.BUILD_COMMIT || null,
  };
  return json(stand);
}
