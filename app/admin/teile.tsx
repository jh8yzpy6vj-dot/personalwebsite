"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Bild from "../components/Bild";
import type { Bildquelle } from "@/lib/bilder";
import { BILDTYPEN } from "@/lib/admin/vertrag";
import { ausserhalb } from "@/lib/admin/werkzeuge";
import styles from "./verwaltung.module.css";

/**
 * Kleine Bausteine der Verwaltung: Symbole, Vorschaubild, Dialog,
 * Dateiknopf, Eingabefelder. Alle ohne eigene Logik.
 */

/* ── Symbole ────────────────────────────────────────────────────────── */

/**
 * Eigene Strich-Symbole statt Zeichen wie ⠿ oder ★: Die Ersatzschrift kennt
 * sie nicht, und welche Systemschrift dann einspringt, sieht auf jedem Gerät
 * anders aus. Immer `aria-hidden` — die Bedeutung trägt das `aria-label`
 * des Knopfs.
 */
const PFADE = {
  griff: (
    <>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </>
  ),
  links: <polyline points="15 18 9 12 15 6" />,
  rechts: <polyline points="9 18 15 12 9 6" />,
  hoch: <polyline points="6 15 12 9 18 15" />,
  runter: <polyline points="6 9 12 15 18 9" />,
  stern: <polygon points="12 2.5 15 8.6 21.7 9.6 16.8 14.3 18 21 12 17.8 6 21 7.2 14.3 2.3 9.6 9 8.6" />,
  auge: (
    <>
      <path d="M1.5 12s3.8-7 10.5-7 10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  augeZu: (
    <>
      <path d="M1.5 12s3.8-7 10.5-7 10.5 7 10.5 7-3.8 7-10.5 7S1.5 12 1.5 12z" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </>
  ),
  eimer: (
    <>
      <polyline points="3 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V3.5h6V6" />
    </>
  ),
  stift: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  hochladen: (
    <>
      <path d="M12 16V4" />
      <polyline points="7 9 12 4 17 9" />
      <path d="M4 20h16" />
    </>
  ),
  zu: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  zurueck: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <polyline points="3 3.5 3 9 8.5 9" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
} as const;

export type Zeichenname = keyof typeof PFADE;

export function Zeichen({ name, voll = false }: { name: Zeichenname; voll?: boolean }) {
  return (
    <svg
      className={styles.symbol}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill={voll || name === "griff" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={name === "griff" ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PFADE[name]}
    </svg>
  );
}

/* ── Vorschaubild ───────────────────────────────────────────────────── */

/**
 * Ein kleines Bild aus dem Manifest — über `Bild`, damit der Browser aus dem
 * `srcset` die kleine Stufe nimmt statt des großen JPEGs.
 *
 * `ganz` zeigt das ganze Foto (wie im Mosaik, nichts beschnitten), `voll`
 * füllt die Fläche mit dem gewählten Ausschnitt (wie im Hero).
 */
export function Daumen({
  quelle,
  art = "ganz",
  ausschnitt,
  breite = "(max-width: 700px) 45vw, 220px",
}: {
  quelle: Bildquelle | undefined;
  art?: "ganz" | "voll";
  ausschnitt?: string;
  breite?: string;
}) {
  if (!quelle) return <span className={styles.daumenLeer}>kein Bild</span>;
  return (
    <Bild
      quelle={quelle}
      alt=""
      sizes={breite}
      ausschnitt={art === "voll" ? ausschnitt : undefined}
      className={art === "voll" ? styles.daumenVoll : styles.daumenGanz}
    />
  );
}

/* ── Dialog ─────────────────────────────────────────────────────────── */

/**
 * Ein modaler Dialog über das native `<dialog>`: Fokusfalle, `Esc` und der
 * abgedunkelte Hintergrund kommen vom Browser, nicht aus eigenem Code.
 * Erscheint, sobald er gerendert wird; `beiSchliessen` entfernt ihn.
 *
 * `art="seite"` ist das Seitenpanel (rechts am PC, ganzflächig am Telefon).
 *
 * ⚠️ **Knöpfe im Dialog schließen über `schliesse`** (`children` als
 * Funktion), nie über `beiSchliessen` oder einen eigenen Setter. Nur das
 * native `close()` gibt den Fokus an den Knopf zurück, der den Dialog
 * geöffnet hat; ein Dialog, der einfach aus dem DOM verschwindet, lässt ihn
 * auf `<body>` fallen — wer per Tastatur oder Screenreader arbeitet, stünde
 * wieder am Seitenanfang. `onClose` ruft danach `beiSchliessen`.
 */
export function Dialog({
  titel,
  beiSchliessen,
  children,
  art = "mitte",
}: {
  titel: string;
  beiSchliessen: () => void;
  children: ReactNode | ((schliesse: () => void) => ReactNode);
  art?: "mitte" | "seite";
}) {
  /* Das Element als Zustand, nicht als Ref: `schliesse` geht beim Rendern an
     `children`, und dort darf kein Ref gelesen werden. */
  const [element, setElement] = useState<HTMLDialogElement | null>(null);
  const kennung = useId();
  /* Wo der Fokus vor dem Öffnen stand. */
  const vorher = useRef<HTMLElement | null>(null);
  /* Begann der Druck auf dem abgedunkelten Rand? */
  const startDraussen = useRef(false);

  useEffect(() => {
    const d = element;
    if (!d) return;
    /* Nur merken, was außerhalb liegt — im Strict Mode läuft das zweimal,
       und beim zweiten Mal steht der Fokus schon im Dialog. */
    const fokus = document.activeElement;
    if (fokus instanceof HTMLElement && !d.contains(fokus)) vorher.current = fokus;
    if (!d.open) d.showModal();
    return () => {
      /* Rückfall, falls der Dialog doch ohne `close()` verschwindet: Der
         Fokus geht dorthin zurück, wo er vorher stand — wenn es das noch gibt. */
      const jetzt = document.activeElement;
      const ziel = vorher.current;
      if ((jetzt === null || jetzt === document.body) && ziel?.isConnected) ziel.focus();
    };
  }, [element]);

  const schliesse = () => element?.close();
  /* Der abgedunkelte Rand gehört zum `<dialog>` selbst — aber auch die leere
     Fläche unter dem Inhalt des Seitenpanels. Deshalb zählt die Lage, nicht
     das Ziel. */
  const draussen = (e: { target: EventTarget; currentTarget: HTMLDialogElement; clientX: number; clientY: number }) =>
    e.target === e.currentTarget && ausserhalb(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);

  return (
    <dialog
      ref={setElement}
      className={art === "seite" ? styles.panel : styles.dialog}
      aria-labelledby={kennung}
      onClose={beiSchliessen}
      onPointerDown={(e) => {
        startDraussen.current = draussen(e);
      }}
      onClick={(e) => {
        /* Nur, wenn Drücken **und** Loslassen auf dem Rand lagen: Wer Text
           markiert und die Maus daneben loslässt, löst ebenfalls ein `click`
           auf dem Dialog aus. Am Telefon ist das Panel ganzflächig und hat
           keinen Rand — dort schließt ✕ (oder Esc). */
        const zu = startDraussen.current && draussen(e);
        startDraussen.current = false;
        if (zu) schliesse();
      }}
    >
      <div className={styles.dialogInnen}>
        <div className={styles.dialogKopf}>
          <h2 id={kennung} className={styles.dialogTitel}>
            {titel}
          </h2>
          <button type="button" className={styles.knopfSymbol} onClick={schliesse} aria-label="Schließen">
            <Zeichen name="zu" />
          </button>
        </div>
        {typeof children === "function" ? children(schliesse) : children}
      </div>
    </dialog>
  );
}

/* ── Dateiknopf ─────────────────────────────────────────────────────── */

const ANNEHMEN = [...Object.keys(BILDTYPEN), ".tif", ".tiff"].join(",");

/**
 * Ein Knopf, der die Dateiauswahl öffnet. Das echte `<input type="file">`
 * liegt unsichtbar darin — so bleibt es per Tastatur erreichbar, und der
 * Knopf sieht aus wie alle anderen.
 */
export function DateiKnopf({
  mehrere = false,
  gesperrt = false,
  beiDateien,
  children,
  leise = false,
}: {
  mehrere?: boolean;
  gesperrt?: boolean;
  beiDateien: (dateien: File[]) => void;
  children: ReactNode;
  leise?: boolean;
}) {
  return (
    <label className={`${leise ? styles.knopfLeise : styles.knopf} ${gesperrt ? styles.gesperrt : ""}`}>
      <input
        type="file"
        className="nur-vorlesen"
        accept={ANNEHMEN}
        multiple={mehrere}
        disabled={gesperrt}
        onChange={(e) => {
          const dateien = [...(e.currentTarget.files ?? [])];
          /* Zurücksetzen, sonst löst dieselbe Datei ein zweites Mal kein
             `change` aus. */
          e.currentTarget.value = "";
          if (dateien.length > 0) beiDateien(dateien);
        }}
      />
      <Zeichen name="hochladen" />
      <span>{children}</span>
    </label>
  );
}

/* ── Eingabefelder ──────────────────────────────────────────────────── */

export function Textfeld({
  bezeichnung,
  wert,
  beiAenderung,
  beiVerlassen,
  mehrzeilig = false,
  hinweis,
  typ = "text",
  platzhalter,
  nurLesen = false,
}: {
  bezeichnung: string;
  wert: string;
  beiAenderung?: (w: string) => void;
  /** Wenn der Fokus das Feld verlässt — z. B. um bei Adressen `https://` zu ergänzen. */
  beiVerlassen?: (w: string) => void;
  mehrzeilig?: boolean;
  hinweis?: ReactNode;
  typ?: "text" | "email" | "url";
  platzhalter?: string;
  nurLesen?: boolean;
}) {
  const kennung = useId();
  const hinweisKennung = `${kennung}-hinweis`;
  const gemeinsam = {
    id: kennung,
    className: styles.eingabe,
    value: wert,
    placeholder: platzhalter,
    readOnly: nurLesen,
    "aria-describedby": hinweis ? hinweisKennung : undefined,
    onChange: (e: { currentTarget: { value: string } }) => beiAenderung?.(e.currentTarget.value),
    onBlur: (e: { currentTarget: { value: string } }) => beiVerlassen?.(e.currentTarget.value),
  };
  return (
    <div className={styles.feld}>
      <label htmlFor={kennung} className={styles.feldName}>
        {bezeichnung}
      </label>
      {mehrzeilig ? <textarea rows={3} {...gemeinsam} /> : <input type={typ} {...gemeinsam} />}
      {hinweis && (
        <p id={hinweisKennung} className={styles.feldHinweis}>
          {hinweis}
        </p>
      )}
    </div>
  );
}

export function Auswahl({
  bezeichnung,
  wert,
  optionen,
  beiAenderung,
  beschriftung = (o) => o,
}: {
  bezeichnung: string;
  wert: string;
  optionen: string[];
  beiAenderung: (w: string) => void;
  /** Was in der Liste steht, wenn es nicht der Wert selbst sein soll (Titel statt Kennung). */
  beschriftung?: (o: string) => string;
}) {
  const kennung = useId();
  return (
    <div className={styles.feld}>
      <label htmlFor={kennung} className={styles.feldName}>
        {bezeichnung}
      </label>
      <select id={kennung} className={styles.eingabe} value={wert} onChange={(e) => beiAenderung(e.currentTarget.value)}>
        {!optionen.includes(wert) && <option value={wert}>{wert || "—"}</option>}
        {optionen.map((o) => (
          <option key={o} value={o}>
            {beschriftung(o)}
          </option>
        ))}
      </select>
    </div>
  );
}
