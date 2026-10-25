"use client";

import { impressumVon, type Impressum as Angaben } from "@/lib/inhalt";
import { FELDNAMEN, setzeImpressum } from "@/lib/admin/werkzeuge";
import { useSitzung } from "./kontext";
import { Textfeld } from "./teile";
import styles from "./verwaltung.module.css";

/**
 * **Reiter Impressum** (seit 2026-10-25) — die Angaben auf `/impressum` und
 * oben in der Datenschutzerklärung (`inhalt.impressum`, gelesen in
 * `lib/legal.ts`). Die Rechtstexte selbst bleiben im Code.
 *
 * Pflicht nach § 5 DDG sind Name, ladungsfähige Anschrift und E-Mail — leer
 * lässt die Prüfung nicht speichern. Freiwilliges leer heißt: Der Abschnitt
 * erscheint gar nicht.
 */
export default function Impressum() {
  const { inhalt, aendere } = useSitzung();
  const m = impressumVon(inhalt);
  const setze = (feld: keyof Angaben) => (w: string) => aendere((i) => setzeImpressum(i, feld, w));

  return (
    <>
      <section className={styles.abschnitt} aria-labelledby="impressum-pflicht">
        <h2 id="impressum-pflicht" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Pflichtangaben
        </h2>
        <p className={`${styles.leise} ${styles.unterTitel}`}>
          Stehen auf /impressum und oben in der Datenschutzerklärung. Die Anschrift muss eine sein, unter der dich Post
          erreicht — ein Postfach genügt nicht. Sie ist damit öffentlich auffindbar.
        </p>
        <div className={styles.formular}>
          <Textfeld bezeichnung={FELDNAMEN.impName} wert={m.name} beiAenderung={setze("name")} />
          <Textfeld bezeichnung={FELDNAMEN.impStrasse} wert={m.strasse} beiAenderung={setze("strasse")} />
          <Textfeld bezeichnung={FELDNAMEN.impPlzOrt} wert={m.plzOrt} beiAenderung={setze("plzOrt")} />
          <Textfeld bezeichnung={FELDNAMEN.impLand} wert={m.land} beiAenderung={setze("land")} />
          <Textfeld bezeichnung={FELDNAMEN.impEmail} typ="email" wert={m.email} beiAenderung={setze("email")} />
        </div>
      </section>

      <section className={styles.abschnitt} aria-labelledby="impressum-frei">
        <h2 id="impressum-frei" className={`${styles.abschnittTitel} ${styles.unterTitel}`}>
          Nur falls zutreffend
        </h2>
        <div className={styles.formular}>
          <Textfeld
            bezeichnung={FELDNAMEN.impTelefon}
            wert={m.telefon ?? ""}
            beiAenderung={setze("telefon")}
            hinweis="Freiwillig. Leer heißt: keine Telefonnummer im Impressum."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.impUstId}
            wert={m.ustId ?? ""}
            platzhalter="DE123456789"
            beiAenderung={setze("ustId")}
            hinweis="Nur, wenn du eine hast: „DE“ und neun Ziffern. Nie die normale Steuernummer eintragen."
          />
          <Textfeld
            bezeichnung={FELDNAMEN.impMstv}
            mehrzeilig
            wert={m.mstv ?? ""}
            beiAenderung={setze("mstv")}
            hinweis="Name und Anschrift — nur, wenn die Seite eigene journalistische Beiträge veröffentlicht. Für ein Portfolio in der Regel leer."
          />
        </div>
      </section>
    </>
  );
}
