/**
 * Platzhalter für „Tödliches Gold": ein gezeichneter Goldbarren.
 *
 * Die Bilder zur Arbeit kommen später (Jan, 2026-10-14). Bis dahin trägt
 * dieses Bild Kachel und Detailseite. ⚠️ **Bewusst gezeichnet, kein
 * Stockfoto:** Auf der Seite eines Fotografen läse sich ein fremdes Foto als
 * seine Arbeit — eine Zeichnung ist als Platzhalter erkennbar und braucht
 * keine Lizenz.
 *
 *   node scripts/goldbarren.mjs <ziel.jpg>
 *
 * Das Ergebnis gehört nach `original/arbeiten/toedliches-gold.jpg` im Bucket
 * (z. B. über `npm run verkleinern -- <ziel.jpg> --einzel arbeiten/toedliches-gold
 * --original --hochladen`). Sobald echte Bilder da sind, ersetzen sie es unter
 * demselben Namen.
 */

import sharp from "sharp";

const B = 4000;
const H = 2667;

/* Ein Barren in leichter Aufsicht: vorne die schräge Stirnfläche, dahinter
   die Oberseite. Zwei Flächen genügen — mehr Geometrie sähe nach Rendering
   aus, nicht nach Platzhalter. */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${H}" viewBox="0 0 ${B} ${H}">
  <defs>
    <radialGradient id="grund" cx="50%" cy="48%" r="70%">
      <stop offset="0" stop-color="#26231c"/>
      <stop offset="1" stop-color="#0e0e10"/>
    </radialGradient>
    <linearGradient id="oben" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1b8"/>
      <stop offset="0.35" stop-color="#f2cc5c"/>
      <stop offset="1" stop-color="#c9952a"/>
    </linearGradient>
    <linearGradient id="vorne" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e2b13e"/>
      <stop offset="0.55" stop-color="#b07f1f"/>
      <stop offset="1" stop-color="#6e4c10"/>
    </linearGradient>
    <linearGradient id="glanz" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff8dc" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff8dc" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#fff8dc" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="schatten" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#000" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${B}" height="${H}" fill="url(#grund)"/>
  <ellipse cx="2000" cy="1800" rx="1150" ry="150" fill="url(#schatten)"/>
  <polygon points="1100,1760 2900,1760 2700,1330 1300,1330" fill="url(#vorne)"/>
  <polygon points="1300,1330 2700,1330 2560,1060 1440,1060" fill="url(#oben)"/>
  <polygon points="1300,1330 2700,1330 2690,1342 1310,1342" fill="url(#glanz)"/>
  <rect x="1640" y="1150" width="720" height="110" rx="14" fill="none" stroke="#a87a1e" stroke-opacity="0.55" stroke-width="10"/>
</svg>`;

const ziel = process.argv[2];
if (!ziel) {
  console.error("Aufruf: node scripts/goldbarren.mjs <ziel.jpg>");
  process.exit(1);
}
await sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toFile(ziel);
console.log(`${ziel}: ${B}×${H}`);
