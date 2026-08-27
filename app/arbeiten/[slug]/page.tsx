import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "../../components/Topbar";
import SiteFooter from "../../components/SiteFooter";
import { CATEGORIES } from "@/lib/content";
import { allSlugs, bySlug, metaLine } from "@/lib/works";
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

  return (
    <div className={styles.page}>
      <Topbar homeHref="/" />

      <main>
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
