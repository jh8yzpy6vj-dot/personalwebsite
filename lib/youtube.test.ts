import { describe, expect, it } from "vitest";
import { youtubeId, youtubePlayer, youtubeVorschau } from "./youtube";
import { FILME } from "./content";

describe("youtubeId", () => {
  it("erkennt die üblichen Formen", () => {
    for (const link of [
      "https://youtu.be/73MpHsj1OqI",
      "https://youtu.be/73MpHsj1OqI?si=abc",
      "https://www.youtube.com/watch?v=73MpHsj1OqI",
      "https://youtube.com/watch?v=73MpHsj1OqI&t=42s",
      "https://m.youtube.com/watch?v=73MpHsj1OqI",
      "https://www.youtube.com/embed/73MpHsj1OqI",
      "https://www.youtube.com/shorts/73MpHsj1OqI",
      "https://www.youtube-nocookie.com/embed/73MpHsj1OqI",
    ]) {
      expect(youtubeId(link), link).toBe("73MpHsj1OqI");
    }
  });

  it("nimmt Kennungen mit - und _", () => {
    expect(youtubeId("https://youtu.be/_-ByXNPB4PA")).toBe("_-ByXNPB4PA");
  });

  it("lässt alles andere als Link stehen", () => {
    for (const link of [
      "https://www.ardmediathek.de/video/y-kollektiv/trailer/ard/Y3JpZDovL3N3ci5kZS9hZXgvbzIzNTkyMzE",
      "https://vimeo.com/123456",
      "https://www.youtube.com/@kanal",
      "https://www.youtube.com/playlist?list=PL123",
      "https://www.youtube.com/watch?v=zukurz",
      "https://youtu.be/",
      "http://youtu.be/73MpHsj1OqI",
      "https://youtu.be.example.com/73MpHsj1OqI",
      "kein Link",
    ]) {
      expect(youtubeId(link), link).toBeNull();
    }
  });

  it("bettet die YouTube-Filme aus lib/inhalt.json ein", () => {
    const yt = FILME.filter((f) => /youtu\.?be/.test(f.link));
    for (const f of yt) expect(youtubeId(f.link), f.id).not.toBeNull();
  });
});

describe("Adressen", () => {
  it("spielt über youtube-nocookie.com", () => {
    expect(youtubePlayer("73MpHsj1OqI")).toBe(
      "https://www.youtube-nocookie.com/embed/73MpHsj1OqI?autoplay=1&rel=0&playsinline=1",
    );
    expect(youtubeVorschau("73MpHsj1OqI", "hqdefault")).toBe("https://i.ytimg.com/vi/73MpHsj1OqI/hqdefault.jpg");
  });
});
