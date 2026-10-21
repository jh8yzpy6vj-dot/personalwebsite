import { describe, expect, it } from "vitest";
import { INHALT } from "../inhalt";
import {
  alsDatei,
  berlinerTag,
  betreffAus,
  commitNachricht,
  istJson,
  leseBegrenzt,
  logText,
  papierkorbDaten,
  speichereInhalt,
} from "./antwort";
import { GithubFehler, nachBase64, type GithubKonfig } from "./github";

describe("berlinerTag", () => {
  it("ist der Tag in deutscher Zeit, nicht in UTC", () => {
    expect(berlinerTag(new Date("2026-10-18T21:59:00Z"))).toBe("2026-10-18"); // 23:59 Sommerzeit
    expect(berlinerTag(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19"); // 00:30
    expect(berlinerTag(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01"); // 00:30 Winterzeit
  });
});

describe("papierkorbDaten", () => {
  const HEUTE = "2026-10-18";

  it("ignoriert das Datum vom Client — ein neuer Schlüssel bekommt heute", () => {
    expect(papierkorbDaten({ "arbeiten/stamp/03": "2000-01-01" }, {}, HEUTE)).toEqual({
      "arbeiten/stamp/03": HEUTE,
    });
  });

  it("behält das Datum von main, wenn der Schlüssel dort schon im Papierkorb liegt", () => {
    expect(
      papierkorbDaten({ a: "2026-10-18", b: "2026-10-18" }, { a: "2026-10-01", c: "2026-09-01" }, HEUTE),
    ).toEqual({ a: "2026-10-01", b: HEUTE });
  });

  it("Beispiel aus dem Befund: der Stand vom 05.09. bringt stamp/03 mit „2026-09-01“ zurück → heute", () => {
    // Auf main ist das Bild seit dem 10.09. wiederhergestellt, also nicht im Papierkorb.
    const ausAltemStand = { "arbeiten/stamp/03": "2026-09-01" };
    expect(papierkorbDaten(ausAltemStand, {}, "2026-10-17")).toEqual({ "arbeiten/stamp/03": "2026-10-17" });
  });

  it("ein unmögliches oder künftiges Datum auf main wird heute", () => {
    expect(papierkorbDaten({ a: "x", b: "x", c: "x" }, { a: "2026-99-99", b: "2027-01-01", c: 7 }, HEUTE)).toEqual({
      a: HEUTE,
      b: HEUTE,
      c: HEUTE,
    });
  });

  it("verträgt jede Form von main", () => {
    for (const main of [undefined, null, "x", [], 3]) {
      expect(papierkorbDaten({ a: "2000-01-01" }, main, HEUTE)).toEqual({ a: HEUTE });
    }
  });

  it("lässt sich nicht über __proto__ oder geerbte Schlüssel täuschen", () => {
    expect(papierkorbDaten({ toString: "2000-01-01" }, {}, HEUTE)).toEqual({ toString: HEUTE });
  });
});

describe("speichereInhalt", () => {
  const A = "a".repeat(40);
  const B = "b".repeat(40);
  const antwort = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status });
  const datei = (inhalt: unknown, sha: string) =>
    antwort({ sha, encoding: "base64", content: nachBase64(JSON.stringify(inhalt)) });

  /** GitHub, auf dessen main `aufMain` mit sha B steht; Lesen über den Branch liefert `gelesen`. */
  function github(aufMain: unknown, gelesen: { inhalt: unknown; sha: string }) {
    const wege: string[] = [];
    const gh: GithubKonfig = {
      token: "t",
      repo: "besitzer/repo",
      branch: "main",
      fetch: (async (url: string, init: RequestInit = {}) => {
        const methode = init.method ?? "GET";
        const weg = `${methode} ${url.replace("https://api.github.com/repos/besitzer/repo", "")}`;
        wege.push(weg);
        if (methode === "PUT") {
          return (JSON.parse(String(init.body)) as { sha: string }).sha === B
            ? antwort({ content: { sha: "c".repeat(40) }, commit: { sha: "d".repeat(40) } })
            : antwort({ message: "does not match" }, 409);
        }
        if (weg.includes("/git/blobs/")) return weg.endsWith(B) ? datei(aufMain, B) : antwort({}, 404);
        if (weg.includes("/commits?")) return antwort([{ sha: "e".repeat(40), commit: { message: "x" } }]);
        if (weg.includes("inhalt.json")) return datei(gelesen.inhalt, gelesen.sha);
        return datei({}, "f".repeat(40)); // Manifest
      }) as typeof fetch,
    };
    return { gh, wege };
  }

  const NEU = { ...INHALT, seite: { ...INHALT.seite, name: "neu" } };

  it("schreibt zuerst — liefert das Lesen von main noch den alten Stand, wird nichts verschluckt (Fall X1)", async () => {
    // main ist NEU (sha B), das Lesen über den Branch hinkt und liefert noch INHALT.
    const { gh, wege } = github(NEU, { inhalt: INHALT, sha: A });
    const a = await speichereInhalt(gh, INHALT, B, "zurück");
    expect(a.status).toBe(200);
    expect(await a.json()).toMatchObject({ ok: true, commit: "d".repeat(40) });
    expect(wege.filter((w) => w.includes("inhalt.json") || w.includes("/git/blobs/"))).toEqual([
      `GET /git/blobs/${B}`,
      "PUT /contents/lib/inhalt.json",
    ]);
  });

  it("lehnt GitHub ab und steht genau das schon auf main: kein Commit, die sha von main", async () => {
    const { gh, wege } = github(NEU, { inhalt: NEU, sha: B });
    const a = await speichereInhalt(gh, NEU, A, "noch einmal");
    expect(a.status).toBe(200);
    expect(await a.json()).toMatchObject({ ok: true, sha: B, commit: "e".repeat(40) });
    expect(wege.filter((w) => w.startsWith("PUT"))).toHaveLength(1);
  });

  it("lehnt GitHub ab und steht auf main etwas anderes: 409", async () => {
    const { gh } = github(NEU, { inhalt: NEU, sha: B });
    const a = await speichereInhalt(gh, INHALT, A, "x");
    expect(a.status).toBe(409);
    expect((await a.json()).grund).toBe("konflikt");
  });
});

describe("logText", () => {
  it("nennt Art und Meldung, gekürzt", () => {
    expect(logText(new SyntaxError("Unexpected token <"))).toBe("SyntaxError: Unexpected token <");
    expect(logText(new GithubFehler("lib/inhalt.json lesen: GitHub antwortet mit 500.", 500))).toBe(
      "GithubFehler: lib/inhalt.json lesen: GitHub antwortet mit 500.",
    );
    expect(logText(new Error("x".repeat(1000)))).toHaveLength("Error: ".length + 300);
    expect(logText("roh")).toBe("roh");
  });
});

describe("betreffAus", () => {
  it("macht eine Zeile daraus", () => {
    expect(betreffAus("  Titel\nvon STAMP\r\n geändert jetzt ")).toBe("Titel von STAMP geändert jetzt");
  });

  it("entfernt E-Mail-Adressen — das Repo ist öffentlich", () => {
    expect(betreffAus("Kontakt auf jakob.sax@example.org geändert")).toBe("Kontakt auf [Adresse] geändert");
    expect(betreffAus("<a@b.de>")).not.toContain("@");
  });

  it("kürzt auf 72 Zeichen", () => {
    const lang = betreffAus("ä".repeat(200));
    expect([...lang]).toHaveLength(72);
    expect(lang.endsWith("…")).toBe(true);
  });

  it("hat einen Ersatz für leer und Unfug", () => {
    expect(betreffAus("")).toBe("Inhalte geändert");
    expect(betreffAus(undefined)).toBe("Inhalte geändert");
    expect(betreffAus({ boese: true })).toBe("Inhalte geändert");
  });
});

describe("commitNachricht", () => {
  it("hat Betreff, Leerzeile und Hinweis", () => {
    expect(commitNachricht("Titel geändert")).toBe(
      "Verwaltung: Titel geändert\n\nGespeichert über die Verwaltung (/admin).",
    );
  });
});

describe("alsDatei", () => {
  it("zwei Leerzeichen Einzug, Zeilenumbruch am Ende, Umlaute unverändert", () => {
    expect(alsDatei({ a: "ü" })).toBe('{\n  "a": "ü"\n}\n');
  });
});

describe("leseBegrenzt", () => {
  const anfrage = (rumpf: BodyInit, kopf: Record<string, string> = {}) =>
    new Request("https://jakobsax.de/x", { method: "POST", body: rumpf, headers: kopf });

  it("liest bis zur Grenze", async () => {
    expect(await leseBegrenzt(anfrage("abc"), 3)).toEqual(new TextEncoder().encode("abc"));
  });

  it("bricht beim Lesen ab, wenn es mehr wird", async () => {
    expect(await leseBegrenzt(anfrage("abcd"), 3)).toBeNull();
  });

  it("glaubt einem zu großen Content-Length sofort", async () => {
    expect(await leseBegrenzt(anfrage("a", { "content-length": "999" }), 3)).toBeNull();
  });
});

describe("istJson", () => {
  it("nimmt application/json auch mit charset", () => {
    const r = (typ: string) => new Request("https://x.de", { method: "POST", headers: { "content-type": typ } });
    expect(istJson(r("application/json; charset=utf-8"))).toBe(true);
    expect(istJson(r("text/plain"))).toBe(false);
    expect(istJson(r("application/x-www-form-urlencoded"))).toBe(false);
  });
});
