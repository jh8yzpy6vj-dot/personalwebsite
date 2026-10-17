import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Konfiguration } from "./vertrag";
import type { GithubKonfig } from "./github";
import type { EingangKonfig } from "./eingang";

/**
 * **Die Einstellungen der Verwaltung** — Secrets und Variablen des Workers.
 *
 * Gelesen wird zuerst aus der Worker-Umgebung (`getCloudflareContext`), dann
 * aus `process.env`. Zwei Quellen, weil es zwei Laufwege gibt: Im Worker
 * stehen die im Dashboard gesetzten Werte in `env`; unter `next dev` gibt es
 * keinen Cloudflare-Kontext (der Aufruf wirft), dort kommen sie aus
 * `.env.local` bzw. der Shell.
 *
 * ⚠️ **Nichts von hier geht je an den Browser.** Die Routen geben nur die
 * abgeleitete `Konfiguration` (zwei Wahrheitswerte) heraus — nie einen Wert.
 */

/** Die Namen sind verbindlich; so stehen sie im Cloudflare-Dashboard. */
const NAMEN = [
  "ADMIN_PASSWORT",
  "ADMIN_DEV",
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
    // Kein Worker (next dev, Tests) — dann allein process.env.
  }
  return umgebungAus(worker, process.env);
}

/** GitHub-Zugang, oder `null`, solange kein Token gesetzt ist. */
export function githubZugang(u: Umgebung): GithubKonfig | null {
  if (!u.GITHUB_TOKEN) return null;
  return { token: u.GITHUB_TOKEN, repo: u.GITHUB_REPO, branch: u.GITHUB_BRANCH };
}

/** Eingangs-Bucket, oder `null`, solange eine der vier Angaben fehlt. */
export function eingangZugang(u: Umgebung): EingangKonfig | null {
  if (
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
  return { github: githubZugang(u) !== null, eingang: eingangZugang(u) !== null };
}
