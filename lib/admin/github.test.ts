import { describe, expect, it } from "vitest";
import {
  ausBase64,
  GithubFehler,
  GithubKonflikt,
  laeufe,
  leseBlob,
  leseDatei,
  nachBase64,
  schreibeDatei,
  starteWorkflow,
  verlauf,
  type GithubKonfig,
} from "./github";

type Aufruf = { url: string; methode: string; kopf: Headers; rumpf: unknown };

/** Ein Fake-GitHub: zeichnet Aufrufe auf und antwortet nach `antworte`. */
function fake(antworte: (a: Aufruf) => Response | Promise<Response>) {
  const aufrufe: Aufruf[] = [];
  const holen = (async (url: string, init: RequestInit = {}) => {
    const a: Aufruf = {
      url,
      methode: init.method ?? "GET",
      kopf: new Headers(init.headers),
      rumpf: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    };
    aufrufe.push(a);
    return antworte(a);
  }) as unknown as typeof fetch;
  const cfg: GithubKonfig = { token: "ghp_GEHEIM", repo: "besitzer/repo", branch: "main", fetch: holen };
  return { cfg, aufrufe };
}

const json = (daten: unknown, status = 200) =>
  new Response(JSON.stringify(daten), { status, headers: { "content-type": "application/json" } });

const TEXT = '{\n  "titel": "„Grüße“ – Café, Straße, ÄÖÜ ß 🎞"\n}\n';

describe("Base64", () => {
  it("überlebt Umlaute, Anführungszeichen und Emoji in beide Richtungen", () => {
    expect(ausBase64(nachBase64(TEXT))).toBe(TEXT);
  });

  it("verträgt die Zeilenumbrüche, die GitHub einstreut", () => {
    const b64 = nachBase64(TEXT).replace(/(.{20})/g, "$1\n");
    expect(ausBase64(b64)).toBe(TEXT);
  });
});

describe("leseDatei", () => {
  it("liest Text und sha, mit den richtigen Headern", async () => {
    const { cfg, aufrufe } = fake(() =>
      json({ sha: "a".repeat(40), encoding: "base64", content: nachBase64(TEXT) }),
    );
    expect(await leseDatei(cfg, "lib/inhalt.json")).toEqual({ text: TEXT, sha: "a".repeat(40) });

    const [a] = aufrufe;
    expect(a.url).toBe("https://api.github.com/repos/besitzer/repo/contents/lib/inhalt.json?ref=main");
    expect(a.kopf.get("authorization")).toBe("Bearer ghp_GEHEIM");
    expect(a.kopf.get("accept")).toBe("application/vnd.github+json");
    expect(a.kopf.get("x-github-api-version")).toBe("2022-11-28");
    expect(a.kopf.get("user-agent")).toBe("jakobsax-verwaltung");
  });

  it("liest an einem bestimmten Commit", async () => {
    const { cfg, aufrufe } = fake(() =>
      json({ sha: "b".repeat(40), encoding: "base64", content: nachBase64("{}") }),
    );
    await leseDatei(cfg, "lib/inhalt.json", "abc1234");
    expect(aufrufe[0].url).toContain("?ref=abc1234");
  });

  it("holt große Dateien über die Blob-API nach", async () => {
    const { cfg, aufrufe } = fake((a) =>
      a.url.includes("/git/blobs/")
        ? json({ encoding: "base64", content: nachBase64(TEXT) })
        : json({ sha: "c".repeat(40), encoding: "none", content: "", size: 2_000_000 }),
    );
    expect((await leseDatei(cfg, "lib/bilder-manifest.json")).text).toBe(TEXT);
    expect(aufrufe[1].url).toBe(`https://api.github.com/repos/besitzer/repo/git/blobs/${"c".repeat(40)}`);
  });

  it("nennt bei Fehlern nie den Token", async () => {
    const { cfg } = fake(() => json({ message: "Bad credentials" }, 401));
    const fehler = await leseDatei(cfg, "lib/inhalt.json").catch((e: unknown) => e);
    expect(fehler).toBeInstanceOf(GithubFehler);
    expect((fehler as Error).message).not.toContain("GEHEIM");
    expect((fehler as GithubFehler).status).toBe(401);
  });

  it("lehnt Pfad-Ausbrüche ab, ohne zu fragen", async () => {
    const { cfg, aufrufe } = fake(() => json({}));
    await expect(leseDatei(cfg, "../geheim")).rejects.toBeInstanceOf(GithubFehler);
    await expect(leseDatei(cfg, "lib/inhalt.json", "main..x")).rejects.toBeInstanceOf(GithubFehler);
    expect(aufrufe).toHaveLength(0);
  });
});

describe("leseBlob", () => {
  it("liest genau die Fassung mit dieser sha — über die Blob-API, nicht über den Branch", async () => {
    const { cfg, aufrufe } = fake(() => json({ sha: "a".repeat(40), encoding: "base64", content: nachBase64(TEXT) }));
    expect(await leseBlob(cfg, "a".repeat(40), "lib/inhalt.json")).toBe(TEXT);
    expect(aufrufe.map((a) => a.url)).toEqual([`https://api.github.com/repos/besitzer/repo/git/blobs/${"a".repeat(40)}`]);
  });

  it("unbekannte sha: GithubFehler mit 404", async () => {
    const { cfg } = fake(() => json({ message: "Not Found" }, 404));
    const e = await leseBlob(cfg, "b".repeat(40), "lib/inhalt.json").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(GithubFehler);
    expect((e as GithubFehler).status).toBe(404);
  });

  it("fragt bei leerer oder kaputter sha gar nicht erst", async () => {
    const { cfg, aufrufe } = fake(() => json({}));
    for (const sha of ["", "../x", "A".repeat(40), "a".repeat(39)]) {
      await expect(leseBlob(cfg, sha, "lib/inhalt.json")).rejects.toBeInstanceOf(GithubFehler);
    }
    expect(aufrufe).toHaveLength(0);
  });
});

describe("schreibeDatei", () => {
  it("schreibt mit sha und Branch, ohne author — Umlaute bleiben heil", async () => {
    const { cfg, aufrufe } = fake(() => json({ content: { sha: "d".repeat(40) }, commit: { sha: "e".repeat(40) } }));
    expect(await schreibeDatei(cfg, "lib/inhalt.json", TEXT, "a".repeat(40), "Verwaltung: Test")).toEqual({
      sha: "d".repeat(40),
      commit: "e".repeat(40),
    });

    const [a] = aufrufe;
    expect(a.methode).toBe("PUT");
    const rumpf = a.rumpf as Record<string, unknown>;
    expect(rumpf).toMatchObject({ message: "Verwaltung: Test", branch: "main", sha: "a".repeat(40) });
    expect(rumpf).not.toHaveProperty("author");
    expect(rumpf).not.toHaveProperty("committer");
    expect(ausBase64(rumpf.content as string)).toBe(TEXT);
  });

  /** Die Datei auf main, wie `leseDatei` sie beim Nachsehen bekommt. */
  const aufMain = (sha: string) => json({ sha, encoding: "base64", content: nachBase64("{}") });

  it("wirft GithubKonflikt bei 409, wenn die Datei auf main wirklich eine andere sha hat", async () => {
    const { cfg, aufrufe } = fake((a) =>
      a.methode === "PUT" ? json({ message: "does not match" }, 409) : aufMain("b".repeat(40)),
    );
    await expect(schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x")).rejects.toBeInstanceOf(
      GithubKonflikt,
    );
    expect(aufrufe.map((a) => a.methode)).toEqual(["PUT", "GET"]);
  });

  it("wirft GithubKonflikt bei 422 mit sha-Meldung, wenn die sha nicht passt", async () => {
    const { cfg } = fake((a) =>
      a.methode === "PUT"
        ? json({ message: "Invalid request.\n\n\"sha\" wasn't supplied." }, 422)
        : aufMain("a".repeat(40)),
    );
    await expect(schreibeDatei(cfg, "lib/inhalt.json", "{}", "", "x")).rejects.toBeInstanceOf(GithubKonflikt);
  });

  it("409 bei gleicher sha (Branch weitergerückt): genau ein zweiter Versuch, und der geht durch", async () => {
    let puts = 0;
    const { cfg, aufrufe } = fake((a) => {
      if (a.methode !== "PUT") return aufMain("a".repeat(40));
      puts++;
      return puts === 1
        ? json({ message: "refs/heads/main is at 123 but expected 456" }, 409)
        : json({ content: { sha: "d".repeat(40) }, commit: { sha: "e".repeat(40) } });
    });
    expect(await schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x")).toEqual({
      sha: "d".repeat(40),
      commit: "e".repeat(40),
    });
    expect(aufrufe.map((a) => a.methode)).toEqual(["PUT", "GET", "PUT"]);
    expect(aufrufe[2].rumpf).toEqual(aufrufe[0].rumpf);
  });

  it("409 bei gleicher sha, auch beim zweiten Mal (Regel des Repos): GitHubs Meldung, kein Konflikt", async () => {
    const { cfg, aufrufe } = fake((a) =>
      a.methode === "PUT" ? json({ message: "Repository rule violations found" }, 409) : aufMain("a".repeat(40)),
    );
    const e = await schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(GithubFehler);
    expect(e).not.toBeInstanceOf(GithubKonflikt);
    expect((e as GithubFehler).status).toBe(502);
    expect((e as Error).message).toBe("GitHub hat das Speichern abgelehnt: „Repository rule violations found“.");
    // Kein dritter Versuch.
    expect(aufrufe.filter((a) => a.methode === "PUT")).toHaveLength(2);
  });

  it("422 mit sha-Meldung, die Datei aber unverändert: ebenfalls ein zweiter Versuch statt Konflikt", async () => {
    let puts = 0;
    const { cfg, aufrufe } = fake((a) => {
      if (a.methode !== "PUT") return aufMain("a".repeat(40));
      puts++;
      return puts === 1
        ? json({ message: "lib/inhalt.json does not match " + "a".repeat(40) }, 422)
        : json({ content: { sha: "d".repeat(40) }, commit: { sha: "e".repeat(40) } });
    });
    expect((await schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x")).sha).toBe("d".repeat(40));
    expect(aufrufe.map((a) => a.methode)).toEqual(["PUT", "GET", "PUT"]);
  });

  it("lässt sich die sha nicht nachlesen, ist das kein Konflikt", async () => {
    const { cfg } = fake((a) => (a.methode === "PUT" ? json({}, 409) : json({ message: "Server Error" }, 500)));
    const e = await schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(GithubFehler);
    expect(e).not.toBeInstanceOf(GithubKonflikt);
  });

  it("sonstige 422 sind kein Konflikt", async () => {
    const { cfg } = fake(() => json({ message: "Validation Failed" }, 422));
    const e = await schreibeDatei(cfg, "lib/inhalt.json", "{}", "a".repeat(40), "x").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(GithubFehler);
    expect(e).not.toBeInstanceOf(GithubKonflikt);
  });
});

describe("verlauf", () => {
  it("liefert Commit, Datum, Autor und erste Zeile — keine E-Mail", async () => {
    const { cfg, aufrufe } = fake(() =>
      json([
        {
          sha: "f".repeat(40),
          author: { login: "gUrkE1000" },
          commit: {
            message: "Verwaltung: Titel geändert\n\nGespeichert über die Verwaltung (/admin).",
            author: { name: "Jan", email: "jan@example.org", date: "2026-10-17T10:00:00Z" },
            committer: { name: "GitHub", email: "noreply@github.com", date: "2026-10-17T10:00:01Z" },
          },
        },
      ]),
    );
    const eintraege = await verlauf(cfg, "lib/inhalt.json", 5);
    expect(eintraege).toEqual([
      {
        commit: "f".repeat(40),
        datum: "2026-10-17T10:00:01Z",
        autor: "gUrkE1000",
        nachricht: "Verwaltung: Titel geändert",
      },
    ]);
    expect(JSON.stringify(eintraege)).not.toContain("@");
    expect(aufrufe[0].url).toContain("/commits?path=lib%2Finhalt.json&sha=main&per_page=5");
  });
});

describe("Actions", () => {
  it("startet den Workflow per dispatch", async () => {
    const { cfg, aufrufe } = fake(() => new Response(null, { status: 204 }));
    await starteWorkflow(cfg, "medien.yml", "main");
    expect(aufrufe[0]).toMatchObject({
      url: "https://api.github.com/repos/besitzer/repo/actions/workflows/medien.yml/dispatches",
      methode: "POST",
      rumpf: { ref: "main" },
    });
  });

  it("lehnt fremde Workflow-Namen ab", async () => {
    const { cfg } = fake(() => new Response(null, { status: 204 }));
    await expect(starteWorkflow(cfg, "../x.yml", "main")).rejects.toBeInstanceOf(GithubFehler);
  });

  it("liest die Läufe", async () => {
    const { cfg } = fake(() =>
      json({
        workflow_runs: [
          {
            id: 7,
            status: "completed",
            conclusion: "success",
            run_started_at: "2026-10-17T10:00:00Z",
            html_url: "https://github.com/besitzer/repo/actions/runs/7",
          },
          { id: 8, status: "in_progress", conclusion: null, created_at: "2026-10-17T11:00:00Z" },
        ],
      }),
    );
    expect(await laeufe(cfg, "medien.yml", 2)).toEqual([
      {
        id: 7,
        status: "completed",
        ergebnis: "success",
        gestartet: "2026-10-17T10:00:00Z",
        url: "https://github.com/besitzer/repo/actions/runs/7",
      },
      { id: 8, status: "in_progress", ergebnis: null, gestartet: "2026-10-17T11:00:00Z", url: "" },
    ]);
  });
});
