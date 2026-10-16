/**
 * Dünner Zugriff auf den R2-Bucket — auflisten, holen, ablegen.
 *
 * R2 spricht die S3-API. Signiert wird mit `aws4fetch` (88 kB, keine
 * Abhängigkeiten) statt mit dem AWS-SDK, das für ein Build-Skript ein
 * Vielfaches an Gewicht mitbrächte.
 *
 * ⚠️ **Dieses Modul läuft lokal oder in der Medien-Action**
 * (`.github/workflows/medien.yml`), nie im Cloudflare-Build und nie im
 * Worker. Der Build liest nur das eingecheckte Manifest; die Zugangsdaten
 * liegen deshalb nur auf euren Rechnern und als Secrets bei GitHub.
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

  const roh = readFileSync(datei);
  const werte = leseDevVars(entziffere(roh));

  /*
   * ⚠️ **Eine Datei mit Inhalt, aus der nichts herauskommt, ist ein Fehler
   * und keine leere Umgebung.** Sonst folgt die Meldung „Zugangsdaten
   * fehlen" — und man sucht an der falschen Stelle, nämlich beim Token statt
   * bei der Datei. Genau das ist am 2026-09-12 zweimal passiert.
   *
   * Übrig bleibt vor allem UTF-16 ohne BOM: Das lässt sich nicht zuverlässig
   * erkennen, deshalb wird hier nicht geraten, sondern gesagt, was zu tun ist.
   */
  if (roh.length > 0 && Object.keys(werte).length === 0) {
    throw new Error(
      `.dev.vars hat ${roh.length} Bytes, aber keine einzige lesbare Zeile.\n` +
        `    Erwartet wird je Zeile NAME=wert, als UTF-8 gespeichert.\n` +
        `    Häufigste Ursache: die Datei liegt in UTF-16 vor. In VS Code unten\n` +
        `    rechts auf die Kodierung klicken → „Save with Encoding" → UTF-8.`,
    );
  }

  for (const [name, wert] of Object.entries(werte)) {
    // Was schon in der Umgebung steht, gewinnt.
    if (process.env[name] === undefined) process.env[name] = wert;
  }
}

/**
 * Bytes zu Text — mit Rücksicht auf das, was Windows so erzeugt.
 *
 * ⚠️ PowerShell schreibt je nach Version und Befehl **UTF-16**, und Editoren
 * setzen gern ein BOM davor. Wird so etwas als UTF-8 gelesen, steht in jedem
 * zweiten Byte eine Null und keine einzige Zeile passt mehr.
 */
function entziffere(roh) {
  if (roh[0] === 0xff && roh[1] === 0xfe) return roh.subarray(2).toString("utf16le");
  if (roh[0] === 0xfe && roh[1] === 0xff) return roh.subarray(2).swap16().toString("utf16le");
  return roh.toString("utf8").replace(/^﻿/, "");
}

/**
 * `NAME=wert`-Zeilen zu einem Objekt. Rein, damit es prüfbar bleibt —
 * `scripts/r2.test.mjs`.
 *
 * ⚠️ **Getrennt wird an `\r?\n`, nicht an `\n`.** Das war ein echter Fehler,
 * und ein überraschender: In JavaScript zählt `\r` als Zeilenende, und `.`
 * matcht Zeilenenden **nicht**. Ein an `\n` zerlegtes CRLF-Dokument behält
 * also ein `\r` am Zeilenende, und `(.*)$` scheitert daran — an *jeder* Zeile.
 * Da CRLF auf Windows der Normalfall ist, las die Datei sich dort nie ein,
 * während sie hier zum Test brav funktionierte.
 */
export function leseDevVars(text) {
  const werte = {};
  for (const zeile of text.split(/\r?\n/)) {
    const treffer = zeile.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!treffer) continue; // Kommentar, Leerzeile, Unfug
    const [, name, roh] = treffer;
    // Anführungszeichen sind hier Schreibweise, nicht Inhalt.
    werte[name] = roh.trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return werte;
}

/**
 * Zugangsdaten aus der Umgebung oder aus `.dev.vars` (ist bereits von Git
 * ausgenommen) — **niemals aus einer eingecheckten Datei**.
 *
 * Die Werte stehen im Cloudflare-Dashboard unter R2 → „Manage API Tokens".
 * Nötig ist ein Token mit **Object Read & Write** für genau diesen Bucket
 * (für die Medien-Action: für beide Buckets, siehe `zugangEingang`).
 *
 * Ohne Angabe ist es der öffentliche Bucket aus `R2_BUCKET` — so rufen es
 * alle bisherigen Skripte auf. `bucket` wählt einen anderen mit denselben
 * Zugangsdaten. `jurisdiktion` (auch `""` für „keine") ersetzt
 * `R2_S3_ENDPOINT`/`R2_JURISDICTION`, für einen Bucket, der anders angelegt
 * ist als der öffentliche.
 *
 * @param {{ bucket?: string; bucketName?: string; jurisdiktion?: string }} [optionen]
 *   `bucketName` ist nur der Name der Variablen für die Fehlermeldung.
 */
export function zugang(optionen = {}) {
  ausDevVars();

  const bucketName = optionen.bucketName ?? "R2_BUCKET";
  const bucket = "bucket" in optionen ? optionen.bucket : process.env.R2_BUCKET;

  const fehlend = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].filter(
    (k) => !process.env[k],
  );
  if (!bucket) fehlend.push(bucketName);

  if (fehlend.length > 0) {
    // ⚠️ Nur die Namen, nie die Werte — die Meldung landet im Log der Action.
    throw new Error(
      `R2-Zugangsdaten fehlen: ${fehlend.join(", ")}.\n` +
        `    Lege sie in .dev.vars an (die Datei ist bereits von Git ausgenommen)\n` +
        `    oder setze sie in der Shell. Anleitung: TECH-STACK.md, Abschnitt „Medien".`,
    );
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT, R2_JURISDICTION } =
    process.env;

  const eigene = optionen.jurisdiktion !== undefined;
  const konto = eigene
    ? endpunkt(R2_ACCOUNT_ID, undefined, optionen.jurisdiktion)
    : endpunkt(R2_ACCOUNT_ID, R2_S3_ENDPOINT, R2_JURISDICTION);

  return {
    client: new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    }),
    /** Der S3-Endpunkt des Buckets. Nicht die öffentliche Adresse. */
    basis: `${konto}/${bucket}`,
  };
}

/**
 * Ist der Eingangs-Bucket eingerichtet? Liest `.dev.vars` mit, damit lokal
 * dieselbe Antwort kommt wie in der Action.
 */
export function eingangEingerichtet() {
  ausDevVars();
  return Boolean(process.env.EINGANG_BUCKET);
}

/**
 * Der **private** Eingangs-Bucket (`EINGANG_BUCKET`), in den die Verwaltung
 * hochgeladene Bilder legt — mit denselben Zugangsdaten wie der öffentliche.
 *
 * ⚠️ **Warum ein eigener, privater Bucket.** Eine frisch hochgeladene Datei
 * trägt noch alle Metadaten der Kamera, oft mit GPS. Läge sie auch nur für
 * Minuten im öffentlichen Bucket, wäre der Aufnahmeort über ihre Adresse
 * abrufbar. Erst `scripts/eingang.mjs` säubert sie und legt sie nach
 * `original/`.
 *
 * Liegt der Eingang in einer anderen Jurisdiction als der öffentliche
 * Bucket, gibt `EINGANG_JURISDICTION` sie an (`eu`, oder leer für keine).
 */
export function zugangEingang() {
  ausDevVars();
  const { EINGANG_BUCKET, EINGANG_JURISDICTION } = process.env;
  return zugang({
    bucket: EINGANG_BUCKET,
    bucketName: "EINGANG_BUCKET",
    ...(EINGANG_JURISDICTION !== undefined ? { jurisdiktion: EINGANG_JURISDICTION } : {}),
  });
}

/**
 * Die S3-Adresse des Kontos — ohne den Bucket.
 *
 * ⚠️ **Ein Bucket mit Jurisdiction hat einen anderen Endpunkt.** Wer ihn in
 * der EU anlegt (in Cloudflare beim Anlegen wählbar, hinterher nicht mehr
 * änderbar), bekommt `<konto>.eu.r2.cloudflarestorage.com` statt
 * `<konto>.r2.cloudflarestorage.com`. Ohne das `.eu.` greift jede Anfrage ins
 * Leere — beim ersten echten Bucket genau so passiert, weil ich die
 * Jurisdiction schlicht nicht bedacht hatte.
 *
 * Zwei Wege, beide optional:
 *
 * - **`R2_S3_ENDPOINT`** — die Adresse aus dem Dashboard (R2 → Bucket →
 *   Settings → „S3 API"), zum Kopieren gedacht. Der Bucketname darf dranhängen
 *   und wird abgeschnitten. Das ist der sichere Weg: keine Tipparbeit, keine
 *   Annahme über die Jurisdiction.
 * - **`R2_JURISDICTION`** — nur das Kürzel, z. B. `eu`.
 *
 * Ohne beides bleibt es beim Standard, und der stimmt für Buckets ohne
 * Jurisdiction.
 */
function endpunkt(konto, ausDashboard, jurisdiktion) {
  if (ausDashboard) {
    let url;
    try {
      url = new URL(ausDashboard.trim());
    } catch {
      // Ohne den Wert: Die Meldung kann im öffentlichen Log der Action landen.
      throw new Error(
        `R2_S3_ENDPOINT ist keine gültige Adresse.\n` +
          `    Erwartet wird die Zeile „S3 API" aus R2 → Bucket → Settings,\n` +
          `    also etwa https://<konto>.eu.r2.cloudflarestorage.com/<bucket>`,
      );
    }
    // Der Pfad ist der Bucketname und steht ohnehin in R2_BUCKET.
    return `${url.protocol}//${url.host}`;
  }

  const teil = jurisdiktion ? `.${jurisdiktion.trim().toLowerCase()}` : "";
  return `https://${konto}${teil}.r2.cloudflarestorage.com`;
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
      throw new Error(`R2 auflisten fehlgeschlagen (${antwort.status})${s3Grund(await antwort.text())}`);
    }
    const xml = await antwort.text();

    for (const eintrag of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const feld = (name) =>
        eintrag[1].match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1];
      const key = feld("Key");
      if (!key || key.endsWith("/")) continue; // Ordner-Platzhalter
      objekte.push({
        // ⚠️ S3 maskiert `&`, `<`, `>` im XML. Ohne Rückübersetzung käme
        // „a&amp;b.jpg" als Schlüssel zurück, den es so nicht gibt.
        key: xmlText(key),
        groesse: Number(feld("Size") ?? 0),
        // Die ETag ist bei einfachen Uploads die MD5-Summe. Reicht, um zu
        // erkennen, ob sich eine Datei geändert hat.
        etag: (feld("ETag") ?? "").replaceAll("&quot;", "").replaceAll('"', ""),
        /** ISO-Zeitpunkt des letzten Schreibens — der Eingang nimmt das Neueste. */
        geaendert: feld("LastModified") ?? "",
      });
    }

    weiter = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
    const gekuerzt = xml.match(/<IsTruncated>(true|false)<\/IsTruncated>/)?.[1];
    if (gekuerzt !== "true") weiter = undefined;
  } while (weiter);

  return objekte;
}

/**
 * Aus einer S3-Fehlerantwort nur `<Code>` und `<Message>` — als
 * `": Code – Message"` oder leer.
 *
 * ⚠️ **Nicht mehr den ganzen Rumpf.** Seit die Skripte auch in der
 * Medien-Action laufen, steht jede Fehlermeldung im Log eines **öffentlichen**
 * Repos. Das Fehler-XML von S3 nennt je nach Fehler die Access-Key-ID, die
 * signierte Anfrage oder den kanonischen Request. GitHub maskiert zwar
 * eingetragene Secrets im Log, aber nur exakt diese Zeichenketten — darauf
 * baut eine Sicherheitsgrenze nicht.
 */
export function s3Grund(xml) {
  const feld = (name) => xml.match(new RegExp(`<${name}>([^<]{0,200})</${name}>`))?.[1];
  const code = feld("Code");
  const nachricht = feld("Message");
  if (!code && !nachricht) return "";
  return `: ${[code, nachricht].filter(Boolean).map((t) => xmlText(t)).join(" – ")}`;
}

/** Die fünf XML-Entitäten zurück in Zeichen. `&amp;` zuletzt, sonst würde `&amp;lt;` zu `<`. */
export function xmlText(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/** Ein Objekt als Buffer. */
export async function hole(r2, key) {
  const antwort = await r2.client.fetch(`${r2.basis}/${encodeURI(key)}`);
  if (!antwort.ok) {
    throw new Error(`R2 holen fehlgeschlagen für ${key} (${antwort.status})`);
  }
  return Buffer.from(await antwort.arrayBuffer());
}

/**
 * Für Originale: Sie werden **unter gleichem Namen ersetzt** (die
 * Verwaltung tauscht ein Bild aus), tragen aber keinen Fingerabdruck in der
 * Adresse. `immutable` hielte dort das alte Bild ein Jahr lang am Rand fest.
 */
export const KURZ_ZWISCHENSPEICHERN = "public, max-age=3600";

/**
 * Ein Objekt ablegen. `typ` ist der Content-Type, den R2 später ausliefert.
 * `cache` ist der Cache-Control-Kopf; ohne Angabe ein Jahr unveränderlich —
 * richtig nur für Varianten mit Fingerabdruck (Begründung unten).
 */
export async function lege(r2, key, daten, typ, cache = "public, max-age=31536000, immutable") {
  const antwort = await r2.client.fetch(`${r2.basis}/${encodeURI(key)}`, {
    method: "PUT",
    body: daten,
    headers: {
      "content-type": typ,
      /*
       * Ein Jahr, unveränderlich — **nur zusammen mit dem Fingerabdruck in
       * der Adresse** (`?v=…`, siehe `verarbeite()` in `medien.mjs`).
       *
       * ⚠️ Hier stand die Begründung, das sei gefahrlos, „weil der Browser
       * sie über die neue Prüfsumme im Manifest holt". **Diese Prüfsumme gab
       * es nicht.** Im Manifest stand die blanke Adresse, und die ändert sich
       * beim Bildwechsel nicht. Ergebnis: Jan tauschte die Fotos aus, die
       * Pipeline lud sie brav hoch — und Browser wie Cloudflare-Edge zeigten
       * ein Jahr lang weiter die alten, wegen `immutable` ohne nachzufragen.
       *
       * Der Fingerabdruck macht die Zusage jetzt wahr: gleiche Adresse heißt
       * wirklich gleiches Bild.
       */
      "cache-control": cache,
    },
  });
  if (!antwort.ok) {
    throw new Error(
      `R2 ablegen fehlgeschlagen für ${key} (${antwort.status})${s3Grund(await antwort.text())}`,
    );
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
