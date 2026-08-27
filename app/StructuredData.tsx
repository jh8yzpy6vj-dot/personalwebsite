import { ABOUT, CONTACT, SITE } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * JSON-LD für Google.
 *
 * Zweck (siehe SITE-PLAN.md, „Wie diese Zielgruppen die Seite finden"):
 * `sameAs` verknüpft diese Seite mit der SWR-Autorenseite und dem
 * Instagram-Profil. Das ist der Hebel, damit Google „Jakob Sax der
 * SWR-Journalist" und „Jakob Sax der Fotograf" als **eine** Person versteht
 * statt als zwei — und diese Seite neben der SWR-Autorenseite ausspielt
 * statt dahinter.
 *
 * ⚠️ **Regel für diese Datei: nur belegte, öffentlich sichtbare Angaben.**
 * Strukturierte Daten müssen mit dem übereinstimmen, was auf der Seite steht.
 * Deshalb hier bewusst **keine** Kontaktdaten — die Adresse in `content.ts`
 * ist ein Platzhalter, und eine erfundene Adresse in strukturierten Daten
 * wäre schlimmer als auf der Seite: Google übernimmt sie in Wissensfelder.
 * Sobald echte Daten vorliegen: `email` und `address` hier ergänzen.
 */
export default function StructuredData() {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Jakob Sax",
    url: SITE_URL,
    jobTitle: ["Fotograf", "Journalist"],
    description: SITE.positioning,
    worksFor: {
      "@type": "Organization",
      name: "SWR",
    },
    // Die Verknüpfung, um die es hier eigentlich geht.
    sameAs: [ABOUT.authorPageUrl, CONTACT.instagram.url],
  };

  const service = {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#service`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.positioning,
    provider: { "@id": `${SITE_URL}/#person` },
    // Nur belegte Orte — `SITE.locations` in content.ts nennt Rastatt und
    // Stuttgart. Weitere Orte erst ergänzen, wenn sie dort stehen.
    // Grossschreibung: `SITE.locations` ist als Gestaltung kleingeschrieben
    // (siehe UI-SPEC), für Google sind es aber Ortsnamen — Google gleicht sie
    // gegen echte Orte ab, deshalb hier in korrekter Schreibweise.
    areaServed: SITE.locations
      .split("·")
      .map((place) => place.trim())
      .filter(Boolean)
      .map((place) => ({
        "@type": "Place",
        name: place.charAt(0).toUpperCase() + place.slice(1),
      })),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [person, service],
  };

  return (
    <script
      type="application/ld+json"
      // Kein Nutzereingabe-Pfad: Der Inhalt stammt vollständig aus
      // content.ts und site.ts, also aus dem Repo.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
