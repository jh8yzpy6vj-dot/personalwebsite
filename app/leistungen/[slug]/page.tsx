import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LightPage, { lightStyles as base } from "../../components/LightPage";
import { CONTACT, SERVICES, SITE } from "@/lib/content";
import { forService, metaLine } from "@/lib/works";
import { SITE_URL } from "@/lib/site";
import styles from "./leistung.module.css";

/**
 * Eine Seite je Leistung.
 *
 * **Warum das die stärkste Strukturänderung ist:** Vorher waren die drei
 * Angebote nur Textblöcke auf der Startseite — ohne eigene URL. Damit
 * konnte weder jemand darauf verlinken, noch konnte „Festivalfotograf
 * Rastatt" auf einer Seite *über Festivalfotografie* landen. Verkauf und
 * Suchmaschine wollen hier dasselbe: einen Ort pro Angebot.
 *
 * Die Startseite behält die drei Türen als Anriss; hier steht, was
 * dahinter liegt.
 */

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  if (!service) return {};

  return {
    title: `${service.shortTitle} — jakob sax`,
    description: `${service.description} Für ${service.audience}. ${SITE.locations}.`,
    alternates: { canonical: `/leistungen/${service.id}` },
  };
}

export default async function Leistung({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  if (!service) notFound();

  const arbeiten = forService(service.works);
  const andere = SERVICES.filter((s) => s.id !== service.id);

  /*
   * `Service` statt `CreativeWork`: Hier wird ein Angebot beschrieben, keine
   * fertige Arbeit. Über `provider` mit der Person aus StructuredData.tsx
   * verknüpft. `areaServed` kommt aus SITE.locations — nur belegte Orte.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.shortTitle,
    description: service.description,
    url: `${SITE_URL}/leistungen/${service.id}`,
    provider: { "@id": `${SITE_URL}/#person` },
    areaServed: SITE.locations
      .split("·")
      .map((o) => o.trim())
      .filter(Boolean)
      .map((o) => ({
        "@type": "Place",
        name: o.charAt(0).toUpperCase() + o.slice(1),
      })),
  };

  return (
    <LightPage title={service.title}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className={styles.audience}>Für {service.audience}</p>
      <p className={base.lead}>{service.description}</p>

      <h2 className={styles.h2}>Eckdaten</h2>
      <ul className={styles.facts}>
        {service.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      {/* Der Preisanker erscheint nur, wenn einer feststeht — statt einer
          erfundenen Zahl. Solange nicht, bleibt die Stelle leer; die
          Budget-Auswahl im Anfrageformular fängt die Frage auf. */}
      {service.priceAnchor && (
        <p className={styles.price}>{service.priceAnchor}</p>
      )}

      {arbeiten.length > 0 && (
        <>
          <h2 className={styles.h2}>Dazu passende Arbeiten</h2>
          <ul className={styles.works}>
            {arbeiten.map((w) => (
              <li key={w.id}>
                <a className={styles.workLink} href={`/arbeiten/${w.id}`}>
                  <span className={styles.workClient}>{w.client}</span>
                  <span className={styles.workTitle}>{w.title}</span>
                  <span className={styles.workMeta}>{metaLine(w)}</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className={styles.ctaRow}>
        <a className={styles.cta} href="/kontakt">
          Anfrage stellen
        </a>
      </p>
      <p className={styles.direkt}>
        Oder direkt:{" "}
        <a href={`mailto:${CONTACT.booking.email}`}>{CONTACT.booking.email}</a>
      </p>

      <h2 className={styles.h2}>Auch buchbar</h2>
      <ul className={styles.andere}>
        {andere.map((s) => (
          <li key={s.id}>
            <a href={`/leistungen/${s.id}`}>{s.title}</a>
          </li>
        ))}
      </ul>
    </LightPage>
  );
}
