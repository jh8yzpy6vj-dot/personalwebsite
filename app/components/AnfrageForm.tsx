"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ANLAESSE,
  BUDGET_BAENDER,
  LEERE_ANFRAGE,
  istGueltig,
  pruefe,
  type AnfrageFelder,
  type Fehler,
} from "@/lib/anfrage";
import styles from "./AnfrageForm.module.css";

type Zustand = "idle" | "sendet" | "fertig" | "fehler";

/**
 * Anfrageformular. Zustände und Regeln stehen in design/UI-SPEC.md,
 * Abschnitt „Anfrageformular auf /kontakt" — dort **vor** diesem Code
 * festgelegt.
 *
 * Zwei Dinge, die leicht untergehen und hier bewusst gelöst sind:
 * Bei einem Fehler bleiben **alle Eingaben erhalten** (nichts ist
 * ärgerlicher, als einen Text zweimal zu tippen), und Erfolgs- wie
 * Fehlermeldung bekommen den **Fokus**, damit sie mit Tastatur und
 * Screenreader überhaupt bemerkt werden.
 */
export default function AnfrageForm({ email }: { email: string }) {
  const id = useId();
  const [werte, setWerte] = useState<AnfrageFelder>(LEERE_ANFRAGE);
  const [fehler, setFehler] = useState<Fehler>({});
  const [zustand, setZustand] = useState<Zustand>("idle");
  const [meldung, setMeldung] = useState("");
  const gestartet = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Zeitpunkt des Seitenaufrufs — Grundlage der Mindest-Ausfüllzeit.
  useEffect(() => {
    gestartet.current = Date.now();
  }, []);

  // Nach Erfolg oder Fehler den Fokus auf die Meldung setzen.
  useEffect(() => {
    if (zustand === "fertig" || zustand === "fehler") statusRef.current?.focus();
  }, [zustand]);

  function setze(feld: keyof AnfrageFelder, wert: string) {
    setWerte((v) => ({ ...v, [feld]: wert }));
    // Fehler verschwinden beim Tippen — eine Meldung, die stehen bleibt,
    // obwohl das Problem behoben ist, verwirrt mehr, als sie hilft.
    if (fehler[feld]) setFehler((f) => ({ ...f, [feld]: undefined }));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    const gefunden = pruefe(werte);
    if (!istGueltig(gefunden)) {
      setFehler(gefunden);
      const erstes = Object.keys(gefunden)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${erstes}"]`)?.focus();
      return;
    }

    setZustand("sendet");
    setMeldung("");
    try {
      const antwort = await fetch("/api/anfrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...werte, gestartet: gestartet.current }),
      });
      const daten = (await antwort.json().catch(() => ({}))) as {
        fehler?: string;
        felder?: Fehler;
      };

      if (antwort.ok) {
        setZustand("fertig");
        return;
      }
      if (daten.felder) setFehler(daten.felder);
      setZustand("fehler");
      setMeldung(daten.fehler ?? "Das hat nicht geklappt.");
    } catch {
      // Netzwerkfehler — die Eingaben bleiben stehen.
      setZustand("fehler");
      setMeldung(
        "Die Verbindung ist abgebrochen. Bitte versuchen Sie es noch einmal."
      );
    }
  }

  if (zustand === "fertig") {
    return (
      <div className={styles.erfolg} role="status" tabIndex={-1} ref={statusRef}>
        <p className={styles.erfolgTitel}>Ihre Anfrage ist angekommen.</p>
        <p className={styles.erfolgText}>
          Ich melde mich in der Regel innerhalb von zwei Werktagen. Kommt bis
          dahin nichts an, schreiben Sie mir gern direkt an {email} — dann ist
          etwas unterwegs verlorengegangen.
        </p>
      </div>
    );
  }

  const sendet = zustand === "sendet";

  return (
    <form className={styles.form} onSubmit={absenden} noValidate ref={formRef}>
      {zustand === "fehler" && (
        <div className={styles.fehlerBox} role="status" tabIndex={-1} ref={statusRef}>
          {meldung}{" "}
          <a href={`mailto:${email}`}>Oder direkt per E-Mail schreiben.</a>
        </div>
      )}

      <Feld id={`${id}-anlass`} label="Art der Veranstaltung" hinweis="optional">
        <select
          className={styles.eingabe}
          name="anlass"
          id={`${id}-anlass`}
          value={werte.anlass}
          onChange={(e) => setze("anlass", e.target.value)}
        >
          <option value="">bitte wählen</option>
          {ANLAESSE.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Feld>

      <div className={styles.zweiSpalten}>
        <Feld id={`${id}-datum`} label="Datum" hinweis="optional">
          <input
            className={styles.eingabe}
            type="date"
            name="datum"
            id={`${id}-datum`}
            value={werte.datum}
            onChange={(e) => setze("datum", e.target.value)}
          />
        </Feld>

        <Feld id={`${id}-ort`} label="Ort" hinweis="optional" fehler={fehler.ort}>
          <input
            className={styles.eingabe}
            type="text"
            name="ort"
            id={`${id}-ort`}
            value={werte.ort}
            onChange={(e) => setze("ort", e.target.value)}
            aria-invalid={fehler.ort ? true : undefined}
            aria-describedby={fehler.ort ? `${id}-ort-fehler` : undefined}
          />
        </Feld>
      </div>

      <Feld
        id={`${id}-budget`}
        label="Budgetrahmen"
        hinweis="hilft uns beiden, schneller zu klären, ob es passt"
      >
        <select
          className={styles.eingabe}
          name="budget"
          id={`${id}-budget`}
          value={werte.budget}
          onChange={(e) => setze("budget", e.target.value)}
        >
          <option value="">bitte wählen</option>
          {BUDGET_BAENDER.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Feld>

      <Feld id={`${id}-nachricht`} label="Nachricht" fehler={fehler.nachricht}>
        <textarea
          className={`${styles.eingabe} ${styles.textfeld}`}
          name="nachricht"
          id={`${id}-nachricht`}
          rows={5}
          value={werte.nachricht}
          onChange={(e) => setze("nachricht", e.target.value)}
          aria-invalid={fehler.nachricht ? true : undefined}
          aria-describedby={fehler.nachricht ? `${id}-nachricht-fehler` : undefined}
        />
      </Feld>

      <div className={styles.zweiSpalten}>
        <Feld id={`${id}-name`} label="Name" fehler={fehler.name}>
          <input
            className={styles.eingabe}
            type="text"
            name="name"
            id={`${id}-name`}
            autoComplete="name"
            value={werte.name}
            onChange={(e) => setze("name", e.target.value)}
            aria-invalid={fehler.name ? true : undefined}
            aria-describedby={fehler.name ? `${id}-name-fehler` : undefined}
          />
        </Feld>

        <Feld id={`${id}-email`} label="E-Mail" fehler={fehler.email}>
          <input
            className={styles.eingabe}
            type="email"
            name="email"
            id={`${id}-email`}
            autoComplete="email"
            value={werte.email}
            onChange={(e) => setze("email", e.target.value)}
            aria-invalid={fehler.email ? true : undefined}
            aria-describedby={fehler.email ? `${id}-email-fehler` : undefined}
          />
        </Feld>
      </div>

      {/* Honeypot. Für Menschen unsichtbar, für Screenreader ausgeblendet —
          deshalb aria-hidden und tabIndex -1, sonst stolpern Nutzende mit
          Tastatur darüber und werden fälschlich als Bot gewertet. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`${id}-webseite`}>Webseite</label>
        <input
          type="text"
          name="webseite"
          id={`${id}-webseite`}
          tabIndex={-1}
          autoComplete="off"
          value={werte.webseite}
          onChange={(e) => setze("webseite", e.target.value)}
        />
      </div>

      <button className={styles.absenden} type="submit" disabled={sendet}>
        {sendet ? "wird gesendet…" : "Anfrage senden"}
      </button>

      <p className={styles.datenschutz}>
        Ihre Angaben nutze ich nur zur Beantwortung dieser Anfrage. Näheres in
        der <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>
    </form>
  );
}

function Feld({
  id,
  label,
  hinweis,
  fehler,
  children,
}: {
  id: string;
  label: string;
  hinweis?: string;
  fehler?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={styles.feld}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {hinweis && <span className={styles.hinweis}> — {hinweis}</span>}
      </label>
      {children}
      {fehler && (
        <span className={styles.feldFehler} id={`${id}-fehler`}>
          {fehler}
        </span>
      )}
    </p>
  );
}
