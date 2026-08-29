/**
 * Die Vorschaukarte, die erscheint, wenn jemand einen Link teilt — als
 * Elementbaum aus einfachen Objekten.
 *
 * **Warum keine JSX-Datei:** Diese Karte wird von einem Node-Skript
 * gerendert (`scripts/og.mjs`), nicht von Next. Ein Skript kann kein JSX
 * lesen. `ImageResponse` nimmt denselben Baum auch als `{ type, props }`
 * entgegen — das ist genau das, wozu JSX ohnehin übersetzt wird.
 *
 * ⚠️ Satori — die Bibliothek dahinter — kennt **nur Flexbox**. Kein
 * `display: block`, kein Fließtext, keine geerbten Schriftgrößen. Jedes
 * Element trägt seine Angaben ausgeschrieben; was hier nach Umständlichkeit
 * aussieht, ist die Bedingung dafür, dass überhaupt etwas gerendert wird.
 */

export const OG_GROESSE = { width: 1200, height: 630 };

/** Dieselben Werte wie in app/globals.css — Satori kennt keine CSS-Variablen. */
const FARBE = {
  buehne: "#0e0e10",
  papier: "#f4f3ef",
  rec: "#e11b1b",
  recText: "#ee3b3b",
  stein: "#d9d5cc",
};

const el = (type, style, children) => ({ type, props: { style, children } });

/**
 * @param {object} o
 * @param {string} o.marke      Wortmarke oben links.
 * @param {string} [o.ueber]    Kleine rote Zeile über dem Titel (Auftraggeber).
 * @param {string} o.titel
 * @param {string} [o.unter]    Metazeile darunter.
 * @param {string|null} o.foto  Datei-URI des Fotos, oder `null`.
 */
export function ogKarte({ marke, ueber, titel, unter, foto }) {
  const schichten = [];

  if (foto) {
    schichten.push({
      type: "img",
      props: {
        src: foto,
        width: OG_GROESSE.width,
        height: OG_GROESSE.height,
        style: { position: "absolute", top: 0, left: 0, objectFit: "cover" },
      },
    });

    /*
     * Derselbe Gedanke wie über den Kacheln: Weiße und rote Schrift über
     * einem hellen Foto ist sonst nicht lesbar (siehe „Text über Fotos" in
     * design/UI-SPEC.md). Deckend, wo der Text steht, nach rechts offen,
     * damit das Motiv sichtbar bleibt.
     *
     * ⚠️ `backgroundImage`, nicht die Kurzform `background`: Satori wertet
     * Verläufe nur über die Langform aus. Mit der Kurzform blieb die Fläche
     * unsichtbar und der Text lag ungeschützt auf dem Foto.
     */
    schichten.push(
      el("div", {
        position: "absolute",
        top: 0,
        left: 0,
        width: OG_GROESSE.width,
        height: OG_GROESSE.height,
        display: "flex",
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.86) 55%, rgba(0,0,0,0.35) 100%)",
      }),
    );
  }

  const kopf = el(
    "div",
    { display: "flex", alignItems: "center", gap: 20 },
    [
      el("div", { display: "flex", fontFamily: "Display", fontSize: 44, color: FARBE.papier }, marke),
      el(
        "div",
        {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 14px",
          backgroundColor: FARBE.rec,
          fontFamily: "Mono",
          fontSize: 22,
          letterSpacing: 2,
          color: "#ffffff",
        },
        [
          el("div", {
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#ffffff",
          }),
          "REC",
        ],
      ),
    ],
  );

  const fuss = el(
    "div",
    { display: "flex", flexDirection: "column", gap: 14, maxWidth: 900 },
    [
      ueber
        ? el(
            "div",
            {
              display: "flex",
              fontFamily: "Mono",
              fontSize: 26,
              letterSpacing: 2,
              color: FARBE.recText,
            },
            ueber.toUpperCase(),
          )
        : null,
      el(
        "div",
        {
          display: "flex",
          fontFamily: "Display",
          // Lange Titel kleiner setzen, statt sie über drei Zeilen laufen zu
          // lassen — die Karte ist nur 630px hoch.
          fontSize: titel.length > 40 ? 62 : 78,
          lineHeight: 1.1,
          color: FARBE.papier,
        },
        titel,
      ),
      unter
        ? el("div", { display: "flex", fontFamily: "Mono", fontSize: 28, color: FARBE.stein }, unter)
        : null,
    ].filter(Boolean),
  );

  return el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      position: "relative",
      backgroundColor: FARBE.buehne,
      /*
       * Ohne Foto derselbe Farbverlauf wie der Hero-Platzhalter der Seite.
       *
       * ⚠️ Der Schlüssel wird **weggelassen**, nicht auf `undefined` gesetzt:
       * Satori liest jeden vorhandenen Schlüssel und ruft auf dem leeren Wert
       * `.trim()` auf — das brach das Rendern jeder Karte mit Foto ab.
       */
      ...(foto
        ? {}
        : { backgroundImage: `linear-gradient(150deg, #17171b 0%, ${FARBE.buehne} 100%)` }),
    },
    [
      ...schichten,
      /*
       * ⚠️ Foto und Verlauf liegen **außerhalb** dieser gepolsterten Ebene.
       * Bei Satori bezieht sich eine absolute Position auf die Innenkante,
       * nicht auf die Außenkante — lag das Bild im gepolsterten Element,
       * blieb ringsum ein 64px breiter schwarzer Rand stehen.
       */
      el(
        "div",
        {
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
        },
        [kopf, fuss],
      ),
    ],
  );
}
