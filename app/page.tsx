import Topbar from "./components/Topbar";
import Works from "./components/Works";
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

export default function Home() {
  return (
    <>
      <Topbar />

      <main>
        {/* ── dunkel: sehen ─────────────────────────────────────────── */}
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

        <Works />

        {/* ── hell: lesen ───────────────────────────────────────────── */}
        <div className={styles.light} id="lesen">
          <section className={styles.section} id="buchbar">
            <h2 className={styles.sectionTitle}>buchbar.</h2>
            <div className={styles.services}>
              {SERVICES.map((service) => (
                <article key={service.id} className={styles.service}>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceAudience}>{service.audience}</p>
                  <p className={styles.serviceText}>{service.description}</p>
                  <ul className={styles.serviceFacts}>
                    {service.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className={styles.ctaRow}>
              <a
                className={styles.cta}
                href={`mailto:${CONTACT.booking.email}`}
              >
                {CONTACT.booking.cta}
              </a>
            </p>
          </section>

          <section className={styles.section} id="referenzen">
            <h2 className={styles.sectionTitle}>schon fotografiert für.</h2>
            <p className={styles.referenceLine}>{REFERENCES.join(" · ")}</p>
          </section>

          <section className={styles.section} id="ueber">
            <h2 className={styles.sectionTitle}>über.</h2>
            <div className={styles.prose}>
              {ABOUT.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className={styles.authorLink}>
              <a href={ABOUT.authorPageUrl} rel="noreferrer">
                → {ABOUT.authorPageLabel}
              </a>
            </p>
          </section>

          <section className={styles.section} id="kontakt">
            <h2 className={styles.sectionTitle}>kontakt.</h2>
            <div className={styles.contact}>
              <div>
                <h3 className={styles.contactHeading}>
                  {CONTACT.booking.heading}
                </h3>
                <p className={styles.contactNote}>{CONTACT.booking.note}</p>
                <p className={styles.ctaRow}>
                  <a
                    className={styles.cta}
                    href={`mailto:${CONTACT.booking.email}`}
                  >
                    {CONTACT.booking.cta}
                  </a>
                </p>
                <p className={styles.contactValue}>{CONTACT.booking.email}</p>
              </div>

              <div>
                <h3 className={styles.contactHeading}>
                  {CONTACT.confidential.heading}
                </h3>
                <p className={styles.contactNote}>{CONTACT.confidential.note}</p>
                <ul className={styles.channels}>
                  {CONTACT.confidential.channels.map((channel) => (
                    <li key={channel}>{channel}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <span>Impressum · Datenschutz</span>
            <a href={CONTACT.instagram.url} rel="noreferrer">
              {CONTACT.instagram.label}
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
