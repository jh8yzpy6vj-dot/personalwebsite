import manifest from "./video-manifest.json";

/**
 * Zugriff auf die Videos im R2-Bucket.
 *
 * `lib/video-manifest.json` wird von `scripts/medien.mjs` geschrieben und ist
 * **nicht von Hand zu bearbeiten**. Es ist eingecheckt, damit Typprüfung,
 * Tests und Build laufen, ohne den Bucket anzufassen.
 *
 * ⚠️ **Videos werden nicht umgerechnet.** Anders als bei den Bildern erzeugt
 * die Pipeline keine Varianten — sie verzeichnet nur, was unter
 * `original/video/` und `original/hero/` liegt, und liefert die Datei direkt
 * von dort aus. Umrechnen bräuchte ffmpeg im Deployweg und gehört ohnehin in
 * die Hand dessen, der den Schnitt gemacht hat; die Exportvorgaben stehen in
 * TECH-STACK.md, Abschnitt „Medien".
 */

export type Videoquelle = {
  /** Vollständige Adresse im Bucket. */
  url: string;
  /** MIME-Typ, aus der Endung abgeleitet. */
  typ: string;
  /** Dateigröße in Bytes — Grundlage für die Warnung unten. */
  bytes: number;
};

export const VIDEOS: Record<string, Videoquelle> = manifest as Record<
  string,
  Videoquelle
>;

/** Video zu einem Schlüssel, oder `null`. */
export function video(schluessel: string | null | undefined): Videoquelle | null {
  if (!schluessel) return null;
  return VIDEOS[schluessel] ?? null;
}

/**
 * Das Hero-Video: `original/hero/film.mp4` im Bucket.
 *
 * Fehlt es, fällt die Startseite auf das Standbild zurück und darunter auf
 * den Farbverlauf — beides sind gültige Zustände, kein Fehler.
 */
export function heroVideo(): Videoquelle | null {
  return video("hero/film");
}

/**
 * Das Video zu einer Arbeit: `original/video/<id>.mp4` im Bucket.
 *
 * Über die `id` statt über ein Feld in `content.ts` — dieselbe Konvention wie
 * beim Leitbild in `lib/bilder.ts`. Eine zweite Stelle, an der derselbe Name
 * steht, ist eine zweite Stelle, an der er falsch stehen kann.
 */
export function videoZurArbeit(id: string): Videoquelle | null {
  return video(`video/${id}`);
}
