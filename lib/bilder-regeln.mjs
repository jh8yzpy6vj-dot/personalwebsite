/**
 * Regeln der Bildpipeline — Breiten, Formate, Qualitäten, Budgets.
 *
 * Bewusst reines JavaScript ohne Abhängigkeiten: Diese Datei wird von
 * `scripts/medien.mjs` (Node, lokal) **und** von den Tests benutzt.
 * Wäre sie TypeScript, müsste das Build-Skript kompiliert werden, bevor es
 * laufen kann — für eine Handvoll Konstanten ein schlechter Tausch.
 *
 * ⚠️ Änderungen an den Werten hier ändern jedes ausgelieferte Bild. Nach
 * einer Änderung `PIPELINE_VERSION` erhöhen, sonst hält der Zwischenspeicher
 * in `.medien-cache/stand.json` die alten Dateien für aktuell.
 */

/**
 * Wird in den Cache-Schlüssel gemischt. Erhöhen, sobald sich Breiten,
 * Formate oder Qualitäten ändern — sonst werden alte Ableitungen nicht neu
 * berechnet.
 */
export const PIPELINE_VERSION = 5;

/**
 * EXIF-Felder, die aus dem Original gelesen werden — **abschließend**.
 *
 * ⚠️ Diese Liste ist eine Sicherheitsgrenze, keine Bequemlichkeit. `exifr`
 * liest mit `pick` ausschließlich die hier genannten Tags; alles andere,
 * insbesondere **GPS-Koordinaten**, wird gar nicht erst eingelesen. Bei
 * Aufnahmeorten und bei einem Journalisten ist das kein Randthema (siehe
 * TECH-STACK.md).
 *
 * `ISOSpeedRatings` steht daneben, weil ältere Kameras die Empfindlichkeit
 * dort ablegen statt unter `ISO`.
 */
export const EXIF_FELDER = [
  "DateTimeOriginal",
  "ExposureTime",
  "FNumber",
  "ISO",
  "ISOSpeedRatings",
];

/**
 * Ausgabebreiten in Pixeln.
 *
 * Die Obergrenze ist 2400 und nicht „Originalgröße": Ein Kurator schaut sich
 * das laut SITE-PLAN.md auf dem Festivalgelände mit schlechtem Netz an.
 * 2400 deckt Retina-Displays bis 1200 CSS-Pixel ab; darüber gewinnt niemand
 * sichtbar etwas, zahlt aber Ladezeit.
 */
export const BREITEN = [480, 800, 1200, 1600, 2400];

/**
 * Bis zu welcher Breite AVIF erzeugt wird.
 *
 * ⚠️ **Stand 2026-09-12 wieder bei 2400** — und das ist die eigentliche
 * Einstellung für die Bildqualität.
 *
 * Vorher stand hier 1600, mit einer reinen Bauzeit-Begründung: Der
 * Cloudflare-Build rechnete bei jedem Deploy alles neu, und die 2400er-Stufe
 * kostete allein 17,5 s je Bild. Mit dem R2-Umbau vom 2026-08-29 ist das
 * hinfällig — gerechnet wird lokal, einmal je geändertem Bild.
 *
 * **Was die Kappung tatsächlich anrichtete:** Das Bild auf der Detailseite
 * läuft mit `sizes="100vw"` über die volle Breite. Ein 1920er-Bildschirm
 * fordert 1920px an, ein Retina-Laptop 2560 und mehr — im AVIF-`srcset` stand
 * als größtes aber 1600. Der Browser nahm es und rechnete hoch. Sichtbar
 * weich, und zwar genau dort, wo die Seite ihr Versprechen einlöst.
 *
 * Gemessen an einem 3000×2000-Testbild, je Bild:
 *
 * | Breite | AVIF q62 | WebP q82 | AVIF-Zeit |
 * |--------|----------|----------|-----------|
 * | 480    |    2 kB  |    2 kB  |   0.3s    |
 * | 800    |    6 kB  |    9 kB  |   1.5s    |
 * | 1200   |   30 kB  |   46 kB  |   3.9s    |
 * | 1600   |  104 kB  |  166 kB  |   8.0s    |
 * | 2400   |  498 kB  |  685 kB  |  24.7s    |
 *
 * ⚠️ Die absoluten Zahlen gelten für ein rauschreiches Testbild und liegen
 * damit am oberen Rand; echte Fotos komprimieren besser. Das Verhältnis
 * stimmt: AVIF bleibt deutlich unter WebP.
 *
 * Wer hier wieder kappt, macht die Detailseite weich. Wer die Rechenzeit
 * drücken will, sollte stattdessen an `QUALITAET` drehen.
 */
export const AVIF_MAX_BREITE = 2400;

/**
 * Ab dieser Kantenlänge ist eine Quelldatei unnötig groß.
 *
 * Nicht der Rechenzeit wegen — Dekodieren kostet nur rund 4 % — sondern
 * wegen des Git-Verlaufs: Zwölf unbearbeitete Kameradateien waren 134 MB,
 * und die blieben dort für immer. Die Originale liegen inzwischen im
 * R2-Bucket statt im Repo, aber Bandbreite und Rechenzeit kosten sie
 * weiterhin. TECH-STACK.md nennt 2400–3000 px als Vorgabe; die Pipeline sagt
 * Bescheid, statt sie stillschweigend zu verarbeiten.
 */
export const QUELLE_WARNUNG = { kante: 4000, bytes: 6 * 1024 * 1024 };

/** Breite des JPEG-Rückfalls für Browser ohne AVIF und WebP. */
export const FALLBACK_BREITE = 1200;

/**
 * Qualitäten je Format. AVIF darf deutlich niedriger stehen als JPEG —
 * die Zahlen sind zwischen den Formaten nicht vergleichbar.
 *
 * ⚠️ **Am 2026-09-12 angehoben** (AVIF 50→62, WebP 72→82, JPEG 78→86), nachdem
 * die ersten echten Fotos live waren und sichtbar schlecht aussahen. Die alten
 * Werte stammten aus einer Zeit, in der jede Variante Bauzeit im Deploy
 * kostete; gespart wurde am falschen Ende.
 *
 * Für ein Fotografen-Portfolio ist das Bild das Produkt. Ein paar hundert
 * Kilobyte mehr sind hier besser angelegt als anderswo — die Ladezeit bleibt
 * über `srcset` und AVIF trotzdem im Rahmen.
 */
export const QUALITAET = { avif: 62, webp: 82, jpeg: 86 };

/** Breite des Vorschaubildchens (LQIP), das als Datei-URI im Manifest landet. */
export const LQIP_BREITE = 16;

/**
 * Größenbudget (siehe TODO.md, „Ladezeit als Qualitätsmerkmal").
 *
 * `warnung` gilt für die 1200er-AVIF-Variante — das ist auf den meisten
 * Geräten die tatsächlich geladene und damit die für den Bildaufbau
 * entscheidende. `fehler` gilt für jede Variante und fängt den Fall ab, dass
 * etwas grundlegend schiefgeht (ein Screenshot als PNG, eine Datei ohne
 * echte Kompression) — nicht das übliche „ein bisschen zu groß".
 */
export const BUDGET = {
  warnung: 200 * 1024,
  fehler: 1500 * 1024,
};

/**
 * Welche Breiten für ein Original sinnvoll sind.
 *
 * Nie hochskalieren: Ein 900px breites Original als 1600px auszuliefern
 * kostet Bytes und liefert keine zusätzliche Bildinformation. Ist das
 * Original kleiner als die kleinste Stufe, bleibt es bei genau einer Breite.
 */
export function breitenFuer(originalBreite) {
  const passend = BREITEN.filter((b) => b <= originalBreite);
  return passend.length > 0 ? passend : [originalBreite];
}

/** Die Breite des JPEG-Rückfalls, begrenzt auf das, was es tatsächlich gibt. */
export function fallbackBreite(breiten) {
  const passend = breiten.filter((b) => b <= FALLBACK_BREITE);
  return passend.length > 0 ? Math.max(...passend) : Math.min(...breiten);
}

/**
 * Dateiname einer Variante: `name-1200.avif`.
 *
 * `name` ist der volle Pfad ohne Endung (`arbeiten/wiwawo-52/serie/03`), nicht
 * nur der Dateiname — die Ableitungen liegen im Bucket unter `b/` im selben
 * Baum wie die Originale unter `original/`. Beim Nachsehen im Dashboard ist
 * das der entscheidende Vorteil gegenüber gehashten Namen.
 */
export function variantenName(name, breite, endung) {
  return `${name}-${breite}.${endung}`;
}

/**
 * Fertiger `srcset`-String. Wird im Manifest abgelegt statt in der
 * Komponente zusammengebaut — so gibt es genau eine Stelle, an der die
 * Pfade entstehen, und die Komponente bleibt dumm.
 */
export function srcset(basisPfad, name, breiten, endung) {
  return breiten
    .map((b) => `${basisPfad}/${variantenName(name, b, endung)} ${b}w`)
    .join(", ");
}
