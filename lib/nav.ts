/**
 * Die Navigation an **einer** Stelle.
 *
 * Topbar und Footer lesen von hier. Zwei getrennte Listen würden beim
 * nächsten neuen Bereich auseinanderlaufen — genau so entstehen Menüs, in
 * denen eine Seite fehlt.
 */

export type NavItem = { href: string; label: string };

/**
 * Hauptbereiche — in dieser Reihenfolge, klein und ohne Schlusspunkt
 * (UI-SPEC, E7).
 */
export const NAV_MAIN: NavItem[] = [
  { href: "/foto", label: "foto" },
  { href: "/film", label: "film" },
  { href: "/ueber", label: "über mich" },
];

/** Rechtliches — steht nur im Footer bzw. auf `/` unten links, nie im Header. */
export const NAV_LEGAL: NavItem[] = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
];

/**
 * Gehört der Pfad zu diesem Ziel? Berücksichtigt Unterseiten, falls es je
 * wieder welche gibt.
 */
export function isCurrent(pathname: string | undefined, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
