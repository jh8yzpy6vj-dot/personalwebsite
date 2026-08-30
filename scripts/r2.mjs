/**
 * Dünner Zugriff auf den R2-Bucket — auflisten, holen, ablegen.
 *
 * R2 spricht die S3-API. Signiert wird mit `aws4fetch` (88 kB, keine
 * Abhängigkeiten) statt mit dem AWS-SDK, das für ein Build-Skript ein
 * Vielfaches an Gewicht mitbrächte.
 *
 * ⚠️ **Dieses Modul läuft ausschließlich lokal**, nie im Cloudflare-Build und
 * nie im Worker. Der Build liest nur das eingecheckte Manifest; die
 * Zugangsdaten müssen deshalb nirgends außer auf euren Rechnern liegen.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AwsClient } from "aws4fetch";

const WURZEL = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

/**
 * `.dev.vars` einlesen, falls vorhanden.
 *
 * Die Datei ist im Projekt ohnehin **der** Ort für Zugangsdaten (sie ist von
 * Git ausgenommen, und `wrangler` liest sie von selbst). Ein blankes
 * Node-Skript täte das nicht — dann müsste man die Werte vor jedem Aufruf
 * von Hand exportieren, und genau daran scheitert so ein Ablauf im Alltag.
 *
 * **Was schon in der Umgebung steht, gewinnt.** So bleibt ein einmaliges
 * `R2_BUCKET=test npm run medien` möglich, ohne die Datei zu ändern.
 */
function ausDevVars() {
  const datei = path.join(WURZEL, ".dev.vars");
  if (!existsSync(datei)) return;

  for (const zeile of readFileSync(datei, "utf8").split("\n")) {
    const treffer = zeile.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!treffer) continue; // Kommentar, Leerzeile, Unfug
    const [, name, roh] = treffer;
    if (process.env[name] !== undefined) continue;
    // Anführungszeichen sind hier Schreibweise, nicht Inhalt.
    process.env[name] = roh.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

/**
 * Zugangsdaten aus der Umgebung oder aus `.dev.vars` (ist bereits von Git
 * ausgenommen) — **niemals aus einer eingecheckten Datei**.
 *
 * Die Werte stehen im Cloudflare-Dashboard unter R2 → „Manage API Tokens".
 * Nötig ist ein Token mit **Object Read & Write** für genau diesen Bucket.
 */
export function zugang() {
  ausDevVars();

  const fehlend = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ].filter((k) => !process.env[k]);

  if (fehlend.length > 0) {
    throw new Error(
      `R2-Zugangsdaten fehlen: ${fehlend.join(", ")}.\n` +
        `    Lege sie in .dev.vars an (die Datei ist bereits von Git ausgenommen)\n` +
        `    oder setze sie in der Shell. Anleitung: TECH-STACK.md, Abschnitt „Medien".`,
    );
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;

  return {
    client: new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    }),
    /** Der S3-Endpunkt des Buckets. Nicht die öffentliche Adresse. */
    basis: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
}

/**
 * Alle Objekte unter einem Präfix.
 *
 * Blättert selbstständig: S3 liefert höchstens 1000 Einträge je Antwort und
 * gibt dann einen Fortsetzungspunkt zurück. Ohne das Blättern fehlten ab dem
 * 1001. Bild schlicht welche — ein Fehler, der lange unbemerkt bliebe.
 */
export async function liste(r2, praefix) {
  const objekte = [];
  let weiter;

  do {
    const u = new URL(r2.basis);
    u.searchParams.set("list-type", "2");
    u.searchParams.set("prefix", praefix);
    if (weiter) u.searchParams.set("continuation-token", weiter);

    const antwort = await r2.client.fetch(u);
    if (!antwort.ok) {
      throw new Error(`R2 auflisten fehlgeschlagen (${antwort.status}): ${await antwort.text()}`);
    }
    const xml = await antwort.text();

    for (const eintrag of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const feld = (name) =>
        eintrag[1].match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];
      const key = feld("Key");
      if (!key || key.endsWith("/")) continue; // Ordner-Platzhalter
      objekte.push({
        key,
        groesse: Number(feld("Size") ?? 0),
        // Die ETag ist bei einfachen Uploads die MD5-Summe. Reicht, um zu
        // erkennen, ob sich eine Datei geändert hat.
        etag: (feld("ETag") ?? "").replaceAll("&quot;", "").replaceAll('"', ""),
      });
    }

    weiter = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
    const gekuerzt = xml.match(/<IsTruncated>(true|false)<\/IsTruncated>/)?.[1];
    if (gekuerzt !== "true") weiter = undefined;
  } while (weiter);

  return objekte;
}

/** Ein Objekt als Buffer. */
export async function hole(r2, key) {
  const antwort = await r2.client.fetch(`${r2.basis}/${encodeURI(key)}`);
  if (!antwort.ok) {
    throw new Error(`R2 holen fehlgeschlagen für ${key} (${antwort.status})`);
  }
  return Buffer.from(await antwort.arrayBuffer());
}

/** Ein Objekt ablegen. `typ` ist der Content-Type, den R2 später ausliefert. */
export async function lege(r2, key, daten, typ) {
  const antwort = await r2.client.fetch(`${r2.basis}/${encodeURI(key)}`, {
    method: "PUT",
    body: daten,
    headers: {
      "content-type": typ,
      /*
       * Ein Jahr, unveränderlich. Das ist gefahrlos, weil jede Variante die
       * Breite im Dateinamen trägt: Ändert sich das Bild, ändert sich der
       * Name nicht — deshalb schreibt die Pipeline bei geändertem Original
       * alle Varianten neu und der Browser holt sie über die neue Prüfsumme
       * im Manifest. Bei gleichbleibendem Bild soll er sie gerade **nicht**
       * neu holen.
       */
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
  if (!antwort.ok) {
    throw new Error(`R2 ablegen fehlgeschlagen für ${key} (${antwort.status}): ${await antwort.text()}`);
  }
}

/** Ein Objekt löschen — für Varianten, deren Original verschwunden ist. */
export async function loesche(r2, key) {
  const antwort = await r2.client.fetch(`${r2.basis}/${encodeURI(key)}`, {
    method: "DELETE",
  });
  if (!antwort.ok && antwort.status !== 404) {
    throw new Error(`R2 löschen fehlgeschlagen für ${key} (${antwort.status})`);
  }
}
