import Topbar from "./components/Topbar";
import SiteFooter from "./components/SiteFooter";
import Bild from "./components/Bild";
import HeroVideo from "./components/HeroVideo";
import UeberAnriss from "./components/UeberAnriss";
import styles from "./page.module.css";
import {
  HERO_ALT,
  HERO_ART,
  HERO_ERSATZ,
  HERO_VIDEO,
  HIGHLIGHTS,
  SITE,
  WEGE,
} from "@/lib/content";
import { ausschnittAus, bild, heroSizes } from "@/lib/bilder";
import { heroVideo } from "@/lib/video";
import { filmeMitStandbild, fotosFuerMosaik } from "@/lib/arbeiten";

/**
 * Die Startseite. Seit dem 2026-10-10 wieder eine scrollende Seite (Jans
 * Entscheidung, UI-SPEC „Startseite"):
 *
 * **Hero → Über-mich-Anriss → Wege (foto, film) → Highlights → Footer.**
 *
 * Hero und Anriss sind der Stand von vor dem Umbau. Die reine Videoseite davor
 * hatte unter dem Schriftzug nichts — wer nicht wusste, wohin, kam nicht
 * weiter.
 *
 * Hero-Rückfälle, alle gültig: Video → Standbild → ein Foto aus `/foto`
 * (`HERO_ERSATZ`) → Verlauf. Das Standbild muss allein tragen — iPhones im
 * Energiesparmodus spielen kein Video automatisch ab.
 *
 * Seit dem 2026-10-23 wählt Jakob in der Verwaltung, ob oben **Foto oder
 * Video** steht (`HERO_ART`). Bei „Foto" läuft kein Video, auch wenn eins
 * im Bucket liegt. Bei „Video" steht unter dem Video dessen erstes Bild
 * (`hero/film` im Bild-Manifest, von der Medien-Action erzeugt) — es
 * gleicht dem ersten Bild der Schleife, das Anlaufen springt also nicht.
 */
export default function Home() {
  const fotos = fotosFuerMosaik();
  const finde = (schluessel: string | null) =>
    schluessel ? (fotos.find((b) => b.schluessel === schluessel) ?? null) : null;

  /* Normalfall ist der Bucket; `HERO_VIDEO` ist der Ausnahmeweg für ein
     extern gehostetes Video und hat Vorrang. Bei „Foto" gar keins. */
  const ausDemBucket = HERO_ART === "video" && !HERO_VIDEO ? heroVideo() : null;
  const film = HERO_ART === "video" ? (HERO_VIDEO ?? ausDemBucket?.url ?? null) : null;
  /* Das erste Bild des Videos — nur zu dem Video, aus dem es stammt. Dieselbe
     Regel wie `videoObenZuSehen` in der Prüfung. */
  const anfang = ausDemBucket ? bild("hero/film") : null;
  const standbild = anfang ?? bild("hero/standbild");
  const standbildSchluessel = anfang ? "hero/film" : "hero/standbild";
  /* Ohne eigenes Standbild trägt ein Foto aus `/foto` — mit seinem Alt-Text,
     denn anders als das Hero-Standbild ist es Inhalt, keine Dekoration. */
  const ersatz = standbild ? null : finde(HERO_ERSATZ);
  const hatMedien = Boolean(film || standbild || ersatz);

  const fotoWeg = finde(WEGE.foto);
  const ersterFilm = filmeMitStandbild()[0] ?? null;
  const filmWeg = ersterFilm
    ? { quelle: ersterFilm.standbild, ausschnitt: ersterFilm.ausschnitt }
    : (finde(WEGE.film) ?? null);

  const highlights = HIGHLIGHTS.map((schluessel) => finde(schluessel));

  return (
    <div className={styles.seite}>
      <Topbar startseite />

      <main id="inhalt" tabIndex={-1} className={styles.inhalt}>
        {/* ── 1. Hero ─────────────────────────────────────────────── */}
        <section
          className={`${styles.hero}${hatMedien ? " medien-scrim" : ""}`}
          aria-labelledby="positionierung"
        >
          {standbild ? (
            <Bild
              className={styles.heroMedium}
              quelle={standbild}
              alt={HERO_ALT ?? ""}
              sizes={heroSizes(standbild, "start")}
              ausschnitt={ausschnittAus(standbildSchluessel)}
              vorrang
            />
          ) : ersatz ? (
            <Bild
              className={styles.heroMedium}
              quelle={ersatz.quelle}
              alt={ersatz.alt}
              sizes={heroSizes(ersatz.quelle, "start")}
              ausschnitt={ersatz.ausschnitt}
              vorrang
            />
          ) : (
            <div className={styles.heroPlatzhalter} aria-hidden="true" />
          )}
          {film && (
            <HeroVideo
              className={styles.heroMedium}
              src={film}
              poster={(standbild ?? ersatz?.quelle)?.fallback}
            />
          )}

          <div className={styles.heroText}>
            <h1 className={styles.positionierung} id="positionierung">
              {SITE.positioning}
            </h1>
            <p className={styles.orte}>
              <span className={styles.ortePunkt} aria-hidden="true" />
              {SITE.locations}
            </p>
          </div>
        </section>

        {/* ── 2. Wer das ist ──────────────────────────────────────── */}
        <UeberAnriss />

        {/* ── 3. Wege zu foto und film ────────────────────────────── */}
        <nav className={styles.wege} aria-label="Bereiche">
          <a className={styles.weg} href="/foto">
            {fotoWeg ? (
              <Bild
                className={styles.wegBild}
                quelle={fotoWeg.quelle}
                alt=""
                sizes="(max-width: 700px) 92vw, 50vw"
                ausschnitt={fotoWeg.ausschnitt}
              />
            ) : (
              <span className={styles.wegLeer} aria-hidden="true" />
            )}
            <span className={styles.wegBeschriftung}>
              <span className={styles.wegLabel}>foto</span>
              <span className="nur-vorlesen">, alle Fotos</span>
              <span className={styles.wegPfeil} aria-hidden="true">
                →
              </span>
            </span>
          </a>

          <a className={styles.weg} href="/film">
            {filmWeg ? (
              <Bild
                className={styles.wegBild}
                quelle={filmWeg.quelle}
                alt=""
                sizes="(max-width: 700px) 92vw, 50vw"
                ausschnitt={filmWeg.ausschnitt}
              />
            ) : (
              /* Noch kein Film mit Standbild: eine dunkle Fläche mit ▶ —
                 sagt „Film", ohne ein Foto als Film auszugeben. */
              <span className={styles.wegLeer} aria-hidden="true">
                <svg className={styles.wegPlay} viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="31" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M26 20 L46 32 L26 44 Z" fill="currentColor" />
                </svg>
              </span>
            )}
            <span className={styles.wegBeschriftung}>
              <span className={styles.wegLabel}>film</span>
              <span className="nur-vorlesen">, alle Filme</span>
              <span className={styles.wegPfeil} aria-hidden="true">
                →
              </span>
            </span>
          </a>
        </nav>

        {/* ── 4. Highlights ───────────────────────────────────────── */}
        <section className={styles.highlights} aria-labelledby="highlights">
          <h2 className={styles.titel} id="highlights">
            highlights.
          </h2>
          <ul className={styles.highlightListe}>
            {highlights.map((foto, i) => (
              <li key={HIGHLIGHTS[i] ?? `platz-${i}`}>
                {foto ? (
                  <a className={styles.highlight} href="/foto">
                    <Bild
                      className={styles.highlightBild}
                      quelle={foto.quelle}
                      alt={foto.alt}
                      sizes="(max-width: 900px) 46vw, 25vw"
                      ausschnitt={foto.ausschnitt}
                    />
                    <span className={styles.highlightZeile} aria-hidden="true">
                      {foto.beschriftung}
                    </span>
                  </a>
                ) : (
                  <div className={styles.highlightPlatzhalter}>
                    <span className={styles.platzhalterPunkt} aria-hidden="true" />
                    Highlight folgt
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
