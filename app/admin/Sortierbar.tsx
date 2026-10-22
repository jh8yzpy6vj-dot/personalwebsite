"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { verschiebe } from "@/lib/admin/werkzeuge";
import styles from "./verwaltung.module.css";

/**
 * **Sortieren per Ziehen** — Maus und Touch über Pointer Events, ohne Paket.
 * Dazu Tastatur (Pfeiltasten am Griff) und Knöpfe „nach vorn/hinten", weil
 * Ziehen allein für viele nicht geht (Zittern, Screenreader, Trackpad).
 *
 * So funktioniert es:
 * - Gezogen wird nur am **Griff**. Er hat `touch-action: none`, der Rest der
 *   Kachel nicht — am Telefon lässt sich die Seite daneben ganz normal
 *   wischen, und ein Tipp aufs Bild öffnet weiter das Bearbeiten.
 * - Während des Ziehens ordnet sich die Liste **live** um; das gezogene
 *   Element bleibt als gedimmter Platzhalter an seinem neuen Platz, ein
 *   „Geist" folgt dem Finger. Gespeichert (`beiNeuerReihenfolge`) wird erst
 *   beim Loslassen, `Esc` bricht ab.
 * - Getroffen wird über `elementFromPoint`, nicht über vorher gemessene
 *   Rechtecke: Die verschieben sich ja beim Umordnen.
 * - Griff und Knöpfe tragen nur Attribute (`data-sortier-ziel`); die
 *   Ereignisse fängt die Liste selbst ab (Delegation). So muss keine
 *   Funktion durch `kind` gereicht werden, und eine Kachel kann die
 *   Steuerung einfach auf ihre Knöpfe spreizen.
 *
 * ⚠️ Die Bewegung wird am **Fenster** verfolgt, nicht per
 * `setPointerCapture` am Griff. React verschiebt beim Umordnen DOM-Knoten,
 * und ein verschobener Knoten verliert in Chromium die Erfassung — das
 * Ziehen bräche mitten in der Bewegung ab.
 */

type Knopf = { disabled: boolean; "aria-label": string; "data-sortier-ziel": string };

export type Steuerung = {
  /** Auf den Griff-Knopf spreizen. */
  griff: Knopf & { className: string };
  /** Auf den Knopf „nach vorn" bzw. „nach oben" (heißt „{Bezeichnung} nach vorn"). */
  vor: Knopf;
  /** Auf den Knopf „nach hinten" bzw. „nach unten". */
  zurueck: Knopf;
  platz: number;
  anzahl: number;
  gezogen: boolean;
};

type Props<T> = {
  eintraege: T[];
  schluessel: (t: T) => string;
  /** Für Ansagen und Beschriftungen: „STAMP · 02". */
  bezeichnung: (t: T) => string;
  beiNeuerReihenfolge: (neu: string[]) => void;
  darstellung: "raster" | "liste";
  kind: (t: T, s: Steuerung) => ReactNode;
  /** Was dem Finger beim Ziehen folgt; ohne Angabe die Bezeichnung. */
  geist?: (t: T) => ReactNode;
  gesperrt?: boolean;
  /** Name der Liste für Screenreader. */
  name: string;
};

type Zug = {
  s: string;
  anfang: string[];
  ordnung: string[];
  x: number;
  y: number;
  /** Abstand des Fingers zur linken oberen Ecke des Elements. */
  dx: number;
  dy: number;
  breite: number;
  hoehe: number;
  /** Erst nach ein paar Pixeln — sonst wäre jeder Tipp auf den Griff ein Zug. */
  aktiv: boolean;
  sx: number;
  sy: number;
};

/** Ab so viel Bewegung (px) wird aus dem Drücken ein Ziehen. */
const SCHWELLE = 5;
/** So nah am Fensterrand (px) scrollt die Seite beim Ziehen mit. */
const RAND = 72;
/* Fokus ohne Ring und ohne Scrollen. Als Konstante, weil TypeScripts
   DOM-Typen `focusVisible` noch nicht kennen; ein Browser ohne die Option
   zeigt eben den Ring. */
const OHNE_RING = { preventScroll: true, focusVisible: false };

/** Element mit `data-sortier-ziel` unter dem Ereignis, samt Schlüssel des Eintrags. */
function ziel(e: { target: EventTarget | null; currentTarget: HTMLElement }) {
  const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-sortier-ziel]");
  if (!el || !e.currentTarget.contains(el)) return null;
  const eintrag = el.closest<HTMLElement>("[data-sortier]");
  const s = eintrag?.dataset.sortier;
  if (!eintrag || !s) return null;
  return { art: el.dataset.sortierZiel ?? "", s, el, eintrag };
}

export default function Sortierbar<T>({
  eintraege,
  schluessel,
  bezeichnung,
  beiNeuerReihenfolge,
  darstellung,
  kind,
  geist,
  gesperrt = false,
  name,
}: Props<T>) {
  const [zug, setZug] = useState<Zug | null>(null);
  const [ansage, setAnsage] = useState("");
  const zugRef = useRef<Zug | null>(null);
  const liste = useRef<HTMLUListElement>(null);
  const melde = useRef(beiNeuerReihenfolge);
  const kennung = useId();

  useEffect(() => {
    melde.current = beiNeuerReihenfolge;
  }, [beiNeuerReihenfolge]);

  const setzeZug = useCallback((z: Zug | null) => {
    zugRef.current = z;
    setZug(z);
  }, []);

  const nachSchluessel = new Map(eintraege.map((t) => [schluessel(t), t]));
  const ordnung = zug?.aktiv ? zug.ordnung : eintraege.map(schluessel);
  const angezeigt = ordnung.flatMap((s) => {
    const t = nachSchluessel.get(s);
    return t === undefined ? [] : [t];
  });
  const name0 = (s: string) => {
    const t = nachSchluessel.get(s);
    return t === undefined ? s : bezeichnung(t);
  };

  /* Aufräumen der Fenster-Verfolgung — gesetzt, solange ein Zug läuft. */
  const aufraeumen = useRef<(() => void) | null>(null);

  /*
   * ⚠️ Die Verfolgung wird **im pointerdown selbst** angemeldet, nicht in
   * einem Effekt danach. Ein Effekt läuft erst nach dem nächsten Rendern —
   * ein schneller Tipp (oder ein flinkes Trackpad) ist bis dahin schon
   * losgelassen, das pointerup ginge verloren, und der Zug hinge fest.
   */
  const verfolge = () => {
    aufraeumen.current?.();
    let rahmen = 0;

    const treffe = (x: number, y: number) => {
      const z = zugRef.current;
      if (!z?.aktiv) return;
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-sortier]");
      if (!el || !liste.current?.contains(el)) return;
      const ueber = el.dataset.sortier;
      if (!ueber || ueber === z.s) return;
      const von = z.ordnung.indexOf(z.s);
      const nach = z.ordnung.indexOf(ueber);
      if (von < 0 || nach < 0) return;
      setzeZug({ ...z, ordnung: verschiebe(z.ordnung, von, nach) });
    };

    const bewege = (e: PointerEvent) => {
      const z = zugRef.current;
      if (!z) return;
      const aktiv = z.aktiv || Math.hypot(e.clientX - z.sx, e.clientY - z.sy) > SCHWELLE;
      setzeZug({ ...z, x: e.clientX, y: e.clientY, aktiv });
      treffe(e.clientX, e.clientY);
    };

    /* Am Rand mitscrollen — sonst lässt sich am Telefon kein Bild über
       mehr als einen Bildschirm hinweg verschieben. */
    const scrolle = () => {
      const z = zugRef.current;
      if (z?.aktiv) {
        let v = 0;
        if (z.y < RAND) v = -Math.ceil((RAND - z.y) / 4);
        else if (z.y > window.innerHeight - RAND) v = Math.ceil((z.y - (window.innerHeight - RAND)) / 4);
        if (v !== 0) {
          window.scrollBy(0, v);
          treffe(z.x, z.y);
        }
      }
      rahmen = requestAnimationFrame(scrolle);
    };

    const ende = () => {
      const z = zugRef.current;
      schluss();
      if (!z?.aktiv) return;
      if (z.ordnung.join("\n") !== z.anfang.join("\n")) {
        melde.current(z.ordnung);
        setAnsage(`Verschoben auf Platz ${z.ordnung.indexOf(z.s) + 1} von ${z.ordnung.length}.`);
      }
    };
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") schluss();
    };
    const schluss = () => {
      window.removeEventListener("pointermove", bewege);
      window.removeEventListener("pointerup", ende);
      window.removeEventListener("pointercancel", schluss);
      window.removeEventListener("keydown", taste);
      cancelAnimationFrame(rahmen);
      aufraeumen.current = null;
      setzeZug(null);
    };

    window.addEventListener("pointermove", bewege);
    window.addEventListener("pointerup", ende);
    window.addEventListener("pointercancel", schluss);
    window.addEventListener("keydown", taste);
    rahmen = requestAnimationFrame(scrolle);
    aufraeumen.current = schluss;
  };

  /* Verschwindet die Liste mitten im Zug (Reiterwechsel), nichts hängen lassen. */
  useEffect(() => () => aufraeumen.current?.(), []);

  /*
   * ⚠️ Nach dem Verschieben per Tastatur den Fokus zurückholen. React
   * verschiebt dabei DOM-Knoten, und ein verschobener Knoten verliert den
   * Fokus — ohne das stünde man nach einem Pfeildruck irgendwo am
   * Seitenanfang. Ein Bild später, wenn React die neue Ordnung gezeichnet
   * hat. Ist der Knopf am Rand jetzt gesperrt, geht der Fokus auf den Griff.
   */
  const fokussiere = (s: string, art: string) => {
    requestAnimationFrame(() => {
      const ul = document.querySelector(`[data-sortier-liste="${CSS.escape(kennung)}"]`);
      const eintrag = ul?.querySelector(`[data-sortier="${CSS.escape(s)}"]`);
      const knopf = eintrag?.querySelector<HTMLButtonElement>(`[data-sortier-ziel="${art}"]`);
      const ziel =
        knopf && !knopf.disabled ? knopf : eintrag?.querySelector<HTMLElement>('[data-sortier-ziel="griff"]');
      if (ziel && document.activeElement !== ziel) ziel.focus();
    });
  };

  const bewegeUm = (s: string, schritt: number | "anfang" | "ende", art: string) => {
    const alt = eintraege.map(schluessel);
    const von = alt.indexOf(s);
    const nach = schritt === "anfang" ? 0 : schritt === "ende" ? alt.length - 1 : von + schritt;
    if (von < 0 || nach < 0 || nach >= alt.length || nach === von) return;
    beiNeuerReihenfolge(verschiebe(alt, von, nach));
    setAnsage(`${name0(s)}: jetzt Platz ${nach + 1} von ${alt.length}.`);
    fokussiere(s, art);
  };

  const quer = darstellung === "raster";

  return (
    <>
      <ul
        ref={liste}
        data-sortier-liste={kennung}
        className={quer ? styles.raster : styles.reihen}
        aria-label={name}
        onPointerDown={(e) => {
          const t = ziel(e);
          if (!t || t.art !== "griff" || gesperrt || e.button !== 0) return;
          const r = t.eintrag.getBoundingClientRect();
          /* Keine Textauswahl beim Ziehen mit der Maus. Das verhindert aber
             auch, dass der Griff den Fokus bekommt — er bliebe im zuletzt
             benutzten Textfeld, dessen `beiVerlassen` käme nie, und Strg+Z
             nach dem Zug ginge an das Rückgängig des Browsers in diesem Feld.
             Ohne Fokusring: Gedrückt wurde mit Maus oder Finger. */
          e.preventDefault();
          t.el.focus(OHNE_RING);
          const alle = eintraege.map(schluessel);
          setzeZug({
            s: t.s,
            anfang: alle,
            ordnung: alle,
            x: e.clientX,
            y: e.clientY,
            dx: e.clientX - r.left,
            dy: e.clientY - r.top,
            breite: r.width,
            hoehe: r.height,
            aktiv: false,
            sx: e.clientX,
            sy: e.clientY,
          });
          verfolge();
        }}
        onKeyDown={(e) => {
          const t = ziel(e);
          if (!t || t.art !== "griff" || gesperrt) return;
          const schritt =
            e.key === "ArrowLeft" || e.key === "ArrowUp"
              ? -1
              : e.key === "ArrowRight" || e.key === "ArrowDown"
                ? 1
                : e.key === "Home"
                  ? "anfang"
                  : e.key === "End"
                    ? "ende"
                    : null;
          if (schritt === null) return;
          e.preventDefault();
          bewegeUm(t.s, schritt, "griff");
        }}
        onClick={(e) => {
          const t = ziel(e);
          if (!t || gesperrt || (t.el as HTMLButtonElement).disabled) return;
          if (t.art === "vor") bewegeUm(t.s, -1, "vor");
          else if (t.art === "zurueck") bewegeUm(t.s, 1, "zurueck");
        }}
      >
        {angezeigt.map((t, platz) => {
          const s = schluessel(t);
          const gezogen = zug?.aktiv === true && zug.s === s;
          const steuerung: Steuerung = {
            griff: {
              "aria-label": `${bezeichnung(t)} verschieben: ziehen oder Pfeiltasten`,
              "data-sortier-ziel": "griff",
              className: styles.griff,
              disabled: gesperrt,
            },
            /* Mit dem Namen: 38-mal „Nach vorn" sagte Screenreader und
               Sprachsteuerung nicht, welches Bild gemeint ist. */
            vor: {
              disabled: gesperrt || platz === 0,
              "aria-label": `${bezeichnung(t)} ${quer ? "nach vorn" : "nach oben"}`,
              "data-sortier-ziel": "vor",
            },
            zurueck: {
              disabled: gesperrt || platz === angezeigt.length - 1,
              "aria-label": `${bezeichnung(t)} ${quer ? "nach hinten" : "nach unten"}`,
              "data-sortier-ziel": "zurueck",
            },
            platz,
            anzahl: angezeigt.length,
            gezogen,
          };
          return (
            <li key={s} data-sortier={s} className={gezogen ? styles.platzhalter : undefined}>
              {kind(t, steuerung)}
            </li>
          );
        })}
      </ul>

      {zug?.aktiv && nachSchluessel.has(zug.s) && (
        <div
          className={styles.geist}
          aria-hidden="true"
          style={{
            width: zug.breite,
            height: zug.hoehe,
            transform: `translate(${zug.x - zug.dx}px, ${zug.y - zug.dy}px)`,
          }}
        >
          {geist ? geist(nachSchluessel.get(zug.s) as T) : <span>{name0(zug.s)}</span>}
        </div>
      )}

      <p className="nur-vorlesen" aria-live="polite">
        {ansage}
      </p>
    </>
  );
}
