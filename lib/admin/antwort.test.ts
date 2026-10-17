import { describe, expect, it } from "vitest";
import { alsDatei, betreffAus, commitNachricht, istJson, leseBegrenzt } from "./antwort";

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
