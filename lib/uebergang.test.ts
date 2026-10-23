import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "./bilder-manifest.json";
import type { Bildquelle } from "./bilder";
import { bereich } from "./bereich";
import { istUebergang, mitUebergang, UEBERGANG_DATEI, UEBERGANG_FILM, UEBERGANG_STANDBILD } from "./uebergang";

/** Die Übergangsfassung des Videos oben (`lib/uebergang.ts`). */
describe("Übergang: Video oben aus dem Repo", () => {
  it("springt nur ein, solange der Bucket kein Video hat", () => {
    const echt = Object.values(manifest)[0] as Bildquelle;
    expect(mitUebergang({})["hero/film"]).toBe(UEBERGANG_STANDBILD);
    expect(mitUebergang({ "hero/film": echt })["hero/film"]).toBe(echt);
    expect(istUebergang(UEBERGANG_STANDBILD)).toBe(true);
    expect(istUebergang(echt)).toBe(false);
    expect(istUebergang(undefined)).toBe(false);
  });

  it("jede genannte Datei liegt unter public/", () => {
    const adressen = [
      UEBERGANG_DATEI,
      UEBERGANG_STANDBILD.fallback,
      ...UEBERGANG_STANDBILD.webp.split(", ").map((e) => e.split(" ")[0]),
    ];
    for (const a of adressen) expect(existsSync(`public${a.split("?")[0]}`), a).toBe(true);
  });

  it("das Video kommt über die Route mit Range, nicht direkt aus public/", () => {
    expect(UEBERGANG_FILM.url).toMatch(/^\/uebergang\/film\.mp4\?v=[0-9a-f]{8}$/);
  });
});

describe("bereich (Range)", () => {
  it("löst die üblichen Formen auf", () => {
    expect(bereich("bytes=0-1", 100)).toEqual({ von: 0, bis: 1 });
    expect(bereich("bytes=10-", 100)).toEqual({ von: 10, bis: 99 });
    expect(bereich("bytes=-10", 100)).toEqual({ von: 90, bis: 99 });
    expect(bereich("bytes=50-500", 100)).toEqual({ von: 50, bis: 99 });
  });

  it("ohne oder mit unlesbarem Kopf die ganze Datei, hinter dem Ende 416", () => {
    expect(bereich(null, 100)).toBeNull();
    expect(bereich("bytes=0-1,5-9", 100)).toBeNull();
    expect(bereich("items=0-1", 100)).toBeNull();
    expect(bereich("bytes=100-", 100)).toBe("ungueltig");
    expect(bereich("bytes=5-2", 100)).toBe("ungueltig");
    expect(bereich("bytes=-0", 100)).toBe("ungueltig");
  });
});
