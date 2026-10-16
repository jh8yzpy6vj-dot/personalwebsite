import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { pruefeZugang } from "@/lib/admin/zugang";
import Verwaltung from "./Verwaltung";

/**
 * **Die Verwaltung unter `/admin`** — Jakob ordnet hier Bilder, lädt neue
 * hoch und bearbeitet Texte; Speichern wird ein Commit von `lib/inhalt.json`
 * (siehe `lib/admin/vertrag.ts`).
 *
 * Diese Seite ist eine Server-Komponente, damit der Zugang **vor** dem
 * ersten Byte geprüft wird: Ohne gültige Anmeldung — oder ohne vollständige
 * Einrichtung — gibt es eine schlichte 404, und von außen ist nicht zu
 * erkennen, dass hier etwas wäre. Die eigentliche Oberfläche ist die
 * Client-Komponente `Verwaltung`.
 *
 * ⚠️ `lib/admin/zugang` (und `github`, `eingang`, `umgebung`) nur hier und in
 * den Routen importieren, **nie** in einer Client-Komponente: Alles, was die
 * importiert, landet im Bündel für den Browser.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verwaltung — jakob sax",
  robots: { index: false, follow: false },
};

export default async function VerwaltungSeite() {
  /* Als echte `Headers` weitergereicht: `headers()` liefert eine
     schreibgeschützte Sonderform. */
  const z = await pruefeZugang(new Headers(await headers()));
  if (!z.ok) notFound();
  return <Verwaltung email={z.email} />;
}
