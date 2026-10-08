import Topbar from "./components/Topbar";
import Bild from "./components/Bild";
import HeroVideo from "./components/HeroVideo";
import styles from "./page.module.css";
import { HERO_ALT, HERO_ERSATZ, HERO_VIDEO, SITE } from "@/lib/content";
import { HERO_SIZES, ausschnittAus, bild } from "@/lib/bilder";
import { heroVideo } from "@/lib/video";
import { NAV_LEGAL } from "@/lib/nav";
import { fotosFuerMosaik } from "@/lib/arbeiten";

/**
 * Die Startseite: Video in voller Fensterhöhe, mittig „jakob sax".
 * **Nichts darunter, kein Scrollen** (UI-SPEC, „Seitenstruktur").
 *
 * Rückfälle, alle gültig: kein Video → Standbild; kein Standbild → ein Foto
 * aus `/foto` (`HERO_ERSATZ`); gar nichts → Fläche `--grund` mit Schriftzug.
 * Das Standbild muss allein tragen — iPhones im Energiesparmodus spielen kein
 * Video automatisch ab.
 *
 * Kein Footer: Impressum und Datenschutz stehen klein unten links im Video.
 * Sie dürfen nicht fehlen (§ 5 DDG: von jeder Seite aus erreichbar).
 */
export default function Home() {
  const standbild = bild("hero/standbild");
  /* Ohne eigenes Standbild trägt ein Foto aus `/foto` — mit seinem Alt-Text,
     denn anders als das Hero-Standbild ist es Inhalt, keine Dekoration. */
  const ersatz = standbild
    ? null
    : (fotosFuerMosaik().find((b) => b.schluessel === HERO_ERSATZ) ?? null);
  /* Normalfall ist der Bucket; `HERO_VIDEO` ist der Ausnahmeweg für ein
     extern gehostetes Video und hat Vorrang. */
  const film = HERO_VIDEO ?? heroVideo()?.url ?? null;
  const hatMedien = Boolean(film || standbild || ersatz);

  return (
    <main
      id="inhalt"
      tabIndex={-1}
      className={`${styles.hero}${hatMedien ? " medien-scrim" : ""}`}
    >
      <Topbar startseite />

      {standbild ? (
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
      ) : (
        ersatz && (
          <Bild
            className={styles.medium}
            quelle={ersatz.quelle}
            alt={ersatz.alt}
            sizes={HERO_SIZES}
            ausschnitt={ersatz.ausschnitt}
            vorrang
          />
        )
      )}
      {film && (
        <HeroVideo
          className={styles.medium}
          src={film}
          poster={(standbild ?? ersatz?.quelle)?.fallback}
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
