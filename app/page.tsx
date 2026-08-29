import Topbar from "./components/Topbar";
import SiteFooter from "./components/SiteFooter";
import styles from "./page.module.css";
import {
  CONTACT,
  HERO_ALT,
  HERO_VIDEO,
  REFERENCES,
  SERVICES,
  SITE,
} from "@/lib/content";
import { latest } from "@/lib/works";
import { bild } from "@/lib/bilder";
import Bild from "./components/Bild";
import Kachelraster from "./components/Kachelraster";
import UeberAnriss from "./components/UeberAnriss";

/**
 * Der Primary CTA. **Genau ein Label, einmal verwendet** — am Ende von
 * `buchbar.`, dem letzten Block vor dem Footer. Ein zweiter gefüllter Knopf
 * wäre eine zweite konkurrierende Aufforderung und verstieße gegen die Regel
 * „einziger gefüllter Button der Seite" in design/UI-SPEC.md.
 *
 * Verb + Nomen, wie der Copywriting Contract es verlangt. Ziel ist bewusst
 * `/kontakt` und nicht `mailto:` — dort ist nach Absicht getrennt
 * (Buchung / vertraulich) und dort steht das Anfrageformular.
 */
const CTA_LABEL = "Anfrage stellen";

/** Wie viele Arbeiten der Materialblock zeigt. Sechs füllen drei Reihen. */
const MATERIAL_ANZAHL = 6;

/**
 * Die Startseite ist eine **Weiche, kein Archiv** (siehe SITE-PLAN.md).
 *
 * Reihenfolge, seit dem Umbau am 2026-08-29:
 * **Hero → wer → was → Angebot.** Wer auf einer Fotografenseite landet, will
 * zuerst sehen, dann wissen, wer das ist, und erst danach, was es kostet.
 * Vorher stand das Angebot direkt hinter dem Hero — die Antwort auf eine
 * Frage, die zu dem Zeitpunkt noch niemand gestellt hat.
 *
 * **Genau eine Naht.** Hero, Porträt und Material sind zusammen die dunkle
 * „sehen"-Hälfte; darunter beginnt einmalig das helle „lesen". Deshalb steht
 * der Kurzanriss über Jakob auf dunklem Grund und nicht auf Papier.
 */
export default function Home() {
  const material = latest(MATERIAL_ANZAHL);
  const heroBild = bild("hero/standbild");

  return (
    <div className={styles.page}>
      <Topbar />

      <main id="inhalt" tabIndex={-1}>
        {/* ── 1. Hero: ein Bild, ein Satz. Eine Behauptung. ───────────── */}
        {/* `medien-scrim` nur, wenn wirklich ein Bild oder Video dahinter
            liegt — über dem Farbverlauf-Platzhalter wäre es ein dunkler
            Streifen ohne Zweck. Erklärung in globals.css. */}
        <section
          className={`${styles.hero}${HERO_VIDEO || heroBild ? " medien-scrim" : ""}`}
          aria-label="Startbild"
        >
          {HERO_VIDEO ? (
            <video
              className={styles.heroMedia}
              src={HERO_VIDEO}
              poster={heroBild?.fallback}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : heroBild ? (
            /* Kein Video, aber ein Standbild: besser als der Farbverlauf.
               Das Hero ist das größte sichtbare Element — deshalb Vorrang. */
            <Bild
              className={styles.heroMedia}
              quelle={heroBild}
              alt={HERO_ALT ?? ""}
              sizes="100vw"
              vorrang
            />
          ) : (
            <div className={styles.heroPlaceholder} aria-hidden="true" />
          )}

          <div className={styles.heroCaption}>
            <h1 className={styles.positioning}>{SITE.positioning}</h1>
            <p className={styles.locations}>
              <span className={styles.locationDot} aria-hidden="true" />
              {SITE.locations}
            </p>
          </div>
        </section>

        {/* ── 2. Wer das ist. Porträt, zwei Sätze, Weiterweg. ─────────── */}
        <UeberAnriss />

        {/* ── 3. Das Material. Der eigentliche Beleg. ─────────────────── */}
        <section className={styles.material} aria-labelledby="material">
          <h2 className={styles.materialTitel} id="material">
            arbeiten.
          </h2>
          <Kachelraster works={material} />
          <p className={styles.moreRow}>
            <a className={styles.more} href="/arbeiten">
              → alle Arbeiten
            </a>
          </p>
        </section>

        {/* `id="lesen"` ist kein Ankerziel, sondern der Beobachtungspunkt
            der Topbar — sie wechselt daran auf die helle Variante. Ohne die
            id bliebe die weiße Wortmarke über Papier unlesbar. */}
        <div className={styles.light} id="lesen">
          {/* ── 4. Vertrauen, bewusst knapp. ──────────────────────────── */}
          <section className={styles.section} id="vertrauen">
            <h2 className={styles.sectionTitle}>schon fotografiert für.</h2>
            <p className={styles.referenceLine}>{REFERENCES.join(" · ")}</p>
            {/* Bewusst **kein** Fließtext mehr an dieser Stelle. Hier stand
                bisher wörtlich derselbe Absatz wie auf `/ueber` — eine
                Dopplung, die beim Review auffiel und bei jeder Textänderung
                auseinanderläuft. Der Absatz steht jetzt einmal, im Anriss
                oben. Hier bleibt die Referenzzeile und der Weg dorthin. */}
            <p className={styles.trustNote}>
              <a href="/ueber">→ mehr über mich</a>
            </p>
          </section>

          {/* ── 5. buchbar.: der letzte Block vor dem Footer. ─────────── */}
          <section className={styles.section} id="buchbar">
            <h2 className={styles.sectionTitle}>buchbar.</h2>
            <div className={styles.doors}>
              {SERVICES.map((service) => (
                <article key={service.id} className={`${styles.door} aufsteigen`}>
                  {/* Der Titel ist der Link — die Tür führt jetzt wirklich
                      irgendwohin. Vorher waren die drei Angebote nur Text
                      ohne eigene URL. */}
                  <h3 className={styles.doorTitle}>
                    <a
                      className={styles.doorLink}
                      href={`/leistungen/${service.id}`}
                    >
                      {service.title}
                    </a>
                  </h3>
                  <p className={styles.doorAudience}>{service.audience}</p>
                  <p className={styles.doorText}>{service.description}</p>
                  <ul className={styles.doorFacts}>
                    {service.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            {/* Der Preisanker gehört hierher, sobald er feststeht — er
                beantwortet die Frage, die ein Kulturamt zuerst hat, und
                halbiert die unpassenden Anfragen. Siehe TODO.md. */}
            <p className={styles.contactNote}>{CONTACT.booking.note}</p>
            <p className={styles.ctaRow}>
              <a className={styles.cta} href="/kontakt">
                {CTA_LABEL}
              </a>
            </p>
          </section>
        </div>
      </main>

      <div className={styles.light}>
        <SiteFooter />
      </div>
    </div>
  );
}
