import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BILDER } from "../bilder";
import { INHALT } from "../inhalt";
import { nachBase64 } from "./github";
import { vergissSchluessel } from "./zugang";
import * as stand from "@/app/api/admin/stand/route";
import * as speichern from "@/app/api/admin/speichern/route";
import * as verlauf from "@/app/api/admin/verlauf/route";
import * as zuruecksetzen from "@/app/api/admin/zuruecksetzen/route";
import * as hochladen from "@/app/api/admin/hochladen/route";
import * as verarbeiten from "@/app/api/admin/verarbeiten/route";
import * as verarbeitung from "@/app/api/admin/verarbeitung/route";
import * as live from "@/app/api/admin/live/route";

/*
 * Die Routen als Ganzes: Zugang, Herkunft, Grenzen und das Zusammenspiel
 * mit GitHub und dem Eingang — beides über ein gefälschtes `fetch`.
 * Angemeldet wird über die Dev-Abkürzung (NODE_ENV=development +
 * ADMIN_DEV=1); das JWT selbst prüft `zugang.test.ts`.
 */

const BASIS = "https://jakobsax.de/api/admin";
const SHA = "a".repeat(40);

type Aufruf = { url: string; methode: string; rumpf: unknown };
let aufrufe: Aufruf[] = [];

function fakeFetch(antworte: (url: string, methode: string, init?: RequestInit) => Response) {
  aufrufe = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (eingabe: string | Request, init?: RequestInit) => {
      const url = typeof eingabe === "string" ? eingabe : eingabe.url;
      const methode = (typeof eingabe === "string" ? init?.method : eingabe.method) ?? "GET";
      const rumpf = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      aufrufe.push({ url, methode, rumpf });
      return antworte(url, methode, init);
    }),
  );
}

const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status });
const datei = (text: string, sha = SHA) => json({ sha, encoding: "base64", content: nachBase64(text) });

function anmelden() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ADMIN_DEV", "1");
}

function mitGithub() {
  vi.stubEnv("GITHUB_TOKEN", "ghp_GEHEIM");
}

function mitEingang() {
  vi.stubEnv("R2_ACCOUNT_ID", "abc123");
  vi.stubEnv("EINGANG_BUCKET", "eingang");
  vi.stubEnv("EINGANG_ACCESS_KEY_ID", "KEYID");
  vi.stubEnv("EINGANG_SECRET_ACCESS_KEY", "GEHEIM");
}

const eigene = { origin: "https://jakobsax.de" };

beforeEach(() => {
  vergissSchluessel();
  // Saubere Ausgangslage: nichts eingerichtet, egal, was in der Shell steht.
  for (const name of [
    "ADMIN_ACCESS_TEAM",
    "ADMIN_ACCESS_AUD",
    "ADMIN_EMAILS",
    "ADMIN_DEV",
    "GITHUB_TOKEN",
    "R2_ACCOUNT_ID",
    "EINGANG_BUCKET",
    "EINGANG_ACCESS_KEY_ID",
    "EINGANG_SECRET_ACCESS_KEY",
  ]) {
    vi.stubEnv(name, "");
  }
  fakeFetch(() => {
    throw new Error("unerwarteter Abruf");
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ohne Einrichtung", () => {
  it("antwortet überall mit 404 und no-store", async () => {
    const antworten = await Promise.all([
      stand.GET(new Request(`${BASIS}/stand`)),
      speichern.POST(new Request(`${BASIS}/speichern`, { method: "POST", headers: eigene })),
      verlauf.GET(new Request(`${BASIS}/verlauf`)),
      zuruecksetzen.POST(new Request(`${BASIS}/zuruecksetzen`, { method: "POST", headers: eigene })),
      hochladen.PUT(new Request(`${BASIS}/hochladen?ziel=portrait`, { method: "PUT", headers: eigene })),
      verarbeiten.POST(new Request(`${BASIS}/verarbeiten`, { method: "POST", headers: eigene })),
      verarbeitung.GET(new Request(`${BASIS}/verarbeitung`)),
      live.GET(new Request(`${BASIS}/live`)),
    ]);
    for (const a of antworten) {
      expect(a.status).toBe(404);
      expect(a.headers.get("cache-control")).toBe("no-store");
    }
  });

  it("ADMIN_DEV allein öffnet nichts", async () => {
    vi.stubEnv("ADMIN_DEV", "1"); // NODE_ENV bleibt "test"
    expect((await stand.GET(new Request(`${BASIS}/stand`))).status).toBe(404);
  });

  it("alle Routen sind dynamisch", () => {
    for (const r of [stand, speichern, verlauf, zuruecksetzen, hochladen, verarbeiten, verarbeitung, live]) {
      expect(r.dynamic).toBe("force-dynamic");
    }
  });
});

describe("stand", () => {
  it("ohne GitHub: der Build-Stand, sha leer", async () => {
    anmelden();
    const a = await stand.GET(new Request(`${BASIS}/stand`));
    expect(a.status).toBe(200);
    const d = await a.json();
    expect(d.sha).toBe("");
    expect(d.inhalt).toEqual(INHALT);
    expect(d.wer).toEqual({ email: "dev@localhost" });
    expect(d.konfiguration).toEqual({ github: false, eingang: false });
    expect(JSON.stringify(d)).not.toContain("GEHEIM");
  });

  it("mit GitHub: Inhalt und Manifest von main", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url) =>
      url.includes("inhalt.json")
        ? datei(JSON.stringify({ ...INHALT, seite: { ...INHALT.seite, name: "von main" } }))
        : datei(JSON.stringify({}), "b".repeat(40)),
    );
    const d = await (await stand.GET(new Request(`${BASIS}/stand`))).json();
    expect(d.sha).toBe(SHA);
    expect(d.inhalt.seite.name).toBe("von main");
    expect(d.bilder).toEqual({});
    expect(d.konfiguration.github).toBe(true);
    expect(JSON.stringify(d)).not.toContain("GEHEIM");
  });
});

describe("speichern", () => {
  const anfrage = (rumpf: unknown, kopf: Record<string, string> = eigene) =>
    new Request(`${BASIS}/speichern`, {
      method: "POST",
      headers: { "content-type": "application/json", ...kopf },
      body: JSON.stringify(rumpf),
    });

  it("lehnt fremde Herkunft ab", async () => {
    anmelden();
    mitGithub();
    const a = await speichern.POST(anfrage({ inhalt: INHALT, sha: SHA }, { origin: "https://boese.example" }));
    expect(a.status).toBe(403);
  });

  it("ohne Token: 503 nicht-eingerichtet", async () => {
    anmelden();
    const a = await speichern.POST(anfrage({ inhalt: INHALT, sha: SHA, nachricht: "x" }));
    expect(a.status).toBe(503);
    expect((await a.json()).grund).toBe("nicht-eingerichtet");
  });

  it("verlangt JSON", async () => {
    anmelden();
    mitGithub();
    const a = await speichern.POST(
      new Request(`${BASIS}/speichern`, { method: "POST", headers: { ...eigene, "content-type": "text/plain" }, body: "{}" }),
    );
    expect(a.status).toBe(415);
  });

  it("lehnt Ungültiges mit 422 und Befunden ab, ohne zu schreiben", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url, methode) => {
      if (methode === "PUT") throw new Error("darf nicht schreiben");
      return datei(JSON.stringify(BILDER));
    });
    const a = await speichern.POST(anfrage({ inhalt: { seite: 1 }, sha: SHA, nachricht: "x" }));
    expect(a.status).toBe(422);
    const d = await a.json();
    expect(d).toMatchObject({ ok: false, grund: "ungueltig" });
    expect(d.befunde.length).toBeGreaterThan(0);
  });

  it("schreibt gültigen Inhalt als Commit — ohne author, ohne Adresse in der Nachricht", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url, methode) =>
      methode === "PUT"
        ? json({ content: { sha: "c".repeat(40) }, commit: { sha: "d".repeat(40) } })
        : datei(JSON.stringify(BILDER)),
    );
    const a = await speichern.POST(
      anfrage({ inhalt: INHALT, sha: SHA, nachricht: "Mail jakob@example.org\nneu" }),
    );
    expect(a.status).toBe(200);
    expect(await a.json()).toMatchObject({ ok: true, sha: "c".repeat(40), commit: "d".repeat(40) });

    const put = aufrufe.find((x) => x.methode === "PUT")!;
    expect(put.url).toBe("https://api.github.com/repos/jh8yzpy6vj-dot/personalwebsite/contents/lib/inhalt.json");
    const rumpf = put.rumpf as Record<string, unknown>;
    expect(rumpf.message).toBe("Verwaltung: Mail [Adresse] neu\n\nGespeichert über die Verwaltung (/admin).");
    expect(rumpf).not.toHaveProperty("author");
    expect(rumpf).toMatchObject({ sha: SHA, branch: "main" });
  });

  it("meldet einen Konflikt mit 409", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url, methode) =>
      methode === "PUT" ? json({ message: "does not match" }, 409) : datei(JSON.stringify(BILDER)),
    );
    const a = await speichern.POST(anfrage({ inhalt: INHALT, sha: SHA, nachricht: "x" }));
    expect(a.status).toBe(409);
    expect((await a.json()).grund).toBe("konflikt");
  });

  it("nimmt den Build-Stand der Bilder, wenn das Manifest nicht lesbar ist", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url, methode) =>
      methode === "PUT"
        ? json({ content: { sha: "c".repeat(40) }, commit: { sha: "d".repeat(40) } })
        : json({ message: "Server Error" }, 500),
    );
    const a = await speichern.POST(anfrage({ inhalt: INHALT, sha: SHA, nachricht: "x" }));
    expect(a.status).toBe(200);
  });

  it("lehnt eine kaputte sha ab", async () => {
    anmelden();
    mitGithub();
    const a = await speichern.POST(anfrage({ inhalt: INHALT, sha: "../x", nachricht: "x" }));
    expect(a.status).toBe(400);
  });
});

describe("zuruecksetzen", () => {
  it("stellt den alten Stand als neuen Commit her", async () => {
    anmelden();
    mitGithub();
    fakeFetch((url, methode) => {
      if (methode === "PUT") return json({ content: { sha: "c".repeat(40) }, commit: { sha: "d".repeat(40) } });
      if (url.includes("/commits/abc1234")) {
        return json({ sha: "abc1234".padEnd(40, "0"), commit: { committer: { date: "2026-10-01T08:30:00Z" } } });
      }
      if (url.includes("inhalt.json")) return datei(JSON.stringify(INHALT));
      return datei(JSON.stringify(BILDER));
    });
    const a = await zuruecksetzen.POST(
      new Request(`${BASIS}/zuruecksetzen`, {
        method: "POST",
        headers: { ...eigene, "content-type": "application/json" },
        body: JSON.stringify({ commit: "abc1234", sha: SHA }),
      }),
    );
    expect(a.status).toBe(200);
    const lesen = aufrufe.find((x) => x.url.includes("contents/lib/inhalt.json?ref=abc1234"));
    expect(lesen).toBeDefined();
    const put = aufrufe.find((x) => x.methode === "PUT")!;
    expect((put.rumpf as { message: string }).message).toMatch(
      /^Verwaltung: Stand vom 01\.10\.2026, 10:30 wiederhergestellt\n\n/,
    );
  });

  it("lehnt Branchnamen und Unfug als commit ab", async () => {
    anmelden();
    mitGithub();
    for (const commit of ["main", "../x", "", 42]) {
      const a = await zuruecksetzen.POST(
        new Request(`${BASIS}/zuruecksetzen`, {
          method: "POST",
          headers: { ...eigene, "content-type": "application/json" },
          body: JSON.stringify({ commit, sha: SHA }),
        }),
      );
      expect(a.status).toBe(400);
    }
  });
});

describe("hochladen", () => {
  const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const anfrage = (ziel: string, rumpf: Uint8Array<ArrayBuffer>, typ = "image/jpeg", kopf: Record<string, string> = {}) =>
    new Request(`${BASIS}/hochladen?ziel=${encodeURIComponent(ziel)}`, {
      method: "PUT",
      headers: { ...eigene, "content-type": typ, ...kopf },
      body: rumpf,
    });

  it("ohne Eingang: 503", async () => {
    anmelden();
    expect((await hochladen.PUT(anfrage("portrait", JPEG))).status).toBe(503);
  });

  it("legt das Bild als <ziel>.<endung> in den Eingang", async () => {
    anmelden();
    mitEingang();
    fakeFetch(() => new Response(null, { status: 200 }));
    const a = await hochladen.PUT(anfrage("arbeiten/stamp/01", JPEG));
    expect(a.status).toBe(200);
    expect(await a.json()).toEqual({ ok: true, schluessel: "arbeiten/stamp/01" });
    expect(aufrufe[0]).toMatchObject({
      url: "https://abc123.r2.cloudflarestorage.com/eingang/arbeiten/stamp/01.jpg",
      methode: "PUT",
    });
  });

  it("lehnt Ziele außerhalb von ZIEL ab", async () => {
    anmelden();
    mitEingang();
    for (const ziel of ["../geheim", "original/x", "arbeiten/stamp/1", "/portrait", "portrait.jpg", ""]) {
      expect((await hochladen.PUT(anfrage(ziel, JPEG))).status).toBe(400);
    }
  });

  it("lehnt falsche Typen und gefälschte Bytes ab", async () => {
    anmelden();
    mitEingang();
    expect((await hochladen.PUT(anfrage("portrait", JPEG, "image/svg+xml"))).status).toBe(415);
    expect((await hochladen.PUT(anfrage("portrait", new TextEncoder().encode("<svg/>")))).status).toBe(415);
    expect((await hochladen.PUT(anfrage("portrait", JPEG, "image/png"))).status).toBe(415);
  });

  it("lehnt zu Großes schon am Content-Length ab", async () => {
    anmelden();
    mitEingang();
    const a = await hochladen.PUT(anfrage("portrait", JPEG, "image/jpeg", { "content-length": String(41 * 1024 * 1024) }));
    expect(a.status).toBe(413);
  });

  it("lehnt fremde Herkunft ab", async () => {
    anmelden();
    mitEingang();
    const a = await hochladen.PUT(anfrage("portrait", JPEG, "image/jpeg", { origin: "https://boese.example" }));
    expect(a.status).toBe(403);
  });
});

describe("verarbeiten, verarbeitung, live, verlauf", () => {
  it("startet die Medien-Action", async () => {
    anmelden();
    mitGithub();
    fakeFetch(() => new Response(null, { status: 204 }));
    const a = await verarbeiten.POST(new Request(`${BASIS}/verarbeiten`, { method: "POST", headers: eigene }));
    expect(await a.json()).toEqual({ ok: true });
    expect(aufrufe[0].url).toContain("/actions/workflows/medien.yml/dispatches");
  });

  it("verarbeitung ohne Einrichtung: leere Listen", async () => {
    anmelden();
    expect(await (await verarbeitung.GET(new Request(`${BASIS}/verarbeitung`))).json()).toEqual({
      wartend: [],
      laeufe: [],
    });
  });

  it("verarbeitung: wartende Schlüssel ohne Endung", async () => {
    anmelden();
    mitEingang();
    fakeFetch(
      () =>
        new Response(
          "<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>ueber/01.jpg</Key></Contents><Contents><Key>portrait.png</Key></Contents></ListBucketResult>",
        ),
    );
    expect((await (await verarbeitung.GET(new Request(`${BASIS}/verarbeitung`))).json()).wartend).toEqual([
      "portrait",
      "ueber/01",
    ]);
  });

  it("live meldet den Build-Commit", async () => {
    anmelden();
    vi.stubEnv("BUILD_COMMIT", "e".repeat(40));
    expect(await (await live.GET(new Request(`${BASIS}/live`))).json()).toEqual({ commit: "e".repeat(40) });
  });

  it("verlauf ohne GitHub: leer", async () => {
    anmelden();
    expect(await (await verlauf.GET(new Request(`${BASIS}/verlauf`))).json()).toEqual({ eintraege: [] });
  });
});
