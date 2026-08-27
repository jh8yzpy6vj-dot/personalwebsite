import Topbar from "./components/Topbar";
import SiteFooter from "./components/SiteFooter";
import styles from "./page.module.css";
import {
  ABOUT,
  CONTACT,
  HERO_POSTER,
  HERO_VIDEO,
  REFERENCES,
  SERVICES,
  SITE,
} from "@/lib/content";
import { latest, metaLine } from "@/lib/works";

/**
 * Der Primary CTA. **Genau ein Label, zweimal verwendet** — am Ende von
 * `buchbar.` und unter `kontakt.` Zwei verschieden beschriftete rote Knöpfe
 * wären zwei konkurrierende Aufforderungen und verstießen gegen die Regel
 * „einziger gefüllter Button der Seite" in design/UI-SPEC.md.
 *
 * Verb + Nomen, wie der Copywriting Contract es verlangt. Ziel ist
 * `/kontakt`, nicht `mailto:` — die Adresse in content.ts ist erfunden.
 */
const CTA_LABEL = "Anfrage stellen";

/**
 * Die Startseite ist eine **Weiche, kein Archiv** (siehe SITE-PLAN.md).
 * Jeder Block hat genau einen Job, und sie soll in unter einer Minute
 * lesbar sein. Das Archiv liegt unter `/arbeiten`.
 *
 * Reihenfolge und Naht: Der Hero ist dunkel („sehen"), alles darunter hell
 * („lesen"). Genau ein Wechsel — die harte Naht ist das Strukturelement und
 * wird nicht dekoriert.
 */
export default function Home() {
  const zuletzt = latest(4);

  return (
    <div className={styles.page}>
      <Topbar />

      <main>
        {/* ── 1. Hero: ein Bild, ein Satz. Eine Behauptung. ───────────── */}
        <section className={styles.hero} aria-label="Startbild">
          {HERO_VIDEO ? (
            <video
              className={styles.heroMedia}
              src={HERO_VIDEO}
              poster={HERO_POSTER ?? undefined}
              autoPlay
              loop
              muted
              playsInline
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

        {/* `id="lesen"` ist kein Ankerziel, sondern der Beobachtungspunkt
            der Topbar — sie wechselt daran auf die helle Variante. Ohne die
            id bliebe die weiße Wortmarke über Papier unlesbar. */}
        <div className={styles.light} id="lesen">
          {/* ── 2. Drei Türen: der wichtigste Block der Seite. ────────── */}
          <section className={styles.section} id="buchbar">
            <h2 className={styles.sectionTitle}>buchbar.</h2>
            <div className={styles.doors}>
              {SERVICES.map((service) => (
                <article key={service.id} className={styles.door}>
                  <h3 className={styles.doorTitle}>{service.title}</h3>
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
            <p className={styles.ctaRow}>
              <a className={styles.cta} href="/kontakt">
                {CTA_LABEL}
              </a>
            </p>
          </section>

          {/* ── 3. zuletzt.: das Aktualitätssignal. ───────────────────── */}
          <section className={styles.section} id="zuletzt">
            <h2 className={styles.sectionTitle}>zuletzt.</h2>
            <ul className={styles.recent}>
              {zuletzt.map((work) => (
                <li key={work.id}>
                  <a className={styles.recentLink} href={`/arbeiten/${work.id}`}>
                    <span className={styles.recentClient}>{work.client}</span>
                    <span className={styles.recentTitle}>{work.title}</span>
                    <span className={styles.recentMeta}>{metaLine(work)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.moreRow}>
              <a className={styles.more} href="/arbeiten">
                → alle Arbeiten
              </a>
            </p>
          </section>

          {/* ── 4. Vertrauen, bewusst knapp. ──────────────────────────── */}
          <section className={styles.section} id="vertrauen">
            <h2 className={styles.sectionTitle}>schon fotografiert für.</h2>
            <p className={styles.referenceLine}>{REFERENCES.join(" · ")}</p>
            <p className={styles.trustNote}>
              {ABOUT.paragraphs[0]}{" "}
              <a href="/ueber">mehr über mich</a>
            </p>
          </section>

          {/* ── 5. Kontakt: Einstieg, Details auf /kontakt. ───────────── */}
          <section className={styles.section} id="kontakt">
            <h2 className={styles.sectionTitle}>kontakt.</h2>
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
