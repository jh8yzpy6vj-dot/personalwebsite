import { sparsamesSrcset, type Bildquelle } from "@/lib/bilder";
import styles from "./Bild.module.css";

type Props = {
  quelle: Bildquelle;
  /** Beschreibt die Szene. Pflicht — siehe design/UI-SPEC.md. */
  alt: string;
  /**
   * Wie breit das Bild im Layout tatsächlich wird. Ohne diese Angabe nimmt
   * der Browser `100vw` an und lädt in einem zweispaltigen Raster durchweg
   * die doppelt zu große Datei.
   */
  sizes: string;
  /**
   * Für das Bild, das beim Aufschlagen der Seite sichtbar ist. Schaltet das
   * verzögerte Laden ab — beim größten sichtbaren Element kostet es sonst
   * genau die Zeit, die man sparen wollte.
   */
  vorrang?: boolean;
  /**
   * Name für den Seitenübergang. Tragen Kachel und Zielbild **denselben**
   * Namen, bewegt der Browser das Foto beim Klick von der einen Position in
   * die andere, statt beide Seiten zu überblenden. Siehe globals.css.
   *
   * Muss je Seite eindeutig sein — deshalb der Slug der Arbeit darin.
   */
  uebergang?: string;
  className?: string;
};

/**
 * Für Verbindungen, bei denen jemand ausdrücklich um wenig Daten gebeten hat.
 *
 * ⚠️ **Wirkt heute in keinem ausgelieferten Browser.** Chromium kennt die
 * Abfrage nur hinter einer Fahne, Safari und Firefox gar nicht. Eine unbekannte
 * Medienabfrage ist ungültig und damit `false` — die `<source>` wird also
 * schlicht übersprungen und die volle Liste greift. Das kostet ein paar Zeilen
 * HTML und schaltet sich von selbst ein, sobald ein Browser es kann.
 *
 * Der Weg über `navigator.connection.saveData` wäre heute wirksam, würde aber
 * bedeuten, das Bild erst zu laden und dann per Skript auszutauschen — also
 * mehr Daten zu übertragen, nicht weniger. Deshalb bewusst nicht.
 */
const SPARSAM = "(prefers-reduced-data: reduce)";

/**
 * Ein Bild, in allen Formaten und Größen, die die Pipeline erzeugt hat.
 *
 * Reine Serverkomponente ohne Zustand, damit sie auch innerhalb von
 * Client-Komponenten (`Works.tsx`) benutzbar bleibt.
 *
 * Zwei Dinge, die hier absichtlich so stehen:
 *
 * - `width`/`height` tragen die Maße des **Originals**. Der Browser braucht
 *   daraus nur das Seitenverhältnis, um vor dem Laden Platz zu reservieren;
 *   ohne das springt das Layout, sobald das Foto eintrifft.
 * - Das Vorschaubildchen liegt als Hintergrund **unter** dem Bild. Es ist
 *   schon da, wenn das HTML ankommt, und wird vom fertigen Foto überdeckt.
 *   Kein Skript, kein Umschaltmoment, keine zusätzliche Anfrage.
 */
export default function Bild({
  quelle,
  alt,
  sizes,
  vorrang = false,
  uebergang,
  className,
}: Props) {
  const sparsamAvif = sparsamesSrcset(quelle.avif);
  const sparsamWebp = sparsamesSrcset(quelle.webp);

  return (
    <picture className={styles.picture}>
      {/* Reihenfolge zählt: Der Browser nimmt die **erste** passende Quelle.
          Die sparsamen stehen deshalb vorn — sonst käme er nie zu ihnen. */}
      {sparsamAvif && (
        <source type="image/avif" media={SPARSAM} srcSet={sparsamAvif} sizes={sizes} />
      )}
      {sparsamWebp && (
        <source type="image/webp" media={SPARSAM} srcSet={sparsamWebp} sizes={sizes} />
      )}

      <source type="image/avif" srcSet={quelle.avif} sizes={sizes} />
      <source type="image/webp" srcSet={quelle.webp} sizes={sizes} />
      <img
        className={[styles.bild, className].filter(Boolean).join(" ")}
        src={quelle.fallback}
        alt={alt}
        width={quelle.breite}
        height={quelle.hoehe}
        loading={vorrang ? "eager" : "lazy"}
        fetchPriority={vorrang ? "high" : undefined}
        decoding="async"
        style={{
          backgroundImage: `url("${quelle.lqip}")`,
          ...(uebergang ? { viewTransitionName: uebergang } : {}),
        }}
      />
    </picture>
  );
}
