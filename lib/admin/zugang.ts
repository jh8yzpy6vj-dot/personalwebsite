import { umgebung, type Umgebung } from "./umgebung";
import { nichtGefunden, verboten } from "./antwort";

/**
 * **Wer darf in die Verwaltung?** — geprüft auf dem Server, bei jeder Anfrage.
 *
 * Vor `/admin` steht Cloudflare Access: Es meldet Jakob per E-Mail-Code an
 * und hängt jeder durchgelassenen Anfrage ein signiertes JWT an
 * (`cf-access-jwt-assertion`). Hier wird dieses JWT **trotzdem selbst**
 * geprüft, aus zwei Gründen:
 *
 * - Access wirkt nur, wenn die Application im Dashboard richtig auf den Pfad
 *   gelegt ist. Ein Tippfehler dort (`/admin` statt `/api/admin`), und die
 *   Schnittstelle wäre offen — ohne dass es jemand merkt.
 * - Der Worker ist auch unter `*.workers.dev` erreichbar, wo Access gar nicht
 *   davorsteht. Ein blanker Header „bin angemeldet" wäre dort fälschbar; eine
 *   RSA-Signatur von Cloudflare nicht.
 *
 * ⚠️ **Fail closed.** Fehlt irgendein Teil der Einrichtung, ist die
 * Verwaltung nicht da (404) — nie offen.
 */

export type Zugang = { ok: true; email: string } | { ok: false; grund: string };

/** Spielraum für Uhren, die nicht ganz gleich gehen (Sekunden). */
const SPIELRAUM = 60;
/** So lange gelten die geladenen Schlüssel von Cloudflare (ms). */
const SCHLUESSEL_GUELTIG = 60 * 60 * 1000;
/**
 * Bei unbekanntem `kid` frühestens nach dieser Zeit neu laden (ms). Sonst
 * könnte jeder mit erfundenen `kid`s den Worker die Zertifikate in
 * Dauerschleife holen lassen.
 */
const NEU_LADEN_FRUEHESTENS = 30 * 1000;

// ---------------------------------------------------------------------------
// Kleinzeug: Base64url und JSON
// ---------------------------------------------------------------------------

const BASE64URL = /^[A-Za-z0-9_-]*$/;

function ausBase64url(teil: string): Uint8Array<ArrayBuffer> | null {
  if (!BASE64URL.test(teil)) return null;
  const b64 = teil.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((teil.length + 3) % 4);
  try {
    const binaer = atob(b64);
    const bytes = new Uint8Array(binaer.length);
    for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function jsonAus(teil: string): Record<string, unknown> | null {
  const bytes = ausBase64url(teil);
  if (!bytes) return null;
  try {
    const wert: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof wert === "object" && wert !== null && !Array.isArray(wert)
      ? (wert as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Die Teamdomain in einer Form: ohne `https://`, ohne Schrägstrich am Ende,
 * klein. Im Dashboard wird sie mal so, mal so kopiert. Was danach nicht wie
 * ein Hostname aussieht, gilt als nicht eingerichtet — die Domain wird in
 * eine Adresse eingesetzt, die der Worker abruft.
 */
export function normalisiereTeam(team: string | undefined): string | null {
  if (!team) return null;
  const host = team
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)
    ? host
    : null;
}

/** `ADMIN_EMAILS` → Liste, getrimmt und klein. */
export function erlaubteEmails(liste: string | undefined): string[] {
  return (liste ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e !== "");
}

// ---------------------------------------------------------------------------
// Der Kern: ein JWT prüfen
// ---------------------------------------------------------------------------

export type JwtPruefung = {
  /** Teamdomain, normalisiert (`jakobsax.cloudflareaccess.com`). */
  team: string;
  /** Application Audience Tag. */
  aud: string;
  /** Erlaubte E-Mails, klein geschrieben. */
  erlaubt: string[];
  /** Liefert den öffentlichen Schlüssel zu einer `kid`, oder `null`. */
  schluessel: (kid: string) => Promise<CryptoKey | null>;
  /** Jetzt, in Sekunden seit 1970. */
  jetzt: number;
};

/**
 * Prüft ein Access-JWT vollständig. Rein bis auf `schluessel` — so lässt sie
 * sich mit einem selbst erzeugten Schlüsselpaar testen. Wirft nie.
 *
 * ⚠️ Die Reihenfolge ist Absicht: Erst `alg` festnageln, dann Signatur, dann
 * erst den Inhalt glauben. Die klassische JWT-Falle ist ein Token mit
 * `"alg": "none"` oder `HS256` (mit dem öffentlichen Schlüssel als
 * „Geheimnis"), das eine nachgiebige Bibliothek durchwinkt. Hier gibt es nur
 * RS256.
 */
export async function pruefeJwt(token: string, p: JwtPruefung): Promise<Zugang> {
  const teile = token.split(".");
  if (teile.length !== 3) return { ok: false, grund: "kein JWT" };
  const [kopfTeil, inhaltTeil, signaturTeil] = teile;

  const kopf = jsonAus(kopfTeil);
  if (!kopf) return { ok: false, grund: "JWT-Kopf unlesbar" };
  if (kopf.alg !== "RS256") return { ok: false, grund: "falscher Algorithmus" };
  if (typeof kopf.kid !== "string" || kopf.kid === "") return { ok: false, grund: "kid fehlt" };

  const signatur = ausBase64url(signaturTeil);
  if (!signatur || signatur.length === 0) return { ok: false, grund: "Signatur unlesbar" };

  let schluessel: CryptoKey | null;
  try {
    schluessel = await p.schluessel(kopf.kid);
  } catch {
    return { ok: false, grund: "Schlüssel nicht abrufbar" };
  }
  if (!schluessel) return { ok: false, grund: "unbekannter Schlüssel" };

  let echt = false;
  try {
    echt = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      schluessel,
      signatur,
      new TextEncoder().encode(`${kopfTeil}.${inhaltTeil}`),
    );
  } catch {
    echt = false;
  }
  if (!echt) return { ok: false, grund: "Signatur ungültig" };

  const claims = jsonAus(inhaltTeil);
  if (!claims) return { ok: false, grund: "JWT-Inhalt unlesbar" };

  if (typeof claims.exp !== "number") return { ok: false, grund: "exp fehlt" };
  if (p.jetzt > claims.exp + SPIELRAUM) return { ok: false, grund: "abgelaufen" };
  if (claims.nbf !== undefined) {
    if (typeof claims.nbf !== "number") return { ok: false, grund: "nbf unlesbar" };
    if (p.jetzt + SPIELRAUM < claims.nbf) return { ok: false, grund: "noch nicht gültig" };
  }

  if (claims.iss !== `https://${p.team}`) return { ok: false, grund: "falscher Aussteller" };

  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.some((a) => typeof a === "string" && a === p.aud)) {
    return { ok: false, grund: "falsche Audience" };
  }

  // Service-Tokens von Access tragen keine E-Mail — die sind hier nicht gemeint.
  if (typeof claims.email !== "string") return { ok: false, grund: "keine E-Mail im Token" };
  const email = claims.email.trim().toLowerCase();
  if (email === "" || !p.erlaubt.includes(email)) {
    // ⚠️ Die abgelehnte Adresse steht bewusst nicht im Grund: Der landet im Log.
    return { ok: false, grund: "E-Mail nicht freigegeben" };
  }

  return { ok: true, email };
}

// ---------------------------------------------------------------------------
// Schlüssel von Cloudflare (JWKS), mit Modul-Cache
// ---------------------------------------------------------------------------

type Schluesselbund = { team: string; geladen: number; schluessel: Map<string, CryptoKey> };
let bund: Schluesselbund | null = null;

/** Für Tests: Cache leeren. */
export function vergissSchluessel(): void {
  bund = null;
}

async function ladeSchluessel(team: string, holen: typeof fetch): Promise<Map<string, CryptoKey>> {
  const antwort = await holen(`https://${team}/cdn-cgi/access/certs`, {
    headers: { accept: "application/json" },
  });
  if (!antwort.ok) throw new Error(`Access-Schlüssel nicht abrufbar (${antwort.status})`);
  const daten = (await antwort.json()) as { keys?: unknown };
  const karte = new Map<string, CryptoKey>();
  for (const k of Array.isArray(daten.keys) ? daten.keys : []) {
    if (typeof k !== "object" || k === null) continue;
    const jwk = k as Record<string, unknown>;
    if (jwk.kty !== "RSA" || typeof jwk.kid !== "string") continue;
    if (typeof jwk.n !== "string" || typeof jwk.e !== "string") continue;
    try {
      // Nur n und e übernehmen: Ein mitgeliefertes `alg`/`key_ops` soll den
      // Import nicht scheitern lassen — der Algorithmus steht ohnehin hier fest.
      karte.set(
        jwk.kid,
        await crypto.subtle.importKey(
          "jwk",
          { kty: "RSA", n: jwk.n, e: jwk.e, ext: true },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"],
        ),
      );
    } catch {
      // Ein kaputter Schlüssel soll die anderen nicht mitreißen.
    }
  }
  return karte;
}

/**
 * Schlüssel zu `kid` — aus dem Cache, sonst frisch geladen. Cloudflare
 * wechselt die Schlüssel regelmäßig; ein neues `kid` heißt deshalb
 * „nachladen", nicht „ablehnen".
 */
export async function schluesselFuer(
  team: string,
  kid: string,
  holen: typeof fetch = fetch,
  jetztMs: number = Date.now(),
): Promise<CryptoKey | null> {
  const frisch = bund && bund.team === team && jetztMs - bund.geladen < SCHLUESSEL_GUELTIG;
  if (frisch && bund!.schluessel.has(kid)) return bund!.schluessel.get(kid)!;
  if (frisch && jetztMs - bund!.geladen < NEU_LADEN_FRUEHESTENS) return null;

  bund = { team, geladen: jetztMs, schluessel: await ladeSchluessel(team, holen) };
  return bund.schluessel.get(kid) ?? null;
}

// ---------------------------------------------------------------------------
// Für Seite und Routen
// ---------------------------------------------------------------------------

/**
 * Prüft den Zugang einer Anfrage. `u` und `holen` nur für Tests — im
 * Betrieb kommen sie aus der Worker-Umgebung bzw. sind das globale `fetch`.
 */
export async function pruefeZugang(
  headers: Headers,
  u?: Umgebung,
  holen: typeof fetch = fetch,
): Promise<Zugang> {
  const env = u ?? (await umgebung());

  /*
   * Abkürzung für `next dev`. ⚠️ Doppelt gesichert: `ADMIN_DEV` allein
   * reicht nicht, es muss auch wirklich der Entwicklungsserver sein. Im
   * Produktionsbuild setzt Next `NODE_ENV` fest auf "production" ein — wer
   * `ADMIN_DEV=1` versehentlich im Dashboard setzt, öffnet damit nichts.
   */
  if (process.env.NODE_ENV === "development" && env.ADMIN_DEV === "1") {
    return { ok: true, email: "dev@localhost" };
  }

  const team = normalisiereTeam(env.ADMIN_ACCESS_TEAM);
  const aud = env.ADMIN_ACCESS_AUD;
  const erlaubt = erlaubteEmails(env.ADMIN_EMAILS);
  if (!team || !aud || erlaubt.length === 0) {
    return { ok: false, grund: "Zugang nicht eingerichtet" };
  }

  const token = headers.get("cf-access-jwt-assertion");
  if (!token) return { ok: false, grund: "kein Access-Token" };

  return pruefeJwt(token.trim(), {
    team,
    aud,
    erlaubt,
    schluessel: (kid) => schluesselFuer(team, kid, holen),
    jetzt: Math.floor(Date.now() / 1000),
  });
}

/**
 * Für Routen: die E-Mail der angemeldeten Person, oder eine fertige
 * 404-Antwort. Bewusst 404 und nicht 401/403 — von außen soll nicht zu
 * erkennen sein, dass es hier überhaupt etwas gibt.
 */
export async function zugangOder404(request: Request): Promise<string | Response> {
  const zugang = await pruefeZugang(request.headers);
  if (zugang.ok) return zugang.email;
  // Nur der Grund, nie Token oder Adresse.
  console.warn(`Verwaltung: Zugang abgelehnt (${zugang.grund})`);
  return nichtGefunden();
}

/**
 * Schutz gegen Anfragen von fremden Seiten (CSRF): Ein angemeldeter Browser
 * schickt das Access-Cookie überallhin mit — auch, wenn eine fremde Seite
 * ein Formular an `/api/admin/speichern` abschickt. Mutierende Anfragen
 * gehen deshalb nur durch, wenn sie nachweislich von der eigenen Seite kommen.
 *
 * Gibt `null` zurück, wenn alles stimmt, sonst eine 403-Antwort.
 */
export function pruefeHerkunft(request: Request): Response | null {
  const herkunft = request.headers.get("origin");
  if (herkunft) {
    try {
      if (herkunft === new URL(request.url).origin) return null;
    } catch {
      // unlesbare Adresse → weiter unten ablehnen, falls auch Sec-Fetch fehlt
    }
  }
  if (request.headers.get("sec-fetch-site") === "same-origin") return null;
  return verboten("Diese Anfrage kam nicht von der Verwaltung selbst.");
}
