"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Bild from "./Bild";
import { heroSizes, type Bildquelle } from "@/lib/bilder";
import styles from "./Blende.module.css";

/**
 * Standzeit und Dauer sind **zwei** Entscheidungen.
 *
 * ⚠️ Im ersten Entwurf hingen sie aneinander (die Pause war fest
 * `dauer + 1600ms`), und genau deshalb sah man die Bilder nicht: Wer die
 * Blende kurz wollte, bekam zwangsweise auch ein kurzes Standbild. Jan:
 * „man sieht das bild nicht so recht und die transition ist auch zu
 * schnell". Die Werte sind am 2026-09-13 an acht Varianten ausgesucht
 * worden und stehen so in design/UI-SPEC.md.
 */
const STANDZEIT_MS = 4000;

/**
 * Die Blende in ihren zwei Abschnitten.
 *
 * `BLOCK_MS` ist die Zeit, in der die drei Flächen **nacheinander**
 * aufkommen; `AUFDECK_MS` die Überblendung auf das ganze Bild danach.
 * `BLOCK_EINZELN_MS` ist die Dauer **einer** Fläche — sie ist länger als
 * der Versatz zwischen zweien, damit sich die drei überlappen statt im
 * Gänsemarsch zu erscheinen.
 *
 * ⚠️ Diese Zahlen gehen als CSS-Eigenschaften an die Bühne und stehen
 * **nur hier**. In der ersten Fassung standen dieselben Werte zusätzlich
 * im Stylesheet — und liefen prompt auseinander, als sich der Takt
 * änderte.
 */
const BLOCK_MS = 1200;
const BLOCK_EINZELN_MS = 520;
const AUFDECK_MS = 420;
/** Die ganze Blende, von der ersten Fläche bis zum fertigen Bild. */
const DAUER_MS = BLOCK_MS + AUFDECK_MS;

/**
 * Wischen auf Touch (seit 2026-10-16, Jan: „am handy soll man swipen
 * können"). Ab so vielen Pixeln waagerecht zählt es — und nur, wenn die
 * Geste um diesen Faktor waagerechter als senkrecht ist. Sonst schaltete
 * jedes etwas schräge Scrollen das Bild weiter.
 */
const WISCH_PX = 40;
const WISCH_FAKTOR = 1.5;

/**
 * Die drei Flächen der Blockblende, als Prozent des Heros:
 * `[links, oben, breite, höhe]`.
 *
 * Ungleich groß und versetzt gesetzt — gleich große Flächen wirken nach
 * Raster, ungleiche nach Entscheidung.
 */
const FELDER = [
  [8, 14, 34, 30],
  [46, 40, 40, 36],
  [16, 56, 26, 28],
] as const;

/* Ob Bewegung erwünscht ist — für den Pause-Knopf, der nur erscheint, wenn
   die Folge auch läuft. Auf dem Server gilt „nein", also kein Knopf im HTML. */
const RUHIG = "(prefers-reduced-motion: reduce)";
function abonniereBewegung(melde: () => void) {
  const abfrage = window.matchMedia(RUHIG);
  abfrage.addEventListener("change", melde);
  return () => abfrage.removeEventListener("change", melde);
}
const darfBewegen = () => !window.matchMedia(RUHIG).matches;

/** Ein Bild der Folge samt seinem Zuschnitt — siehe `ausschnittAus`. */
export type Heroquelle = {
  quelle: Bildquelle;
  ausschnitt: string;
  /** Eigene Bildbeschreibung; ohne sie gilt `alt` der ganzen Folge. */
  alt?: string;
};

type Props = {
  /** Leitbild zuerst, danach die Strecke. Mindestens ein Bild. */
  bilder: Heroquelle[];
  alt: string;
};

/**
 * Das Hero von `/foto` als Folge statt als Standbild (bis 2026-10-14 abends
 * das Hero der Detailseiten).
 *
 * ⚠️ **Am 2026-09-13 neu gebaut**, nachdem Jan die erste Fassung live sah:
 * „die hero animation ist krass am hängen, das sieht aus wie Pixelfehler
 * nicht wie eine gewollte animation." Drei Ursachen, alle drei hier
 * behoben — und alle drei unsichtbar, solange nur Platzhalterbilder
 * laufen:
 *
 * 1. **Die Blöcke liefen gegen das Endbild.** Die Fahrt wechselte je Bild
 *    die Richtung, aber nur am Endbild: Die Klasse dafür saß auf der
 *    Bildlage, die Blöcke sind deren *Geschwister*, der Selektor griff bei
 *    ihnen nie. Bei jedem zweiten Schritt zeigten die Ausschnitte also
 *    eine andere Skalierung als das Bild, das danach aufdeckte — das
 *    Motiv sprang im Moment des Umschlags.
 *    **Jetzt bewegt sich nur noch das *laufende* Bild.** Blöcke und
 *    eintreffendes Bild stehen beide still und decken sich damit
 *    zwangsläufig. Die Fahrt hat außerdem nur noch **eine** Richtung: Bei
 *    wechselnder Richtung müsste das eintreffende Bild bei 1.07 beginnen,
 *    die Blöcke aber bei 1 — derselbe Fehler von der anderen Seite.
 * 2. **Die Bilder wurden erst im Moment der Blende geladen.** Blöcke und
 *    Endbild hingen am Zustand „Blende läuft"; ihr `srcset` startete also
 *    genau dann. Mit echten Fotos blendete die Seite in etwas, das noch
 *    nicht da war. **Jetzt hängt jedes Bild schon eine Standzeit früher im
 *    Dokument** (unsichtbar, `opacity: 0`) und die Blende startet
 *    **nur**, wenn das nächste Bild fertig geladen ist.
 * 3. **Eine Bildlage tauschte ihre Adresse.** Beim Weiterschalten bekam
 *    dasselbe `img` eine neue Quelle — dazwischen liegt mindestens ein
 *    Bildaufbau mit dem alten Inhalt. **Jetzt hat jedes Bild seine eigene
 *    Lage**, die es behält; gewechselt werden nur Deckkraft und Ebene.
 *
 * Was unverändert gilt: nur das erste Bild lädt mit Vorrang (es ist der
 * LCP), die Folge steht still, solange das Hero nicht im Bild ist, und
 * unter `prefers-reduced-motion` sowie ohne JavaScript bleibt es beim
 * Leitbild.
 */
export default function Blende({ bilder, alt }: Props) {
  const [index, setIndex] = useState(0);
  /*
   * ⚠️ **`bereit` ist kein Zierschritt, sondern der Grund, warum die
   * Blende überhaupt läuft.** Ein Element, dessen *erste* berechnete
   * Deckkraft schon der Endwert ist, bekommt keinen Übergang — CSS
   * überblendet nur zwischen zwei Werten. In der ersten Fassung wurden
   * die Flächen im selben Durchlauf eingehängt, in dem `laeuft` gesetzt
   * wurde; sie erschienen deshalb **alle drei schlagartig**, und die
   * Staffelung lief ins Leere. Jan: „die drei vierecke kommen nicht
   * nacheinander, sondern gleichzeitig."
   *
   * In `bereit` hängen die Flächen mit Deckkraft 0 im Dokument. Erst ein
   * Bildaufbau später kommt `laeuft` dazu — und dann gibt es einen
   * Anfangswert, von dem aus überblendet werden kann.
   */
  const [phase, setPhase] = useState<"still" | "bereit" | "laeuft" | "fertig">(
    "still",
  );
  /* Welche Bilder im Dokument hängen. Wächst um genau eins je Schritt —
     nie die ganze Strecke auf einmal, das wäre bei sieben Bildern über
     10 MB Original eine Zumutung für die Leitung. */
  const [gemountet, setGemountet] = useState<number[]>([0]);
  /* Welche davon fertig geladen sind. Nur in ein geladenes Bild wird
     geblendet. */
  const [geladen, setGeladen] = useState<number[]>([]);
  /*
   * WCAG 2.2.2: Was sich länger als fünf Sekunden von selbst bewegt, muss
   * sich anhalten lassen — wie beim Hero-Video auf `/`. `bewegt` wird erst
   * im Browser wahr, wenn die Folge wirklich läuft (nicht unter
   * `prefers-reduced-motion`); vorher gibt es nichts anzuhalten und also
   * keinen Knopf.
   */
  const [angehalten, setAngehalten] = useState(false);
  const bewegt =
    useSyncExternalStore(abonniereBewegung, darfBewegen, () => false) && bilder.length > 1;

  /* Das Bild, das nach einem Wisch über dem neuen ausblendet — `null`,
     sobald es weg ist. */
  const [vorher, setVorher] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  /* Der Takt liest den Zustand, soll aber nicht bei jeder Änderung neu
     aufgesetzt werden — sonst beginnt die Standzeit jedes Mal von vorn. */
  const stand = useRef({ index: 0, geladen: [] as number[], angehalten: false });
  /* Die Zeitgeber einer laufenden Blende. Hier statt im Effekt, damit ein
     Wisch sie abbrechen kann — sonst schaltete die Blende danach noch auf
     ihr altes Ziel um. */
  const zeitgeber = useRef<ReturnType<typeof setTimeout>[]>([]);
  /* Setzt den Takt neu auf, die Standzeit beginnt von vorn. Belegt nur,
     solange die Folge von selbst läuft. */
  const neuerTakt = useRef<(() => void) | null>(null);
  const wischStart = useRef<{ x: number; y: number } | null>(null);

  const anzahl = bilder.length;
  const mehrere = anzahl > 1;
  const naechster = (index + 1) % anzahl;

  /* Nach dem Zeichnen, nicht währenddessen: Der Takt läuft ohnehin
     asynchron und liest den Stand erst, wenn dieser Effekt durch ist. */
  useEffect(() => {
    stand.current = { index, geladen, angehalten };
  }, [index, geladen, angehalten]);

  /*
   * Der eine Bildaufbau zwischen „Flächen sind da" und „Flächen kommen
   * auf". Zwei verschachtelte `requestAnimationFrame`, weil der erste
   * noch vor dem Zeichnen des neuen Zustands laufen kann — dann wäre die
   * Deckkraft 0 nie berechnet worden und wir stünden wieder vor dem
   * ursprünglichen Fehler.
   */
  useEffect(() => {
    if (phase !== "bereit") return;
    let zweiter = 0;
    const erster = requestAnimationFrame(() => {
      zweiter = requestAnimationFrame(() => setPhase("laeuft"));
    });
    return () => {
      cancelAnimationFrame(erster);
      cancelAnimationFrame(zweiter);
    };
  }, [phase]);

  useEffect(() => {
    if (!mehrere) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = heroRef.current;
    if (!hero) return;

    let takt: ReturnType<typeof setInterval> | undefined;
    let sichtbar = false;
    const starte = () => {
      clearInterval(takt);
      if (sichtbar) takt = setInterval(schalte, STANDZEIT_MS + DAUER_MS);
    };

    const schalte = () => {
      const jetzt = stand.current.index;
      const kommt = (jetzt + 1) % anzahl;
      /*
       * ⚠️ Kein Blenden in ein Bild, das noch lädt. Das ist der Kern von
       * Jans „Pixelfehler": Die Blockausschnitte zeigten schlicht noch
       * nichts. Lieber steht das aktuelle Bild eine Standzeit länger.
       */
      if (!stand.current.geladen.includes(kommt)) return;
      /* Angehalten: Das Bild bleibt stehen, bis jemand weiterspielt. */
      if (stand.current.angehalten) return;

      /* Flächen einhängen, noch unsichtbar. Weiter geht es im Effekt
         unten, einen Bildaufbau später. */
      setPhase("bereit");
      zeitgeber.current.push(setTimeout(() => setPhase("fertig"), BLOCK_MS));
      zeitgeber.current.push(
        setTimeout(() => {
          setIndex(kommt);
          setPhase("still");
          /* Das übernächste Bild ins Dokument holen — es hat jetzt eine
             volle Standzeit Zeit zu laden, bevor es gebraucht wird. */
          setGemountet((m) => {
            const dann = (kommt + 1) % anzahl;
            return m.includes(dann) ? m : [...m, dann];
          });
          /*
           * ⚠️ Erst **nach** der Überblendung, nicht 40 ms nach ihrem
           * Beginn. Vorher schnitt der Wechsel sie nach einem Vierzigstel
           * ab: Die Flächen verschwanden und das Bild stand schlagartig
           * da, statt aufzukommen.
           */
        }, DAUER_MS + 60),
      );
    };

    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        sichtbar = eintrag.intersectionRatio > 0.25;
        starte();
      },
      { threshold: [0, 0.25, 0.6] },
    );
    beobachter.observe(hero);
    neuerTakt.current = starte;

    /* Das zweite Bild sofort ins Dokument, damit der erste Schritt nicht
       auf das Laden warten muss. */
    setGemountet((m) => (m.includes(1) ? m : [...m, 1]));

    const laufende = zeitgeber.current;
    return () => {
      beobachter.disconnect();
      clearInterval(takt);
      laufende.forEach(clearTimeout);
      neuerTakt.current = null;
    };
  }, [anzahl, mehrere]);

  /*
   * Ein Wisch: sofort aufs Nachbarbild, das alte blendet darüber aus
   * (`.geht`). Keine Blockblende — die zeigt immer das **nächste** Bild,
   * und rückwärts müsste sie ein anderes aufdecken als das, auf das sie
   * vorbereitet ist. Im Kreis wie der Takt.
   */
  const wechsle = (schritt: 1 | -1) => {
    const jetzt = stand.current.index;
    const ziel = (jetzt + schritt + anzahl) % anzahl;
    /* Leeren, nicht ersetzen: Das Aufräumen des Effekts hält dasselbe Feld. */
    zeitgeber.current.splice(0).forEach(clearTimeout);
    setPhase("still");
    setVorher(jetzt);
    setIndex(ziel);
    /* Das Ziel und dessen Nachfolger — der Takt blendet als Nächstes dorthin. */
    setGemountet((m) => {
      const dazu = [ziel, (ziel + 1) % anzahl].filter((i) => !m.includes(i));
      return dazu.length ? [...m, ...dazu] : m;
    });
    zeitgeber.current.push(setTimeout(() => setVorher(null), AUFDECK_MS + 60));
    neuerTakt.current?.();
  };

  /* Beide Nachbarn schon beim Aufsetzen des Fingers holen — so hat das
     Bild die Dauer der Geste als Vorsprung. */
  const holeNachbarn = () => {
    const jetzt = stand.current.index;
    setGemountet((m) => {
      const dazu = [(jetzt + 1) % anzahl, (jetzt - 1 + anzahl) % anzahl].filter(
        (i) => !m.includes(i),
      );
      return dazu.length ? [...m, ...dazu] : m;
    });
  };

  /*
   * `load` steigt nicht auf, React kann es an einem Elternteil also nicht
   * abfangen — deshalb hier direkt am `img` und mit `complete` für den
   * Fall, dass es schon im Zwischenspeicher lag.
   */
  const meldeGeladen = (i: number) => (knoten: HTMLDivElement | null) => {
    const bild = knoten?.querySelector("img");
    if (!bild) return;
    const fertig = () => setGeladen((g) => (g.includes(i) ? g : [...g, i]));
    if (bild.complete && bild.naturalWidth > 0) fertig();
    else bild.addEventListener("load", fertig, { once: true });
  };

  return (
    <div
      className={`${styles.buehne} ${styles[phase]}${angehalten ? ` ${styles.angehalten}` : ""}`}
      ref={heroRef}
      /*
       * Touch-Ereignisse, keine Pointer-Ereignisse: Die Maus soll nicht
       * ziehen (UI-SPEC, „Blende — Wischen"). Kein `preventDefault` —
       * senkrecht scrollt die Seite weiter, `touch-action` im CSS
       * überlässt uns nur die Waagerechte.
       */
      onTouchStart={
        mehrere
          ? (e) => {
              const t = e.touches[0];
              wischStart.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
              if (wischStart.current) holeNachbarn();
            }
          : undefined
      }
      onTouchEnd={
        mehrere
          ? (e) => {
              const start = wischStart.current;
              wischStart.current = null;
              const t = e.changedTouches[0];
              if (!start || !t) return;
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              if (Math.abs(dx) < WISCH_PX || Math.abs(dx) < WISCH_FAKTOR * Math.abs(dy)) return;
              wechsle(dx < 0 ? 1 : -1);
            }
          : undefined
      }
      onTouchCancel={() => {
        wischStart.current = null;
      }}
      /* Die Zeiten stehen nur oben in dieser Datei und werden von dort ins
         Stylesheet gereicht — doppelt geführt liefen sie auseinander. */
      style={
        {
          "--takt-block": `${BLOCK_EINZELN_MS}ms`,
          "--takt-aufdecken": `${AUFDECK_MS}ms`,
          "--takt-fahrt": `${STANDZEIT_MS + DAUER_MS}ms`,
        } as React.CSSProperties
      }
    >
      {gemountet.map((i) => {
        const rolle =
          i === index
            ? styles.aktiv
            : i === vorher
              ? styles.geht
              : i === naechster
                ? styles.kommt
                : styles.ruht;
        return (
          <div key={i} className={`${styles.lage} ${rolle}`} ref={meldeGeladen(i)}>
            <Bild
              className={styles.bild}
              quelle={bilder[i].quelle}
              ausschnitt={bilder[i].ausschnitt}
              /* Nur das laufende Bild wird beschrieben — die anderen
                 liegen unsichtbar darunter und wären als Wiederholung
                 desselben Alt-Textes nur Lärm im Screenreader. */
              alt={i === index ? (bilder[i].alt ?? alt) : ""}
              sizes={heroSizes(bilder[i].quelle, "foto")}
              vorrang={i === 0}
            />
          </div>
        );
      })}

      {mehrere && phase !== "still" && (
        /*
         * ⚠️ Der Kern der Blockblende: Das Bild **im** Block ist so groß
         * wie das ganze Hero und nur um die Blockposition verschoben.
         * Bekäme jeder Block sein eigenes `object-fit: cover`, hätte jedes
         * Viereck einen eigenen Zuschnitt — das Motiv zerfiele in Kacheln,
         * statt durchzubrechen.
         *
         * Die Blöcke stehen **still**. Jede Bewegung hier müsste auf den
         * Bruchteil genau der Bewegung des Endbildes entsprechen, sonst
         * springt das Motiv beim Umschlag — siehe Kopf dieser Datei.
         */
        <div className={styles.bloecke} aria-hidden="true">
          {FELDER.map(([l, t, b, h], i) => (
            <span
              key={i}
              className={styles.block}
              style={{
                left: `${l}%`,
                top: `${t}%`,
                width: `${b}%`,
                height: `${h}%`,
                /*
                 * Der Versatz füllt `BLOCK_MS` genau aus: Die letzte
                 * Fläche startet so, dass sie am Ende fertig ist. Weil
                 * eine Fläche länger braucht (`BLOCK_EINZELN_MS`) als der
                 * Versatz zwischen zweien, überlappen sich die drei —
                 * sonst wäre es ein Gänsemarsch statt einer Bewegung.
                 */
                transitionDelay: `${
                  (i * (BLOCK_MS - BLOCK_EINZELN_MS)) / (FELDER.length - 1)
                }ms`,
              }}
            >
              <img
                src={bilder[naechster].quelle.fallback}
                srcSet={bilder[naechster].quelle.webp}
                sizes={heroSizes(bilder[naechster].quelle, "foto")}
                alt=""
                style={{
                  width: `${(100 / b) * 100}%`,
                  height: `${(100 / h) * 100}%`,
                  left: `${-(l / b) * 100}%`,
                  top: `${-(t / h) * 100}%`,
                  /* ⚠️ Muss derselbe Zuschnitt sein wie am eintreffenden
                     Bild, sonst zeigen die Flächen einen anderen
                     Bildausschnitt als das, was danach aufdeckt. */
                  objectPosition: bilder[naechster].ausschnitt,
                }}
              />
            </span>
          ))}
        </div>
      )}

      {/* Wo man in der Folge steht. Ohne das wirkt ein wechselndes Hero wie
          ein Fehler statt wie eine Strecke. */}
      {mehrere && (
        <p className={styles.zaehler}>
          <span className={styles.zaehlerText}>
            {index + 1} / {anzahl}
          </span>
          <span className={styles.striche} aria-hidden="true">
            {bilder.map((_, i) => (
              <span key={i} className={i === index ? styles.an : undefined} />
            ))}
          </span>
          {bewegt && (
            <button
              type="button"
              className={styles.knopf}
              onClick={() => setAngehalten((a) => !a)}
              aria-label={angehalten ? "Bilder abspielen" : "Bilder anhalten"}
            >
              {angehalten ? (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
