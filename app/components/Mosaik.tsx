"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Bild from "./Bild";
import { MOSAIK_SIZES } from "@/lib/bilder";
import type { Mosaikbild } from "@/lib/arbeiten";
import styles from "./Mosaik.module.css";

type Props = {
  /** Alle Bilder der Seite, in Anzeigereihenfolge (lib/arbeiten.ts). */
  bilder: Mosaikbild[];
};

/** Wie viele Bilder sofort laden — der Rest lädt, wenn er in die Nähe kommt. */
const SOFORT = 3;

/**
 * Das Mosaik auf `/foto`: alle Fotos aller Arbeiten in Spalten, jedes Bild
 * in seiner eigenen Form, **nichts beschnitten**, **keine Zwischenzeilen**
 * (E4). „Titel – Kunde" erscheint erst beim Überfahren bzw. bei
 * Tastaturfokus und im Lichtkasten.
 *
 * ⚠️ **Der erste Anlauf war ein Zeilensatz und ist am 2026-09-13
 * gescheitert.** Ein Zeilensatz reiht die Bilder in Dateireihenfolge
 * aneinander und kann Formate nicht mischen — bei fünf Hochformaten und
 * einem Querformat ein Streifen plus Einzelbild. Jan: „das mosaik ist
 * geordnet … das ist kein mosaik." Spalten mischen von selbst, weil jede
 * unabhängig gefüllt wird.
 *
 * **Kein JavaScript im Layout.** Der Spaltensatz ist reines CSS und trägt
 * auch ohne Skript; der Lichtkasten obendrauf ist eine Aufwertung, ohne ihn
 * ist jede Kachel ein gewöhnlicher Link auf die Bilddatei.
 */
/** Name des Übergangs zwischen Kachel und Lichtkasten. Je Zustand trägt ihn
    genau ein Element — zwei gleichnamige brechen den Übergang ab. */
const UEBERGANG = "lichtkasten";

/**
 * Führt eine Änderung als View Transition aus: Das Foto wächst aus seiner
 * Kachel in den Lichtkasten und kehrt beim Schließen dorthin zurück (UI-SPEC,
 * „Motion"). Ohne Unterstützung oder unter `prefers-reduced-motion` passiert
 * dieselbe Änderung sofort — der Übergang ist Zugabe, keine Voraussetzung.
 */
function mitUebergang(
  aenderung: () => void | Promise<void>,
  danach?: () => void,
): void {
  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ruhig || typeof document.startViewTransition !== "function") {
    void aenderung();
    danach?.();
    return;
  }
  const t = document.startViewTransition(aenderung);
  t.finished.finally(() => danach?.());
}

/** Das `<img>` in einem Element, oder `null`. */
const bildIn = (el: Element | null | undefined) =>
  (el?.querySelector("img") as HTMLImageElement | null) ?? null;

/** Wartet kurz auf das große Bild, damit der Übergang nicht in eine leere
    Fläche läuft — aber nie länger als `ms`, sonst wirkt der Klick träge. */
function hoechstens(versprechen: Promise<unknown>, ms: number) {
  return Promise.race([
    versprechen.catch(() => undefined),
    new Promise((fertig) => setTimeout(fertig, ms)),
  ]);
}

type Sperre = { css: string; hoehe: number };

/**
 * Hintergrund festhalten, solange der Kasten offen ist. Die
 * Breitenkompensation ist kein Beiwerk: Verschwindet die Bildlaufleiste
 * ersatzlos, springt die ganze Seite darunter um deren Breite zur Seite —
 * sichtbar als Ruck beim Öffnen **und** beim Schließen.
 */
function sperren(): Sperre {
  const leiste = window.innerWidth - document.documentElement.clientWidth;
  const sperre = { css: document.body.style.cssText, hoehe: window.scrollY };
  document.body.style.overflow = "hidden";
  if (leiste > 0) document.body.style.paddingRight = `${leiste}px`;
  return sperre;
}

/**
 * ⚠️ Chromium behält die Scrollposition über das Sperren hinweg — gemessen.
 * Safari und iOS setzen sie beim Aufheben von `overflow: hidden` bekanntlich
 * zurück. Deshalb wird die Position ausdrücklich zurückgesetzt.
 */
function entsperren(sperre: Sperre) {
  document.body.style.cssText = sperre.css;
  window.scrollTo(0, sperre.hoehe);
}

export default function Mosaik({ bilder }: Props) {
  const [offen, setOffen] = useState<number | null>(null);
  /* Alle Kacheln, nach Bildnummer — Ziel des Übergangs beim Schließen. */
  const kacheln = useRef<(HTMLAnchorElement | null)[]>([]);
  const kasten = useRef<HTMLDivElement | null>(null);
  const sperre = useRef<Sperre | null>(null);

  /*
   * Was gezeigt werden **soll** — sofort gesetzt, während `offen` erst nach
   * dem Übergang nachzieht. Ohne diese Trennung ging ein `Esc` während des
   * Öffnens verloren, und der Kasten öffnete trotzdem (gemessen 2026-10-08).
   */
  const soll = useRef<number | null>(null);

  const oeffne = useCallback((i: number, kachel: HTMLAnchorElement) => {
    soll.current = i;
    const klein = bildIn(kachel);
    if (klein) klein.style.viewTransitionName = UEBERGANG;
    sperre.current ??= sperren();
    mitUebergang(async () => {
      if (klein) klein.style.viewTransitionName = "";
      // Inzwischen geschlossen oder weitergeblättert: nichts überschreiben.
      if (soll.current !== i) return;
      flushSync(() => setOffen(i));
      const gross = bildIn(kasten.current);
      if (gross) await hoechstens(gross.decode(), 120);
    });
  }, []);

  /*
   * ⚠️ Behebung von Jans Fehlerbild („beim schließen von einem bild in
   * großer ansicht landet man wieder ganz oben"). Ursache war ein Kasten mit
   * `position: absolute` im scrollenden Element. Der Kasten ist jetzt
   * `fixed`, und der Fokus geht auf eine Kachel zurück.
   *
   * Seit dem 2026-10-08 auf die Kachel des **zuletzt gezeigten** Bildes, nicht
   * mehr auf die, von der man kam: Wer im Kasten weitergeblättert hat, steht
   * danach dort, wo er zuletzt hingesehen hat — wie in einer Foto-App. Das
   * Foto kehrt sichtbar in genau diese Kachel zurück.
   */
  const schliesse = useCallback(() => {
    const i = soll.current;
    if (i === null) return;
    soll.current = null;
    const ziel = kacheln.current[i] ?? null;
    const zielBild = bildIn(ziel);
    mitUebergang(
      () => {
        flushSync(() => setOffen(null));
        if (sperre.current) entsperren(sperre.current);
        sperre.current = null;
        if (!ziel) return;
        const r = ziel.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) {
          ziel.scrollIntoView({ block: "center" });
        }
        if (zielBild) zielBild.style.viewTransitionName = UEBERGANG;
        ziel.focus({ preventScroll: true });
      },
      () => {
        if (zielBild) zielBild.style.viewTransitionName = "";
      },
    );
  }, []);

  /* Blättert über **alle** Bilder der Seite, nicht nur innerhalb einer
     Arbeit — das Mosaik hat keine Grenzen zwischen den Arbeiten. */
  const blaettere = useCallback(
    (schritt: number) => {
      const i = soll.current;
      if (i === null) return;
      const neu = i + schritt;
      if (neu < 0 || neu >= bilder.length) return;
      soll.current = neu;
      setOffen(neu);
    },
    [bilder.length],
  );

  /* Dauerhaft angemeldet, nicht erst wenn `offen` gesetzt ist — sonst wären
     die Tasten während des Öffnens tot. */
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (soll.current === null) return;
      if (e.key === "Escape") { e.preventDefault(); schliesse(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); blaettere(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); blaettere(1); }
    };
    document.addEventListener("keydown", taste);
    return () => document.removeEventListener("keydown", taste);
  }, [schliesse, blaettere]);

  /* Verlässt jemand die Seite mit offenem Kasten, darf die Sperre nicht
     hängen bleiben. */
  useEffect(
    () => () => {
      if (sperre.current) entsperren(sperre.current);
    },
    [],
  );

  if (bilder.length === 0) return null;

  const bildImKasten = offen === null ? null : bilder[offen];

  /*
   * Reihum verteilt, nicht spaltenweise: Bild 1 in Spalte 1, Bild 2 in
   * Spalte 2, Bild 3 in Spalte 3, Bild 4 wieder in Spalte 1. Damit liest
   * sich die obere Reihe 1-2-3 statt 1-3-5. Genau das kann der
   * Mehrspaltensatz des Browsers (`column-count`) nicht.
   */
  const spalten: { bild: Mosaikbild; i: number }[][] = [[], [], []];
  bilder.forEach((bild, i) => spalten[i % spalten.length].push({ bild, i }));

  return (
    <>
      {/*
        Eine Liste für Screenreader, drei Spalten fürs Auge. Die Spalten
        sind `role="presentation"`, damit sie nicht als drei Listen
        angesagt werden. Vorgelesen wird in DOM-Reihenfolge, also
        spaltenweise (1, 4, 7, 2, …) — jedes Bild nennt seine Arbeit im
        Alt-Text, deshalb bleibt die Zuordnung trotzdem klar.
      */}
      <div className={styles.mosaik} role="list">
        {spalten.map((spalte, s) => (
          <div key={s} className={styles.spalte} role="presentation">
            {spalte.map(({ bild, i }) => (
              <div
                role="listitem"
                key={bild.schluessel}
                className={styles.figur}
                /*
                 * ⚠️ **Nur auf dem Telefon wirksam, dort aber
                 * entscheidend.** Die Spalten sind schmal `display:
                 * contents`; die Bilder werden damit direkte Kinder des
                 * Mosaiks und lägen sonst in der Reihenfolge
                 * 1, 4, 2, 5, 3, 6 untereinander.
                 */
                style={{ order: i }}
              >
                {/*
                  Ein echter Link, kein `button`: Ohne JavaScript öffnet er
                  die Bilddatei, und im Kontextmenü steht „Link in neuem Tab
                  öffnen" — beides das, was man bei einem Foto erwartet.
                */}
                <a
                  ref={(el) => {
                    kacheln.current[i] = el;
                  }}
                  className={styles.griff}
                  href={bild.quelle.fallback}
                  style={{ aspectRatio: `${bild.quelle.breite} / ${bild.quelle.hoehe}` }}
                  onClick={(e) => {
                    /* Mit Zusatztaste oder mittlerer Maustaste darf der
                       Link Link bleiben. */
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    oeffne(i, e.currentTarget);
                  }}
                >
                  <Bild
                    className={styles.bild}
                    quelle={bild.quelle}
                    alt={bild.alt}
                    sizes={MOSAIK_SIZES}
                    vorrang={i < SOFORT}
                  />
                  {/* Für Sehende beim Überfahren. Vorgelesen wird sie nicht —
                      die Beschriftung steckt schon im Alt-Text. */}
                  <span className={styles.beschriftung} aria-hidden="true">
                    <span className={styles.beschriftungText}>{bild.beschriftung}</span>
                  </span>
                  <span className={styles.nurVorlesen}>, groß ansehen</span>
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>

      {bildImKasten && (
        <div
          className={styles.kasten}
          role="dialog"
          aria-modal="true"
          aria-label={bildImKasten.alt}
          onClick={(e) => {
            /* Klick neben das Bild schließt — aber nur, wenn wirklich der
               Grund getroffen wurde und nicht ein Kind davon. */
            if (e.target === e.currentTarget) schliesse();
          }}
        >
          <div className={styles.kastenBild} ref={kasten}>
            {/* `key`: ein neues Element je Bild, sonst zeigt der Browser beim
                Blättern kurz das alte Foto in den Maßen des neuen. */}
            <Bild
              key={bildImKasten.schluessel}
              className={styles.kastenFoto}
              quelle={bildImKasten.quelle}
              alt={bildImKasten.alt}
              sizes="100vw"
              vorrang
              uebergang={UEBERGANG}
            />
          </div>

          <p className={styles.kastenZeile}>{bildImKasten.beschriftung}</p>

          <button
            type="button"
            className={styles.zu}
            onClick={schliesse}
            /* Der Fokus muss beim Öffnen in den Kasten — sonst tabbt man
               hinter ihm weiter durch die Seite. `autoFocus` ist hier
               richtig: Der Dialog erscheint erst auf eine Nutzeraktion. */
            autoFocus
          >
            <span aria-hidden="true">✕</span>
            <span className={styles.nurVorlesen}>Schließen</span>
          </button>

          <button
            type="button"
            className={`${styles.pfeil} ${styles.zurueck}`}
            onClick={() => blaettere(-1)}
            disabled={offen === 0}
          >
            <span aria-hidden="true">‹</span>
            <span className={styles.nurVorlesen}>Vorheriges Bild</span>
          </button>
          <button
            type="button"
            className={`${styles.pfeil} ${styles.vor}`}
            onClick={() => blaettere(1)}
            disabled={offen === bilder.length - 1}
          >
            <span aria-hidden="true">›</span>
            <span className={styles.nurVorlesen}>Nächstes Bild</span>
          </button>
        </div>
      )}
    </>
  );
}
