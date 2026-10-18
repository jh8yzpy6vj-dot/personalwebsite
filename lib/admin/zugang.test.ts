import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COOKIE,
  MIN_LAENGE,
  SITZUNG_TAGE,
  anmeldungErlaubt,
  bremsSchluessel,
  cookieAus,
  neueSitzung,
  passwortAus,
  passwortRichtig,
  pruefeHerkunft,
  pruefeZugang,
  setzeCookie,
  sitzungGueltig,
} from "./zugang";
import { eingangZugang, githubZugang, konfiguration, umgebungAus } from "./umgebung";

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

describe("bremsSchluessel", () => {
  it("IPv4 bleibt, wie sie ist; ohne IP zählt alles gemeinsam", () => {
    expect(bremsSchluessel("203.0.113.7")).toBe("203.0.113.7");
    expect(bremsSchluessel("::ffff:203.0.113.7")).toBe("::ffff:203.0.113.7");
    expect(bremsSchluessel(null)).toBe("unbekannt");
  });

  it("IPv6 zählt je /64 — ein neuer Rest der Adresse hilft nicht", () => {
    const a = bremsSchluessel("2001:db8:aa:1::1");
    expect(a).toBe("2001:db8:aa:1::/64");
    expect(bremsSchluessel("2001:0DB8:00aa:0001:dead:beef:0:7")).toBe(a);
    expect(bremsSchluessel("2001:db8:aa:2::1")).not.toBe(a);
    expect(bremsSchluessel("::1")).toBe("0:0:0:0::/64");
    expect(bremsSchluessel("2001:db8::")).toBe("2001:db8:0:0::/64");
  });
});

describe("anmeldungErlaubt", () => {
  it("ohne Cloudflare-Kontext (Tests): durchlassen, aber im Log melden", async () => {
    const warnung = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await anmeldungErlaubt(new Request("https://jakobsax.de/api/admin/anmelden"))).toBe(true);
    expect(warnung.mock.calls.join()).toMatch(/Anmeldebremse/);
    warnung.mockRestore();
  });
});

describe("Schreiben unter next dev", () => {
  const MIT_TOKEN = { GITHUB_TOKEN: "ghp_x" };
  const MIT_EINGANG = {
    R2_ACCOUNT_ID: "abc",
    EINGANG_BUCKET: "eingang",
    EINGANG_ACCESS_KEY_ID: "id",
    EINGANG_SECRET_ACCESS_KEY: "geheim",
  };
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nur mit ADMIN_DEV_SCHREIBEN=1", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(githubZugang(umgebungAus(MIT_TOKEN, {}))).toBeNull();
    expect(githubZugang(umgebungAus({ ...MIT_TOKEN, ADMIN_DEV_SCHREIBEN: "ja" }, {}))).toBeNull();
    const u = umgebungAus({ ...MIT_TOKEN, ADMIN_DEV_SCHREIBEN: "1" }, {});
    expect(githubZugang(u)?.branch).toBe("main");
    expect(konfiguration(u).entwicklung).toBe("jh8yzpy6vj-dot/personalwebsite@main");
  });

  it("Hochladen ebenso nur mit ADMIN_DEV_SCHREIBEN=1", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(eingangZugang(umgebungAus(MIT_EINGANG, {}))).toBeNull();
    expect(eingangZugang(umgebungAus({ ...MIT_EINGANG, ADMIN_DEV_SCHREIBEN: "1" }, {}))?.bucket).toBe("eingang");
  });

  it("im Produktionsbuild ändert sich nichts", () => {
    vi.stubEnv("NODE_ENV", "production");
    const u = umgebungAus(MIT_TOKEN, {});
    expect(githubZugang(u)).not.toBeNull();
    expect(konfiguration(u)).toEqual({ github: true, eingang: false });
    expect(eingangZugang(umgebungAus(MIT_EINGANG, {}))).not.toBeNull();
  });
});
