/**
 * YouTube-Filme einbetten (seit 2026-10-24).
 *
 * Aus einem Filmlink in `lib/inhalt.json` wird die Kennung des Videos — nur
 * daran entscheidet `/film`, ob ein Film auf der Seite selbst läuft oder wie
 * bisher nach außen verlinkt ist. Alles, was nicht eindeutig ein einzelnes
 * YouTube-Video ist (Kanal, Playlist, Mediathek, Vimeo), bleibt ein Link.
 *
 * ⚠️ Eingebettet wird **erst nach Einwilligung** (`lib/einwilligung.ts`) und
 * immer über `youtube-nocookie.com` — YouTube setzt dort erst beim Abspielen
 * Cookies. Vorschaubilder kommen von `i.ytimg.com`, ebenfalls erst nach
 * Einwilligung. Siehe UI-SPEC, „Filme einbetten".
 */

/** Eine Videokennung: genau elf Zeichen aus Buchstaben, Ziffern, `-`, `_`. */
const KENNUNG = /^[A-Za-z0-9_-]{11}$/;

/**
 * Die Videokennung aus einem YouTube-Link, sonst `null`.
 *
 * Erkannt werden `youtu.be/<id>`, `youtube.com/watch?v=<id>` sowie
 * `/embed/`, `/shorts/` und `/live/` — jeweils auch mit `www.`, `m.` und
 * `youtube-nocookie.com`. Zusätze wie `?si=` oder `&t=42s` stören nicht.
 */
export function youtubeId(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www|m)\./, "");
  const teile = url.pathname.split("/").filter(Boolean);

  let id: string | null | undefined;
  if (host === "youtu.be") id = teile[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (teile[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live"].includes(teile[0] ?? "")) id = teile[1];
  }
  return id && KENNUNG.test(id) ? id : null;
}

/**
 * Adresse des Players. `autoplay=1`, weil er erst nach einem Klick auf ▶
 * entsteht — sonst müsste man zweimal klicken. `rel=0`: am Ende nur Filme
 * desselben Kanals statt beliebiger Empfehlungen.
 */
export function youtubePlayer(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
}

/**
 * Vorschaubild von YouTube. `maxresdefault` (1280 px) gibt es nicht für jedes
 * Video — dann liefert YouTube ein 120 px breites Ersatzbild, und die Kachel
 * fällt auf `hqdefault` (480 px, immer vorhanden) zurück.
 */
export function youtubeVorschau(id: string, stufe: "maxresdefault" | "hqdefault"): string {
  return `https://i.ytimg.com/vi/${id}/${stufe}.jpg`;
}
