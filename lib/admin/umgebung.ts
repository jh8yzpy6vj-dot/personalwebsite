import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Konfiguration } from "./vertrag";
import type { GithubKonfig } from "./github";
import type { EingangKonfig } from "./eingang";

/**
 * **Die Einstellungen der Verwaltung** — Secrets und Variablen des Workers.
 *
 * Gelesen wird zuerst aus der Worker-Umgebung (`getCloudflareContext`), dann
 * aus `process.env`. Zwei Quellen, weil es zwei Laufwege gibt: Im Worker
 * stehen die im Dashboard gesetzten Werte in `env`. Unter `next dev` holt
 * `getCloudflareContext` sich `env` über Wrangler — mit den Werten aus
 * `.dev.vars` (die gewinnen) —, alles Übrige kommt aus `.env*.local` bzw.
 * der Shell. Ohne Kontext (Tests, oder Wrangler startet nicht) wirft der
 * Aufruf, dann gilt allein `process.env`.
 *
 * ⚠️ **Nichts von hier geht je an den Browser.** Die Routen geben nur die
 * abgeleitete `Konfiguration` (zwei Wahrheitswerte) heraus — nie einen Wert.
 * Einzige Ausnahme, und nur unter `next dev`: Repo und Branch, auf die
 * Speichern schreibt (`entwicklung`) — beides kein Geheimnis.
 */

/** Die Namen sind verbindlich; so stehen sie im Cloudflare-Dashboard. */
const NAMEN = [
  "ADMIN_PASSWORT",
  "ADMIN_DEV",
  "ADMIN_DEV_SCHREIBEN",
  "GITHUB_TOKEN",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
  "R2_ACCOUNT_ID",
  "R2_JURISDICTION",
  "EINGANG_BUCKET",
  "EINGANG_ACCESS_KEY_ID",
  "EINGANG_SECRET_ACCESS_KEY",
] as const;

export type Umgebung = Record<(typeof NAMEN)[number], string | undefined> & {
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
};

export const STANDARD_REPO = "jh8yzpy6vj-dot/personalwebsite";
export const STANDARD_BRANCH = "main";

/** Leere Zeichenkette zählt als „nicht gesetzt" — so sieht ein im Dashboard geleertes Feld aus. */
function wert(w: unknown): string | undefined {
  if (typeof w !== "string") return undefined;
  const getrimmt = w.trim();
  return getrimmt === "" ? undefined : getrimmt;
}

/** Baut die Umgebung aus zwei Quellen; `worker` gewinnt. Rein, damit testbar. */
export function umgebungAus(
  worker: Record<string, unknown>,
  prozess: Record<string, string | undefined>,
): Umgebung {
  const roh = {} as Record<(typeof NAMEN)[number], string | undefined>;
  for (const name of NAMEN) roh[name] = wert(worker[name]) ?? wert(prozess[name]);
  return {
    ...roh,
    GITHUB_REPO: roh.GITHUB_REPO ?? STANDARD_REPO,
    GITHUB_BRANCH: roh.GITHUB_BRANCH ?? STANDARD_BRANCH,
  };
}

export async function umgebung(): Promise<Umgebung> {
  let worker: Record<string, unknown> = {};
  try {
    const kontext = await getCloudflareContext({ async: true });
    worker = kontext.env as unknown as Record<string, unknown>;
  } catch {
    // Kein Worker-Kontext (Tests, Wrangler startet nicht) — dann allein process.env.
  }
  return umgebungAus(worker, process.env);
}

/** Läuft das unter `next dev`? Im Produktionsbuild setzt Next `NODE_ENV` fest auf "production". */
const entwicklungsserver = () => process.env.NODE_ENV === "development";

/**
 * ⚠️ **Unter `next dev` wird nur mit ausdrücklicher Freigabe geschrieben**
 * (`ADMIN_DEV_SCHREIBEN=1`) — weder auf GitHub noch in den Eingang. Ein
 * `GITHUB_TOKEN` oder die Eingangs-Schlüssel stehen schnell einmal in der
 * Shell oder in `.dev.vars` (in Agenten-Containern sogar von selbst), und
 * dann committete ein Klick auf „Speichern“ beim Ausprobieren auf `main`,
 * und ein hochgeladenes Testbild verarbeitete die nächste Medien-Action —
 * beides geht live. Gilt für jeden `next dev`, nicht nur mit `ADMIN_DEV=1`:
 * Auch wer lokal die echte Anmeldung ausprobiert, soll nicht aus Versehen
 * schreiben.
 */
const entwicklungOhneFreigabe = (u: Umgebung) => entwicklungsserver() && u.ADMIN_DEV_SCHREIBEN !== "1";

/** GitHub-Zugang, oder `null`, solange kein Token gesetzt ist (unter `next dev`: siehe oben). */
export function githubZugang(u: Umgebung): GithubKonfig | null {
  if (!u.GITHUB_TOKEN || entwicklungOhneFreigabe(u)) return null;
  return { token: u.GITHUB_TOKEN, repo: u.GITHUB_REPO, branch: u.GITHUB_BRANCH };
}

/** Eingangs-Bucket, oder `null`, solange eine der vier Angaben fehlt (unter `next dev`: siehe oben). */
export function eingangZugang(u: Umgebung): EingangKonfig | null {
  if (
    entwicklungOhneFreigabe(u) ||
    !u.R2_ACCOUNT_ID ||
    !u.EINGANG_BUCKET ||
    !u.EINGANG_ACCESS_KEY_ID ||
    !u.EINGANG_SECRET_ACCESS_KEY
  ) {
    return null;
  }
  return {
    konto: u.R2_ACCOUNT_ID,
    jurisdiktion: u.R2_JURISDICTION,
    bucket: u.EINGANG_BUCKET,
    schluesselId: u.EINGANG_ACCESS_KEY_ID,
    geheimnis: u.EINGANG_SECRET_ACCESS_KEY,
  };
}

/** Was eingerichtet ist — das Einzige aus der Umgebung, das der Browser erfährt. */
export function konfiguration(u: Umgebung): Konfiguration {
  const github = githubZugang(u);
  const k: Konfiguration = { github: github !== null, eingang: eingangZugang(u) !== null };
  // Schreibt ein Entwicklungsserver echt, soll man sehen, wohin.
  if (github && entwicklungsserver()) k.entwicklung = `${github.repo}@${github.branch}`;
  return k;
}
