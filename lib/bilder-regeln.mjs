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
export const PIPELINE_VERSION = 4;

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
 * ⚠️ **Das ist eine Bauzeit-Entscheidung, keine Qualitätsentscheidung.**
 * AVIF ist praktisch die gesamte Rechenzeit der Pipeline, und sie steigt
 * steil mit der Breite. Gemessen an einer 6000×4000-Kameradatei, je Bild:
 *
 * | Breite | AVIF | WebP | AVIF-Größe | WebP-Größe |
 * |--------|------|------|------------|------------|
 * | 480    | 0.2s | 0.04s|      1 kB  |      1 kB  |
 * | 800    | 0.9s | 0.06s|      5 kB  |      9 kB  |
 * | 1200   | 2.3s | 0.15s|     17 kB  |     65 kB  |
 * | 1600   | 5.4s | 0.29s|     46 kB  |    199 kB  |
 * | 2400   |17.5s | 0.68s|    389 kB  |    771 kB  |
 *
 * Die 2400er-Variante allein kostet zwei Drittel der Zeit. Zwölf Bilder
 * ergaben damit rund sechs Minuten — der Cloudflare-Build lief in die Länge.
 *
 * Ohne sie bekommt ein Retina-Gerät die 1600er AVIF mit **46 kB** statt der
 * 2400er WebP mit 771 kB. Der Browser wählt selbst: Fehlt im AVIF-`srcset`
 * die große Stufe, nimmt er die größte vorhandene — und die ist kleiner
 * *und* schneller als jede WebP-Alternative.
 *
 * WebP wird weiterhin in allen Breiten erzeugt; es kostet fast nichts.
 *
 * ⚠️ Wer das zurückdreht, muss die Bauzeit im Blick behalten. Ab etwa
 * hundert Bildern wird der Lauf spürbar lang — er läuft aber lokal und nur
 * dann, wenn sich etwas geändert hat, nicht mehr bei jedem Deploy.
 */
export const AVIF_MAX_BREITE = 1600;

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
