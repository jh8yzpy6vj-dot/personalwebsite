import type { Metadata } from "next";
import Seite, { seitenStyles } from "../components/Seite";
import Mosaik from "../components/Mosaik";
import { fotosFuerMosaik } from "@/lib/arbeiten";

export const metadata: Metadata = {
  title: "foto — jakob sax",
  description: "Fotos von Jakob Sax.",
  alternates: { canonical: "/foto" },
};

/**
 * `/foto`: ein Mosaik aus den Fotos aller Arbeiten, in der Reihenfolge von
 * `FOTOS` in lib/content.ts, **ohne Zwischenzeilen** (E4). Keine Überschrift,
 * keine Einleitung — die `<h1>` steht nur für Screenreader.
 */
export default function Foto() {
  const bilder = fotosFuerMosaik();

  return (
    <Seite titel="Fotos von Jakob Sax" aktuell="/foto" breite="foto">
      {bilder.length > 0 ? (
        <Mosaik bilder={bilder} />
      ) : (
        <p className={seitenStyles.leer}>Fotos folgen.</p>
      )}
    </Seite>
  );
}
