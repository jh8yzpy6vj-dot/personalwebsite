/**
 * Das Video oben auf der Startseite umrechnen — für `scripts/eingang.mjs`,
 * seit dem 2026-10-23.
 *
 * Vorher hieß es: „Videos werden nicht umgerechnet, bitte fertig
 * exportieren" (TECH-STACK.md, „Medien"). Seit Jakob das Video selbst in der
 * Verwaltung hochlädt, kommt aber, was der Schnitt ausgibt — beim ersten
 * Mal eine .mov mit 13 Mbit/s, Tonspur, Zeitcode und „Jakob Sax" als Autor,
 * 30 MB für 18 Sekunden. Das lüde auf jedem Telefon vor allem anderen.
 *
 * Deshalb hier, mit ffmpeg (auf dem Läufer der Action vorhanden bzw. per
 * apt nachinstalliert, siehe `.github/workflows/medien.yml`):
 *
 * - **nur die Bildspur** (`-map 0:v:0`): kein Ton, kein Zeitcode, keine
 *   Untertitel. Das Video läuft stumm — eine Tonspur wäre nur Gewicht.
 * - **keine Metadaten** (`-map_metadata -1`): weder Autor noch Titel, und vor
 *   allem kein Aufnahmeort, den Telefone in Videos schreiben.
 * - **H.264 in MP4, `+faststart`**: spielt überall, startet vor dem Ende
 *   des Ladens. Höchstens 1920 breit, nie hochskaliert.
 * - **Datenrate aus der Länge** (`videoEinstellungen`): so, dass die Datei
 *   unter dem Budget von `scripts/medien.mjs` bleibt (8 MB), aber nie unter
 *   eine Untergrenze, ab der das Bild sichtbar leidet.
 * - **das erste Bild als Standbild**: Es steht da, bevor das Video läuft
 *   (und auf iPhones im Energiesparmodus ganz ohne). Weil die Schleife dort
 *   beginnt, gibt es beim Anlaufen keinen Sprung.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Zielgröße der Datei — mit Luft unter dem Budget von 8 MB in `scripts/medien.mjs`. */
export const ZIEL_BYTES = 7 * 1024 * 1024;
/** Datenrate in kbit/s: nie mehr (kurze Clips) und nie weniger (lange). */
export const RATE = { hoechstens: 5000, mindestens: 1500 };
/** Größte Breite — die Startseite ist nie breiter als ein großer Bildschirm. */
export const MAX_BREITE = 1920;

/**
 * Die Einstellungen für ffmpeg aus der Länge in Sekunden. Rein, damit es
 * unter Test steht.
 *
 * CRF 23 bestimmt die Qualität; `maxrate` deckelt sie dort, wo das Bild viel
 * Bewegung hat (Laub, Wasser) und CRF allein die Datei sprengte. Beim ersten
 * Video: 18 s, gedeckelt auf 3,2 Mbit/s → 7,4 MB, vom Original mit bloßem
 * Auge nicht zu unterscheiden.
 *
 * @param {number} dauer Sekunden
 * @returns {{ rate: number; argumente: string[] }} `rate` in kbit/s
 */
export function videoEinstellungen(dauer) {
  const sekunden = Number.isFinite(dauer) && dauer > 0 ? dauer : 15;
  const passend = Math.floor((ZIEL_BYTES * 8) / sekunden / 1000);
  const rate = Math.max(RATE.mindestens, Math.min(RATE.hoechstens, passend));
  return {
    rate,
    argumente: [
      "-map", "0:v:0",
      "-an", "-sn", "-dn",
      "-map_metadata", "-1",
      "-map_chapters", "-1",
      "-vf", `scale='min(${MAX_BREITE},iw)':-2`,
      "-c:v", "libx264",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-crf", "23",
      "-maxrate", `${rate}k`,
      "-bufsize", `${rate * 2}k`,
      "-preset", "slow",
      "-movflags", "+faststart",
    ],
  };
}

/** Ein Programm ausführen; gibt stdout zurück, wirft mit dem Ende von stderr. */
function fuehreAus(programm, argumente) {
  return new Promise((fertig, scheitert) => {
    let aus = "";
    let fehler = "";
    const p = spawn(programm, argumente, { stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.on("data", (d) => (aus += d));
    p.stderr.on("data", (d) => (fehler = (fehler + d).slice(-2000)));
    p.on("error", (e) =>
      scheitert(
        /** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT"
          ? new Error(`${programm} ist nicht installiert — ohne ffmpeg lässt sich das Video nicht umrechnen.`)
          : e,
      ),
    );
    p.on("close", (code) => {
      if (code === 0) fertig(aus);
      else scheitert(new Error(`${programm} endete mit Code ${code}: ${fehler.trim().split("\n").slice(-3).join(" / ")}`));
    });
  });
}

/**
 * Ein hochgeladenes Video umrechnen.
 *
 * @param {Buffer} roh die Datei aus dem Eingang (MP4 oder MOV)
 * @returns {Promise<{ video: Buffer; standbild: Buffer; breite: number; hoehe: number; dauer: number; rate: number }>}
 */
export async function rechneVideo(roh) {
  const ordner = await mkdtemp(path.join(tmpdir(), "hero-video-"));
  try {
    const quelle = path.join(ordner, "quelle");
    const ziel = path.join(ordner, "film.mp4");
    const bild = path.join(ordner, "standbild.jpg");
    await writeFile(quelle, roh);

    const probe = JSON.parse(
      await fuehreAus("ffprobe", [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration",
        "-of", "json",
        quelle,
      ]),
    );
    if (!probe.streams?.length) throw new Error("Die Datei hat keine Bildspur — ist es wirklich ein Video?");
    const dauer = Number(probe.format?.duration);

    const { rate, argumente } = videoEinstellungen(dauer);
    await fuehreAus("ffmpeg", ["-v", "error", "-y", "-i", quelle, ...argumente, ziel]);
    // Aus dem fertigen Video, nicht aus der Quelle: Dann gleicht das Standbild genau dem ersten Bild, das läuft.
    await fuehreAus("ffmpeg", ["-v", "error", "-y", "-i", ziel, "-frames:v", "1", "-q:v", "2", bild]);

    const fertig = JSON.parse(
      await fuehreAus("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", ziel]),
    );
    return {
      video: await readFile(ziel),
      standbild: await readFile(bild),
      breite: fertig.streams[0].width,
      hoehe: fertig.streams[0].height,
      dauer,
      rate,
    };
  } finally {
    await rm(ordner, { recursive: true, force: true });
  }
}
