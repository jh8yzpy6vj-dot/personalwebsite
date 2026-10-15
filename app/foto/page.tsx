import type { Metadata } from "next";
import Topbar from "../components/Topbar";
import SiteFooter from "../components/SiteFooter";
import Blende from "../components/Blende";
import Mosaik from "../components/Mosaik";
import { fotosFuerHero, fotosFuerMosaik } from "@/lib/arbeiten";
import styles from "./foto.module.css";

export const metadata: Metadata = {
  title: "foto — jakob sax",
  description: "Fotos von Jakob Sax: Festival, Theater, Paddeln, Journalismus.",
  alternates: { canonical: "/foto" },
};

/**
 * `/foto` (UI-SPEC, „/foto"): **Hero mit Blende → ein Mosaik aus allen
 * Bildern → Footer.**
 *
 * ⚠️ Seit dem 2026-10-14 abends, auf Jakobs Rückmeldung. Am selben Tag war
 * hier für ein paar Stunden eine Übersicht nach Kategorien mit Detailseiten
 * je Arbeit live (`/foto/<id>`). Jakob: keine Detailseiten, keine
 * Kategorie-Kacheln — oben die besten Bilder mit der Blende, darunter ein
 * einziges Mosaik, nach Kategorien sortiert, aber ohne sichtbare Grenzen.
 * Die alten Adressen leiten hierher um (next.config.mjs).
 */
export default function Foto() {
  const hero = fotosFuerHero();
  const bilder = fotosFuerMosaik();

  return (
    <div className={styles.seite}>
      <Topbar aktuell="/foto" />

      <main id="inhalt" tabIndex={-1} className={styles.main}>
        {/* Keine sichtbaren Seitentitel (UI-SPEC) — die Navigation zeigt, wo
            man ist. */}
        <h1 className="nur-vorlesen">Fotos von Jakob Sax</h1>

        {/*
          Die Blende über die Auswahl aus `FOTO_HERO` (Blende.tsx, Takt im
          UI-SPEC). Ohne Skript, unter `prefers-reduced-motion` und bei nur
          einem Bild steht das erste.
        */}
        {hero.length > 0 && (
          <section className={styles.hero} aria-label="Ausgewählte Fotos">
            <Blende
              bilder={hero.map((b) => ({ quelle: b.quelle, ausschnitt: b.ausschnitt, alt: b.alt }))}
              alt="Fotos von Jakob Sax"
            />
          </section>
        )}

        <div className={styles.inhalt}>
          {bilder.length > 0 ? (
            /* Alle Bilder, nach Kategorie geordnet, unbeschnitten; jedes
               öffnet groß. Keine Zwischenüberschriften. */
            <Mosaik bilder={bilder} spaltenMax={4} />
          ) : (
            <p className={styles.leer}>Fotos folgen.</p>
          )}
        </div>
      </main>

      <SiteFooter aktuell="/foto" />
    </div>
  );
}
