/**
 * Regeln der Bildpipeline — Breiten, Formate, Qualitäten, Budgets.
 *
 * Bewusst reines JavaScript ohne Abhängigkeiten: Diese Datei wird von
 * `scripts/bilder.mjs` (Node, zur Bauzeit) **und** von den Tests benutzt.
 * Wäre sie TypeScript, müsste das Build-Skript kompiliert werden, bevor es
 * laufen kann — für eine Handvoll Konstanten ein schlechter Tausch.
 *
 * ⚠️ Änderungen an den Werten hier ändern jedes ausgelieferte Bild. Nach
 * einer Änderung `PIPELINE_VERSION` erhöhen, sonst hält der Cache in
 * `lib/bilder-manifest.json` die alten Dateien für aktuell.
 */

/**
 * Wird in den Cache-Schlüssel gemischt. Erhöhen, sobald sich Breiten,
 * Formate oder Qualitäten ändern — sonst werden alte Ableitungen nicht neu
 * berechnet.
 */
export const PIPELINE_VERSION = 3;

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

/** Breite des JPEG-Rückfalls für Browser ohne AVIF und WebP. */
export const FALLBACK_BREITE = 1200;

/**
 * Qualitäten je Format. AVIF darf deutlich niedriger stehen als JPEG —
 * die Zahlen sind zwischen den Formaten nicht vergleichbar.
 */
export const QUALITAET = { avif: 50, webp: 72, jpeg: 78 };

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

/** Dateiname einer Variante: `name-1200.avif`. */
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
