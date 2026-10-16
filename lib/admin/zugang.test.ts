import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  erlaubteEmails,
  normalisiereTeam,
  pruefeHerkunft,
  pruefeJwt,
  pruefeZugang,
  schluesselFuer,
  vergissSchluessel,
  type JwtPruefung,
} from "./zugang";
import { umgebungAus } from "./umgebung";

/*
 * Geprüft wird mit einem selbst erzeugten RSA-Schlüsselpaar — genau so, wie
 * Cloudflare Access signiert (RS256). So ist jeder Ablehnungsgrund einzeln
 * nachweisbar, ohne Netz und ohne echtes Access.
 */

const TEAM = "jakobsax.cloudflareaccess.com";
const AUD = "aud-tag-123";
const JETZT = 1_800_000_000;

let paar: CryptoKeyPair;
let fremd: CryptoKeyPair;

beforeAll(async () => {
  const art = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  } as const;
  paar = (await crypto.subtle.generateKey(art, true, ["sign", "verify"])) as CryptoKeyPair;
  fremd = (await crypto.subtle.generateKey(art, true, ["sign", "verify"])) as CryptoKeyPair;
});

beforeEach(() => vergissSchluessel());

function b64url(bytes: Uint8Array | string): string {
  const roh = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  let s = "";
  for (const b of roh) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function token(
  claims: Record<string, unknown>,
  kopf: Record<string, unknown> = { alg: "RS256", kid: "k1", typ: "JWT" },
  schluessel: CryptoKey = paar.privateKey,
): Promise<string> {
  const teil = `${b64url(JSON.stringify(kopf))}.${b64url(JSON.stringify(claims))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", schluessel, new TextEncoder().encode(teil));
  return `${teil}.${b64url(new Uint8Array(sig))}`;
}

const gut = () => ({
  iss: `https://${TEAM}`,
  aud: [AUD],
  email: "Jakob@Example.org ",
  exp: JETZT + 600,
  nbf: JETZT - 10,
  iat: JETZT - 10,
});

function pruefung(teil: Partial<JwtPruefung> = {}): JwtPruefung {
  return {
    team: TEAM,
    aud: AUD,
    erlaubt: ["jakob@example.org"],
    schluessel: async (kid) => (kid === "k1" ? paar.publicKey : null),
    jetzt: JETZT,
    ...teil,
  };
}

describe("pruefeJwt", () => {
  it("lässt ein gültiges Token durch, E-Mail getrimmt und klein", async () => {
    expect(await pruefeJwt(await token(gut()), pruefung())).toEqual({
      ok: true,
      email: "jakob@example.org",
    });
  });

  it("nimmt aud auch als einzelnen String", async () => {
    const t = await token({ ...gut(), aud: AUD });
    expect((await pruefeJwt(t, pruefung())).ok).toBe(true);
  });

  it("lehnt falsche aud ab", async () => {
    const t = await token({ ...gut(), aud: ["anderes"] });
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "falsche Audience" });
  });

  it("lehnt falschen Aussteller ab", async () => {
    const t = await token({ ...gut(), iss: "https://boese.cloudflareaccess.com" });
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "falscher Aussteller" });
  });

  it("lehnt abgelaufene Tokens ab — mit 60 s Spielraum", async () => {
    const knapp = await token({ ...gut(), exp: JETZT - 30 });
    expect((await pruefeJwt(knapp, pruefung())).ok).toBe(true);
    const weg = await token({ ...gut(), exp: JETZT - 61 });
    expect(await pruefeJwt(weg, pruefung())).toMatchObject({ ok: false, grund: "abgelaufen" });
  });

  it("lehnt Tokens aus der Zukunft ab (nbf)", async () => {
    const t = await token({ ...gut(), nbf: JETZT + 120 });
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "noch nicht gültig" });
  });

  it("lehnt alg none ab — auch ohne Signatur", async () => {
    const teil = `${b64url(JSON.stringify({ alg: "none", kid: "k1" }))}.${b64url(JSON.stringify(gut()))}`;
    expect(await pruefeJwt(`${teil}.`, pruefung())).toMatchObject({ ok: false });
    expect(await pruefeJwt(`${teil}.`, pruefung())).toMatchObject({ grund: "falscher Algorithmus" });
  });

  it("lehnt HS256 ab", async () => {
    const t = await token(gut(), { alg: "HS256", kid: "k1" });
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "falscher Algorithmus" });
  });

  it("lehnt eine manipulierte Signatur ab", async () => {
    const t = await token(gut());
    const [k, i, s] = t.split(".");
    const kaputt = `${k}.${i}.${s.slice(0, -4)}${s.slice(-4) === "AAAA" ? "BBBB" : "AAAA"}`;
    expect(await pruefeJwt(kaputt, pruefung())).toMatchObject({ ok: false, grund: "Signatur ungültig" });
  });

  it("lehnt einen manipulierten Inhalt ab (andere E-Mail, alte Signatur)", async () => {
    const t = await token({ ...gut(), email: "fremd@example.org" });
    const echt = await token(gut());
    const [k, , s] = echt.split(".");
    const [, i] = t.split(".");
    expect(await pruefeJwt(`${k}.${i}.${s}`, pruefung())).toMatchObject({ ok: false });
  });

  it("lehnt ein Token mit fremdem Schlüssel ab", async () => {
    const t = await token(gut(), undefined, fremd.privateKey);
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "Signatur ungültig" });
  });

  it("lehnt unbekannte kid ab", async () => {
    const t = await token(gut(), { alg: "RS256", kid: "k9" });
    expect(await pruefeJwt(t, pruefung())).toMatchObject({ ok: false, grund: "unbekannter Schlüssel" });
  });

  it("lehnt nicht freigegebene E-Mail ab, ohne sie im Grund zu nennen", async () => {
    const t = await token({ ...gut(), email: "fremd@example.org" });
    const r = await pruefeJwt(t, pruefung());
    expect(r).toMatchObject({ ok: false });
    expect(JSON.stringify(r)).not.toContain("fremd@");
  });

  it("lehnt Tokens ohne E-Mail ab (Service-Token)", async () => {
    const { email: _weg, ...ohne } = gut();
    void _weg;
    expect(await pruefeJwt(await token(ohne), pruefung())).toMatchObject({ ok: false });
  });

  it("überlebt Unfug", async () => {
    for (const t of ["", "a.b", "a.b.c", "!!.??.##", "eyJ.eyJ.eyJ"]) {
      expect((await pruefeJwt(t, pruefung())).ok).toBe(false);
    }
  });
});

describe("Schlüssel von Access", () => {
  async function jwks() {
    const jwk = await crypto.subtle.exportKey("jwk", paar.publicKey);
    return { keys: [{ ...jwk, kid: "k1", alg: "RS256", use: "sig" }] };
  }

  it("lädt einmal und nimmt dann den Cache", async () => {
    let abrufe = 0;
    const holen = (async (adresse: string) => {
      abrufe++;
      expect(adresse).toBe(`https://${TEAM}/cdn-cgi/access/certs`);
      return new Response(JSON.stringify(await jwks()));
    }) as unknown as typeof fetch;

    expect(await schluesselFuer(TEAM, "k1", holen, 1_000_000)).not.toBeNull();
    expect(await schluesselFuer(TEAM, "k1", holen, 1_000_000 + 5_000)).not.toBeNull();
    expect(abrufe).toBe(1);
  });

  it("lädt bei unbekannter kid neu — aber nicht in Dauerschleife", async () => {
    let abrufe = 0;
    const holen = (async () => {
      abrufe++;
      return new Response(JSON.stringify(await jwks()));
    }) as unknown as typeof fetch;

    await schluesselFuer(TEAM, "k1", holen, 1_000_000);
    expect(await schluesselFuer(TEAM, "neu", holen, 1_000_000 + 1_000)).toBeNull();
    expect(abrufe).toBe(1); // zu früh für einen zweiten Abruf
    expect(await schluesselFuer(TEAM, "neu", holen, 1_000_000 + 60_000)).toBeNull();
    expect(abrufe).toBe(2);
  });

  it("lädt nach einer Stunde neu", async () => {
    let abrufe = 0;
    const holen = (async () => {
      abrufe++;
      return new Response(JSON.stringify(await jwks()));
    }) as unknown as typeof fetch;
    await schluesselFuer(TEAM, "k1", holen, 0);
    await schluesselFuer(TEAM, "k1", holen, 60 * 60 * 1000 + 1);
    expect(abrufe).toBe(2);
  });
});

describe("pruefeZugang", () => {
  const env = (teil: Record<string, string>) => umgebungAus(teil, {});
  const nieAbrufen = (() => {
    throw new Error("darf nicht abrufen");
  }) as unknown as typeof fetch;

  it("ist zu, solange etwas an der Einrichtung fehlt", async () => {
    const h = new Headers({ "cf-access-jwt-assertion": "x.y.z" });
    const voll = { ADMIN_ACCESS_TEAM: TEAM, ADMIN_ACCESS_AUD: AUD, ADMIN_EMAILS: "jakob@example.org" };
    for (const fehlt of Object.keys(voll)) {
      const teil = { ...voll, [fehlt]: "" };
      expect(await pruefeZugang(h, env(teil), nieAbrufen)).toEqual({
        ok: false,
        grund: "Zugang nicht eingerichtet",
      });
    }
  });

  it("ist zu ohne Token", async () => {
    const u = env({ ADMIN_ACCESS_TEAM: TEAM, ADMIN_ACCESS_AUD: AUD, ADMIN_EMAILS: "a@b.de" });
    expect((await pruefeZugang(new Headers(), u, nieAbrufen)).ok).toBe(false);
  });

  it("ADMIN_DEV öffnet außerhalb von next dev nichts", async () => {
    // Vitest läuft mit NODE_ENV=test — wie Produktion: keine Abkürzung.
    expect((await pruefeZugang(new Headers(), env({ ADMIN_DEV: "1" }), nieAbrufen)).ok).toBe(false);
  });

  it("prüft ein echtes Token mit Schlüsseln vom Team", async () => {
    const jwk = await crypto.subtle.exportKey("jwk", paar.publicKey);
    const holen = (async () =>
      new Response(JSON.stringify({ keys: [{ ...jwk, kid: "k1" }] }))) as unknown as typeof fetch;
    const jetzt = Math.floor(Date.now() / 1000);
    const t = await token({ ...gut(), exp: jetzt + 600, nbf: jetzt - 10 });
    const u = env({
      ADMIN_ACCESS_TEAM: `https://${TEAM}/`,
      ADMIN_ACCESS_AUD: AUD,
      ADMIN_EMAILS: " JAKOB@example.org , jan@example.org",
    });
    expect(await pruefeZugang(new Headers({ "cf-access-jwt-assertion": t }), u, holen)).toEqual({
      ok: true,
      email: "jakob@example.org",
    });
  });
});

describe("Hilfen", () => {
  it("normalisiert die Teamdomain und lehnt Unfug ab", () => {
    expect(normalisiereTeam("https://JakobSax.cloudflareaccess.com/")).toBe(TEAM);
    expect(normalisiereTeam(TEAM)).toBe(TEAM);
    expect(normalisiereTeam("boese.de/pfad?x")).toBeNull();
    expect(normalisiereTeam("localhost")).toBeNull();
    expect(normalisiereTeam(undefined)).toBeNull();
  });

  it("liest ADMIN_EMAILS", () => {
    expect(erlaubteEmails(" A@b.de, ,c@D.de ")).toEqual(["a@b.de", "c@d.de"]);
    expect(erlaubteEmails(undefined)).toEqual([]);
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
