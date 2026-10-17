import { describe, expect, it } from "vitest";
import {
  COOKIE,
  MIN_LAENGE,
  SITZUNG_TAGE,
  cookieAus,
  neueSitzung,
  passwortAus,
  passwortRichtig,
  pruefeHerkunft,
  pruefeZugang,
  setzeCookie,
  sitzungGueltig,
} from "./zugang";
import { umgebungAus } from "./umgebung";

const PASSWORT = "lange-genug-und-geheim";
const JETZT = 1_800_000_000;
const TAG = 86_400;

describe("passwortAus", () => {
  it("fehlt oder zu kurz → nicht eingerichtet", () => {
    expect(passwortAus(umgebungAus({}, {}))).toBeNull();
    expect(passwortAus(umgebungAus({ ADMIN_PASSWORT: "x".repeat(MIN_LAENGE - 1) }, {}))).toBeNull();
    expect(passwortAus(umgebungAus({ ADMIN_PASSWORT: "   " }, {}))).toBeNull();
  });

  it("lang genug → das Passwort", () => {
    expect(passwortAus(umgebungAus({ ADMIN_PASSWORT: PASSWORT }, {}))).toBe(PASSWORT);
  });
});

describe("passwortRichtig", () => {
  it("nur genau das Passwort", async () => {
    expect(await passwortRichtig(PASSWORT, PASSWORT)).toBe(true);
    expect(await passwortRichtig(PASSWORT + " ", PASSWORT)).toBe(false);
    expect(await passwortRichtig(PASSWORT.toUpperCase(), PASSWORT)).toBe(false);
    expect(await passwortRichtig("", PASSWORT)).toBe(false);
  });
});

describe("Sitzung", () => {
  it("eine frische Sitzung gilt", async () => {
    const s = await neueSitzung(PASSWORT, JETZT);
    expect(s).toMatch(/^v1\.\d+\.[A-Za-z0-9_-]+$/);
    expect(await sitzungGueltig(s, PASSWORT, JETZT)).toBe(true);
    expect(await sitzungGueltig(s, PASSWORT, JETZT + (SITZUNG_TAGE - 1) * TAG)).toBe(true);
  });

  it("läuft ab", async () => {
    const s = await neueSitzung(PASSWORT, JETZT);
    expect(await sitzungGueltig(s, PASSWORT, JETZT + (SITZUNG_TAGE + 1) * TAG)).toBe(false);
  });

  it("neues Passwort meldet alle ab", async () => {
    const s = await neueSitzung(PASSWORT, JETZT);
    expect(await sitzungGueltig(s, "ein-ganz-anderes-passwort", JETZT)).toBe(false);
  });

  it("verlängern durch Ändern der Ablaufzeit geht nicht", async () => {
    const [v, ablauf, sig] = (await neueSitzung(PASSWORT, JETZT)).split(".");
    const spaeter = `${v}.${Number(ablauf) + TAG}.${sig}`;
    expect(await sitzungGueltig(spaeter, PASSWORT, JETZT)).toBe(false);
  });

  it("selbst gebaute Sitzung mit Ablauf weit in der Zukunft gilt nicht", async () => {
    const s = await neueSitzung(PASSWORT, JETZT + 365 * TAG);
    expect(await sitzungGueltig(s, PASSWORT, JETZT)).toBe(false);
  });

  it("Unsinn wirft nicht", async () => {
    for (const w of ["", "v1", "v1..", "v2.1.abc", "v1.abc.def", "a.b.c.d"]) {
      expect(await sitzungGueltig(w, PASSWORT, JETZT)).toBe(false);
    }
  });
});

describe("Cookie", () => {
  it("wird gelesen, auch zwischen anderen", () => {
    const h = new Headers({ cookie: `a=1; ${COOKIE}=v1.2.xyz; b=2` });
    expect(cookieAus(h)).toBe("v1.2.xyz");
    expect(cookieAus(new Headers())).toBeNull();
  });

  it("wird sicher gesetzt und beim Abmelden gelöscht", () => {
    const an = setzeCookie("v1.2.xyz");
    expect(an).toContain(`${COOKIE}=v1.2.xyz`);
    for (const teil of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax"]) expect(an).toContain(teil);
    expect(setzeCookie("")).toContain("Max-Age=0");
  });
});

describe("pruefeZugang", () => {
  const u = umgebungAus({ ADMIN_PASSWORT: PASSWORT }, {});

  it("ohne Passwort in der Umgebung: nicht eingerichtet", async () => {
    const z = await pruefeZugang(new Headers(), umgebungAus({}, {}));
    expect(z).toEqual({ ok: false, grund: "Zugang nicht eingerichtet", eingerichtet: false });
  });

  it("ohne Cookie: eingerichtet, aber nicht angemeldet", async () => {
    const z = await pruefeZugang(new Headers(), u);
    expect(z.ok).toBe(false);
    if (!z.ok) expect(z.eingerichtet).toBe(true);
  });

  it("mit gültiger Sitzung: angemeldet", async () => {
    const s = await neueSitzung(PASSWORT, Math.floor(Date.now() / 1000));
    const z = await pruefeZugang(new Headers({ cookie: `${COOKIE}=${s}` }), u);
    expect(z).toEqual({ ok: true });
  });

  it("mit gefälschter Sitzung: nicht angemeldet", async () => {
    const s = await neueSitzung("falsch-falsch-falsch", Math.floor(Date.now() / 1000));
    const z = await pruefeZugang(new Headers({ cookie: `${COOKIE}=${s}` }), u);
    expect(z.ok).toBe(false);
  });

  it("ADMIN_DEV öffnet außerhalb von next dev nichts", async () => {
    const z = await pruefeZugang(new Headers(), umgebungAus({ ADMIN_DEV: "1" }, {}));
    expect(z.ok).toBe(false);
  });
});

describe("pruefeHerkunft", () => {
  const url = "https://jakobsax.de/api/admin/speichern";
  const anfrage = (h: Record<string, string>) => new Request(url, { method: "POST", headers: h });

  it("lässt die eigene Origin durch", () => {
    expect(pruefeHerkunft(anfrage({ origin: "https://jakobsax.de" }))).toBeNull();
  });

  it("lässt Sec-Fetch-Site same-origin durch", () => {
    expect(pruefeHerkunft(anfrage({ "sec-fetch-site": "same-origin" }))).toBeNull();
  });

  it("lehnt fremde Seiten ab", () => {
    expect(pruefeHerkunft(anfrage({ origin: "https://boese.example" }))?.status).toBe(403);
    expect(pruefeHerkunft(anfrage({ "sec-fetch-site": "cross-site" }))?.status).toBe(403);
    expect(pruefeHerkunft(anfrage({ origin: "https://www.jakobsax.de" }))?.status).toBe(403);
  });

  it("lehnt Anfragen ohne jeden Herkunftsnachweis ab", () => {
    expect(pruefeHerkunft(anfrage({}))?.status).toBe(403);
  });
});
