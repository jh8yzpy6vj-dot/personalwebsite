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
  angekommen,
  bildBezeichnung,
  erwarteteBilder,
  fasseZusammen,
  gleich,
  gleicherCommit,
  letzterFehlschlag,
  mitPapierkorbDaten,
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
 * - `bilder` — das Manifest. Nach fertiger Verarbeitung kommt der ganze
 *   Stand neu, übernommen wird aber nur das Manifest — `inhalt`, `basis`
 *   und `sha` nur dann, wenn nichts ungespeichert ist (die Action kann den
 *   Papierkorb geleert haben). Sonst wären Jakobs Änderungen weg; dann sagt
 *   ein Band, dass Speichern eine Rückfrage bringt.
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
/** Nach dem Wiederherstellen: so oft den neuen Stand holen, in diesem Abstand (ms). */
const NACH_WIEDERHERSTELLEN_VERSUCHE = 4;
const NACH_WIEDERHERSTELLEN_ABSTAND = 1500;

type Geladen = {
  inhalt: Inhalt;
  basis: Inhalt;
  sha: string;
  /** Der Commit, der `sha` geschrieben hat — nur nach eigenem Speichern oder Wiederherstellen bekannt, sonst `""`. */
  commit: string;
  bilder: Record<string, Bildquelle>;
  konfiguration: Konfiguration;
};

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
  const [panel, setPanel] = useState<string | null>(null);

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
    });
    setLadefehler(null);
    setVeraltet(false);
    setEigeneNachricht(null);
    setServerBefunde(null);
    setFremd(false);
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
         „ungespeichert" da. */
      const { papierkorb } = daten;
      setGeladen((g) =>
        g
          ? {
              ...g,
              basis: { ...gesendet, papierkorb },
              inhalt: mitPapierkorbDaten(g.inhalt, papierkorb),
              sha: daten.sha,
              commit: daten.commit,
            }
          : g,
      );
      setEigeneNachricht(null);
      setServerBefunde(null);
      setFremd(false);
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
  const beobachtetSeit = useRef(0);

  /**
   * Nach fertiger Verarbeitung den neuen Stand übernehmen: das Manifest
   * immer. Hat die Action auch `lib/inhalt.json` geändert (Papierkorb
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
      setGeladen((x) =>
        x && x.sha === g.sha
          ? { ...x, inhalt: stand.inhalt, basis: stand.inhalt, sha: stand.sha, commit: "", bilder: stand.bilder }
          : x && { ...x, bilder: stand.bilder },
      );
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
    for (const l of auswertung.fehlgeschlagen) erledigt.current.add(l.id);
    /* Ein erfolgreicher Lauf gilt erst als ausgewertet, wenn seine Bilder im
       geholten Manifest stehen — sonst nächste Runde noch einmal. */
    let offen = false;
    if (auswertung.erfolgreich.length > 0) {
      const bisher = [...vorher.hochgeladen, ...vorher.wartend].filter((s) => !verworfen.current.has(s));
      const erwartet = erwarteteBilder(bisher, daten.wartend, vorher.geladen?.bilder ?? {});
      const erg = await holeStand();
      if ("stand" in erg && angekommen(erwartet, erg.stand.bilder)) {
        for (const l of auswertung.erfolgreich) erledigt.current.add(l.id);
        nimmStand(erg.stand);
        /* Was nicht mehr im Eingang liegt, ist verarbeitet. Nur, was vor der
           Abfrage schon hochgeladen war — Späteres stand noch gar nicht darin. */
        const fertig = new Set(vorher.hochgeladen.filter((s) => !daten.wartend.includes(s)));
        setHochgeladen((h) => h.filter((s) => !fertig.has(s)));
        setLaufFehler(null);
      } else {
        offen = true;
      }
    }
    if (auswertung.fehlgeschlagen.length > 0) setLaufFehler({ url: auswertung.fehlgeschlagen[0].url });
    const weiter = daten.wartend.length > 0 || auswertung.laufend || offen;
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
      }
    }
    pumpeLaeuft.current = false;
    if (geschafft > 0) await stosseAn();
  };

  const reiheEin = (liste: { datei: File; ziel: string }[], art: Zielart | null) => {
    const neu: Auftrag[] = [];
    for (const { datei, ziel } of liste) {
      const auftrag = { id: naechsteId.current++, name: datei.name, ziel, art, anteil: 0 };
      const pruefung = pruefeDatei(datei);
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

  const blendeAus = (id: number) => setAuftraege((liste) => liste.filter((x) => x.id !== id));

  /** Nach „Verwerfen": Der Schlüssel ist aus dem Eingang — sofort aus der Anzeige, dann frisch nachsehen. */
  const beiVerworfen = (s: string) => {
    verworfen.current.add(s);
    vergeben.current.delete(s);
    setHochgeladen((h) => h.filter((x) => x !== s));
    setVerarbeitung((v) => v && { ...v, wartend: v.wartend.filter((x) => x !== s) });
    /* Nichts wartet mehr: Dann ist auch der rote Lauf erledigt. */
    if ((verarbeitung?.wartend ?? []).every((x) => x === s)) setLaufFehler(null);
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
    unterwegs,
    ladeHoch,
    ladeNeueHoch,
    heute,
    bearbeite: setPanel,
    ungespeichert,
  };

  const kannSpeichern =
    geladen.konfiguration.github && ungespeichert && fehler.length === 0 && speicher.art !== "laeuft" && !veraltet;

  /* Warum das letzte Speichern scheiterte — solange nichts Wichtigeres in der Leiste steht. */
  const speicherFehler =
    speicher.art === "fehler" && ungespeichert && geladen.konfiguration.github && !veraltet && fehler.length === 0
      ? speicher
      : null;

  const status = !geladen.konfiguration.github
    ? "Speichern ist noch nicht eingerichtet."
    : veraltet
      ? "Wiederhergestellt, aber der neue Stand ließ sich nicht laden. Bitte neu laden."
      : speicher.art === "laeuft"
        ? "Speichert …"
        : fehler.length > 0 && ungespeichert
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
  /* Einmal für den ganzen Bereich, nicht in jeder Zeile. */
  const abgemeldet = anstossFehler?.anmelden || offeneAuftraege.some((a) => a.zustand === "fehler" && a.anmelden);
  /* Anstoßen geht, wenn etwas wartet — oder wenn eben Hochgeladenes nicht
     angestoßen werden konnte und der Blick in den Eingang auch scheiterte. */
  const anstossbar =
    !laufend && geladen.konfiguration.github && (wartend.length > 0 || (anstossFehler !== null && hochgeladen.length > 0));

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
                    ? anstossFehler
                      ? "Hochgeladen, aber die Verarbeitung ließ sich nicht starten."
                      : "Hochgeladen. Die Verarbeitung startet gleich."
                    : ""}
            </p>
            {laufFehler && (
              <p className={styles.fehlerText}>
                Die Verarbeitung ist fehlgeschlagen. Die Bilder liegen weiter sicher im Eingang.{" "}
                <a href={laufFehler.url} target="_blank" rel="noopener noreferrer">
                  Lauf ansehen ↗
                </a>
              </p>
            )}
            {anstossFehler && <p className={styles.fehlerText}>{anstossFehler.text}</p>}
            {abgemeldet && (
              <p className={styles.leise}>
                <AnmeldenLink />
              </p>
            )}
            {anstossbar && (
              <div className={styles.knopfreihe}>
                <button type="button" className={styles.knopf} disabled={startet} onClick={() => void stosseAn()}>
                  {startet ? "Startet …" : anstossFehler ? "Noch einmal versuchen" : "Verarbeitung starten"}
                </button>
              </div>
            )}
            {/* Scheitert ein Bild immer wieder, hängt es sonst für immer im
                Eingang — und jeder Lauf endet rot. Während eines Laufs nicht:
                Dann liest die Action gerade daraus. */}
            {laufFehler && !laufend && wartend.length > 0 && (
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
              commit={geladen.commit}
              gesperrt={veraltet}
              beiWiederhergestellt={beiWiederhergestellt}
              beiKonflikt={() => setKonflikt(true)}
            />
          )}
        </div>

        <div className={styles.leiste}>
          <div className={styles.leisteInnen}>
            <p className={styles.leisteStatus} role="status">
              {status}
              {speicherFehler?.anmelden && (
                <>
                  {" "}
                  <AnmeldenLink />
                </>
              )}
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
            {veraltet && (
              <button type="button" className={styles.knopf} disabled={laedtNeu} onClick={ladeNeuNachFrage}>
                {laedtNeu ? "Lädt …" : "Neu laden"}
              </button>
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

        {verwerfen && (
          <VerwerfenDialog
            schluessel={verwerfen}
            name={bildBezeichnung(geladen.inhalt, verwerfen)}
            beiVerworfen={beiVerworfen}
            beiSchliessen={() => setVerwerfen(null)}
          />
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
            <button type="button" className={styles.knopf} onClick={schliesse}>
              Abbrechen
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
