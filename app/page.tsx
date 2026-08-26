import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <header className={styles.header}>
        <span className={styles.headerName}>Jakob Sax</span>
        <nav className={styles.nav}>
          <a href="#ueber-mich">Über mich</a>
          <a href="#kontakt">Kontakt</a>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.section} id="hero">
          <h1 className={styles.heroName}>Jakob Sax</h1>
          <div className={styles.role}>Platzhalter-Rolle / Tagline</div>
          <p className={styles.bio}>
            Das ist eine Testseite auf Next.js, um zu sehen, ob Deployment und
            Bearbeitung dieses Repos funktionieren. Inhalt, Design und
            Struktur werden als nächstes gemeinsam festgelegt (siehe
            SITE-PLAN.md).
          </p>
        </section>

        <section className={styles.section} id="ueber-mich">
          <h2 className={styles.sectionTitle}>Über mich</h2>
          <p className={styles.bio}>
            Hier kommt später ein echter Bio-Text hin.
          </p>
        </section>

        <section className={styles.section} id="kontakt">
          <h2 className={styles.sectionTitle}>Kontakt</h2>
          <p className={styles.bio}>Erreichbar über:</p>
          <div className={styles.links}>
            <a href="mailto:hallo@example.com">E-Mail</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>jakobsax.de</footer>
    </>
  );
}
