"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Bildquelle } from "@/lib/bilder";
import type { Inhalt } from "@/lib/inhalt";
import { pruefeInhalt, type Befund } from "@/lib/inhalt-pruefen";
import {
  ZIEL,
  type Konfiguration,
  type SpeichernAnfrage,
  type SpeichernAntwort,
  type Stand,
  type Verarbeitung,
  type VerarbeitenAntwort,
} from "@/lib/admin/vertrag";
import {
  fasseZusammen,
  gleich,
  gleicherCommit,
  naechsteZiele,
  nachStufe,
  ohneEmail,
  pruefeDatei,
  tagAus,
  werteAus,
  type Zielart,
} from "@/lib/admin/werkzeuge";
import { SitzungKontext, type Sitzung } from "./kontext";
import { holeJson, netzText, sendeDatei, sendeJson } from "./hochladen";
import Befunde from "./Befunde";
import BildPanel from "./BildPanel";
import Fotos from "./Fotos";
import Hero from "./Hero";
import Arbeiten from "./Arbeiten";
import Ueber from "./Ueber";
import Filme from "./Filme";
import Startseite from "./Startseite";
import Papierkorb from "./Papierkorb";
import VerlaufReiter from "./Verlauf";
import { Dialog } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Die Wurzel der Verwaltung.** Hält den Zustand der Sitzung und alles, was
 * mit dem Server spricht: Laden, Speichern, Hochladen, Verarbeitung,
 * Live-Meldung. Die Reiter bekommen über `SitzungKontext` nur Daten und
 * Funktionen und rechnen mit `lib/admin/werkzeuge.ts`.
 *
 * Drei Stände werden auseinandergehalten:
 * - `inhalt` — was Jakob gerade sieht und bearbeitet,
 * - `basis` — was zuletzt auf `main` stand (geladen oder gespeichert);
 *   der Unterschied ist „ungespeichert",
 * - `bilder` — das Manifest. Wird nach fertiger Verarbeitung **allein** neu
 *   geholt; `inhalt` und `sha` bleiben dabei, wie sie sind, sonst wären
 *   Jakobs ungespeicherte Änderungen weg.
 */

const REITER = [
  ["fotos", "Fotos"],
  ["hero", "Hero"],
  ["arbeiten", "Arbeiten"],
  ["ueber", "Über mich"],
  ["filme", "Filme"],
  ["startseite", "Startseite"],
  ["papierkorb", "Papierkorb"],
  ["verlauf", "Verlauf"],
] as const;
type Reiter = (typeof REITER)[number][0];

/** So oft fragt die Verwaltung nach, ob der neue Stand online ist (ms). */
const LIVE_ABSTAND = 20_000;
/** So lange höchstens (ms) — ein Build dauert 1–2 Minuten, 15 sind reichlich. */
const LIVE_HOECHSTENS = 15 * 60_000;
/** So oft nach der Verarbeitung der Bilder (ms). */
const VERARBEITUNG_ABSTAND = 15_000;
/** So lange höchstens nach dem letzten Anstoß (ms). */
const VERARBEITUNG_HOECHSTENS = 30 * 60_000;

type Geladen = {
  inhalt: Inhalt;
  basis: Inhalt;
  sha: string;
  bilder: Record<string, Bildquelle>;
  konfiguration: Konfiguration;
};

type Speicherstand =
  | { art: "ruhe" }
  | { art: "laeuft" }
  | { art: "veroeffentlicht"; commit: string; seit: number }
  | { art: "live" }
  | { art: "dauert"; commit: string }
  | { art: "fehler"; text: string };

/** Den ganzen Stand holen — ohne Zustand anzufassen; das macht der Aufrufer. */
async function holeStand(): Promise<{ stand: Stand } | { fehler: string }> {
  const { status, daten } = await holeJson<Stand>("/api/admin/stand");
  if (status !== 200 || !daten || !("inhalt" in daten)) return { fehler: netzText(status, daten) };
  return { stand: daten };
}

type Auftrag = {
  id: number;
  name: string;
  ziel: string;
  anteil: number;
  zustand: "wartet" | "laeuft" | "fertig" | "fehler";
  text?: string;
};

export default function Verwaltung() {
  const [geladen, setGeladen] = useState<Geladen | null>(null);
  const [ladefehler, setLadefehler] = useState<string | null>(null);
  const [reiter, setReiter] = useState<Reiter>("fotos");
  const [speicher, setSpeicher] = useState<Speicherstand>({ art: "ruhe" });
  const [eigeneNachricht, setEigeneNachricht] = useState<string | null>(null);
  /* Befunde, mit denen der Server abgelehnt hat — gelten nur für genau den
     Inhalt, der geschickt wurde. Ändert Jakob etwas, verschwinden sie. */
  const [serverBefunde, setServerBefunde] = useState<{ fuer: Inhalt; befunde: Befund[] } | null>(null);
  const [konflikt, setKonflikt] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);

  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [hochgeladen, setHochgeladen] = useState<string[]>([]);
  const [verarbeitung, setVerarbeitung] = useState<Verarbeitung | null>(null);
  const [beobachten, setBeobachten] = useState(false);
  const [laufFehler, setLaufFehler] = useState<{ url: string } | null>(null);
  const [anstossFehler, setAnstossFehler] = useState<string | null>(null);

  /* Einmal beim Öffnen — ein Tageswechsel mitten in der Sitzung verschiebt
     höchstens das Löschdatum um einen Tag. */
  const [heute] = useState(() => tagAus(new Date()));

  /* ── Laden ─────────────────────────────────────────────────────────── */

  const uebernimm = useCallback((stand: Stand) => {
    setGeladen({
      inhalt: stand.inhalt,
      basis: stand.inhalt,
      sha: stand.sha,
      bilder: stand.bilder,
      konfiguration: stand.konfiguration,
    });
    setLadefehler(null);
    setEigeneNachricht(null);
    setServerBefunde(null);
  }, []);

  const ladeNeu = useCallback(async () => {
    const erg = await holeStand();
    if ("stand" in erg) uebernimm(erg.stand);
    else setLadefehler(erg.fehler);
  }, [uebernimm]);

  useEffect(() => {
    let abgebrochen = false;
    void holeStand().then((erg) => {
      if (abgebrochen) return;
      if ("stand" in erg) uebernimm(erg.stand);
      else setLadefehler(erg.fehler);
    });
    return () => {
      abgebrochen = true;
    };
  }, [uebernimm]);

  /** Nur das Manifest neu holen — `inhalt`, `basis` und `sha` bleiben. */
  const holeBilder = useCallback(async () => {
    const { status, daten } = await holeJson<Stand>("/api/admin/stand");
    if (status === 200 && daten && "bilder" in daten) {
      setGeladen((g) => (g ? { ...g, bilder: daten.bilder } : g));
    }
  }, []);

  const aendere = useCallback((f: (i: Inhalt) => Inhalt) => {
    setGeladen((g) => (g ? { ...g, inhalt: f(g.inhalt) } : g));
  }, []);

  /* ── Ableitungen ───────────────────────────────────────────────────── */

  const inhalt = geladen?.inhalt;
  const bilder = geladen?.bilder;
  const befunde = useMemo(
    () => (inhalt && bilder ? pruefeInhalt(inhalt, Object.keys(bilder)) : []),
    [inhalt, bilder],
  );
  const { fehler } = nachStufe(befunde);
  const ungespeichert = geladen ? !gleich(geladen.basis, geladen.inhalt) : false;
  const vorschlag = geladen ? fasseZusammen(geladen.basis, geladen.inhalt) : "";
  const nachricht = eigeneNachricht ?? vorschlag;

  /* Was gerade hochgeladen wird, hochgeladen ist oder im Eingang wartet. */
  const unterwegs = useMemo(() => {
    const s = new Set<string>(hochgeladen);
    for (const w of verarbeitung?.wartend ?? []) s.add(w);
    for (const a of auftraege) if (a.zustand === "wartet" || a.zustand === "laeuft") s.add(a.ziel);
    return s;
  }, [hochgeladen, verarbeitung, auftraege]);

  /* ── Warnung beim Verlassen ────────────────────────────────────────── */

  useEffect(() => {
    if (!ungespeichert) return;
    const warne = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      /* Ältere Browser brauchen zusätzlich `returnValue`. */
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warne);
    return () => window.removeEventListener("beforeunload", warne);
  }, [ungespeichert]);

  /* ── Speichern ─────────────────────────────────────────────────────── */

  const speichere = async () => {
    if (!geladen || speicher.art === "laeuft") return;
    const gesendet = geladen.inhalt;
    setSpeicher({ art: "laeuft" });
    /* ⚠️ Das Repo ist öffentlich: keine E-Mail-Adresse in die Nachricht. */
    const text = ohneEmail(nachricht).trim() || vorschlag;
    const { status, daten } = await sendeJson<SpeichernAntwort>("/api/admin/speichern", {
      inhalt: gesendet,
      sha: geladen.sha,
      nachricht: text,
    } satisfies SpeichernAnfrage);

    if (daten?.ok === true) {
      setGeladen((g) => (g ? { ...g, basis: gesendet, sha: daten.sha } : g));
      setEigeneNachricht(null);
      setServerBefunde(null);
      setSpeicher({ art: "veroeffentlicht", commit: daten.commit, seit: Date.now() });
      return;
    }
    if (status === 409 || (daten?.ok === false && daten.grund === "konflikt")) {
      setSpeicher({ art: "ruhe" });
      setKonflikt(true);
      return;
    }
    if (daten?.ok === false && daten.befunde?.length) setServerBefunde({ fuer: gesendet, befunde: daten.befunde });
    setSpeicher({ art: "fehler", text: netzText(status, daten) });
  };

  /* Nach dem Speichern: alle 20 s fragen, ob der Commit online ist. */
  const veroeffentlicht = speicher.art === "veroeffentlicht" ? speicher : null;
  useEffect(() => {
    if (!veroeffentlicht) return;
    const { commit, seit } = veroeffentlicht;
    const frage = async () => {
      if (Date.now() - seit > LIVE_HOECHSTENS) {
        setSpeicher((s) => (s.art === "veroeffentlicht" && s.commit === commit ? { art: "dauert", commit } : s));
        return;
      }
      const { daten } = await holeJson<{ commit: string | null }>("/api/admin/live");
      if (daten && gleicherCommit(daten.commit, commit)) {
        setSpeicher((s) => (s.art === "veroeffentlicht" && s.commit === commit ? { art: "live" } : s));
      }
    };
    const t = window.setInterval(() => void frage(), LIVE_ABSTAND);
    return () => window.clearInterval(t);
  }, [veroeffentlicht]);

  /* ── Verarbeitung der Bilder ───────────────────────────────────────── */

  /* Lauf-ids, die schon ausgewertet sind; `null` bis zum ersten Blick. */
  const erledigt = useRef<Set<number> | null>(null);
  const beobachtetSeit = useRef(0);

  const schaueNach = useCallback(async () => {
    const { status, daten } = await holeJson<Verarbeitung>("/api/admin/verarbeitung");
    if (status !== 200 || !daten || !Array.isArray(daten.wartend)) return;
    setVerarbeitung(daten);
    let auswertung;
    if (erledigt.current === null) {
      /* Erster Blick: Was schon fertig ist, ist alt — es steckt im Manifest,
         das gerade geladen wurde. */
      erledigt.current = new Set(daten.laeufe.filter((l) => l.status === "completed").map((l) => l.id));
      auswertung = werteAus(daten, erledigt.current);
    } else {
      auswertung = werteAus(daten, erledigt.current);
      for (const l of [...auswertung.erfolgreich, ...auswertung.fehlgeschlagen]) erledigt.current.add(l.id);
    }
    if (auswertung.erfolgreich.length > 0) {
      await holeBilder();
      /* Was nicht mehr im Eingang liegt, ist verarbeitet. */
      setHochgeladen((h) => h.filter((s) => daten.wartend.includes(s)));
      setLaufFehler(null);
    }
    if (auswertung.fehlgeschlagen.length > 0) setLaufFehler({ url: auswertung.fehlgeschlagen[0].url });
    const weiter = daten.wartend.length > 0 || auswertung.laufend;
    setBeobachten(weiter && Date.now() - beobachtetSeit.current < VERARBEITUNG_HOECHSTENS);
  }, [holeBilder]);

  const konf = geladen?.konfiguration;
  const bereit = geladen !== null;
  useEffect(() => {
    if (!bereit || !(konf?.github || konf?.eingang)) return;
    beobachtetSeit.current = Date.now();
    const t = window.setTimeout(() => void schaueNach(), 0);
    return () => window.clearTimeout(t);
  }, [bereit, konf?.github, konf?.eingang, schaueNach]);

  useEffect(() => {
    if (!beobachten) return;
    const t = window.setInterval(() => void schaueNach(), VERARBEITUNG_ABSTAND);
    return () => window.clearInterval(t);
  }, [beobachten, schaueNach]);

  const stosseAn = useCallback(async () => {
    setAnstossFehler(null);
    const { status, daten } = await sendeJson<VerarbeitenAntwort>("/api/admin/verarbeiten", {});
    if (daten?.ok !== true) {
      setAnstossFehler(netzText(status, daten));
      return;
    }
    beobachtetSeit.current = Date.now();
    setBeobachten(true);
  }, []);

  /* ── Hochladen ─────────────────────────────────────────────────────── */

  const schlange = useRef<{ id: number; datei: File; ziel: string; typ: string }[]>([]);
  const pumpeLaeuft = useRef(false);
  const naechsteId = useRef(1);
  /* Ziele, die in dieser Sitzung vergeben sind — sofort, nicht erst nach dem
     nächsten Rendern, damit zwei schnelle Auswahlen nicht dieselbe Nummer
     bekommen. */
  const vergeben = useRef(new Set<string>());

  const setzeAuftrag = (id: number, teil: Partial<Auftrag>) =>
    setAuftraege((liste) => liste.map((a) => (a.id === id ? { ...a, ...teil } : a)));

  const pumpe = async () => {
    if (pumpeLaeuft.current) return;
    pumpeLaeuft.current = true;
    let geschafft = 0;
    /* Eine Datei nach der anderen: Der Worker hält jede ganz im Speicher. */
    for (let a = schlange.current.shift(); a; a = schlange.current.shift()) {
      const { id, datei, ziel, typ } = a;
      setzeAuftrag(id, { zustand: "laeuft" });
      const antwort = await sendeDatei(datei, ziel, typ, (anteil) => setzeAuftrag(id, { anteil }));
      if (antwort.ok) {
        geschafft++;
        setHochgeladen((h) => (h.includes(ziel) ? h : [...h, ziel]));
        setzeAuftrag(id, { zustand: "fertig", anteil: 1 });
      } else {
        vergeben.current.delete(ziel);
        setzeAuftrag(id, { zustand: "fehler", text: antwort.text });
      }
    }
    pumpeLaeuft.current = false;
    if (geschafft > 0) await stosseAn();
  };

  const ladeHoch = (liste: { datei: File; ziel: string }[]) => {
    const neu: Auftrag[] = [];
    for (const { datei, ziel } of liste) {
      const id = naechsteId.current++;
      const pruefung = pruefeDatei(datei);
      if (!pruefung.ok) {
        neu.push({ id, name: datei.name, ziel, anteil: 0, zustand: "fehler", text: pruefung.text });
      } else if (!ZIEL.test(ziel)) {
        neu.push({ id, name: datei.name, ziel, anteil: 0, zustand: "fehler", text: "Ungültiges Ziel." });
      } else {
        vergeben.current.add(ziel);
        schlange.current.push({ id, datei, ziel, typ: pruefung.typ });
        neu.push({ id, name: datei.name, ziel, anteil: 0, zustand: "wartet" });
      }
    }
    setAuftraege((a) => [...a.filter((x) => x.zustand !== "fertig"), ...neu]);
    void pumpe();
  };

  const ladeNeueHoch = (art: Zielart, dateien: File[]) => {
    if (!geladen) return;
    const gut = dateien.filter((d) => pruefeDatei(d).ok);
    const schlecht = dateien.filter((d) => !pruefeDatei(d).ok);
    const belegt = [
      ...Object.keys(geladen.bilder),
      ...(verarbeitung?.wartend ?? []),
      ...hochgeladen,
      ...vergeben.current,
    ];
    const wahl = naechsteZiele(art, gut.length, belegt);
    if (!wahl.ok) {
      const id = naechsteId.current++;
      setAuftraege((a) => [...a, { id, name: `${gut.length} Dateien`, ziel: "", anteil: 0, zustand: "fehler", text: wahl.text }]);
      return;
    }
    /* Ungeeignete Dateien laufen mit — mit Ziel `""`, damit sie als Fehler
       mit Begründung in der Liste erscheinen statt still wegzufallen. */
    ladeHoch([...gut.map((datei, n) => ({ datei, ziel: wahl.ziele[n] })), ...schlecht.map((datei) => ({ datei, ziel: "" }))]);
  };

  /* ── Darstellung ───────────────────────────────────────────────────── */

  if (!geladen) {
    return (
      <main id="inhalt" className={styles.seite}>
        <div className={styles.mitte}>
          <div>
            <h1 className={styles.titel}>Verwaltung</h1>
            {ladefehler ? (
              <>
                <p className={styles.fehlerText}>{ladefehler}</p>
                <button type="button" className={styles.knopf} onClick={() => void ladeNeu()}>
                  Noch einmal versuchen
                </button>
              </>
            ) : (
              <p className={styles.leise} aria-live="polite">
                Lädt …
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  const sitzung: Sitzung = {
    inhalt: geladen.inhalt,
    bilder: geladen.bilder,
    konfiguration: geladen.konfiguration,
    aendere,
    unterwegs,
    ladeHoch,
    ladeNeueHoch,
    heute,
    bearbeite: setPanel,
    ungespeichert,
  };

  const kannSpeichern =
    geladen.konfiguration.github && ungespeichert && fehler.length === 0 && speicher.art !== "laeuft";

  const status = !geladen.konfiguration.github
    ? "Speichern ist noch nicht eingerichtet."
    : speicher.art === "laeuft"
      ? "Speichert …"
      : fehler.length > 0 && ungespeichert
        ? `Erst ${fehler.length === 1 ? "den Fehler" : `die ${fehler.length} Fehler`} oben beheben, dann speichern.`
        : speicher.art === "fehler" && ungespeichert
          ? speicher.text
          : ungespeichert
            ? "Ungespeicherte Änderungen."
            : speicher.art === "veroeffentlicht"
              ? "Gespeichert. Wird veröffentlicht … (1–2 Minuten)"
              : speicher.art === "live"
                ? "Gespeichert und live."
                : speicher.art === "dauert"
                  ? "Gespeichert, aber noch nicht live. Schau in ein paar Minuten auf der Seite nach."
                  : "Alles gespeichert.";

  const wechsleMitTaste = (e: KeyboardEvent<HTMLButtonElement>, platz: number) => {
    const schritt = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!schritt) return;
    e.preventDefault();
    const neu = REITER[(platz + schritt + REITER.length) % REITER.length][0];
    setReiter(neu);
    document.getElementById(`reiter-${neu}`)?.focus();
  };

  const offeneAuftraege = auftraege.filter((a) => a.zustand !== "fertig" || unterwegs.has(a.ziel));
  const wartend = verarbeitung?.wartend ?? [];
  const laufend = verarbeitung?.laeufe.some((l) => l.status !== "completed") ?? false;

  return (
    <SitzungKontext.Provider value={sitzung}>
      <main id="inhalt" className={styles.seite}>
        <header className={styles.kopf}>
          <h1 className={styles.titel}>Verwaltung</h1>
          <div className={styles.wer}>
            <a href="/" target="_blank" rel="noopener">
              Seite ansehen ↗
            </a>
            <form
              method="post"
              action="/api/admin/abmelden"
              onSubmit={(e) => {
                if (ungespeichert && !window.confirm("Ungespeicherte Änderungen gehen verloren. Trotzdem abmelden?")) {
                  e.preventDefault();
                }
              }}
            >
              <button type="submit" className={styles.knopfLeise}>
                Abmelden
              </button>
            </form>
          </div>
        </header>

        {geladen.konfiguration.entwicklung && (
          <div className={styles.band} role="status">
            <p>
              Entwicklungsmodus — Speichern schreibt auf {geladen.konfiguration.entwicklung}. Ist das main, geht es
              sofort live.
            </p>
          </div>
        )}
        {!geladen.konfiguration.github && (
          <div className={styles.band} role="status">
            <p>
              Speichern ist noch nicht eingerichtet (siehe TECH-STACK.md › Verwaltung). Du kannst dich umsehen, aber
              Änderungen gehen beim Schließen verloren.
            </p>
          </div>
        )}
        {!geladen.konfiguration.eingang && (
          <div className={styles.band} role="status">
            <p>Hochladen ist noch nicht eingerichtet — dafür fehlt der Bildspeicher für neue Bilder. Gib Jan Bescheid.</p>
          </div>
        )}

        <Befunde
          befunde={befunde}
          server={serverBefunde && serverBefunde.fuer === geladen.inhalt ? serverBefunde.befunde : []}
        />

        {(offeneAuftraege.length > 0 || wartend.length > 0 || laufend || laufFehler || anstossFehler) && (
          <section className={styles.auftraege} aria-label="Hochladen und Verarbeitung">
            {offeneAuftraege.length > 0 && (
              <ul>
                {offeneAuftraege.map((a) => (
                  <li key={a.id} className={styles.auftrag}>
                    <span>{a.name}</span>
                    <span className={a.zustand === "fehler" ? undefined : styles.leise}>
                      {a.zustand === "wartet"
                        ? "wartet"
                        : a.zustand === "laeuft"
                          ? `${Math.round(a.anteil * 100)} %`
                          : a.zustand === "fertig"
                            ? "hochgeladen"
                            : "nicht hochgeladen"}
                    </span>
                    {a.zustand === "laeuft" && (
                      <progress className={styles.fortschritt} max={1} value={a.anteil} aria-label={`${a.name} lädt`} />
                    )}
                    {a.zustand === "fehler" && a.text && <p className={`${styles.fehlerText} ${styles.auftragText}`}>{a.text}</p>}
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.leise} aria-live="polite">
              {laufend
                ? "Die Bilder werden verarbeitet (Standortdaten entfernen, Größen rechnen). Das dauert ein paar Minuten — du kannst weiterarbeiten."
                : wartend.length > 0
                  ? `${wartend.length === 1 ? "Ein Bild wartet" : `${wartend.length} Bilder warten`} auf die Verarbeitung.`
                  : offeneAuftraege.some((a) => a.zustand === "fertig")
                    ? "Hochgeladen. Die Verarbeitung startet gleich."
                    : ""}
            </p>
            {wartend.length > 0 && !laufend && geladen.konfiguration.github && (
              <div className={styles.knopfreihe}>
                <button type="button" className={styles.knopf} onClick={() => void stosseAn()}>
                  Verarbeitung starten
                </button>
              </div>
            )}
            {laufFehler && (
              <p className={styles.fehlerText}>
                Die Verarbeitung ist fehlgeschlagen. Die Bilder liegen weiter sicher im Eingang.{" "}
                <a href={laufFehler.url} target="_blank" rel="noopener noreferrer">
                  Lauf ansehen ↗
                </a>
              </p>
            )}
            {anstossFehler && <p className={styles.fehlerText}>{anstossFehler}</p>}
          </section>
        )}

        <div className={styles.reiter} role="tablist" aria-label="Bereiche">
          {REITER.map(([schluessel, name], platz) => (
            <button
              key={schluessel}
              id={`reiter-${schluessel}`}
              type="button"
              role="tab"
              aria-selected={reiter === schluessel}
              aria-controls="reiter-inhalt"
              tabIndex={reiter === schluessel ? 0 : -1}
              className={styles.reiterKnopf}
              onClick={() => setReiter(schluessel)}
              onKeyDown={(e) => wechsleMitTaste(e, platz)}
            >
              {name}
              {schluessel === "papierkorb" && Object.keys(geladen.inhalt.papierkorb).length > 0 && (
                <span className={styles.zaehler}>{Object.keys(geladen.inhalt.papierkorb).length}</span>
              )}
            </button>
          ))}
        </div>

        <div id="reiter-inhalt" role="tabpanel" aria-labelledby={`reiter-${reiter}`}>
          {reiter === "fotos" && <Fotos />}
          {reiter === "hero" && <Hero />}
          {reiter === "arbeiten" && <Arbeiten />}
          {reiter === "ueber" && <Ueber />}
          {reiter === "filme" && <Filme />}
          {reiter === "startseite" && <Startseite />}
          {reiter === "papierkorb" && <Papierkorb />}
          {reiter === "verlauf" && (
            <VerlaufReiter
              sha={geladen.sha}
              beiWiederhergestellt={async (commit) => {
                /* Der neue Stand kommt frisch von `main`. Hinkt die Abfrage
                   GitHub kurz hinterher, wird es kurz später noch einmal
                   versucht. */
                for (let versuch = 0; versuch < 3; versuch++) {
                  const erg = await holeStand();
                  if ("stand" in erg) {
                    uebernimm(erg.stand);
                    break;
                  }
                  await new Promise((r) => setTimeout(r, 1500));
                }
                setSpeicher({ art: "veroeffentlicht", commit, seit: Date.now() });
              }}
              beiKonflikt={() => setKonflikt(true)}
            />
          )}
        </div>

        <div className={styles.leiste}>
          <div className={styles.leisteInnen}>
            <p className={styles.leisteStatus} role="status">
              {status}
            </p>
            {geladen.konfiguration.github && ungespeichert && (
              <div className={styles.leisteNachricht}>
                <label className="nur-vorlesen" htmlFor="nachricht">
                  Was hast du geändert? (steht im Verlauf)
                </label>
                <input
                  id="nachricht"
                  className={styles.eingabe}
                  value={nachricht}
                  maxLength={140}
                  onChange={(e) => setEigeneNachricht(e.currentTarget.value)}
                  placeholder={vorschlag}
                />
              </div>
            )}
            <button
              type="button"
              className={styles.knopfHaupt}
              disabled={!kannSpeichern}
              onClick={() => void speichere()}
            >
              {speicher.art === "laeuft" ? "Speichert …" : "Speichern"}
            </button>
          </div>
        </div>

        {panel && <BildPanel schluessel={panel} beiSchliessen={() => setPanel(null)} />}

        {konflikt && (
          <Dialog titel="Inzwischen hat jemand anderes gespeichert" beiSchliessen={() => setKonflikt(false)}>
            <p className={styles.text}>
              Seit du die Verwaltung geöffnet hast, wurde der Inhalt an anderer Stelle geändert — in einem zweiten Tab
              oder von Jan im Code. Deine Änderungen lassen sich nicht einfach darüberlegen, sonst wäre das andere still
              weg.
            </p>
            <p className={styles.text}>
              <strong>Neu laden verwirft deine ungespeicherten Änderungen.</strong> Merk dir vorher, was du geändert
              hast, und mach es danach noch einmal.
            </p>
            <div className={styles.knopfreihe}>
              <button
                type="button"
                className={styles.knopfHaupt}
                onClick={() => {
                  setKonflikt(false);
                  setSpeicher({ art: "ruhe" });
                  void ladeNeu();
                }}
              >
                Neu laden (Änderungen verwerfen)
              </button>
              <button type="button" className={styles.knopf} onClick={() => setKonflikt(false)}>
                Abbrechen
              </button>
            </div>
          </Dialog>
        )}
      </main>
    </SitzungKontext.Provider>
  );
}
