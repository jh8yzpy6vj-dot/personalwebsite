import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "../../components/Topbar";
import SiteFooter from "../../components/SiteFooter";
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

  return {
    title: `${work.title} — ${work.client} — jakob sax`,
    description: `${work.title}, ${work.client}, ${work.year}. ${work.role} von Jakob Sax.`,
    alternates: { canonical: `/arbeiten/${work.id}` },
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

      <main id="inhalt" tabIndex={-1}>
        {/* Dunkel: das Bild. Solange keins vorliegt, ein ehrlicher Platzhalter
            statt eines kaputten img. */}
        <div className={styles.media}>
          {work.image ? (
            <img
              className={styles.image}
              src={work.image}
              alt={work.alt ?? `${work.title}, ${work.client}, ${work.year}`}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span className={styles.placeholderDot} />
              <span className={styles.placeholderNote}>Bild folgt</span>
            </div>
          )}
        </div>

        {/* Hell: der Kontext. */}
        <div className={styles.light}>
          <article className={styles.inner}>
            <p className={styles.client}>{work.client}</p>
            <h1 className={styles.title}>{work.title}</h1>
            <p className={styles.meta}>{metaLine(work)}</p>

            {/* Bewusst kein Fließtext: Die zwei Sätze Projektkontext je Arbeit
                sind noch nicht geschrieben und werden nicht erfunden. Sobald
                sie vorliegen, kommt in content.ts ein Feld `context` dazu und
                wird hier ausgegeben. Siehe TODO.md. */}
            <p className={styles.pending}>
              Beschreibung und Bildstrecke folgen.
            </p>

            {/* Ohne vor/zurück ist jede Detailseite eine Sackgasse — man
                kann nur zurück. Innerhalb derselben Kategorie, weil wer eine
                Festivalarbeit anschaut, die nächste Festivalarbeit sehen
                will und keinen Radiobeitrag. */}
            {(prev || next) && (
              <nav className={styles.blaettern} aria-label="Weitere Arbeiten">
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
