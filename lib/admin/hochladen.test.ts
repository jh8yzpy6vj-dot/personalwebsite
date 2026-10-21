import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { netzText, sendeDatei, STILLSTAND_GRENZE } from "@/app/admin/hochladen";

/*
 * `sendeDatei` aus `app/admin/hochladen.ts` — hier unter `lib/`, weil die
 * Tests nur dort gesucht werden (`vitest.config.mts`). Der Browser fehlt in
 * Node; an seiner Stelle ein gefälschtes `XMLHttpRequest`, das genau so viel
 * kann, wie `sendeDatei` braucht. Die Uhr ist gefälscht, damit die
 * Stillstandswache ohne 90 echte Sekunden prüfbar ist.
 */

class FalschesXhr {
  static alle: FalschesXhr[] = [];
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null; onload: (() => void) | null } =
    { onprogress: null, onload: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 0;
  responseText = "";
  responseType = "";
  ziel = "";
  kopf: Record<string, string> = {};
  abgebrochen = false;
  private fertig = false;

  constructor() {
    FalschesXhr.alle.push(this);
  }
  open(_methode: string, url: string) {
    this.ziel = url;
  }
  setRequestHeader(name: string, wert: string) {
    this.kopf[name] = wert;
  }
  send() {}
  abort() {
    if (this.fertig) return;
    this.fertig = true;
    this.abgebrochen = true;
    this.onabort?.();
  }

  /* Was der Browser täte: */
  sendet(anteil: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded: anteil * 100, total: 100 });
  }
  allesGesendet() {
    this.sendet(1);
    this.upload.onload?.();
  }
  antwortet(status: number, rumpf: unknown) {
    this.fertig = true;
    this.status = status;
    this.responseText = typeof rumpf === "string" ? rumpf : JSON.stringify(rumpf);
    this.onload?.();
  }
}

const datei = () => new File([new Uint8Array([0xff, 0xd8, 0xff])], "a.jpg", { type: "image/jpeg" });
const letztes = () => FalschesXhr.alle[FalschesXhr.alle.length - 1];

beforeEach(() => {
  FalschesXhr.alle = [];
  vi.useFakeTimers();
  vi.stubGlobal("XMLHttpRequest", FalschesXhr);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sendeDatei", () => {
  it("meldet den Fortschritt und liefert die Antwort des Servers", async () => {
    const anteile: number[] = [];
    const p = sendeDatei(datei(), "arbeiten/stamp/01", "image/jpeg", (a) => anteile.push(a));
    const x = letztes();
    expect(x.ziel).toBe("/api/admin/hochladen?ziel=arbeiten%2Fstamp%2F01");
    expect(x.kopf["content-type"]).toBe("image/jpeg");
    x.sendet(0.5);
    x.allesGesendet();
    x.antwortet(200, { ok: true, schluessel: "arbeiten/stamp/01" });
    expect(await p).toEqual({ ok: true, schluessel: "arbeiten/stamp/01" });
    expect(anteile).toEqual([0.5, 1]);
    // Wache und Abbruch sind aufgeräumt.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("abgelaufene Anmeldung (404): rät nicht zum Neuladen und merkt sich `anmelden`", async () => {
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {});
    letztes().antwortet(404, "Not Found");
    const e = await p;
    expect(e).toEqual({ ok: false, text: netzText(404, null), anmelden: true });
    expect(netzText(404, null)).toContain("in einem neuen Tab");
    expect(netzText(404, null)).not.toMatch(/neu laden|lade die seite/i);
  });

  it("bricht nach 90 Sekunden ohne Fortschritt ab — mit einem Text dazu", async () => {
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {});
    const x = letztes();
    await vi.advanceTimersByTimeAsync(STILLSTAND_GRENZE - 5_000);
    expect(x.abgebrochen).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(x.abgebrochen).toBe(true);
    expect(await p).toEqual({
      ok: false,
      text: "Die Übertragung kam 90 Sekunden lang nicht voran — vermutlich ist die Verbindung weg. Versuch es noch einmal.",
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("langsam, aber stetig ist kein Stillstand — es gibt kein festes Gesamtlimit", async () => {
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {});
    const x = letztes();
    // 20 Minuten lang alle 60 Sekunden ein bisschen weiter.
    for (let i = 1; i <= 20; i++) {
      await vi.advanceTimersByTimeAsync(60_000);
      x.sendet(i / 21);
    }
    expect(x.abgebrochen).toBe(false);
    x.allesGesendet();
    x.antwortet(200, { ok: true, schluessel: "portrait" });
    expect((await p).ok).toBe(true);
  });

  it("ist alles gesendet, wartet sie auf den Server, ohne abzubrechen", async () => {
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {});
    const x = letztes();
    x.allesGesendet();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(x.abgebrochen).toBe(false);
    x.antwortet(200, { ok: true, schluessel: "portrait" });
    expect((await p).ok).toBe(true);
  });

  it("„Abbrechen“ von außen: bricht die Übertragung ab", async () => {
    const abbruch = new AbortController();
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {}, abbruch.signal);
    const x = letztes();
    x.sendet(0.3);
    abbruch.abort();
    expect(x.abgebrochen).toBe(true);
    expect(await p).toEqual({ ok: false, text: "Abgebrochen." });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("schon abgebrochen: schickt gar nicht erst", async () => {
    const abbruch = new AbortController();
    abbruch.abort();
    expect(await sendeDatei(datei(), "portrait", "image/jpeg", () => {}, abbruch.signal)).toEqual({
      ok: false,
      text: "Abgebrochen.",
    });
    expect(FalschesXhr.alle).toHaveLength(0);
  });

  it("ein Abbruch nach der Antwort ändert nichts mehr", async () => {
    const abbruch = new AbortController();
    const p = sendeDatei(datei(), "portrait", "image/jpeg", () => {}, abbruch.signal);
    const x = letztes();
    x.allesGesendet();
    x.antwortet(200, { ok: true, schluessel: "portrait" });
    abbruch.abort();
    expect(x.abgebrochen).toBe(false);
    expect((await p).ok).toBe(true);
  });
});
