import { describe, expect, it } from "vitest";
import { bucketAdresse, EingangFehler, erkenneBildtyp, legeAb, liste, ohneEndung, type EingangKonfig } from "./eingang";

function fake(antworte: (r: Request) => Response | Promise<Response>) {
  const anfragen: Request[] = [];
  const holen = (async (r: Request) => {
    anfragen.push(r);
    return antworte(r);
  }) as unknown as typeof fetch;
  const cfg: EingangKonfig = {
    konto: "abc123",
    bucket: "eingang",
    schluesselId: "KEYID",
    geheimnis: "GEHEIM",
    fetch: holen,
  };
  return { cfg, anfragen };
}

describe("bucketAdresse", () => {
  const basis = { konto: "abc123", bucket: "eingang", schluesselId: "k", geheimnis: "g" };

  it("ohne Jurisdiction", () => {
    expect(bucketAdresse(basis)).toBe("https://abc123.r2.cloudflarestorage.com/eingang");
  });

  it("mit Jurisdiction", () => {
    expect(bucketAdresse({ ...basis, jurisdiktion: "EU" })).toBe(
      "https://abc123.eu.r2.cloudflarestorage.com/eingang",
    );
  });

  it("lehnt Unfug ab", () => {
    expect(() => bucketAdresse({ ...basis, konto: "a.b/c" })).toThrow(EingangFehler);
    expect(() => bucketAdresse({ ...basis, bucket: "../x" })).toThrow(EingangFehler);
  });
});

describe("legeAb", () => {
  it("legt per PUT ab, signiert, mit Content-Type", async () => {
    const { cfg, anfragen } = fake(() => new Response(null, { status: 200 }));
    await legeAb(cfg, "arbeiten/stamp/01.jpg", new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg");

    const [r] = anfragen;
    expect(r.method).toBe("PUT");
    expect(r.url).toBe("https://abc123.r2.cloudflarestorage.com/eingang/arbeiten/stamp/01.jpg");
    expect(r.headers.get("content-type")).toBe("image/jpeg");
    expect(r.headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 Credential=KEYID\//);
    expect(r.headers.get("authorization")).not.toContain("GEHEIM");
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(new Uint8Array([0xff, 0xd8, 0xff]));
  });

  it("gibt den Fehlertext von R2 nicht weiter", async () => {
    const { cfg } = fake(() => new Response("<Error><AccessKeyId>KEYID</AccessKeyId></Error>", { status: 403 }));
    const e = await legeAb(cfg, "portrait.jpg", new Uint8Array([1]), "image/jpeg").catch((x: unknown) => x);
    expect(e).toBeInstanceOf(EingangFehler);
    expect((e as Error).message).not.toContain("KEYID");
  });

  it("lehnt Pfad-Ausbrüche ab", async () => {
    const { cfg, anfragen } = fake(() => new Response(null));
    await expect(legeAb(cfg, "../x.jpg", new Uint8Array([1]), "image/jpeg")).rejects.toBeInstanceOf(EingangFehler);
    expect(anfragen).toHaveLength(0);
  });
});

describe("liste", () => {
  it("blättert über den Fortsetzungspunkt und entschlüsselt XML", async () => {
    const seiten = [
      `<ListBucketResult><IsTruncated>true</IsTruncated><NextContinuationToken>t&amp;2</NextContinuationToken>
        <Contents><Key>arbeiten/stamp/01.jpg</Key><Size>3</Size></Contents>
        <Contents><Key>ordner/</Key></Contents></ListBucketResult>`,
      `<ListBucketResult><IsTruncated>false</IsTruncated>
        <Contents><Key>ueber/02.png</Key></Contents></ListBucketResult>`,
    ];
    const { cfg, anfragen } = fake(() => new Response(seiten.shift()));
    expect(await liste(cfg)).toEqual(["arbeiten/stamp/01.jpg", "ueber/02.png"]);
    expect(anfragen).toHaveLength(2);
    const zweite = new URL(anfragen[1].url);
    expect(zweite.searchParams.get("list-type")).toBe("2");
    expect(zweite.searchParams.get("continuation-token")).toBe("t&2");
  });

  it("wirft bei Fehlern", async () => {
    const { cfg } = fake(() => new Response("nein", { status: 500 }));
    await expect(liste(cfg)).rejects.toBeInstanceOf(EingangFehler);
  });
});

describe("Hilfen", () => {
  it("ohneEndung", () => {
    expect(ohneEndung("arbeiten/stamp/01.jpg")).toBe("arbeiten/stamp/01");
    expect(ohneEndung("portrait.tif")).toBe("portrait");
    expect(ohneEndung("arbeiten/stamp")).toBe("arbeiten/stamp");
  });

  it("erkennt Bildtypen an den ersten Bytes", () => {
    const b = (...x: (number | string)[]) =>
      new Uint8Array(x.flatMap((t) => (typeof t === "string" ? [...t].map((z) => z.charCodeAt(0)) : [t])));
    expect(erkenneBildtyp(b(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(erkenneBildtyp(b(0x89, "PNG", 0x0d, 0x0a))).toBe("image/png");
    expect(erkenneBildtyp(b("RIFF", 0, 0, 0, 0, "WEBPVP8 "))).toBe("image/webp");
    expect(erkenneBildtyp(b("II", 0x2a, 0x00))).toBe("image/tiff");
    expect(erkenneBildtyp(b("MM", 0x00, 0x2a))).toBe("image/tiff");
    expect(erkenneBildtyp(b("<svg"))).toBeNull();
    expect(erkenneBildtyp(b("RIFF", 0, 0, 0, 0, "WAVE"))).toBeNull();
    expect(erkenneBildtyp(b(0xff, 0xd8))).toBeNull();
    expect(erkenneBildtyp(new Uint8Array(0))).toBeNull();
  });
});
