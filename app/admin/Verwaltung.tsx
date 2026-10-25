"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Bildquelle } from "@/lib/bilder";
import type { Inhalt } from "@/lib/inhalt";
import { pruefeInhalt, type Befund } from "@/lib/inhalt-pruefen";
import {
  ZIEL,
  type HochladenAntwort,
  type Konfiguration,
  type SpeichernAnfrage,
  type SpeichernAntwort,
  type Stand,
  type Verarbeitung,
  type VerarbeitenAntwort,
} from "@/lib/admin/vertrag";
import {
  ausgewertet,
  bildBezeichnung,
  erwarteteBilder,
  fasseZusammen,
  gleich,
  gleicherCommit,
  istDoppelklick,
  istTextfeld,
  legeAb,
  LEERER_STAPEL,
  letzterFehlschlag,
  mitPapierkorbDaten,
  nachDemEingang,
  naechsteZiele,
  nachStufe,
  ohneEmail,
  pruefeDatei,
  REITER,
  schrittVor,
  schrittZurueck,
  stapelNachSpeichern,
  tagAus,
  tastenbefehl,
  tippgruppen,
  verarbeitungsanzeige,
  werteAus,
  zeigeziel,
  type Folge,
  type Klick,
  type Reiter,
  type Stapel,
  type Zielart,
} from "@/lib/admin/werkzeuge";
import { SitzungKontext, type Klappliste, type Sitzung } from "./kontext";
import { holeJson, netzText, sendeDatei, sendeJson } from "./hochladen";
import Befunde from "./Befunde";
import BildPanel from "./BildPanel";
import Fotos from "./Fotos";
import Hero from "./Hero";
import Arbeiten from "./Arbeiten";
import Ueber from "./Ueber";
import Filme from "./Filme";
import Startseite from "./Startseite";
import Impressum from "./Impressum";
import Papierkorb from "./Papierkorb";
import VerlaufReiter from "./Verlauf";
import { Dialog, holeInDenBlick, Zeichen } from "./teile";
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
 * - `bilder` — das Manifest. Nach fertiger Verarbeitung kommt der ganze
 *   Stand neu, übernommen wird aber nur das Manifest — `inhalt`, `basis`
 *   und `sha` nur dann, wenn nichts ungespeichert ist (die Action kann den
 *   Papierkorb geleert haben). Sonst wären Jakobs Änderungen weg; dann sagt
 *   ein Band, dass Speichern eine Rückfrage bringt.
 *
 * Dazu `stapel`, die früheren Stände für „Rückgängig" (`legeAb` in
 * `lib/admin/werkzeuge.ts`). Er gehört zu `basis` und `sha`: Ändern die
 * sich (geladen, gespeichert, neuer Stand der Action), beginnt er leer.
 */

/** So oft fragt die Verwaltung nach, ob der neue Stand online ist (ms). */
const LIVE_ABSTAND = 20_000;
/** So lange höchstens (ms) — ein Build dauert 1–2 Minuten, 15 sind reichlich. */
const LIVE_HOECHSTENS = 15 * 60_000;
/** So oft nach der Verarbeitung der Bilder (ms). */
const VERARBEITUNG_ABSTAND = 15_000;
/** So lange höchstens nach dem letzten Anstoß (ms). */
const VERARBEITUNG_HOECHSTENS = 30 * 60_000;
/** Nach dem Wiederherstellen: so oft den neuen Stand holen, in diesem Abstand (ms). */
const NACH_WIEDERHERSTELLEN_VERSUCHE = 4;
const NACH_WIEDERHERSTELLEN_ABSTAND = 1500;
/** So lange steht eine Meldung in der Leiste (ms) — länger, solange Maus oder Fokus darin sind oder ein Dialog sie verdeckt. */
const MELDUNG_DAUER = 8000;
/** So oft schaut die Meldung nach, ob sie noch stehen bleiben muss (ms). */
const MELDUNG_TAKT = 250;

type Geladen = {
  inhalt: Inhalt;
  basis: Inhalt;
  sha: string;
  /** Der Commit, der `sha` geschrieben hat — nur nach eigenem Speichern oder Wiederherstellen bekannt, sonst `""`. */
  commit: string;
  bilder: Record<string, Bildquelle>;
  konfiguration: Konfiguration;
  stapel: Stapel;
};

/** Die Meldung in der Leiste (oder im Seitenpanel); `knopf`: was ihr Knopf tut (oder keiner). */
type Meldung = { id: number; text: string; knopf: "rueckgaengig" | "wiederholen" | null };

type Speicherstand =
  | { art: "ruhe" }
  | { art: "laeuft" }
  | { art: "veroeffentlicht"; commit: string; seit: number }
  | { art: "live" }
  | { art: "dauert"; commit: string }
  /** `anmelden`: abgelaufene Anmeldung — die Leiste bietet dann den Link zum Anmelden. */
  | { art: "fehler"; text: string; anmelden?: boolean };

/** Ein Hinweis, warum etwas nicht ging; `anmelden` wie beim Speicherstand. */
type Hinweis = { text: string; anmelden: boolean };

/** Der Link für eine abgelaufene Anmeldung. Neuer Tab: Hier bleibt alles Ungespeicherte stehen. */
function AnmeldenLink() {
  return (
    <a href="/admin" target="_blank" rel="noopener">
      In neuem Tab anmelden ↗
    </a>
  );
}

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
  /**
   * Neues Bild: wohin es gehört — beim Wiederholen wird die Nummer neu
   * vergeben, die alte kann inzwischen belegt sein. `null`: festes Ziel
   * (Ersetzen, Porträt, Standbild).
   */
  art: Zielart | null;
  anteil: number;
  zustand: "wartet" | "laeuft" | "fertig" | "fehler" | "abgebrochen";
  text?: string;
  /** Gescheitert an der abgelaufenen Anmeldung. */
  anmelden?: boolean;
  /** Gescheitert oder abgebrochen, aber die Datei ist noch da — für „Noch einmal". */
  datei?: File;
};

const gescheitert = (a: Auftrag) => a.zustand === "fehler" || a.zustand === "abgebrochen";

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
  /* Lädt gerade neu (Konfliktdialog, Leiste, Band) — gegen Doppelklicks. */
  const [laedtNeu, setLaedtNeu] = useState(false);
  /* Wiederhergestellt, aber der neue Stand kam nicht an: `inhalt` und `sha`
     sind dann alt. Speichern schriebe den alten Inhalt still über den
     wiederhergestellten — deshalb gesperrt, bis neu geladen ist. */
  const [veraltet, setVeraltet] = useState(false);
  /* Das offene Bild-Panel: welches Bild, und wodurch es blättert. */
  const [panel, setPanel] = useState<{ schluessel: string; folge?: Folge } | null>(null);
  /* Die aufgeklappte Arbeit bzw. der aufgeklappte Film (siehe `Sitzung`). */
  const [aufgeklappt, setAufgeklappt] = useState<Record<Klappliste, string | null>>({ arbeiten: null, filme: null });
  const klappe = useCallback(
    (liste: Klappliste, kennung: string | null) => setAufgeklappt((a) => ({ ...a, [liste]: kennung })),
    [],
  );

  const [auftraege, setAuftraege] = useState<Auftrag[]>([]);
  const [hochgeladen, setHochgeladen] = useState<string[]>([]);
  const [verarbeitung, setVerarbeitung] = useState<Verarbeitung | null>(null);
  const [beobachten, setBeobachten] = useState(false);
  const [laufFehler, setLaufFehler] = useState<{ url: string } | null>(null);
  const [anstossFehler, setAnstossFehler] = useState<Hinweis | null>(null);
  /* Der Anstoß der Verarbeitung ist unterwegs — gegen Doppelklicks. */
  const [startet, setStartet] = useState(false);
  /* Die Verarbeitung hat eine neue Fassung von `lib/inhalt.json` gebracht,
     während Ungespeichertes da war — Speichern wird auf einen Konflikt laufen. */
  const [fremd, setFremd] = useState(false);
  /* Der Schlüssel, den Jakob gerade verwerfen will. */
  const [verwerfen, setVerwerfen] = useState<string | null>(null);
  /* Die Rückfrage „Alle Änderungen verwerfen?" ist offen. */
  const [allesVerwerfen, setAllesVerwerfen] = useState(false);
  const [meldung, setMeldung] = useState<Meldung | null>(null);
  /* Nur für die Kurzbefehle in `title`. */
  const [mac] = useState(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent));

  /* Einmal beim Öffnen. Nur vorläufig, für die Anzeige im Papierkorb: Das
     Datum, das gespeichert wird, legt der Server fest (eine falsch gehende
     Geräteuhr ließe sonst Originale zu früh löschen). */
  const [heute] = useState(() => tagAus(new Date()));

  /* ── Laden ─────────────────────────────────────────────────────────── */

  const uebernimm = useCallback((stand: Stand, commit = "") => {
    setGeladen({
      inhalt: stand.inhalt,
      basis: stand.inhalt,
      sha: stand.sha,
      commit,
      bilder: stand.bilder,
      konfiguration: stand.konfiguration,
      stapel: LEERER_STAPEL,
    });
    setLadefehler(null);
    setVeraltet(false);
    setEigeneNachricht(null);
    setServerBefunde(null);
    setFremd(false);
    setMeldung(null);
  }, []);

  /** Den Stand frisch holen und übernehmen. `false`: nicht geklappt, der Grund steht in `ladefehler`. */
  const ladeNeu = useCallback(async (): Promise<boolean> => {
    setLaedtNeu(true);
    const erg = await holeStand();
    setLaedtNeu(false);
    if ("stand" in erg) {
      uebernimm(erg.stand);
      return true;
    }
    setLadefehler(erg.fehler);
    return false;
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

  /* ── Ändern und Rückgängig ─────────────────────────────────────────── */

  /* Tippen ist ein Schritt je Besuch eines Felds — aber nur, was aus dessen
     Eingabe kommt (`tippe` im Sitzungskontext, gerufen vom `Textfeld`).
     Jeder Fokuswechsel beginnt einen neuen Besuch. */
  const [tippen] = useState(tippgruppen);
  useEffect(() => {
    const neuerBesuch = () => tippen.neuerBesuch();
    document.addEventListener("focusin", neuerBesuch);
    return () => document.removeEventListener("focusin", neuerBesuch);
  }, [tippen]);
  const tippe = useCallback(
    (feld: Element, f: () => void) => tippen.tippe(f, feld === document.activeElement),
    [tippen],
  );

  /* Wo der letzte Mausklick war — `null` nach einem Klick per Tastatur
     (Enter, Leertaste). Abgefangen vor den Knöpfen selbst, damit
     `aendereMitMeldung` weiß, welcher Klick es auslöste. */
  const letzterKlick = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const merke = (e: MouseEvent) => {
      letzterKlick.current = e.detail > 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    window.addEventListener("click", merke, true);
    return () => window.removeEventListener("click", merke, true);
  }, []);

  /* Wann und wo zuletzt etwas aus einer Liste genommen wurde — `null`,
     sobald danach irgendetwas anderes geschah: Nur zwei Wegnahmen direkt
     hintereinander an derselben Stelle sind ein Doppelklick. */
  const zuletztWeg = useRef<Klick | null>(null);

  const legeUndAendere = useCallback((f: (i: Inhalt) => Inhalt) => {
    /* Hier lesen, nicht im Updater: Den ruft React womöglich erst beim
       Rendern, und dann ist `tippe` längst vorbei. */
    const gruppe = tippen.gruppe();
    setGeladen((g) => {
      if (!g) return g;
      const neu = f(g.inhalt);
      return { ...g, inhalt: neu, stapel: legeAb(g.stapel, g.inhalt, neu, gruppe) };
    });
    /* Die Meldung gehört zum Schritt davor — „Rückgängig" darin träfe jetzt diesen. */
    setMeldung(null);
  }, [tippen]);

  const aendere = useCallback(
    (f: (i: Inhalt) => Inhalt) => {
      zuletztWeg.current = null;
      legeUndAendere(f);
    },
    [legeUndAendere],
  );

  const meldungNr = useRef(0);
  const zeige = useCallback((text: string, knopf: Meldung["knopf"]) => {
    meldungNr.current += 1;
    setMeldung({ id: meldungNr.current, text, knopf });
  }, []);
  const meldungWeg = useCallback((id: number) => setMeldung((m) => (m?.id === id ? null : m)), []);

  const aendereMitMeldung = useCallback(
    (f: (i: Inhalt) => Inhalt, text: string, nimmtWeg = false) => {
      const ort = letzterKlick.current;
      const klick = nimmtWeg && ort ? { ...ort, zeit: Date.now() } : null;
      if (istDoppelklick(zuletztWeg.current, klick)) return;
      zuletztWeg.current = klick;
      legeUndAendere(f);
      zeige(text, "rueckgaengig");
    },
    [legeUndAendere, zeige],
  );

  /* ── Ableitungen ───────────────────────────────────────────────────── */

  const inhalt = geladen?.inhalt;
  const bilder = geladen?.bilder;
  const befunde = useMemo(
    () => (inhalt && bilder ? pruefeInhalt(inhalt, Object.keys(bilder)) : []),
    [inhalt, bilder],
  );
  const { fehler } = nachStufe(befunde);
  const ungespeichert = geladen ? !gleich(geladen.basis, geladen.inhalt) : false;
  const laedtNoch = auftraege.filter((a) => a.zustand === "wartet" || a.zustand === "laeuft").length;
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

  /* Nach „Trotzdem abmelden" nicht ein zweites Mal fragen. */
  const verlassenErlaubt = useRef(false);
  /* Auch während des Hochladens: Schließen bräche die Übertragung und die
     ganze Schlange still ab. */
  const warnen = ungespeichert || laedtNoch > 0;
  useEffect(() => {
    if (!warnen) return;
    const warne = (e: BeforeUnloadEvent) => {
      if (verlassenErlaubt.current) return;
      e.preventDefault();
      /* Ältere Browser brauchen zusätzlich `returnValue`. */
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warne);
    return () => window.removeEventListener("beforeunload", warne);
  }, [warnen]);

  /* ── Der jeweils letzte Stand, für Abläufe über mehrere Abrufe ─────── */

  /* `schaueNach` wartet auf das Netz; was danach gilt, steht hier — nicht
     im Stand von dem Rendern, das die Abfrage gestartet hat. */
  const aktuell = useRef<{ geladen: Geladen | null; hochgeladen: string[]; wartend: string[]; speichert: boolean }>({
    geladen: null,
    hochgeladen: [],
    wartend: [],
    speichert: false,
  });
  /* Jede `sha`, die die Verwaltung schon hatte. Kommt eine davon zurück,
     hinkt GitHub hinterher — das ist kein neuer Stand. */
  const gesehen = useRef(new Set<string>());
  /* In dieser Sitzung verworfen — die erscheinen nicht mehr im Manifest. */
  const verworfen = useRef(new Set<string>());
  useEffect(() => {
    aktuell.current = {
      geladen,
      hochgeladen,
      wartend: verarbeitung?.wartend ?? [],
      speichert: speicher.art === "laeuft",
    };
    if (geladen?.sha) gesehen.current.add(geladen.sha);
  }, [geladen, hochgeladen, verarbeitung, speicher]);

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
      /* Die Papierkorb-Daten hat der Server festgelegt — in `basis` und, für
         dieselben Schlüssel, in `inhalt`, sonst stünde gleich wieder
         „ungespeichert" da. Rückgängig beginnt neu: Was gespeichert ist,
         nimmt der Verlauf zurück — was währenddessen dazukam, aber noch
         „Rückgängig" (`stapelNachSpeichern`). */
      const { papierkorb } = daten;
      const basis = { ...gesendet, papierkorb };
      setGeladen((g) =>
        g
          ? {
              ...g,
              basis,
              inhalt: mitPapierkorbDaten(g.inhalt, papierkorb),
              sha: daten.sha,
              commit: daten.commit,
              stapel: stapelNachSpeichern(g.inhalt, gesendet, basis),
            }
          : g,
      );
      setEigeneNachricht(null);
      setServerBefunde(null);
      setFremd(false);
      setMeldung(null);
      /* Ohne Commit (stand schon so auf main, Verlauf nicht lesbar) gibt es
         nichts, worauf die Live-Meldung warten könnte. */
      setSpeicher(daten.commit ? { art: "veroeffentlicht", commit: daten.commit, seit: Date.now() } : { art: "ruhe" });
      return;
    }
    if (status === 409 || (daten?.ok === false && daten.grund === "konflikt")) {
      setSpeicher({ art: "ruhe" });
      setKonflikt(true);
      return;
    }
    if (daten?.ok === false && daten.befunde?.length) setServerBefunde({ fuer: gesendet, befunde: daten.befunde });
    setSpeicher({ art: "fehler", text: netzText(status, daten), anmelden: status === 404 });
  };

  /**
   * Einen Schritt zurück oder wieder vor — die Meldung sagt, welcher es war,
   * und bietet den Rückweg. Nicht während des Speicherns: Danach stünde der
   * Schritt als ungespeicherte Rücknahme des eben Gespeicherten da.
   */
  const geheSchritt = (richtung: "zurueck" | "vor") => {
    if (!geladen || speicher.art === "laeuft") return;
    const g = geladen;
    const s = richtung === "zurueck" ? schrittZurueck(g.stapel, g.inhalt) : schrittVor(g.stapel, g.inhalt);
    if (!s) return;
    zuletztWeg.current = null;
    /* Nur auf genau den Stand, von dem aus gerechnet wurde. */
    setGeladen((x) => (x === g ? { ...x, inhalt: s.inhalt, stapel: s.stapel } : x));
    if (richtung === "zurueck") zeige(`Rückgängig gemacht: ${fasseZusammen(s.inhalt, g.inhalt)}.`, "wiederholen");
    else zeige(`Wiederholt: ${fasseZusammen(g.inhalt, s.inhalt)}.`, "rueckgaengig");
  };

  /** „Alles verwerfen": zurück auf den zuletzt gespeicherten Stand — als ein Schritt, den Rückgängig zurücknimmt. */
  const verwirfAlles = () => {
    zuletztWeg.current = null;
    setGeladen((g) => g && { ...g, inhalt: g.basis, stapel: legeAb(g.stapel, g.inhalt, g.basis, null) });
    setEigeneNachricht(null);
    zeige("Alle Änderungen verworfen.", "rueckgaengig");
  };

  /**
   * Nach „Wiederherstellen" im Verlauf: den neuen Stand frisch von `main`
   * holen. Übernommen wird nur, was die `sha` des neuen Commits trägt — hinkt
   * GitHub kurz hinterher, käme sonst still der alte Stand zurück. Klappt es
   * gar nicht, sagt die Leiste das und Speichern bleibt gesperrt.
   */
  const beiWiederhergestellt = async (commit: string, sha: string) => {
    let neu: Stand | null = null;
    for (let versuch = 0; versuch < NACH_WIEDERHERSTELLEN_VERSUCHE && !neu; versuch++) {
      if (versuch > 0) await new Promise((r) => setTimeout(r, NACH_WIEDERHERSTELLEN_ABSTAND));
      const erg = await holeStand();
      if ("stand" in erg && erg.stand.sha === sha) neu = erg.stand;
    }
    if (neu) uebernimm(neu, commit);
    else setVeraltet(true);
    /* Ohne Commit (stand schon so auf main) gibt es nichts zu veröffentlichen — wie beim Speichern. */
    setSpeicher(commit ? { art: "veroeffentlicht", commit, seit: Date.now() } : { art: "ruhe" });
  };

  /* Ein Fehler beim Neuladen gehört zum Konfliktdialog — nach „Abbrechen"
     soll kein Band mehr zum Neuladen drängen. */
  const schliesseKonflikt = () => {
    setKonflikt(false);
    setLadefehler(null);
  };

  /** „Neu laden" aus Leiste und Band — wirft Ungespeichertes weg, also erst fragen. */
  const ladeNeuNachFrage = () => {
    if (ungespeichert && !window.confirm("Ungespeicherte Änderungen gehen verloren. Trotzdem neu laden?")) return;
    void ladeNeu();
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
  /* Wie oft ein roter Lauf schon ausgewertet werden sollte, ohne dass etwas ankam (`ausgewertet`). */
  const rotRunde = useRef(0);
  const beobachtetSeit = useRef(0);

  /**
   * Nach einem fertigen Lauf (grün oder rot) den neuen Stand übernehmen: das
   * Manifest immer. Hat die Action auch `lib/inhalt.json` geändert (Papierkorb
   * geleert), den Inhalt nur, wenn dabei nichts Ungespeichertes verloren
   * geht — sonst ein Band, denn das nächste Speichern läuft auf einen
   * Konflikt. Eine `sha`, die schon einmal da war, ist kein neuer Stand,
   * sondern GitHub, das kurz hinterherhinkt.
   */
  const nimmStand = useCallback((stand: Stand) => {
    const { geladen: g, speichert } = aktuell.current;
    if (!g) return;
    const neuerInhalt = stand.sha !== g.sha && !gesehen.current.has(stand.sha);
    if (neuerInhalt && gleich(g.basis, g.inhalt) && !speichert) {
      /* Rückgängig beginnt neu: Ein früherer Stand unter der neuen `sha`
         nähme beim Speichern still zurück, was die Action geändert hat. */
      setGeladen((x) =>
        x && x.sha === g.sha
          ? {
              ...x,
              inhalt: stand.inhalt,
              basis: stand.inhalt,
              sha: stand.sha,
              commit: "",
              bilder: stand.bilder,
              stapel: LEERER_STAPEL,
            }
          : x && { ...x, bilder: stand.bilder },
      );
      setMeldung(null);
      setVeraltet(false);
      return;
    }
    setGeladen((x) => x && { ...x, bilder: stand.bilder });
    if (neuerInhalt) setFremd(true);
  }, []);

  const schaueNach = useCallback(async () => {
    /* Was vor der Abfrage unterwegs war — daran misst sich, was danach im Manifest stehen muss. */
    const vorher = aktuell.current;
    const { status, daten } = await holeJson<Verarbeitung>("/api/admin/verarbeitung");
    if (status === 404) {
      /* Abgemeldet. Die Abfrage läuft bis zur Zeitgrenze weiter (sie kostet
         nichts) — nach einer Anmeldung im anderen Tab geht es von selbst weiter. */
      setAnstossFehler({ text: netzText(404, null), anmelden: true });
      return;
    }
    if (status !== 200 || !daten || !Array.isArray(daten.wartend)) return;
    setAnstossFehler((f) => (f?.anmelden ? null : f));
    setVerarbeitung(daten);
    if (erledigt.current === null) {
      /* Erster Blick: Was schon fertig ist, ist alt — es steckt im Manifest,
         das gerade geladen wurde. War der letzte Lauf rot und wartet noch
         etwas, soll Jakob das aber sehen (und es verwerfen können). */
      erledigt.current = new Set(daten.laeufe.filter((l) => l.status === "completed").map((l) => l.id));
      const rot = letzterFehlschlag(daten);
      if (rot) setLaufFehler({ url: rot.url });
    }
    const auswertung = werteAus(daten, erledigt.current);
    const fertigeLaeufe = [...auswertung.erfolgreich, ...auswertung.fehlgeschlagen];
    const roterLauf = auswertung.fehlgeschlagen[0] ?? null;
    /* Grün und rot gleich: Stand holen, übernehmen, was angekommen ist. Auch
       ein roter Lauf committet, was fertig ist (`ausgewertet`) — ohne den
       Stand kämen dessen gute Bilder nie an. Ausgewertet erst, wenn das
       geholte Manifest dazu passt, sonst nächste Runde noch einmal. */
    let offen = false;
    let manifest = vorher.geladen?.bilder ?? {};
    const bisher = vorher.hochgeladen.filter((s) => !verworfen.current.has(s));
    if (fertigeLaeufe.length > 0) {
      const erwartet = erwarteteBilder(
        [...bisher, ...vorher.wartend.filter((s) => !verworfen.current.has(s))],
        daten.wartend,
        manifest,
      );
      const runde = roterLauf ? ++rotRunde.current : 0;
      const erg = await holeStand();
      if ("stand" in erg && ausgewertet(erwartet, erg.stand.bilder, roterLauf !== null, runde)) {
        for (const l of fertigeLaeufe) erledigt.current.add(l.id);
        rotRunde.current = 0;
        nimmStand(erg.stand);
        manifest = erg.stand.bilder;
        /* Verarbeitet ist, was den Eingang verlassen hat und im Manifest
           steht. Nur, was vor der Abfrage schon hochgeladen war — Späteres
           stand noch gar nicht darin. */
        const { fertig } = nachDemEingang(vorher.hochgeladen, daten.wartend, manifest);
        setHochgeladen((h) => h.filter((s) => !fertig.includes(s)));
        if (!roterLauf) setLaufFehler(null);
      } else {
        offen = true;
      }
    }
    /* Was nach einem roten Lauf dazwischen hängt, braucht einen neuen Lauf —
       so lange weiter nachsehen, damit der auch ankommt. */
    const { vermisst } = nachDemEingang(bisher, daten.wartend, manifest);
    /* Ein roter Lauf, nach dem nichts mehr wartet oder fehlt, betrifft Jakobs
       Bilder nicht (etwa nur die Vorschaukarte) — tun kann er dann nichts. */
    if (roterLauf) setLaufFehler(daten.wartend.length > 0 || vermisst.length > 0 ? { url: roterLauf.url } : null);
    const weiter = daten.wartend.length > 0 || auswertung.laufend || offen || vermisst.length > 0;
    setBeobachten(weiter && Date.now() - beobachtetSeit.current < VERARBEITUNG_HOECHSTENS);
  }, [nimmStand]);

  const konf = geladen?.konfiguration;
  const bereit = geladen !== null;
  useEffect(() => {
    if (!bereit || !(konf?.github || konf?.eingang)) return;
    beobachtetSeit.current = Date.now();
    const t = window.setTimeout(() => void schaueNach(), 0);
    return () => window.clearTimeout(t);
  }, [bereit, konf?.github, konf?.eingang, schaueNach]);

  /* ── Reiter- und Speicherleiste ────────────────────────────────────── */

  const reiterleiste = useRef<HTMLDivElement>(null);
  const speicherleiste = useRef<HTMLDivElement>(null);

  /* Wie hoch die beiden Leisten gerade sind — als `--reiter-h` und
     `--leiste-h` am <html>. Daran hängen der Scroll-Abstand (ein
     fokussiertes Feld liegt nie darunter) und der freie Platz unter der
     Seite. Die Speicherleiste wächst mit Meldung und Notizfeld, deshalb
     beobachtet, nicht einmal gemessen. */
  useEffect(() => {
    if (!bereit) return;
    const html = document.documentElement;
    const miss = () => {
      const r = reiterleiste.current;
      const l = speicherleiste.current;
      if (r) html.style.setProperty("--reiter-h", `${r.offsetHeight}px`);
      if (l) html.style.setProperty("--leiste-h", `${l.offsetHeight}px`);
    };
    const beobachter = new ResizeObserver(miss);
    for (const el of [reiterleiste.current, speicherleiste.current]) if (el) beobachter.observe(el);
    miss();
    return () => {
      beobachter.disconnect();
      html.style.removeProperty("--reiter-h");
      html.style.removeProperty("--leiste-h");
    };
  }, [bereit]);

  /* Der aktive Reiter steht im Blick: Passt die Reiterleiste nicht ganz ins
     Fenster, scrollt sie waagerecht mit. Von Hand statt `scrollIntoView` —
     das schöbe auch die Seite, denn der Reiter liegt im Scroll-Abstand oben. */
  useEffect(() => {
    const leiste = reiterleiste.current;
    const knopf = document.getElementById(`reiter-${reiter}`);
    if (!leiste || !knopf || leiste.scrollWidth <= leiste.clientWidth) return;
    const l = leiste.getBoundingClientRect();
    const k = knopf.getBoundingClientRect();
    const rand = parseFloat(getComputedStyle(leiste).paddingLeft) || 0;
    if (k.left < l.left + rand) leiste.scrollBy({ left: k.left - l.left - rand });
    else if (k.right > l.right - rand) leiste.scrollBy({ left: k.right - l.right + rand });
  }, [reiter, bereit]);

  useEffect(() => {
    if (!beobachten) return;
    const t = window.setInterval(() => {
      /* Die Grenze **vor** dem Abruf: Scheitert jeder Abruf (abgemeldet,
         offline), käme eine Prüfung danach nie an die Reihe. */
      if (Date.now() - beobachtetSeit.current > VERARBEITUNG_HOECHSTENS) {
        setBeobachten(false);
        return;
      }
      void schaueNach();
    }, VERARBEITUNG_ABSTAND);
    return () => window.clearInterval(t);
  }, [beobachten, schaueNach]);

  const stosseAn = useCallback(async () => {
    setAnstossFehler(null);
    setStartet(true);
    const { status, daten } = await sendeJson<VerarbeitenAntwort>("/api/admin/verarbeiten", {});
    setStartet(false);
    if (daten?.ok !== true) {
      setAnstossFehler({ text: netzText(status, daten), anmelden: status === 404 });
      /* Gleich nachsehen, was wartet: Der Stand vom Öffnen der Seite kennt
         die eben hochgeladenen Bilder nicht, und ohne ihn fehlte der Knopf
         zum Wiederholen. */
      void schaueNach();
      return;
    }
    /* Ein neuer Lauf ist angestoßen — der rote davor ist erledigt; bis die
       Abfrage den neuen sieht, gälte sonst noch dessen Knopf. */
    setLaufFehler(null);
    beobachtetSeit.current = Date.now();
    setBeobachten(true);
  }, [schaueNach]);

  /* ── Hochladen ─────────────────────────────────────────────────────── */

  const schlange = useRef<{ id: number; datei: File; ziel: string; typ: string }[]>([]);
  const pumpeLaeuft = useRef(false);
  const naechsteId = useRef(1);
  /* Ziele, die in dieser Sitzung vergeben sind — sofort, nicht erst nach dem
     nächsten Rendern, damit zwei schnelle Auswahlen nicht dieselbe Nummer
     bekommen. */
  const vergeben = useRef(new Set<string>());
  /* Je laufender Übertragung ihr Abbruch („Abbrechen"). */
  const abbrueche = useRef(new Map<number, AbortController>());

  const setzeAuftrag = (id: number, teil: Partial<Auftrag>) =>
    setAuftraege((liste) => liste.map((a) => (a.id === id ? { ...a, ...teil } : a)));

  const pumpe = async () => {
    if (pumpeLaeuft.current) return;
    pumpeLaeuft.current = true;
    let geschafft = 0;
    /* Eine Datei nach der anderen: Der Worker hält jede ganz im Speicher. */
    for (let a = schlange.current.shift(); a; a = schlange.current.shift()) {
      const { id, datei, ziel, typ } = a;
      const abbruch = new AbortController();
      abbrueche.current.set(id, abbruch);
      setzeAuftrag(id, { zustand: "laeuft" });
      const antwort = await sendeDatei(datei, ziel, typ, (anteil) => setzeAuftrag(id, { anteil }), abbruch.signal);
      abbrueche.current.delete(id);
      if (antwort.ok) {
        geschafft++;
        verworfen.current.delete(ziel);
        setHochgeladen((h) => (h.includes(ziel) ? h : [...h, ziel]));
        /* Ein Erfolg auf ein festes Ziel erledigt ältere Fehlversuche dafür. */
        setAuftraege((liste) =>
          liste
            .filter((x) => x.id === id || x.art !== null || x.ziel !== ziel || !gescheitert(x))
            .map((x) => (x.id === id ? { ...x, zustand: "fertig", anteil: 1 } : x)),
        );
      } else {
        vergeben.current.delete(ziel);
        setzeAuftrag(
          id,
          abbruch.signal.aborted
            ? { zustand: "abgebrochen", datei }
            : { zustand: "fehler", text: antwort.text, anmelden: "anmelden" in antwort, datei },
        );
        if ("anmelden" in antwort) {
          /* Abgemeldet: Jede weitere Datei scheiterte genauso. Der Rest der
             Schlange steht deshalb auf „abgebrochen" — nach der Anmeldung im
             anderen Tab holt „Noch einmal" ihn nach. */
          const rest = new Map(schlange.current.map((x) => [x.id, x]));
          schlange.current = [];
          for (const x of rest.values()) vergeben.current.delete(x.ziel);
          setAuftraege((liste) =>
            liste.map((x) => {
              const r = rest.get(x.id);
              return r ? { ...x, zustand: "abgebrochen", datei: r.datei } : x;
            }),
          );
        }
      }
    }
    pumpeLaeuft.current = false;
    if (geschafft > 0) await stosseAn();
  };

  const reiheEin = (liste: { datei: File; ziel: string }[], art: Zielart | null) => {
    const neu: Auftrag[] = [];
    for (const { datei, ziel } of liste) {
      const auftrag = { id: naechsteId.current++, name: datei.name, ziel, art, anteil: 0 };
      const pruefung = pruefeDatei(datei, ziel);
      if (!pruefung.ok) {
        neu.push({ ...auftrag, zustand: "fehler", text: pruefung.text });
      } else if (!ZIEL.test(ziel)) {
        neu.push({ ...auftrag, zustand: "fehler", text: "Ungültiges Ziel." });
      } else {
        vergeben.current.add(ziel);
        schlange.current.push({ id: auftrag.id, datei, ziel, typ: pruefung.typ });
        neu.push({ ...auftrag, zustand: "wartet" });
      }
    }
    setAuftraege((a) => [...a.filter((x) => x.zustand !== "fertig"), ...neu]);
    void pumpe();
  };

  const ladeHoch = (liste: { datei: File; ziel: string }[]) => reiheEin(liste, null);

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
      setAuftraege((a) => [
        ...a,
        { id, name: `${gut.length} Dateien`, ziel: "", art, anteil: 0, zustand: "fehler", text: wahl.text },
      ]);
      return;
    }
    /* Ungeeignete Dateien laufen mit — mit Ziel `""`, damit sie als Fehler
       mit Begründung in der Liste erscheinen statt still wegzufallen. */
    reiheEin(
      [...gut.map((datei, n) => ({ datei, ziel: wahl.ziele[n] })), ...schlecht.map((datei) => ({ datei, ziel: "" }))],
      art,
    );
  };

  /** „Abbrechen": Wartendes kommt aus der Schlange, Laufendes bricht ab. */
  const brichAb = (a: Auftrag) => {
    const laufend = abbrueche.current.get(a.id);
    if (laufend) {
      laufend.abort();
      return;
    }
    const eintrag = schlange.current.find((x) => x.id === a.id);
    if (!eintrag) return;
    schlange.current = schlange.current.filter((x) => x.id !== a.id);
    vergeben.current.delete(a.ziel);
    setzeAuftrag(a.id, { zustand: "abgebrochen", datei: eintrag.datei });
  };

  /** „Noch einmal": dieselbe Datei — ein neues Bild bekommt dabei eine frische Nummer. */
  const nochEinmal = (a: Auftrag) => {
    const datei = a.datei;
    if (!datei) return;
    setAuftraege((liste) => liste.filter((x) => x.id !== a.id));
    if (a.art === null) reiheEin([{ datei, ziel: a.ziel }], null);
    else ladeNeueHoch(a.art, [datei]);
  };

  /* Was „Noch einmal" anbietet — ab zwei auch „Alle noch einmal". */
  const wiederholbar = auftraege.filter((a) => gescheitert(a) && a.datei);

  /** „Alle noch einmal", etwa nach einer abgelaufenen Anmeldung mitten im Stapel. */
  const allesNochEinmal = () => {
    for (const a of wiederholbar) nochEinmal(a);
  };

  const blendeAus = (id: number) => setAuftraege((liste) => liste.filter((x) => x.id !== id));

  /** Nach „Verwerfen": Der Schlüssel ist aus dem Eingang — sofort aus der Anzeige, dann frisch nachsehen. */
  const beiVerworfen = (s: string) => {
    verworfen.current.add(s);
    vergeben.current.delete(s);
    setHochgeladen((h) => h.filter((x) => x !== s));
    setVerarbeitung((v) => v && { ...v, wartend: v.wartend.filter((x) => x !== s) });
    /* Nichts wartet mehr und nichts hängt dazwischen: Dann ist auch der rote
       Lauf erledigt. Hängt noch etwas, bleibt er — mit ihm der Knopf. */
    const rest = (verarbeitung?.wartend ?? []).filter((x) => x !== s);
    const { vermisst } = nachDemEingang(
      hochgeladen.filter((x) => x !== s),
      rest,
      geladen?.bilder ?? {},
    );
    if (rest.length === 0 && vermisst.length === 0) setLaufFehler(null);
    void schaueNach();
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
    aendereMitMeldung,
    tippe,
    unterwegs,
    ladeHoch,
    ladeNeueHoch,
    heute,
    bearbeite: (schluessel, folge) => setPanel({ schluessel, folge }),
    ungespeichert,
    aufgeklappt,
    klappe,
  };

  /**
   * „Zeigen" an einem Befund: in seinen Reiter und dort an die Stelle —
   * wohin genau, rechnet `zeigeziel`. Ein Bild öffnet das Bild-Panel; geht
   * es um einen Text des Bilds, steht der Fokus danach im Feld. Eine Arbeit
   * oder ein Film wird aufgeklappt, das Feld fokussiert (`springeZu`). Beides
   * ein Bild später — dann steht der Reiter bzw. das Panel.
   */
  const zeigeBefund = (b: Befund) => {
    const ziel = zeigeziel(b, { inhalt: geladen.inhalt, bilder: geladen.bilder });
    if (!ziel) return;
    const { reiter: r, aufklappen, panel: p, feld, bild } = ziel;
    setReiter(r);
    if (aufklappen && (r === "arbeiten" || r === "filme")) klappe(r, aufklappen);
    if (p) {
      setPanel({ schluessel: p.schluessel, folge: p.folge });
      const imPanel = p.feld;
      if (imPanel) requestAnimationFrame(() => fokussiereImPanel(imPanel));
      return;
    }
    requestAnimationFrame(() => springeZu(feld, aufklappen, bild));
  };

  /** „Zum Fehler" in der Leiste: die Prüfung ganz oben in den Blick, Fokus darauf. */
  const zumFehler = () => {
    const ort = document.getElementById("befunde");
    if (!ort) return;
    ort.focus({ preventScroll: true });
    /* Von Hand statt `scrollIntoView`: Der Scroll-Abstand für die
       Reiterleiste gälte auch hier — die Prüfung steht aber über ihr. */
    window.scrollBy({ top: ort.getBoundingClientRect().top });
  };

  const kannSpeichern =
    geladen.konfiguration.github && ungespeichert && fehler.length === 0 && speicher.art !== "laeuft" && !veraltet;

  /* Warum das letzte Speichern scheiterte — solange nichts Wichtigeres in der Leiste steht. */
  const speicherFehler =
    speicher.art === "fehler" && ungespeichert && geladen.konfiguration.github && !veraltet && fehler.length === 0
      ? speicher
      : null;

  /* Ein Fehler steht dem Speichern im Weg — dann sagt die Leiste das und bietet „Zum Fehler". */
  const fehlerImWeg =
    geladen.konfiguration.github && !veraltet && speicher.art !== "laeuft" && fehler.length > 0 && ungespeichert;

  const status = !geladen.konfiguration.github
    ? "Speichern ist noch nicht eingerichtet."
    : veraltet
      ? "Wiederhergestellt, aber der neue Stand ließ sich nicht laden. Bitte neu laden."
      : speicher.art === "laeuft"
        ? "Speichert …"
        : fehlerImWeg
          ? `Erst ${fehler.length === 1 ? "den Fehler" : `die ${fehler.length} Fehler`} oben beheben, dann speichern.`
          : speicherFehler
            ? speicherFehler.text
            : ungespeichert
              ? "Ungespeicherte Änderungen."
              : laedtNoch > 0
                ? `Lädt noch ${laedtNoch} ${laedtNoch === 1 ? "Bild" : "Bilder"} hoch — bitte die Seite offen lassen.`
                : speicher.art === "veroeffentlicht"
                  ? "Gespeichert. Wird veröffentlicht … (1–2 Minuten)"
                  : speicher.art === "live"
                    ? "Gespeichert und live."
                    : speicher.art === "dauert"
                      ? "Gespeichert, aber noch nicht live. Schau in ein paar Minuten auf der Seite nach."
                      : "Alles gespeichert.";

  /* Strg/⌘+S, Strg/⌘+Z, Strg/⌘+Umschalt+Z — was wann gilt, entscheidet `tastenbefehl`. */
  const beiTaste = (e: globalThis.KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing) return;
    /* Der oberste Dialog zählt — eine Rückfrage über dem Panel ist eine Rückfrage. */
    const offen = [...document.querySelectorAll("dialog[open]")].at(-1);
    const befehl = tastenbefehl(e, {
      imTextfeld: istTextfeld(document.activeElement),
      dialog: !offen ? "keiner" : offen.classList.contains(styles.panel) ? "seite" : "anderer",
    });
    if (!befehl) return;
    e.preventDefault();
    if (befehl === "rueckgaengig") geheSchritt("zurueck");
    else if (befehl === "wiederholen") geheSchritt("vor");
    else if (befehl === "speichern" && !e.repeat) {
      /* Geht Speichern gerade nicht, sagt die Meldung warum — derselbe Text wie in der Leiste. */
      if (kannSpeichern) void speichere();
      else zeige(status, null);
    }
  };

  /* Die Meldung — in der Leiste oder, bei offenem Seitenpanel, in dessen Fuß.
     Ihr Knopf ist während des Speicherns gesperrt wie „Rückgängig". */
  const meldungZeile = meldung && (
    <MeldungZeile
      meldung={meldung}
      gesperrt={speicher.art === "laeuft"}
      beiAblauf={meldungWeg}
      beiKnopf={() => geheSchritt(meldung.knopf === "wiederholen" ? "vor" : "zurueck")}
    />
  );

  /* Pfeile wechseln zum Nachbarn (im Kreis), Pos1 und Ende zum ersten bzw.
     letzten Reiter — wie in jeder Reiterleiste. */
  const wechsleMitTaste = (e: KeyboardEvent<HTMLButtonElement>, platz: number) => {
    const ziel =
      e.key === "ArrowRight"
        ? platz + 1
        : e.key === "ArrowLeft"
          ? platz - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? REITER.length - 1
              : null;
    if (ziel === null) return;
    e.preventDefault();
    const neu = REITER[(ziel + REITER.length) % REITER.length][0];
    setReiter(neu);
    document.getElementById(`reiter-${neu}`)?.focus();
  };

  const offeneAuftraege = auftraege.filter((a) => a.zustand !== "fertig" || unterwegs.has(a.ziel));
  const wartend = verarbeitung?.wartend ?? [];
  const laufend = verarbeitung?.laeufe.some((l) => l.status !== "completed") ?? false;
  /* Text und Link einmal für den ganzen Bereich, nicht in jeder Zeile. */
  const abgemeldet = anstossFehler?.anmelden || offeneAuftraege.some((a) => a.zustand === "fehler" && a.anmelden);
  const anzeige = verarbeitungsanzeige({
    github: geladen.konfiguration.github,
    laufend,
    wartend: wartend.length,
    vermisst: nachDemEingang(hochgeladen, wartend, geladen.bilder).vermisst.length,
    hochgeladen: hochgeladen.length,
    fertigeZeile: offeneAuftraege.some((a) => a.zustand === "fertig"),
    rot: laufFehler !== null,
    anstossFehler: anstossFehler !== null,
  });

  return (
    <SitzungKontext.Provider value={sitzung}>
      <main id="inhalt" className={styles.seite}>
        <header className={styles.kopf}>
          <h1 className={styles.titel}>Verwaltung</h1>
          <div className={styles.wer}>
            <a href="/" target="_blank" rel="noopener" aria-label="Seite ansehen (neuer Tab)">
              Seite ansehen ↗
            </a>
            <form
              method="post"
              action="/api/admin/abmelden"
              onSubmit={(e) => {
                const frage =
                  ungespeichert && laedtNoch > 0
                    ? "Ungespeicherte Änderungen gehen verloren, und das Hochladen bricht ab. Trotzdem abmelden?"
                    : laedtNoch > 0
                      ? "Es werden noch Bilder hochgeladen — das bricht ab. Trotzdem abmelden?"
                      : ungespeichert
                        ? "Ungespeicherte Änderungen gehen verloren. Trotzdem abmelden?"
                        : null;
                if (frage && !window.confirm(frage)) {
                  e.preventDefault();
                  return;
                }
                /* Bestätigt — die Warnung beim Verlassen fragte sonst ein zweites Mal. */
                verlassenErlaubt.current = true;
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
        {fremd && (
          <div className={styles.band} role="status">
            <p>
              Inzwischen wurde der Inhalt anderswo geändert (zum Beispiel hat die Bildverarbeitung den Papierkorb
              geleert). Beim Speichern gibt es deshalb eine Rückfrage.
            </p>
          </div>
        )}
        {/* Neu laden ist gescheitert, während schon ein Stand da ist — sonst
            bliebe es still, und Jakob arbeitete auf dem alten weiter. */}
        {ladefehler && (
          <div className={styles.band} role="alert">
            <p>Neu laden hat nicht geklappt: {ladefehler}</p>
            <div className={styles.knopfreihe}>
              <button type="button" className={styles.knopf} disabled={laedtNeu} onClick={ladeNeuNachFrage}>
                {laedtNeu ? "Lädt …" : "Noch einmal laden"}
              </button>
            </div>
          </div>
        )}

        <Befunde
          befunde={befunde}
          server={serverBefunde && serverBefunde.fuer === geladen.inhalt ? serverBefunde.befunde : []}
          zeige={zeigeBefund}
        />

        {(offeneAuftraege.length > 0 || wartend.length > 0 || laufend || anzeige.rot || anstossFehler) && (
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
                            : a.zustand === "abgebrochen"
                              ? "abgebrochen"
                              : "nicht hochgeladen"}
                    </span>
                    <span className={styles.auftragKnoepfe}>
                      {(a.zustand === "wartet" || a.zustand === "laeuft") && (
                        <button
                          type="button"
                          className={styles.knopfLeise}
                          aria-label={`Abbrechen: ${a.name}`}
                          onClick={() => brichAb(a)}
                        >
                          Abbrechen
                        </button>
                      )}
                      {gescheitert(a) && a.datei && (
                        <button
                          type="button"
                          className={styles.knopfLeise}
                          aria-label={`Noch einmal: ${a.name}`}
                          onClick={() => nochEinmal(a)}
                        >
                          Noch einmal
                        </button>
                      )}
                      {gescheitert(a) && (
                        <button
                          type="button"
                          className={styles.knopfLeise}
                          aria-label={`Ausblenden: ${a.name}`}
                          onClick={() => blendeAus(a.id)}
                        >
                          Ausblenden
                        </button>
                      )}
                    </span>
                    {a.zustand === "laeuft" && (
                      <progress className={styles.fortschritt} max={1} value={a.anteil} aria-label={`${a.name} lädt`} />
                    )}
                    {/* Die abgelaufene Anmeldung steht einmal unten, nicht in jeder Zeile. */}
                    {a.zustand === "fehler" && a.text && !a.anmelden && (
                      <p className={`${styles.fehlerText} ${styles.auftragText}`}>{a.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {wiederholbar.length > 1 && (
              <div className={styles.knopfreihe}>
                <button type="button" className={styles.knopf} onClick={allesNochEinmal}>
                  Alle noch einmal
                </button>
              </div>
            )}
            <p className={styles.leise} aria-live="polite">
              {anzeige.satz}
            </p>
            {laufFehler && anzeige.rot && (
              <p className={styles.fehlerText}>
                Die Verarbeitung ist fehlgeschlagen. {anzeige.rot}{" "}
                <a href={laufFehler.url} target="_blank" rel="noopener noreferrer">
                  Lauf ansehen ↗
                </a>
              </p>
            )}
            {anstossFehler && !anstossFehler.anmelden && <p className={styles.fehlerText}>{anstossFehler.text}</p>}
            {abgemeldet && (
              <p className={styles.fehlerText}>
                {netzText(404, null)} <AnmeldenLink />
              </p>
            )}
            {anzeige.knopf && (
              <div className={styles.knopfreihe}>
                <button type="button" className={styles.knopf} disabled={startet} onClick={() => void stosseAn()}>
                  {startet ? "Startet …" : anzeige.knopf}
                </button>
              </div>
            )}
            {/* Scheitert ein Bild immer wieder, hängt es sonst für immer im
                Eingang — und jeder Lauf endet rot. Während eines Laufs nicht:
                Dann liest die Action gerade daraus. */}
            {anzeige.verwerfen && (
              <>
                <p className={styles.leise}>
                  Scheitert es immer wieder, liegt es meist an einem Bild. Verwirf es und lade es neu als JPEG exportiert
                  noch einmal hoch:
                </p>
                <ul>
                  {wartend.map((s) => (
                    <li key={s} className={styles.auftrag}>
                      <span>{bildBezeichnung(geladen.inhalt, s)}</span>
                      <span className={styles.auftragKnoepfe}>
                        <button
                          type="button"
                          className={styles.knopfLeise}
                          aria-label={`Verwerfen: ${bildBezeichnung(geladen.inhalt, s)}`}
                          onClick={() => setVerwerfen(s)}
                        >
                          Verwerfen
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <div ref={reiterleiste} className={styles.reiter} role="tablist" aria-label="Bereiche">
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

        {/* `tabIndex` -1: „Zeigen" setzt den Fokus an den Anfang des Reiters, wenn es keine genauere Stelle gibt. */}
        <div id="reiter-inhalt" role="tabpanel" aria-labelledby={`reiter-${reiter}`} tabIndex={-1}>
          {reiter === "fotos" && <Fotos />}
          {reiter === "hero" && <Hero />}
          {reiter === "arbeiten" && <Arbeiten />}
          {reiter === "ueber" && <Ueber />}
          {reiter === "filme" && <Filme />}
          {reiter === "startseite" && <Startseite />}
          {reiter === "impressum" && <Impressum />}
          {reiter === "papierkorb" && <Papierkorb />}
          {reiter === "verlauf" && (
            <VerlaufReiter
              sha={geladen.sha}
              commit={geladen.commit}
              gesperrt={veraltet}
              beiWiederhergestellt={beiWiederhergestellt}
              beiKonflikt={() => setKonflikt(true)}
            />
          )}
        </div>

        <Tasten beiTaste={beiTaste} />

        <div ref={speicherleiste} className={styles.leiste} data-leiste>
          {/* Immer da, auch leer: Eine Live-Region, die erst mit ihrem Text
              erscheint, lesen Screenreader oft nicht vor. Bei offenem
              Seitenpanel steht die Meldung in dessen Fuß — hier läge sie
              unter dem Panel. */}
          <div className={styles.meldungOrt} role="status">
            {!panel && meldungZeile}
          </div>
          <div className={styles.leisteInnen}>
            {/* Status und „Zum Fehler" teilen sich einen Platz — sonst rutschte
                „Speichern" bei 1024px in eine zweite Zeile. */}
            <div className={styles.leisteStatusZeile}>
              <p className={styles.leisteStatus} role="status">
                {status}
                {speicherFehler?.anmelden && (
                  <>
                    {" "}
                    <AnmeldenLink />
                  </>
                )}
              </p>
              {fehlerImWeg && (
                <button type="button" className={styles.knopfLeise} onClick={zumFehler}>
                  Zum Fehler
                </button>
              )}
            </div>
            {geladen.konfiguration.github && ungespeichert && (
              <div className={`${styles.feld} ${styles.leisteNachricht}`}>
                <label className={styles.feldName} htmlFor="nachricht">
                  Notiz für den Verlauf (optional)
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
            {veraltet && (
              <button type="button" className={styles.knopf} disabled={laedtNeu} onClick={ladeNeuNachFrage}>
                {laedtNeu ? "Lädt …" : "Neu laden"}
              </button>
            )}
            {/* Nicht während des Speicherns: Danach stünde der alte Stand als
                ungespeicherte Rücknahme des eben Gespeicherten da. */}
            {ungespeichert && (
              <button
                type="button"
                className={styles.knopfLeise}
                disabled={speicher.art === "laeuft"}
                onClick={() => setAllesVerwerfen(true)}
              >
                Alles verwerfen
              </button>
            )}
            <button
              type="button"
              className={styles.knopfLeise}
              disabled={geladen.stapel.rueck.length === 0 || speicher.art === "laeuft"}
              onClick={() => geheSchritt("zurueck")}
              title={`Rückgängig (${mac ? "⌘Z" : "Strg+Z"})`}
              aria-keyshortcuts="Control+Z Meta+Z"
            >
              <Zeichen name="zurueck" />
              Rückgängig
            </button>
            <button
              type="button"
              className={styles.knopfHaupt}
              disabled={!kannSpeichern}
              onClick={() => void speichere()}
              title={`Speichern (${mac ? "⌘S" : "Strg+S"})`}
              aria-keyshortcuts="Control+S Meta+S"
            >
              {speicher.art === "laeuft" ? "Speichert …" : "Speichern"}
            </button>
          </div>
        </div>

        {panel && (
          <BildPanel
            schluessel={panel.schluessel}
            folge={panel.folge}
            beiSchliessen={(nachbar) => {
              setPanel(null);
              /* Ein Bild später: Erst dann ist das Panel weg und der Fokus zurück. */
              const zuletzt = panel.schluessel;
              requestAnimationFrame(() => zeigeKachel(zuletzt, nachbar));
            }}
            meldung={meldungZeile}
          />
        )}

        {verwerfen && (
          <VerwerfenDialog
            schluessel={verwerfen}
            name={bildBezeichnung(geladen.inhalt, verwerfen)}
            beiVerworfen={beiVerworfen}
            beiSchliessen={() => setVerwerfen(null)}
          />
        )}

        {allesVerwerfen && (
          <Dialog titel="Alle Änderungen verwerfen?" beiSchliessen={() => setAllesVerwerfen(false)}>
            {(schliesse) => (
              <>
                <p className={styles.text}>Verworfen wird: {vorschlag}.</p>
                <p className={styles.text}>Danach steht wieder da, was zuletzt gespeichert war.</p>
                <div className={styles.knopfreihe}>
                  <button
                    type="button"
                    className={styles.knopfHaupt}
                    onClick={() => {
                      verwirfAlles();
                      schliesse();
                    }}
                  >
                    Verwerfen
                  </button>
                  <button type="button" className={styles.knopf} onClick={schliesse}>
                    Abbrechen
                  </button>
                </div>
              </>
            )}
          </Dialog>
        )}

        {konflikt && (
          <Dialog titel="Inzwischen hat jemand anderes gespeichert" beiSchliessen={schliesseKonflikt}>
            {(schliesse) => (
              <>
                <p className={styles.text}>
                  Seit du die Verwaltung geöffnet hast, wurde der Inhalt an anderer Stelle geändert — in einem zweiten
                  Tab oder von Jan im Code. Deine Änderungen lassen sich nicht einfach darüberlegen, sonst wäre das
                  andere still weg.
                </p>
                {ungespeichert ? (
                  <>
                    <p className={styles.text}>
                      <strong>Neu laden verwirft:</strong> {vorschlag}.
                    </p>
                    <p className={styles.text}>
                      Abbrechen lässt deine Änderungen hier stehen, damit du sie dir ansehen kannst — speichern lassen
                      sie sich so aber nicht.
                    </p>
                  </>
                ) : (
                  <p className={styles.text}>
                    Neu laden holt den neuesten Stand; danach kannst du es noch einmal versuchen.
                  </p>
                )}
                {ladefehler && <p className={styles.fehlerText}>Neu laden hat nicht geklappt: {ladefehler}</p>}
                <div className={styles.knopfreihe}>
                  <button
                    type="button"
                    className={styles.knopfHaupt}
                    disabled={laedtNeu}
                    onClick={async () => {
                      /* Erst nach Erfolg schließen — sonst wäre der Dialog weg,
                         der alte Stand noch da, und das nächste Speichern
                         landete wieder hier. */
                      if (await ladeNeu()) {
                        schliesse();
                        setSpeicher({ art: "ruhe" });
                      }
                    }}
                  >
                    {laedtNeu ? "Lädt …" : ungespeichert ? "Neu laden (Änderungen verwerfen)" : "Neu laden"}
                  </button>
                  <button type="button" className={styles.knopf} onClick={schliesse}>
                    Abbrechen
                  </button>
                </div>
              </>
            )}
          </Dialog>
        )}
      </main>
    </SitzungKontext.Provider>
  );
}

/**
 * Nach dem Bild-Panel: die Kachel (`data-bild`) des **zuletzt gezeigten**
 * Bilds in den Blick holen und fokussieren — nach dem Blättern ist das nicht
 * mehr die, die das Panel geöffnet hat und auf die der Browser den Fokus
 * zurückgibt. Liegt sie unter der Reiter- oder der Speicherleiste, zählt
 * sie nicht als sichtbar.
 *
 * Steht das Bild auf mehreren Plätzen (Startseite: oben und als Highlight),
 * bleibt der, auf dem der Fokus schon steht — der hat das Panel geöffnet.
 * Gibt es die Kachel nicht mehr (nach „Löschen" im Mosaik), die von
 * `nachbar`; gibt es keine (anderer Reiter), bleibt alles, wie es ist.
 */
function zeigeKachel(s: string, nachbar: string | null) {
  if (document.querySelector("dialog[open]")) return;
  const fokus = document.activeElement;
  const finde = (x: string) => document.querySelector<HTMLElement>(`[data-bild="${CSS.escape(x)}"]`);
  const knopf =
    fokus instanceof HTMLElement && fokus.dataset.bild === s ? fokus : (finde(s) ?? (nachbar ? finde(nachbar) : null));
  if (knopf) holeInDenBlick(knopf);
}

/**
 * Das Eingabefeld in `bereich`, dessen Beschriftung so beginnt („Kunde" für
 * „Kunde (optional)") — nur, wenn es zu sehen ist (nicht zugeklappt).
 */
function feldMit(bereich: Element, feld: string): HTMLElement | null {
  const beschriftung = [...bereich.querySelectorAll("label")].find((l) => l.textContent?.startsWith(feld));
  const eingabe = beschriftung?.htmlFor ? document.getElementById(beschriftung.htmlFor) : null;
  return eingabe && eingabe.getClientRects().length > 0 ? eingabe : null;
}

/**
 * Nach „Zeigen" (ein Bild später, wenn der Reiter steht): das Feld, um das
 * es geht — gesucht über seine Beschriftung, bei einer Arbeit oder einem
 * Film nur in deren aufgeklappter Zeile (`data-sortier`) —, oder der Knopf
 * mit genau diesem Namen („Highlight 2 ändern"). Gibt es keins (oder ist es
 * zugeklappt), die Zeile selbst (ihr Stift), sonst das Bild (`data-bild`;
 * ist es gesperrt, ein Knopf seiner Zeile), sonst der Anfang des Reiters.
 */
function springeZu(feld: string | null, kennung: string | null, schluessel: string | null) {
  const bereich = document.getElementById("reiter-inhalt");
  if (!bereich) return;
  const zeile = kennung ? bereich.querySelector<HTMLElement>(`[data-sortier="${CSS.escape(kennung)}"]`) : null;
  const eingabe = feld ? feldMit(zeile ?? bereich, feld) : null;
  const knopf = feld
    ? [...(zeile ?? bereich).querySelectorAll<HTMLElement>("button[aria-label]")].find(
        (k) => k.getAttribute("aria-label") === feld,
      )
    : undefined;
  const bild = schluessel ? bereich.querySelector<HTMLButtonElement>(`[data-bild="${CSS.escape(schluessel)}"]`) : null;
  const ziel =
    eingabe ??
    knopf ??
    zeile?.querySelector<HTMLElement>("[aria-expanded]") ??
    (bild && !bild.disabled ? bild : bild?.closest("li")?.querySelector<HTMLElement>("button:not(:disabled)"));
  if (ziel) holeInDenBlick(ziel);
  else holeInDenBlick(bereich, "anfang");
}

/**
 * Nach „Zeigen" bei einem Text eines Bilds (ein Bild später, wenn das
 * Bild-Panel offen ist): den Fokus in dessen Feld. Der Browser holt es dabei
 * im Panel in den Blick.
 */
function fokussiereImPanel(feld: string) {
  const panel = document.querySelector(`dialog.${CSS.escape(styles.panel)}[open]`);
  if (panel) feldMit(panel, feld)?.focus();
}

/**
 * Hört auf Tasten im ganzen Fenster. Eine eigene Komponente, weil
 * `beiTaste` erst nach dem Laden entsteht (Hooks dürfen nicht hinter dem
 * frühen `return` stehen); gerufen wird immer die aus dem letzten Rendern.
 */
function Tasten({ beiTaste }: { beiTaste: (e: globalThis.KeyboardEvent) => void }) {
  const aktuell = useRef(beiTaste);
  useEffect(() => {
    aktuell.current = beiTaste;
  }, [beiTaste]);
  useEffect(() => {
    const taste = (e: globalThis.KeyboardEvent) => aktuell.current(e);
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, []);
  return null;
}

/**
 * Die Meldung in der Leiste (oder im Fuß des Seitenpanels). Verschwindet
 * nach `MELDUNG_DAUER` — nicht, solange Maus oder Fokus darin sind oder ein
 * Dialog sie verdeckt; danach beginnt die Zeit von vorn. Gefragt wird alle
 * `MELDUNG_TAKT` das DOM selbst statt eines Zustands: Verschwindet ein
 * Knopf mit dem Fokus, meldet der Browser nicht immer ein `blur`, und wann
 * ein Dialog schließt, erfährt die Meldung sonst gar nicht.
 */
function MeldungZeile({
  meldung,
  gesperrt,
  beiAblauf,
  beiKnopf,
}: {
  meldung: Meldung;
  gesperrt: boolean;
  beiAblauf: (id: number) => void;
  beiKnopf: () => void;
}) {
  const kasten = useRef<HTMLDivElement>(null);
  const { id } = meldung;

  useEffect(() => {
    let frist = Date.now() + MELDUNG_DAUER;
    const t = window.setInterval(() => {
      const k = kasten.current;
      /* Verdeckt: Ein offener Dialog, zu dem sie nicht gehört, liegt darüber. */
      const verdeckt = k !== null && [...document.querySelectorAll("dialog[open]")].some((d) => !d.contains(k));
      if (k && (k.matches(":hover") || k.contains(document.activeElement) || verdeckt)) {
        frist = Date.now() + MELDUNG_DAUER;
      } else if (Date.now() >= frist) {
        beiAblauf(id);
      }
    }, MELDUNG_TAKT);
    return () => window.clearInterval(t);
  }, [id, beiAblauf]);

  return (
    <div ref={kasten} className={styles.meldung}>
      <span>{meldung.text}</span>
      {meldung.knopf && (
        <button
          type="button"
          className={styles.knopfLeise}
          disabled={gesperrt}
          onClick={(e) => {
            /* Derselbe Knopf heißt nach dem ersten Klick „Wiederholen" — der
               zweite Klick eines Doppelklicks machte alles gleich wieder rückgängig. */
            if (e.detail > 1) return;
            beiKnopf();
          }}
        >
          {meldung.knopf === "wiederholen" ? "Wiederholen" : "Rückgängig"}
        </button>
      )}
    </div>
  );
}

/**
 * Rückfrage vor dem Verwerfen eines Bilds, das noch im Eingang liegt
 * (`DELETE /api/admin/hochladen`). Schließt erst, wenn es geklappt hat —
 * sonst steht der Grund darin.
 */
function VerwerfenDialog({
  schluessel,
  name,
  beiVerworfen,
  beiSchliessen,
}: {
  schluessel: string;
  name: string;
  beiVerworfen: (schluessel: string) => void;
  beiSchliessen: () => void;
}) {
  const [laeuft, setLaeuft] = useState(false);
  const [grund, setGrund] = useState<Hinweis | null>(null);

  return (
    <Dialog titel={`„${name}“ verwerfen?`} beiSchliessen={beiSchliessen}>
      {(schliesse) => (
        <>
          <p className={styles.text}>
            Das Bild wurde noch nicht verarbeitet. Verwerfen löscht es aus dem Eingang; auf der Seite ändert sich
            nichts. Exportier es am besten neu als JPEG und lade es noch einmal hoch.
          </p>
          {grund && (
            <p className={styles.fehlerText}>
              {grund.text}
              {grund.anmelden && (
                <>
                  {" "}
                  <AnmeldenLink />
                </>
              )}
            </p>
          )}
          <div className={styles.knopfreihe}>
            <button
              type="button"
              className={styles.knopfHaupt}
              disabled={laeuft}
              onClick={async () => {
                setLaeuft(true);
                setGrund(null);
                const { status, daten } = await holeJson<HochladenAntwort>(
                  `/api/admin/hochladen?ziel=${encodeURIComponent(schluessel)}`,
                  { method: "DELETE" },
                );
                setLaeuft(false);
                if (daten?.ok === true) {
                  beiVerworfen(schluessel);
                  schliesse();
                  return;
                }
                setGrund({ text: netzText(status, daten), anmelden: status === 404 });
              }}
            >
              {laeuft ? "Verwirft …" : "Verwerfen"}
            </button>
            {/* Gesperrt, solange es läuft: Das Löschen ist dann schon unterwegs. */}
            <button type="button" className={styles.knopf} disabled={laeuft} onClick={schliesse}>
              Abbrechen
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
