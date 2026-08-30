import type { Videoquelle } from "@/lib/video";
import type { Bildquelle } from "@/lib/bilder";
import styles from "./Film.module.css";

type Props = {
  quelle: Videoquelle;
  /** Was zu sehen ist — steht als Beschriftung unter dem Bild. */
  titel: string;
  /** Standbild als Vorschau, solange nichts abgespielt wird. */
  standbild?: Bildquelle | null;
};

/**
 * Ein Film zu einer Arbeit — der Aftermovie, nicht das Hero.
 *
 * Drei Entscheidungen, die hier bewusst so stehen:
 *
 * - **`controls`, kein Autoplay.** Ein Film mit Ton, der von selbst losläuft,
 *   ist auf einer Portfolioseite eine Zumutung — und in jedem Browser ohnehin
 *   nur stumm erlaubt. Wer ihn sehen will, drückt.
 * - **`preload="metadata"`.** Ohne das lädt Safari das ganze Video, sobald die
 *   Seite steht, auch wenn niemand es anfasst. Mit `metadata` kommen nur
 *   Länge und Maße — genug, damit der Abspieler nicht springt.
 * - **`poster` aus dem Leitbild.** Der Browser zeigt sonst je nach Hersteller
 *   ein schwarzes Feld oder den ersten Frame, und der erste Frame eines
 *   Aftermovies ist meistens Schwarzblende.
 *
 * ⚠️ **Ohne Untertitel.** Ein `<track>` wäre hier richtig, es gibt aber keine
 * Untertiteldatei — und eine leere Spur ist schlechter als keine, weil sie
 * Barrierefreiheit vortäuscht. Sobald eine `.vtt` vorliegt, gehört sie hier
 * hinein; der Punkt steht in TODO.md.
 */
export default function Film({ quelle, titel, standbild }: Props) {
  return (
    <figure className={styles.rahmen}>
      <video
        className={styles.video}
        controls
        preload="metadata"
        playsInline
        poster={standbild?.fallback}
      >
        <source src={quelle.url} type={quelle.typ} />
        {/* Kein Browser seit 2015 landet hier — aber ein leeres Element wäre
            für jemanden mit abgeschaltetem Video eine Sackgasse. */}
        <a href={quelle.url}>Film herunterladen</a>
      </video>
      <figcaption className={styles.bildunterschrift}>
        Film · {titel}
      </figcaption>
    </figure>
  );
}
