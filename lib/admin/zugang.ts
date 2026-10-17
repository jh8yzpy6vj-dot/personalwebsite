import { umgebung, type Umgebung } from "./umgebung";
import { nichtGefunden, verboten } from "./antwort";

/**
 * **Wer darf in die Verwaltung?** — geprüft auf dem Server, bei jeder Anfrage.
 *
 * Seit 2026-10-17 mit **einem Passwort** (Worker-Secret `ADMIN_PASSWORT`)
 * statt Cloudflare Access: Access hätte nur Jakob im Dashboard anlegen
 * können. Nach der Anmeldung (`/api/admin/anmelden`) trägt der Browser ein
 * Sitzungs-Cookie: Ablaufzeit plus HMAC-Signatur. Der Schlüssel für die
 * Signatur ist das Passwort selbst — **wer das Passwort ändert, meldet damit
 * alle Sitzungen ab.** Aus dem Cookie lässt sich das Passwort nicht
 * zurückrechnen.
 *
 * ⚠️ **Fail closed.** Fehlt `ADMIN_PASSWORT` oder ist es kürzer als
 * `MIN_LAENGE`, ist die Verwaltung nicht da (404) — nie offen.
 *
 * ⚠️ Es gibt keine Sperre nach Fehlversuchen (der Worker hat keinen
 * Speicher dafür), nur eine Verzögerung je Fehlversuch. Den Schutz trägt
 * die Länge des Passworts — deshalb die Mindestlänge.
 */

export type Zugang = { ok: true } | { ok: false; grund: string; eingerichtet: boolean };

/** Name des Cookies. `__Host-`: nur über HTTPS, nur für genau diese Domain, Pfad `/`. */
export const COOKIE = "__Host-verwaltung";
/** So lange bleibt man angemeldet. */
export const SITZUNG_TAGE = 30;
/** Kürzere Passwörter gelten als „nicht eingerichtet". */
export const MIN_LAENGE = 12;

const SITZUNG_SEKUNDEN = SITZUNG_TAGE * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Kleinzeug
// ---------------------------------------------------------------------------

function nachBase64url(bytes: ArrayBuffer): string {
  let binaer = "";
  for (const b of new Uint8Array(bytes)) binaer += String.fromCharCode(b);
  return btoa(binaer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(schluessel: string, text: string): Promise<string> {
  const kodierer = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    kodierer.encode(schluessel),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return nachBase64url(await crypto.subtle.sign("HMAC", key, kodierer.encode(text)));
}

/** Vergleich in fester Zeit — sonst verrät die Antwortzeit, wie viele Zeichen stimmen. */
function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let unterschied = 0;
  for (let i = 0; i < a.length; i++) unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return unterschied === 0;
}

// ---------------------------------------------------------------------------
// Der Kern — rein, damit testbar
// ---------------------------------------------------------------------------

/** Das Passwort aus der Umgebung, oder `null`, solange es fehlt oder zu kurz ist. */
export function passwortAus(u: Umgebung): string | null {
  const p = u.ADMIN_PASSWORT;
  return p && p.length >= MIN_LAENGE ? p : null;
}

/**
 * Stimmt die Eingabe? Beide Seiten gehen erst durch HMAC, damit der
 * Vergleich gleich lange Zeichenketten sieht und die Länge des Passworts
 * nicht an der Antwortzeit abzulesen ist.
 */
export async function passwortRichtig(eingabe: string, passwort: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    hmac("verwaltung-vergleich", eingabe),
    hmac("verwaltung-vergleich", passwort),
  ]);
  return gleich(a, b);
}

/** Neuer Cookie-Wert: `v1.<ablauf>.<signatur>`. `jetzt` in Sekunden. */
export async function neueSitzung(passwort: string, jetzt: number): Promise<string> {
  const ablauf = jetzt + SITZUNG_SEKUNDEN;
  return `v1.${ablauf}.${await hmac(passwort, `sitzung:v1:${ablauf}`)}`;
}

/** Prüft einen Cookie-Wert. Wirft nie. */
export async function sitzungGueltig(
  wert: string,
  passwort: string,
  jetzt: number,
): Promise<boolean> {
  const teile = wert.split(".");
  if (teile.length !== 3 || teile[0] !== "v1") return false;
  if (!/^\d{1,12}$/.test(teile[1])) return false;
  const ablauf = Number(teile[1]);
  if (ablauf < jetzt || ablauf > jetzt + SITZUNG_SEKUNDEN) return false;
  return gleich(teile[2], await hmac(passwort, `sitzung:v1:${ablauf}`));
}

/** Den Wert eines Cookies aus dem `Cookie`-Header. */
export function cookieAus(headers: Headers, name: string = COOKIE): string | null {
  for (const teil of (headers.get("cookie") ?? "").split(";")) {
    const gleichheit = teil.indexOf("=");
    if (gleichheit < 0) continue;
    if (teil.slice(0, gleichheit).trim() === name) return teil.slice(gleichheit + 1).trim();
  }
  return null;
}

/**
 * `Set-Cookie` für eine Sitzung (oder zum Abmelden mit `wert = ""`).
 * `SameSite=Lax` statt `Strict`, damit ein Link auf `/admin` (aus einer Mail,
 * einem Lesezeichen) angemeldet ankommt; gegen fremde Formulare schützt
 * `pruefeHerkunft` bei jeder ändernden Anfrage.
 */
export function setzeCookie(wert: string): string {
  const dauer = wert === "" ? 0 : SITZUNG_SEKUNDEN;
  return `${COOKIE}=${wert}; Path=/; Max-Age=${dauer}; HttpOnly; Secure; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Für Seite und Routen
// ---------------------------------------------------------------------------

/** Prüft den Zugang einer Anfrage. `u` nur für Tests. */
export async function pruefeZugang(headers: Headers, u?: Umgebung): Promise<Zugang> {
  const env = u ?? (await umgebung());

  /*
   * Abkürzung für `next dev`. ⚠️ Doppelt gesichert: `ADMIN_DEV` allein
   * reicht nicht, es muss auch wirklich der Entwicklungsserver sein. Im
   * Produktionsbuild setzt Next `NODE_ENV` fest auf "production" ein — wer
   * `ADMIN_DEV=1` versehentlich im Dashboard setzt, öffnet damit nichts.
   */
  if (process.env.NODE_ENV === "development" && env.ADMIN_DEV === "1") return { ok: true };

  const passwort = passwortAus(env);
  if (!passwort) return { ok: false, grund: "Zugang nicht eingerichtet", eingerichtet: false };

  const wert = cookieAus(headers);
  if (!wert) return { ok: false, grund: "nicht angemeldet", eingerichtet: true };
  if (!(await sitzungGueltig(wert, passwort, Math.floor(Date.now() / 1000)))) {
    return { ok: false, grund: "Sitzung ungültig oder abgelaufen", eingerichtet: true };
  }
  return { ok: true };
}

/**
 * Für Routen: `null`, wenn angemeldet, sonst eine fertige 404-Antwort.
 * Bewusst 404 und nicht 401/403 — von außen soll nicht zu erkennen sein,
 * dass es hier überhaupt etwas gibt.
 */
export async function zugangOder404(request: Request): Promise<Response | null> {
  const zugang = await pruefeZugang(request.headers);
  if (zugang.ok) return null;
  // Nur der Grund, nie Cookie oder Passwort.
  console.warn(`Verwaltung: Zugang abgelehnt (${zugang.grund})`);
  return nichtGefunden();
}

/**
 * Schutz gegen Anfragen von fremden Seiten (CSRF): Ein angemeldeter Browser
 * schickt das Sitzungs-Cookie auch mit, wenn eine fremde Seite ein Formular
 * an `/api/admin/speichern` abschickt. Ändernde Anfragen gehen deshalb nur
 * durch, wenn sie nachweislich von der eigenen Seite kommen.
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
