import { describe, expect, it } from "vitest";
import { SCHLUESSEL, ausSpeicher } from "./einwilligung";

function speicher(werte: Record<string, string>) {
  return { getItem: (k: string) => werte[k] ?? null };
}

describe("ausSpeicher", () => {
  it("kennt nur ja und nein", () => {
    expect(ausSpeicher(speicher({ [SCHLUESSEL]: "ja" }))).toBe("ja");
    expect(ausSpeicher(speicher({ [SCHLUESSEL]: "nein" }))).toBe("nein");
    expect(ausSpeicher(speicher({ [SCHLUESSEL]: "vielleicht" }))).toBe("offen");
    expect(ausSpeicher(speicher({}))).toBe("offen");
    expect(ausSpeicher(undefined)).toBe("offen");
  });

  it("behandelt einen gesperrten Speicher wie unentschieden", () => {
    const gesperrt = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(ausSpeicher(gesperrt)).toBe("offen");
  });
});
