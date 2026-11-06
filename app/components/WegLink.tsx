"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  /** Name des Übergangs, den der Kopf der Zielseite beim Seitenwechsel trägt (globals.css). */
  uebergang: string;
  children: ReactNode;
};

/** Das Bild der Kachel — oder, ohne Bild, die dunkle Fläche an seiner Stelle. */
const bildIn = (a: HTMLAnchorElement | null) =>
  (a?.querySelector("img") ?? a?.firstElementChild) as HTMLElement | null | undefined;

/**
 * Eine Kachel „foto"/„film" auf `/`. Beim Klick wächst ihr Bild in den Kopf
 * der Zielseite (UI-SPEC, „Motion" → „Kachel → Kopf der Seite"): Die Kachel
 * bekommt den Namen des Übergangs **erst beim Klick** — über die Topbar
 * läge sie womöglich außerhalb des Fensters, und der Kopf flöge von unten
 * herein. Ohne Skript ein gewöhnlicher Link.
 */
export default function WegLink({ href, className, uebergang, children }: Props) {
  const ref = useRef<HTMLAnchorElement | null>(null);

  /*
   * Holt der Browser die Startseite mit „Zurück" aus dem Zwischenspeicher,
   * trägt die Kachel den Namen noch — gewollt: Der Kopf kehrt so in sie
   * zurück. Danach muss er weg, sonst gälte er beim nächsten Weg über die
   * Topbar.
   */
  useEffect(() => {
    const leeren = () => {
      const bild = bildIn(ref.current);
      if (bild) bild.style.viewTransitionName = "";
    };
    const beiReveal = (e: Event) => {
      const t = (e as Event & { viewTransition?: ViewTransition | null }).viewTransition;
      if (t) t.finished.finally(leeren);
      else leeren();
    };
    const beiShow = (e: PageTransitionEvent) => {
      if (e.persisted && !("onpagereveal" in window)) leeren();
    };
    window.addEventListener("pagereveal", beiReveal);
    window.addEventListener("pageshow", beiShow);
    return () => {
      window.removeEventListener("pagereveal", beiReveal);
      window.removeEventListener("pageshow", beiShow);
    };
  }, []);

  return (
    <a
      ref={ref}
      className={className}
      href={href}
      onClick={(e) => {
        /* Neuer Tab oder Fenster: kein Seitenwechsel hier, also kein Name. */
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const bild = bildIn(e.currentTarget);
        if (bild) bild.style.viewTransitionName = uebergang;
      }}
    >
      {children}
    </a>
  );
}
