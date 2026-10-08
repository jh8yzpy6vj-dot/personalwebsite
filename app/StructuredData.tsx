import { ABOUT } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * JSON-LD für Google: nur noch eine `Person` (UMBAU 4.7). Der frühere
 * `ProfessionalService` entfällt — die Seite bietet keinen Dienst mehr an.
 *
 * `sameAs` verknüpft diese Seite mit der SWR-Autorenseite und dem
 * Instagram-Profil, damit Google „Jakob Sax, SWR" und diese Seite als
 * **eine** Person versteht.
 *
 * ⚠️ Nur belegte, öffentlich sichtbare Angaben. Strukturierte Daten müssen
 * mit dem übereinstimmen, was auf der Seite steht.
 */
export default function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Jakob Sax",
    url: SITE_URL,
    worksFor: { "@type": "Organization", name: "SWR" },
    sameAs: [ABOUT.swr.url, ABOUT.instagram.url],
  };

  return (
    <script
      type="application/ld+json"
      // Kein Nutzereingabe-Pfad: Der Inhalt stammt aus dem Repo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
