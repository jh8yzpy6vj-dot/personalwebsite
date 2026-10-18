import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { pruefeZugang } from "@/lib/admin/zugang";
import Anmeldung from "./Anmeldung";
import Verwaltung from "./Verwaltung";

/**
 * **Die Verwaltung unter `/admin`** — Jakob ordnet hier Bilder, lädt neue
 * hoch und bearbeitet Texte; Speichern wird ein Commit von `lib/inhalt.json`
 * (siehe `lib/admin/vertrag.ts`).
 *
 * Diese Seite ist eine Server-Komponente, damit der Zugang **vor** dem
 * ersten Byte geprüft wird: Ohne Einrichtung (`ADMIN_PASSWORT` fehlt) gibt
 * es eine schlichte 404; eingerichtet, aber nicht angemeldet, die
 * Anmeldung; angemeldet die eigentliche Oberfläche, die Client-Komponente
 * `Verwaltung`.
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

export default async function VerwaltungSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* Als echte `Headers` weitergereicht: `headers()` liefert eine
     schreibgeschützte Sonderform. */
  const z = await pruefeZugang(new Headers(await headers()));
  if (z.ok) return <Verwaltung />;
  if (!z.eingerichtet) notFound();
  const hinweis = await searchParams;
  return <Anmeldung falsch={hinweis.falsch === "1"} gesperrt={hinweis.gesperrt === "1"} />;
}
