import { FLANKEN_SIZES, type Streckenbild, streckenZeile } from "@/lib/bilder";
import Bild from "./Bild";
import styles from "./Flanken.module.css";

type Props = {
  bilder: Streckenbild[];
  titel: string;
};

/**
 * Die Bilder einer Arbeit **links und rechts neben dem Text**.
 *
 * ⚠️ **Ersetzt den waagerechten Filmstreifen** (`Bildstrecke.tsx`, bis zum
 * 2026-09-13). Der sperrte jedes Foto in 460px Höhe und war für ein
 * Fotografen-Portfolio die falsche Reihenfolge — Jan: „der Slider ist gottlos
 * beschissen". Ein Bild neben dem Text ist außerdem ein **Beleg** zu dem, was
 * dort steht; im Streifen war es Dekoration am Rand.
 *
 * Die Komponente rendert nur die beiden Spalten. Der Text dazwischen kommt
 * von der Seite, weil er dort auch hingehört: Das Raster gehört zum Layout
 * der Detailseite, nicht zu den Bildern.
 *
 * ⚠️ **Grenze, die im UI-SPEC steht und hier wiederholt gehört:** Das
 * Konzept hängt an der Textlänge. Viele Bilder plus kurzer Text lassen die
 * Flanken unter den Text hinauslaufen, und die Mitte wird zur leeren Rinne.
 * Solange `content.ts` keine Beschreibungen hat, ist das der Normalfall —
 * kein Fehler im Code, sondern eine offene Inhaltsfrage.
 */
export default function Flanken({ bilder, titel }: Props) {
  if (bilder.length === 0) return null;

  /*
   * Abwechselnd verteilt, nicht erste Hälfte / zweite Hälfte: So steht die
   * zeitliche Reihenfolge der Aufnahmen im Zickzack untereinander statt in
   * zwei getrennten Blöcken, und beide Spalten sind auch bei ungerader
   * Anzahl etwa gleich lang.
   */
  const mitIndex = bilder.map((bild, index) => ({ bild, index }));
  const links = mitIndex.filter(({ index }) => index % 2 === 0);
  const rechts = mitIndex.filter(({ index }) => index % 2 === 1);

  const karte = ({ bild, index }: { bild: Streckenbild; index: number }) => (
    <Karte
      key={bild.schluessel}
      bild={bild}
      titel={titel}
      nummer={index + 1}
      gesamt={bilder.length}
    />
  );

  /*
   * ⚠️ Die Spalten stehen im Markup **beide vor** dem Text — die Seite kann
   * sie nicht dazwischenschieben, weil sie aus einer Komponente kommen. Ihre
   * Position im Raster steht deshalb ausdrücklich im CSS (`grid-column`) und
   * nicht in der Reihenfolge der Elemente. Ohne das landete der Text in der
   * rechten Spalte und die rechte Flanke in der Mitte: beim Messen gegen den
   * echten Server aufgefallen, 551px breite „Flanken" statt 340.
   */
  return (
    <>
      <div className={styles.spalte}>{links.map(karte)}</div>
      <div className={`${styles.spalte} ${styles.rechts}`}>{rechts.map(karte)}</div>
    </>
  );
}

function Karte({
  bild,
  titel,
  nummer,
  gesamt,
}: {
  bild: Streckenbild;
  titel: string;
  nummer: number;
  gesamt: number;
}) {
  const zeile = streckenZeile(bild.quelle.exif);
  return (
    <figure
      className={styles.karte}
      /*
       * ⚠️ **Nur auf dem Telefon wirksam, dort aber entscheidend.** Die
       * Spalten sind mobil `display: contents`; die Karten werden damit
       * selbst zu Rasterzellen und lägen sonst in der Reihenfolge
       * 1, 3, 5, …, 2, 4, 6 untereinander — die Aufnahmen einer Serie also
       * durcheinander. `order` stellt die echte Reihenfolge wieder her.
       * Am Desktop ändert es nichts: Innerhalb einer Spalte steigt der Wert
       * ohnehin monoton.
       */
      style={{ order: nummer }}
    >
      {/*
        Der Rahmen ist ein eigenes Element über dem Bild: Er hebt sich beim
        Überfahren, das Bild zoomt **in** ihm. Zwei getrennte Bewegungen —
        würde der ganze Rahmen skaliert, skalierte die Bildunterschrift mit
        und würde unscharf.
      */}
      <span className={styles.rahmen}>
        <Bild
          className={styles.bild}
          quelle={bild.quelle}
          alt={`${titel}, Bild ${nummer} von ${gesamt}`}
          sizes={FLANKEN_SIZES}
        />
      </span>
      {/* Nur Uhrzeit und ISO: In einer Serie ist der Unterschied zwischen den
          Bildern die Information, Blende und Belichtungszeit stehen überall
          gleich. */}
      {zeile && <figcaption className={styles.zeile}>{zeile}</figcaption>}
    </figure>
  );
}
