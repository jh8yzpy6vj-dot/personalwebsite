import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "../../components/Topbar";
import SiteFooter from "../../components/SiteFooter";
import Blende from "../../components/Blende";
import Mosaik from "../../components/Mosaik";
import {
  arbeitNach,
  arbeitenMitBild,
  beschriftung,
  bilderDerArbeit,
  nachbarn,
  textDerArbeit,
} from "@/lib/arbeiten";
import { KATEGORIEN } from "@/lib/content";
import styles from "./detail.module.css";

/**
 * Detailseite einer Fotoarbeit (UI-SPEC, „Detailseite"), seit dem 2026-10-14
 * wieder da — nach dem Vorbild der alten `wiwawo-53`-Seite:
 *
 * **Hero mit Blende → Textkasten → Mosaik → vor/zurück → Footer.**
 *
 * Statisch vorgerendert. Nur Arbeiten mit mindestens einem Bild bekommen eine
 * Seite (was kein Bild hat, erscheint nicht); jede andere Adresse ist 404.
 */

/*
 * ⚠️ **Kein `dynamicParams = false`.** Damit lieferte der Worker jede
 * Detailseite als 404 (gemessen 2026-10-14 mit `wrangler dev`, unter
 * `next dev` lief alles): Ohne eingerichteten Inkrement-Cache findet der
 * OpenNext-Adapter die vorgerenderten Seiten nicht, und mit
 * `dynamicParams = false` darf er sie dann auch nicht selbst rendern.
 * Unbekannte Adressen sind trotzdem 404 — über `notFound()` unten.
 */
export function generateStaticParams() {
  return arbeitenMitBild().map((a) => ({ id: a.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const arbeit = arbeitNach(id);
  if (!arbeit) return {};
  const zeile = beschriftung(arbeit);
  return {
    title: `${zeile} — jakob sax`,
    description: `${zeile}. Fotos von Jakob Sax.`,
    alternates: { canonical: `/foto/${arbeit.id}` },
  };
}

export default async function Detail({ params }: Params) {
  const { id } = await params;
  const arbeit = arbeitNach(id);
  if (!arbeit) notFound();

  const bilder = bilderDerArbeit(arbeit);
  if (bilder.length === 0) notFound();

  const kategorie = KATEGORIEN.find((k) => k.id === arbeit.kategorie);
  const { vorher, nachher } = nachbarn(arbeit.id);

  return (
    <div className={styles.seite}>
      <Topbar aktuell="/foto" />

      <main id="inhalt" tabIndex={-1} className={styles.main}>
        {/*
          Das Hero: alle Bilder der Arbeit nacheinander, mit der Blockblende
          dazwischen (Blende.tsx, Takt im UI-SPEC). Ohne Skript, unter
          `prefers-reduced-motion` und bei nur einem Bild steht das Startbild.
        */}
        <section className={styles.hero} aria-labelledby="titel">
          <Blende
            bilder={bilder.map((b) => ({ quelle: b.quelle, ausschnitt: b.ausschnitt, alt: b.alt }))}
            alt={beschriftung(arbeit)}
            uebergang={`start-${arbeit.id}`}
          />
          <div className={styles.heroFuss}>
            {kategorie && <p className={styles.kategorie}>{kategorie.label}</p>}
            <h1 className={styles.titel} id="titel">
              {arbeit.titel}
            </h1>
            {arbeit.kunde && <p className={styles.kunde}>{arbeit.kunde}</p>}
          </div>
        </section>

        <div className={styles.inhalt}>
          {/* Der Kasten mit etwas Text — Jakobs Text, bis dahin TEXT_FOLGT. */}
          <div className={styles.kasten}>
            <p>{textDerArbeit(arbeit)}</p>
          </div>

          {/* Alle Bilder unbeschnitten, jedes öffnet groß. */}
          <Mosaik bilder={bilder} />

          {/* Ohne vor/zurück wäre jede Detailseite eine Sackgasse. */}
          <nav className={styles.blaettern} aria-label="Weitere Arbeiten">
            {vorher ? (
              <a className={styles.vorher} href={`/foto/${vorher.id}`}>
                <span className={styles.blaetternLabel}>← vorherige</span>
                <span className={styles.blaetternTitel}>{vorher.titel}</span>
              </a>
            ) : (
              <span />
            )}
            {nachher && (
              <a className={styles.nachher} href={`/foto/${nachher.id}`}>
                <span className={styles.blaetternLabel}>nächste →</span>
                <span className={styles.blaetternTitel}>{nachher.titel}</span>
              </a>
            )}
          </nav>

          <p className={styles.zurueck}>
            <a href="/foto">← alle fotos</a>
          </p>
        </div>
      </main>

      <SiteFooter aktuell="/foto" />
    </div>
  );
}
