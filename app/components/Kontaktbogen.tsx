import { zeitpunkt, type Serienbild } from "@/lib/bilder";
import Bild from "./Bild";
import styles from "./Kontaktbogen.module.css";

type Props = {
  bilder: Serienbild[];
  titel: string;
};

/**
 * Der Kontaktbogen: alle Frames einer Aufnahmeserie nebeneinander, der
 * gewählte rot gerahmt.
 *
 * **Warum das kein Effekt ist, sondern ein Beleg.** Die Copy behauptet an
 * mehreren Stellen dasselbe: „Ein Moment auf dem Hochseil passiert genau
 * einmal", und im `über.`-Text „antizipieren, warten, im richtigen Moment
 * auslösen". Der Kontaktbogen behauptet es nicht — er zeigt es. Vier Frames
 * daneben, einer sitzt. Damit fällt er unter die Tonalitätsregel
 * *konkrete Nennungen statt Eigenschaftswörter* und nicht unter Dekoration.
 *
 * **Die Aufnahmezeiten sind die Pointe.** Stehen unter den Frames
 * `22:14:03 · 22:14:04 · 22:14:04 · 22:14:05`, dann steht dort schwarz auf
 * weiß, dass zwischen „daneben" und „getroffen" eine Sekunde lag. Das ist
 * derselbe Datenpfad wie die Aufnahmezeile unter dem Leitbild — hier
 * allerdings **mit Sekunden**, weil ohne sie alle Frames dieselbe Uhrzeit
 * trügen und die Aussage verpuffen würde.
 *
 * Bewusst **statisch statt Hover-Animation** (der ursprünglich geplante
 * „Burst"): Ein Beleg, den man erst durch eine Geste hervorholen muss, ist
 * für die meisten Besucher nicht vorhanden — und auf dem Telefon gibt es
 * kein Hover. Außerdem braucht es so keine Ausnahme von der Motion-Regel.
 */
export default function Kontaktbogen({ bilder, titel }: Props) {
  if (bilder.length === 0) return null;

  const gewaehlt = bilder.filter((b) => b.gewaehlt).length;

  return (
    <section className={styles.bogen} aria-labelledby="serie-titel">
      <h2 className={styles.titel} id="serie-titel">
        {/* Kleingeschrieben wie alle Abschnittstitel der Seite. */}
        dieselbe sekunde.
      </h2>

      <ol className={styles.reihe}>
        {bilder.map(({ schluessel, quelle, gewaehlt: istGewaehlt }, i) => {
          const zeit = zeitpunkt(quelle.exif, true);
          return (
            <li
              key={schluessel}
              className={`${styles.frame} ${istGewaehlt ? styles.frameGewaehlt : ""}`}
            >
              <Bild
                className={styles.bild}
                quelle={quelle}
                alt={
                  istGewaehlt
                    ? `${titel}, der gewählte Frame der Serie`
                    : `${titel}, Frame ${i + 1} derselben Serie`
                }
                sizes="(max-width: 700px) 40vw, 220px"
              />
              {zeit && <p className={styles.zeit}>{zeit}</p>}
            </li>
          );
        })}
      </ol>

      {/*
       * Die Zeile darunter sagt, was zu sehen ist. Ohne sie ist ein
       * Kontaktbogen für Leute außerhalb der Fotografie einfach eine Reihe
       * ähnlicher Bilder.
       */}
      <p className={styles.erklaerung}>
        {bilder.length} bilder.{" "}
        {gewaehlt === 1 ? "eins zählt." : "der rest ist danebengegangen."}
      </p>
    </section>
  );
}
