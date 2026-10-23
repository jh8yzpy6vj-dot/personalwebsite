/**
 * Einen `Range`-Kopf (`bytes=…`) gegen eine Dateigröße auflösen — für die
 * Übergangsfassung des Videos oben (`app/uebergang/film.mp4/route.ts`).
 *
 * Nur **ein** Bereich; mehrere (`bytes=0-1,5-9`) beantwortet kaum ein
 * Server, und kein Videoplayer fragt danach. Dann, wie bei fehlendem oder
 * unlesbarem Kopf: `null` — die ganze Datei. `"ungueltig"`: Der Bereich
 * liegt hinter dem Ende (416).
 */
export function bereich(kopf: string | null, groesse: number): { von: number; bis: number } | "ungueltig" | null {
  const t = kopf?.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!t || (t[1] === "" && t[2] === "")) return null;
  if (t[1] === "") {
    // `bytes=-500`: die letzten 500 Bytes.
    const laenge = Number(t[2]);
    if (laenge === 0) return "ungueltig";
    return { von: Math.max(0, groesse - laenge), bis: groesse - 1 };
  }
  const von = Number(t[1]);
  const bis = t[2] === "" ? groesse - 1 : Math.min(Number(t[2]), groesse - 1);
  if (von >= groesse || bis < von) return "ungueltig";
  return { von, bis };
}
