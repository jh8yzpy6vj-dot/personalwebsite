import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { MAX_BREITE, RATE, ZIEL_BYTES, rechneVideo, videoEinstellungen } from "./video.mjs";

const mitFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

describe("videoEinstellungen", () => {
  it("rechnet die Datenrate aus der Länge, damit die Datei unter das Ziel passt", () => {
    const { rate } = videoEinstellungen(18.12);
    expect(rate).toBe(3240);
    expect((rate * 1000 * 18.12) / 8).toBeLessThan(ZIEL_BYTES);
  });

  it("deckelt kurze Clips und hält bei langen eine Untergrenze", () => {
    expect(videoEinstellungen(2).rate).toBe(RATE.hoechstens);
    expect(videoEinstellungen(600).rate).toBe(RATE.mindestens);
    // Unbekannte Länge: wie ein Clip von 15 s, nicht 0 oder unendlich.
    expect(videoEinstellungen(Number.NaN).rate).toBe(videoEinstellungen(15).rate);
  });

  it("nimmt nur die Bildspur, ohne Metadaten, und skaliert nie hoch", () => {
    const { argumente } = videoEinstellungen(10);
    const nach = (a) => argumente[argumente.indexOf(a) + 1];
    expect(nach("-map")).toBe("0:v:0");
    expect(argumente).toContain("-an");
    expect(nach("-map_metadata")).toBe("-1");
    expect(nach("-vf")).toBe(`scale='min(${MAX_BREITE},iw)':-2`);
    expect(nach("-movflags")).toBe("+faststart");
  });
});

describe.skipIf(!mitFfmpeg)("rechneVideo (mit ffmpeg)", () => {
  it("macht aus einer MOV mit Ton und Autor ein stummes MP4 ohne Metadaten — und ein Standbild", async () => {
    const ordner = await mkdtemp(path.join(tmpdir(), "video-test-"));
    try {
      const quelle = path.join(ordner, "quelle.mov");
      execFileSync("ffmpeg", [
        "-v", "error", "-y",
        "-f", "lavfi", "-i", "testsrc=size=2560x1440:rate=25:duration=1",
        "-f", "lavfi", "-i", "sine=duration=1",
        "-metadata", "artist=Jakob Sax",
        "-metadata", "location=+48.85+002.29/",
        "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
        quelle,
      ]);
      const ergebnis = await rechneVideo(await readFile(quelle));
      expect(ergebnis.breite).toBe(1920);
      expect(ergebnis.hoehe).toBe(1080);
      expect([...ergebnis.standbild.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);

      const ziel = path.join(ordner, "film.mp4");
      await writeFile(ziel, ergebnis.video);
      const probe = JSON.parse(
        execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", ziel]).toString(),
      );
      expect(probe.streams.map((s) => s.codec_type)).toEqual(["video"]);
      const tags = JSON.stringify(probe.format.tags ?? {});
      expect(tags).not.toContain("Jakob");
      expect(tags).not.toContain("48.85");
    } finally {
      await rm(ordner, { recursive: true, force: true });
    }
  }, 60_000);
});
