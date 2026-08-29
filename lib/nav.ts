import { SERVICES } from "./content";

/**
 * Die Navigation an **einer** Stelle.
 *
 * Topbar-Menü und Footer zeigen dieselben Ziele. Zwei getrennte Listen
 * würden beim nächsten neuen Bereich auseinanderlaufen — genau so entstehen
 * Menüs, in denen eine Seite fehlt.
 */

export type NavItem = { href: string; label: string };

/** Hauptbereiche. */
export const NAV_MAIN: NavItem[] = [
  { href: "/arbeiten", label: "arbeiten." },
  { href: "/ueber", label: "über." },
  { href: "/kontakt", label: "kontakt." },
];

/**
 * Die Leistungen als eigene Gruppe. Aus `SERVICES` erzeugt, damit eine neue
 * Leistung automatisch im Menü steht und nicht vergessen wird.
 */
export const NAV_SERVICES: NavItem[] = SERVICES.map((s) => ({
  href: `/leistungen/${s.id}`,
  label: s.title,
}));

/** Rechtliches — steht nur im Footer, nicht im Hauptmenü. */
export const NAV_LEGAL: NavItem[] = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

/**
 * Gehört der aktuelle Pfad zu diesem Ziel? Berücksichtigt Unterseiten:
 * Auf `/arbeiten/wiwawo-52` ist auch `arbeiten.` der aktive Bereich —
 * sonst wirkt das Menü auf jeder Detailseite orientierungslos.
 */
export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
