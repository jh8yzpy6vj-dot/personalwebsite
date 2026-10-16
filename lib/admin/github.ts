import type { Lauf, VerlaufEintrag } from "./vertrag";

/**
 * **Zugriff auf GitHub** — die Verwaltung speichert, indem sie committet.
 *
 * Bewusst die blanke REST-API mit `fetch` statt Octokit: vier Aufrufe
 * rechtfertigen keine Abhängigkeit im Worker. `fetch` ist injizierbar, damit
 * die Tests ohne Netz laufen.
 *
 * ⚠️ **Das Repo ist öffentlich.** Commits aus der Verwaltung laufen deshalb
 * auf den Inhaber des Tokens — es wird **kein** `author`/`committer`
 * mitgeschickt. Mit Jakobs Adresse dort stünde sie für immer lesbar im
 * Git-Verlauf.
 *
 * ⚠️ **Der Token taucht in keiner Fehlermeldung auf.** Die Texte hier landen
 * bei Jakob im Browser und im Log des Workers.
 */

export type GithubKonfig = {
  token: string;
  /** `besitzer/repo` */
  repo: string;
  branch: string;
  /** Für Tests; sonst das globale `fetch`. */
  fetch?: typeof fetch;
};

const API = "https://api.github.com";
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const WORKFLOW = /^[A-Za-z0-9_.-]+\.ya?ml$/;
/** Ein Git-Ref: Branchname oder Commit-SHA — ohne `..`, Leerzeichen, Steuerzeichen. */
const REF = /^(?!.*\.\.)[A-Za-z0-9._/-]{1,200}$/;

/** GitHub hat die Anfrage abgelehnt; `text` ist für Jakob formuliert. */
export class GithubFehler extends Error {
  constructor(
    text: string,
    readonly status: number,
  ) {
    super(text);
    this.name = "GithubFehler";
  }
}

/**
 * Die Datei hat sich seit dem Laden geändert (andere `sha`). Kein Fehler im
 * eigentlichen Sinn: Jemand anderes — Jan im Code, Jakob im zweiten Tab —
 * war schneller. Die Verwaltung muss neu laden, statt still zu überschreiben.
 */
export class GithubKonflikt extends GithubFehler {
  constructor() {
    super("Die Datei wurde inzwischen an anderer Stelle geändert.", 409);
    this.name = "GithubKonflikt";
  }
}

// ---------------------------------------------------------------------------
// Base64 ⇄ UTF-8
// ---------------------------------------------------------------------------

/**
 * ⚠️ **`atob` liefert Bytes, keine Zeichen.** Wer das Ergebnis direkt als Text
 * nimmt, macht aus „ü" ein „Ã¼" — und schreibt es beim nächsten Speichern so
 * zurück. Erst Bytes, dann `TextDecoder`. Die Zeilenumbrüche, die GitHub alle
 * 60 Zeichen einstreut, müssen vorher raus.
 */
export function ausBase64(b64: string): string {
  const binaer = atob(b64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binaer.length);
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function nachBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binaer = "";
  // In Stücken: `String.fromCharCode(...riesigesArray)` sprengt den Stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binaer += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binaer);
}

// ---------------------------------------------------------------------------
// Anfragen
// ---------------------------------------------------------------------------

function pruefeKonfig(cfg: GithubKonfig): void {
  if (!REPO.test(cfg.repo)) throw new GithubFehler("GITHUB_REPO hat keine gültige Form.", 500);
  if (!REF.test(cfg.branch)) throw new GithubFehler("GITHUB_BRANCH hat keine gültige Form.", 500);
}

/** Pfad im Repo → URL-Teil. Jeder Abschnitt einzeln kodiert, `..` gibt es nicht. */
function pfadTeil(pfad: string): string {
  const teile = pfad.split("/");
  if (teile.some((t) => t === "" || t === "." || t === "..")) {
    throw new GithubFehler("Ungültiger Dateipfad.", 400);
  }
  return teile.map(encodeURIComponent).join("/");
}

async function anfrage(
  cfg: GithubKonfig,
  methode: string,
  pfad: string,
  rumpf?: unknown,
): Promise<Response> {
  pruefeKonfig(cfg);
  const holen = cfg.fetch ?? fetch;
  const kopf: Record<string, string> = {
    authorization: `Bearer ${cfg.token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    // GitHub verlangt einen User-Agent und weist Anfragen ohne ab.
    "user-agent": "jakobsax-verwaltung",
  };
  if (rumpf !== undefined) kopf["content-type"] = "application/json";
  try {
    return await holen(`${API}/repos/${cfg.repo}${pfad}`, {
      method: methode,
      headers: kopf,
      body: rumpf === undefined ? undefined : JSON.stringify(rumpf),
    });
  } catch {
    throw new GithubFehler("GitHub ist gerade nicht erreichbar. Bitte gleich noch einmal versuchen.", 502);
  }
}

/** GitHubs eigene Meldung, gekürzt — enthält nie den Token. */
async function meldung(antwort: Response): Promise<string> {
  try {
    const daten = (await antwort.clone().json()) as { message?: unknown };
    return typeof daten.message === "string" ? daten.message.slice(0, 200) : "";
  } catch {
    return "";
  }
}

async function fehlerAus(antwort: Response, was: string): Promise<GithubFehler> {
  const m = await meldung(antwort);
  const zusatz = m ? ` (GitHub: „${m}")` : "";
  switch (antwort.status) {
    case 401:
      return new GithubFehler(
        `${was}: GitHub lehnt den Zugang ab — der Token ist abgelaufen oder falsch.${zusatz}`,
        401,
      );
    case 403:
    case 429:
      return new GithubFehler(
        `${was}: GitHub verweigert die Aktion — fehlende Rechte des Tokens oder zu viele Anfragen.${zusatz}`,
        antwort.status,
      );
    case 404:
      return new GithubFehler(
        `${was}: nicht gefunden — Repo, Branch oder Rechte des Tokens prüfen.${zusatz}`,
        404,
      );
    default:
      return new GithubFehler(`${was}: GitHub antwortet mit ${antwort.status}.${zusatz}`, antwort.status);
  }
}

type DateiAntwort = { sha?: unknown; content?: unknown; encoding?: unknown; size?: unknown };

/**
 * Eine Datei lesen — Text und Blob-`sha`. `ref` ist Branch oder Commit;
 * ohne Angabe der konfigurierte Branch.
 *
 * Bis 1 MB liefert die Contents-API den Inhalt gleich mit. Darüber kommt
 * `encoding: "none"` und kein Inhalt — dann über die Blob-API nachladen
 * (dort bis 100 MB). Das Bild-Manifest wächst mit jedem Foto; es soll nicht
 * eines Tages still leer ankommen.
 */
export async function leseDatei(
  cfg: GithubKonfig,
  pfad: string,
  ref?: string,
): Promise<{ text: string; sha: string }> {
  const r = ref ?? cfg.branch;
  if (!REF.test(r)) throw new GithubFehler("Ungültiger Stand.", 400);
  const antwort = await anfrage(cfg, "GET", `/contents/${pfadTeil(pfad)}?ref=${encodeURIComponent(r)}`);
  if (!antwort.ok) throw await fehlerAus(antwort, `${pfad} lesen`);

  const daten = (await antwort.json()) as DateiAntwort;
  if (typeof daten.sha !== "string") throw new GithubFehler(`${pfad} ist keine Datei.`, 502);

  let b64: string;
  if (daten.encoding === "base64" && typeof daten.content === "string") {
    b64 = daten.content;
  } else {
    const blob = await anfrage(cfg, "GET", `/git/blobs/${encodeURIComponent(daten.sha)}`);
    if (!blob.ok) throw await fehlerAus(blob, `${pfad} lesen`);
    const roh = (await blob.json()) as DateiAntwort;
    if (roh.encoding !== "base64" || typeof roh.content !== "string") {
      throw new GithubFehler(`${pfad} kam in unbekannter Form an.`, 502);
    }
    b64 = roh.content;
  }

  try {
    return { text: ausBase64(b64), sha: daten.sha };
  } catch {
    throw new GithubFehler(`${pfad} ist kein gültiger UTF-8-Text.`, 502);
  }
}

/**
 * Eine Datei schreiben = ein Commit auf den Branch. `sha` ist die Blob-SHA,
 * auf der die Änderung aufbaut; passt sie nicht mehr, wirft das
 * `GithubKonflikt`.
 */
export async function schreibeDatei(
  cfg: GithubKonfig,
  pfad: string,
  text: string,
  sha: string,
  nachricht: string,
): Promise<{ sha: string; commit: string }> {
  const antwort = await anfrage(cfg, "PUT", `/contents/${pfadTeil(pfad)}`, {
    message: nachricht,
    content: nachBase64(text),
    branch: cfg.branch,
    // Ohne sha legt GitHub die Datei neu an — und lehnt ab, weil sie existiert.
    // Genau das soll passieren (→ Konflikt), wenn kein Stand von main geladen war.
    ...(sha ? { sha } : {}),
    // ⚠️ Kein author/committer — siehe Kopf dieser Datei.
  });

  if (antwort.status === 409) throw new GithubKonflikt();
  if (antwort.status === 422) {
    const m = (await meldung(antwort)).toLowerCase();
    if (m.includes("sha") || m.includes("does not match")) throw new GithubKonflikt();
  }
  if (!antwort.ok) throw await fehlerAus(antwort, `${pfad} speichern`);

  const daten = (await antwort.json()) as {
    content?: { sha?: unknown };
    commit?: { sha?: unknown };
  };
  if (typeof daten.content?.sha !== "string" || typeof daten.commit?.sha !== "string") {
    throw new GithubFehler(`${pfad} speichern: unerwartete Antwort von GitHub.`, 502);
  }
  return { sha: daten.content.sha, commit: daten.commit.sha };
}

type CommitRoh = {
  sha?: unknown;
  author?: { login?: unknown } | null;
  commit?: {
    message?: unknown;
    author?: { name?: unknown; date?: unknown } | null;
    committer?: { date?: unknown } | null;
  };
};

function alsEintrag(c: CommitRoh): VerlaufEintrag | null {
  if (typeof c.sha !== "string") return null;
  const nachricht = typeof c.commit?.message === "string" ? c.commit.message : "";
  const datum = c.commit?.committer?.date ?? c.commit?.author?.date;
  const autor =
    typeof c.author?.login === "string"
      ? c.author.login
      : typeof c.commit?.author?.name === "string"
        ? c.commit.author.name
        : "";
  return {
    commit: c.sha,
    datum: typeof datum === "string" ? datum : "",
    // ⚠️ Nur Name bzw. Login — die E-Mail aus dem Commit bleibt draußen.
    autor,
    // Die erste Zeile genügt; darunter steht nur der Hinweis auf die Verwaltung.
    nachricht: nachricht.split("\n")[0],
  };
}

/** Die letzten Commits, die `pfad` ändern, neueste zuerst. */
export async function verlauf(
  cfg: GithubKonfig,
  pfad: string,
  anzahl: number,
): Promise<VerlaufEintrag[]> {
  const n = Math.min(100, Math.max(1, Math.floor(anzahl) || 1));
  pfadTeil(pfad); // nur zur Prüfung — der Pfad geht hier als Abfrageparameter mit
  const abfrage = new URLSearchParams({ path: pfad, sha: cfg.branch, per_page: String(n) });
  const antwort = await anfrage(cfg, "GET", `/commits?${abfrage}`);
  if (!antwort.ok) throw await fehlerAus(antwort, "Verlauf laden");
  const daten = (await antwort.json()) as unknown;
  if (!Array.isArray(daten)) return [];
  return daten.map((c) => alsEintrag(c as CommitRoh)).filter((e): e is VerlaufEintrag => e !== null);
}

/** Ein einzelner Commit — für das Datum beim Wiederherstellen. */
export async function holeCommit(cfg: GithubKonfig, commit: string): Promise<VerlaufEintrag> {
  if (!REF.test(commit)) throw new GithubFehler("Ungültiger Stand.", 400);
  const antwort = await anfrage(cfg, "GET", `/commits/${encodeURIComponent(commit)}`);
  if (!antwort.ok) throw await fehlerAus(antwort, "Stand laden");
  const eintrag = alsEintrag((await antwort.json()) as CommitRoh);
  if (!eintrag) throw new GithubFehler("Stand laden: unerwartete Antwort von GitHub.", 502);
  return eintrag;
}

/** Eine Action von Hand anstoßen (`workflow_dispatch`). */
export async function starteWorkflow(cfg: GithubKonfig, datei: string, ref: string): Promise<void> {
  if (!WORKFLOW.test(datei)) throw new GithubFehler("Ungültiger Workflow-Name.", 400);
  if (!REF.test(ref)) throw new GithubFehler("Ungültiger Branch.", 400);
  const antwort = await anfrage(cfg, "POST", `/actions/workflows/${encodeURIComponent(datei)}/dispatches`, {
    ref,
  });
  if (!antwort.ok) throw await fehlerAus(antwort, "Verarbeitung starten");
}

/** Die letzten Läufe einer Action, neueste zuerst. */
export async function laeufe(cfg: GithubKonfig, datei: string, anzahl: number): Promise<Lauf[]> {
  if (!WORKFLOW.test(datei)) throw new GithubFehler("Ungültiger Workflow-Name.", 400);
  const n = Math.min(100, Math.max(1, Math.floor(anzahl) || 1));
  const antwort = await anfrage(
    cfg,
    "GET",
    `/actions/workflows/${encodeURIComponent(datei)}/runs?per_page=${n}`,
  );
  if (!antwort.ok) throw await fehlerAus(antwort, "Verarbeitung abfragen");
  const daten = (await antwort.json()) as { workflow_runs?: unknown };
  const liste = Array.isArray(daten.workflow_runs) ? daten.workflow_runs : [];
  const ergebnis: Lauf[] = [];
  for (const roh of liste) {
    const l = roh as Record<string, unknown>;
    if (typeof l.id !== "number") continue;
    const gestartet = l.run_started_at ?? l.created_at;
    ergebnis.push({
      id: l.id,
      status: typeof l.status === "string" ? l.status : "",
      ergebnis: typeof l.conclusion === "string" ? l.conclusion : null,
      gestartet: typeof gestartet === "string" ? gestartet : "",
      url: typeof l.html_url === "string" ? l.html_url : "",
    });
  }
  return ergebnis;
}
