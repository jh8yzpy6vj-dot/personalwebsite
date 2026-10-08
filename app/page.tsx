import Topbar from "./components/Topbar";
import Bild from "./components/Bild";
import HeroVideo from "./components/HeroVideo";
import styles from "./page.module.css";
import { HERO_ALT, HERO_VIDEO, SITE } from "@/lib/content";
import { HERO_SIZES, ausschnittAus, bild } from "@/lib/bilder";
import { heroVideo } from "@/lib/video";
import { NAV_LEGAL } from "@/lib/nav";

/**
 * Die Startseite: Video in voller Fensterhöhe, mittig „jakob sax".
 * **Nichts darunter, kein Scrollen** (UI-SPEC, „Seitenstruktur").
 *
 * Rückfälle, alle gültig: kein Video → Standbild; weder noch → Fläche
 * `--grund` mit Schriftzug. Das Standbild muss allein tragen — iPhones im
 * Energiesparmodus spielen kein Video automatisch ab.
 *
 * Kein Footer: Impressum und Datenschutz stehen klein unten links im Video.
 * Sie dürfen nicht fehlen (§ 5 DDG: von jeder Seite aus erreichbar).
 */
export default function Home() {
  const standbild = bild("hero/standbild");
  /* Normalfall ist der Bucket; `HERO_VIDEO` ist der Ausnahmeweg für ein
     extern gehostetes Video und hat Vorrang. */
  const film = HERO_VIDEO ?? heroVideo()?.url ?? null;
  const hatMedien = Boolean(film || standbild);

  return (
    <main
      id="inhalt"
      tabIndex={-1}
      className={`${styles.hero}${hatMedien ? " medien-scrim" : ""}`}
    >
      <Topbar startseite />

      {standbild && (
        /* Das Standbild liegt immer darunter: Es ist das größte Element beim
           ersten Aufbau und der Rückfall, wenn das Video nicht läuft. */
        <Bild
          className={styles.medium}
          quelle={standbild}
          alt={HERO_ALT ?? ""}
          sizes={HERO_SIZES}
          ausschnitt={ausschnittAus("hero/standbild")}
          vorrang
        />
      )}
      {film && (
        <HeroVideo
          className={styles.medium}
          src={film}
          poster={standbild?.fallback}
        />
      )}

      <div className={styles.mitte}>
        <h1 className={styles.schriftzug}>{SITE.name}</h1>
      </div>

      <nav className={styles.rechtliches} aria-label="Rechtliches">
        <ul>
          {NAV_LEGAL.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
