import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "../../components/Topbar";
import SiteFooter from "../../components/SiteFooter";
import Blaettertasten from "../../components/Blaettertasten";
import Blende from "../../components/Blende";
import Mosaik from "../../components/Mosaik";
import Film from "../../components/Film";
import Kontaktbogen from "../../components/Kontaktbogen";
import {
  ausschnittAus,
  aufnahmeZeile,
  bildZurArbeit,
  bildstreckeZurArbeit,
  serieZurArbeit,
} from "@/lib/bilder";
import { videoZurArbeit } from "@/lib/video";
import { CATEGORIES } from "@/lib/content";
import { allSlugs, bySlug, metaLine, neighbours, yearOf } from "@/lib/works";
import { SITE_URL } from "@/lib/site";
import styles from "./detail.module.css";

/**
 * Detailseite einer Arbeit.
 *
 * Der wichtigste SEO-Hebel der Seite: Nur eine eigene URL kann für einen
 * Festivalnamen ranken — und „tête-à-tête Rastatt 2026 Fotos" sucht genau
 * das Publikum, aus dem Auftraggeber kommen (siehe SITE-PLAN.md).
 *
 * Statisch vorgerendert; die `id` aus `content.ts` ist der Slug und muss
 * deshalb URL-stabil bleiben.
 */

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = bySlug(slug);
  if (!work) return {};

  const titel = `${work.title} — ${work.client} — jakob sax`;
  const beschreibung = `${work.title}, ${work.client}, ${work.year}. ${work.role} von Jakob Sax.`;
  /*
   * Eigene Vorschaukarte je Arbeit, zur Bauzeit erzeugt (scripts/og.mjs).
   * Wirft ein Festival den Link in die WhatsApp-Gruppe, steht dort der
   * Festivalname statt einer grauen Fläche — das ist der Unterschied
   * zwischen „jemand tippt darauf" und „jemand scrollt weiter".
   */
  const karte = `/og/${work.id}.jpg`;

  return {
    title: titel,
    description: beschreibung,
    alternates: { canonical: `/arbeiten/${work.id}` },
    openGraph: {
      type: "article",
      url: `/arbeiten/${work.id}`,
      title: titel,
      description: beschreibung,
      images: [{ url: karte, width: 1200, height: 630, alt: work.title }],
    },
    twitter: { card: "summary_large_image", images: [karte] },
  };
}

export default async function WorkDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = bySlug(slug);
  if (!work) notFound();

  const category = CATEGORIES.find((c) => c.id === work.category);
  const { prev, next } = neighbours(work);
  const bild = bildZurArbeit(work.id);
  const aufnahme = aufnahmeZeile(bild?.exif);
  const strecke = bildstreckeZurArbeit(work.id);
  const serie = serieZurArbeit(work.id);
  const film = videoZurArbeit(work.id);

  /*
   * Strukturierte Daten je Arbeit. Verknüpft über `@id` mit der Person aus
   * app/StructuredData.tsx — Google soll die Arbeit demselben Jakob Sax
   * zuordnen wie die SWR-Autorenseite.
   *
   * `CreativeWork` statt eines spezifischeren Typs, weil die Arbeiten
   * Fotostrecken, Filme und redaktionelle Beiträge mischen. Nur belegte
   * Felder — nichts, was nicht auch auf der Seite steht.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    url: `${SITE_URL}/arbeiten/${work.id}`,
    datePublished: String(yearOf(work)),
    creator: { "@id": `${SITE_URL}/#person` },
    /*
     * `sourceOrganization`, nicht `sponsor`: `sponsor` bedeutet bei
     * schema.org einen **finanziellen Förderer**. Ein Auftraggeber, für den
     * gearbeitet wurde, ist etwas anderes — die Seite behauptet das auch
     * nirgends. Im Code-Review aufgefallen.
     */
    sourceOrganization: { "@type": "Organization", name: work.client },
    ...(work.place ? { locationCreated: { "@type": "Place", name: work.place } } : {}),
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Topbar homeHref="/" />

      {/* Mit ← und → durch die Kategorie blättern — dieselben Ziele wie die
          sichtbaren Links unten, nur schneller. Rendert nichts. */}
      <Blaettertasten
        prev={prev ? `/arbeiten/${prev.id}` : undefined}
        next={next ? `/arbeiten/${next.id}` : undefined}
      />

      <main id="inhalt" tabIndex={-1}>
        {/*
          Dunkel: das Hero über die volle Fensterhöhe, Titel und Metazeile
          darauf. `medien-scrim` ist zurück — hier läuft das Foto wieder bis
          an den oberen Rand, und darunter sitzt die durchsichtige Topbar.
        */}
        <section className={`${styles.hero} medien-scrim`}>
          {bild ? (
            /*
              Keine stehende Aufnahme mehr, sondern eine Folge aus Leitbild
              und Strecke mit Blockblende dazwischen — siehe „Blende im
              Hero" in design/UI-SPEC.md. Ohne Skript, ohne
              Bewegungswunsch und bei nur einem Bild ist es genau das, was
              vorher hier stand: das Leitbild.
            */
            <Blende
              bilder={[
                /* Jedes Bild bringt seinen gewählten Ausschnitt mit —
                   auch das Leitbild, das im Hero zwar kaum beschnitten
                   wird, auf dem Telefon aber schon. Siehe
                   lib/bildausschnitte.ts. */
                { quelle: bild, ausschnitt: ausschnittAus(`arbeiten/${work.id}`) },
                ...strecke.map((b) => ({ quelle: b.quelle, ausschnitt: b.ausschnitt })),
              ]}
              alt={work.alt ?? `${work.title}, ${work.client}, ${work.year}`}
              uebergang={`bild-${work.id}`}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span className={styles.placeholderDot} />
              <span className={styles.placeholderNote}>Bild folgt</span>
            </div>
          )}

          {/* Titel und Auftraggeber stehen **hier** und sonst nirgends auf
              der Seite — siehe „Titel genau einmal" in design/UI-SPEC.md. */}
          <div className={styles.heroFuss}>
            <div className={styles.heroInner}>
              <p className={styles.client}>{work.client}</p>
              <h1 className={styles.title}>{work.title}</h1>
              <p className={styles.meta}>{metaLine(work)}</p>
            </div>
          </div>
        </section>

        {/* Hell: der Kontext. Die einzige Naht der Seite liegt hier. */}
        <div className={styles.light}>
          {/*
            Erst der Text, darunter die Bilder.

            ⚠️ **Bis zum 2026-09-13 standen die Bilder als Flanken links und
            rechts vom Text.** Zusammen mit dem Hero und dem Kontaktbogen
            erschien dieselbe Strecke damit dreimal auf einer Seite — Jan:
            „das ist zu viel des guten". Die Flanken kosteten sechs volle
            Bildschirme; das Mosaik zeigt dasselbe auf einem und lässt jedes
            Bild groß öffnen. Nebenbei fällt die alte Grenze weg, dass das
            Layout an der Textlänge hing.
          */}
          <article className={styles.text}>
            {/* Aufnahmedaten aus dem EXIF des Originals — automatisch, kein
                Pflegeaufwand. Erscheint nur, wenn die Datei welche
                mitbringt; viele Exportwege werfen das EXIF weg, und das ist
                kein Fehler. */}
            {aufnahme && <p className={styles.aufnahme}>{aufnahme}</p>}

            {/* Bewusst kein Fließtext: Die zwei Sätze Projektkontext je
                Arbeit sind noch nicht geschrieben und werden nicht
                erfunden. Sobald sie vorliegen, kommt in content.ts ein Feld
                dazu und wird hier ausgegeben. Siehe TODO.md. */}
            <p className={styles.pending}>Beschreibung folgt.</p>

            {/* Der Beleg für das, was die Copy behauptet: vier Frames
                daneben, einer sitzt. Siehe Kontaktbogen.tsx. */}
            <Kontaktbogen bilder={serie} titel={work.title} />
          </article>

          {strecke.length > 0 && (
            <div className={styles.mosaik}>
              <Mosaik bilder={strecke} titel={work.title} />
            </div>
          )}

          {/* Der Film steht **unter** dem Textblock über die volle Breite:
              Ein Aftermovie ist ein eigener Auftritt, keine Flanke. */}
          {film && <Film quelle={film} titel={work.title} standbild={bild} />}

          <article className={styles.inner}>
            {/* Ohne vor/zurück ist jede Detailseite eine Sackgasse — man
                kann nur zurück. Innerhalb derselben Kategorie, weil wer eine
                Festivalarbeit anschaut, die nächste Festivalarbeit sehen
                will und keinen Radiobeitrag. */}
            {(prev || next) && (
              <nav
                className={styles.blaettern}
                aria-label="Weitere Arbeiten"
                aria-keyshortcuts="ArrowLeft ArrowRight"
              >
                {prev ? (
                  <a className={styles.blaetternPrev} href={`/arbeiten/${prev.id}`}>
                    <span className={styles.blaetternLabel}>vorherige</span>
                    <span className={styles.blaetternTitel}>{prev.title}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next && (
                  <a className={styles.blaetternNext} href={`/arbeiten/${next.id}`}>
                    <span className={styles.blaetternLabel}>nächste</span>
                    <span className={styles.blaetternTitel}>{next.title}</span>
                  </a>
                )}
              </nav>
            )}

            <p className={styles.back}>
              <a href="/arbeiten">← alle Arbeiten</a>
              {category && (
                <span className={styles.backCategory}> · {category.label}</span>
              )}
            </p>
          </article>
        </div>
      </main>

      <div className={styles.light}>
        <SiteFooter current="/arbeiten" />
      </div>
    </div>
  );
}
