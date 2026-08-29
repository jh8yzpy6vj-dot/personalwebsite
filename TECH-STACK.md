# TECH-STACK.md — Technische Vorgaben & Konventionen

Verbindliche technische Fakten und Regeln für dieses Projekt. Bei jeder technischen Entscheidung (Framework, Hosting-Änderung, neue Abhängigkeit) **muss** diese Datei aktualisiert werden.

## Ziel-Stack (Framework)

- **Framework**: Next.js (App Router) mit **TypeScript** — wie beim CLAER-Projekt.
- **Cloudflare-Adapter**: `@opennextjs/cloudflare`. Next.js baut normalerweise für Node-Server/Vercel; dieser Adapter übersetzt den Next.js-Build so, dass er als **Cloudflare Worker** läuft. Ohne diesen Adapter funktioniert ein Next.js-Projekt auf Cloudflare Workers nicht sauber — das ist der "Connector", den es braucht.
- **Build-Command** (Cloudflare Build-Konfiguration): `npx opennextjs-cloudflare build` — falls eine ältere Next.js-Version (z.B. 14) verwendet wird, zusätzlich das Flag `--dangerouslyUseUnsupportedNextVersion` anhängen (siehe CLAER-Projekt als Referenz, dort war das nötig).
- **TypeScript**: durchgängig für neuen Code, kein plain JavaScript mehr für neue Dateien.
- Status: **Umgesetzt.** Next.js 16.3.3 + `@opennextjs/cloudflare` 1.20.3 (offiziell unterstützte Kombination, kein Legacy-Flag nötig). Lokal via `npm run build` und `npx opennextjs-cloudflare build` getestet.
- ✅ **Erledigt am 2026-08-27:** Die Build-/Deploy-Befehle im Cloudflare-Dashboard (Workers & Pages → personalwebsite → Settings → Build) sind auf den Next.js-Workflow umgestellt (`npx opennextjs-cloudflare build` / `npx wrangler deploy`). Erster erfolgreicher Build und Livegang mit dem neuen Stack bestätigt.

## Bildmaterial ablegen

Zwei Wege, und sie sind bewusst verschieden:

| Was | Wohin | Was damit passiert |
|---|---|---|
| **Fotos** (Arbeiten, Hero-Standbild) | `bilder/arbeiten/`, `bilder/hero/` | Werden **zur Bauzeit verarbeitet** — Größen, Formate, Vorschaubildchen. Ausgeliefert wird das Erzeugte unter `/b/…` |
| **Hero-Video** | `public/hero/hero.mp4` | Wird **unverändert** ausgeliefert, Pfad in `HERO_VIDEO` |

⚠️ **Alles unter `public/` wird unverändert und öffentlich ausgeliefert** — der Pfad in der URL
entspricht dem Pfad im Ordner, nur ohne `public`. Deshalb steht diese Anleitung hier und **nicht**
als `public/README.md`: Die lag dort kurzzeitig und wäre unter `jakobsax.de/README.md` für jeden
lesbar gewesen, inklusive der Hinweise auf ungeklärte Bildrechte. Beim Code-Review aufgefallen.

**`bilder/` liegt außerhalb von `public/`** und ist damit nicht öffentlich — die Originale
behalten ihre Metadaten, die ausgelieferten Ableitungen nicht.

### Fotos → `bilder/` (Bildpipeline)

Bedienung steht in `bilder/README.md` und richtet sich an Jan und Jakob. Kurz:
**Datei nach `bilder/arbeiten/<id>.jpg` legen, `<id>` ist die `id` der Arbeit aus
`lib/content.ts`. Das Hero-Standbild heißt `bilder/hero/standbild.jpg`.** Nichts weiter.

Es gibt **kein Bildfeld mehr in `content.ts`** — Konvention statt Konfiguration. Ein zusätzliches
`image` wäre eine zweite Stelle mit demselben Namen und damit eine Stelle, an der er falsch
stehen kann.

| | |
|---|---|
| Skript | `scripts/bilder.mjs`, läuft über `prebuild` **vor jedem** `npm run build` — also auch im Cloudflare-Build |
| Regeln | `lib/bilder-regeln.mjs` (Breiten, Qualitäten, Budget). ⚠️ Nach Änderungen dort `PIPELINE_VERSION` erhöhen, sonst hält der Cache alte Dateien für aktuell |
| Ergebnis | `public/b/…` und `lib/bilder-manifest.json` |
| Im Git | **nur** die Originale in `bilder/` und das Manifest. `public/b/` und `.bilder-cache.json` sind ignoriert |
| Zugriff im Code | `bildZurArbeit(id)` bzw. `bild(schluessel)` aus `lib/bilder.ts`, gerendert von `app/components/Bild.tsx` |

Erzeugt werden AVIF und WebP in bis zu fünf Breiten (480–2400, **nie hochskaliert**), ein JPEG
als Rückfall und ein 16 px breites Vorschaubildchen, das als Datei-URI im Manifest und damit im
HTML landet.

**Größenbudget** (siehe `lib/bilder-regeln.mjs`): Warnung ab 200 kB für die 1200er-AVIF-Variante,
**Abbruch** ab 1,5 MB für jede Variante. Der Abbruch ist kein Feinschliff, sondern fängt den Fall
ab, dass jemand einen Screenshot oder ein unkomprimiertes PNG einkippt.

**Was mit den Metadaten passiert:** sharp schreibt sie nicht mit — **GPS-Koordinaten sind aus den
ausgelieferten Dateien also draußen**, ohne dass jemand daran denken muss. Die EXIF-Ausrichtung
wird vorher angewendet (`.rotate()`), sonst lägen Hochformate aus dem Telefon quer.

⚠️ **Für die geplante EXIF-Zeile** (Uhrzeit, Blende, ISO — siehe „Bilder & EXIF" weiter unten)
müssen die Werte aus dem **Original** gelesen und ins Manifest geschrieben werden. Aus den
ausgelieferten Dateien sind sie nicht mehr zu holen. Das ist der richtige Weg herum: Die Kamera-
daten kommen in den Text, die Standortdaten nirgendwohin.

**Originale:** JPEG, sRGB, lange Kante rund 2400–3000 px. Größer schadet nicht, bringt aber
nichts — ausgeliefert wird höchstens 2400 px. Seitenverhältnis egal, die Kacheln schneiden auf
4:3 (mobil 4:5) zu; wichtige Bildteile also nicht ganz an den Rand legen.

### Vorschaukarten (OpenGraph) → erzeugt, nicht abgelegt

`scripts/og.mjs` erzeugt vor jedem Build je Arbeit und einmal für die Seite
selbst eine Karte unter `public/og/<id>.jpg` (1200×630). Referenziert wird sie
in `app/layout.tsx` und in `generateMetadata` der Detailseite.

**Das ist die Karte, die WhatsApp und Slack zeigen.** Sie funktioniert schon
heute ohne Fotos — dann trägt sie Wortmarke, ●REC-Chip, Auftraggeber, Titel
und Metazeile auf `--buehne`. Sobald Fotos da sind, liegt das Foto dahinter,
mit demselben Verlauf wie über den Kacheln.

| | |
|---|---|
| Schriften | `assets/fonts/*.ttf` — nur zur Bauzeit gelesen, **nicht** ausgeliefert. Warum doppelt: siehe `assets/fonts/README.md` |
| Format | **JPEG, nicht PNG.** `ImageResponse` liefert PNG; mit Foto waren das ~970 kB je Karte. Über sharp als JPEG sind es ~50 kB. Budget: Warnung ab 250 kB |
| Im Git | nichts — `public/og/` ist ignoriert und entsteht bei jedem Build neu |
| Node | **≥ 22.18**, weil das Skript `lib/content.ts` direkt liest (Typen-Stripping). Kann Node das nicht, bricht der Build nicht ab: Warnung, keine Karten |

⚠️ **Warum das nicht als `app/**/opengraph-image.tsx` gebaut ist**, obwohl
Next genau das anbietet: Genau so stand es zuerst da, `next build` hat die
Karten sauber vorgerendert — **und im echten Worker gaben sie 500 zurück**
(`[unenv] fs.readFile is not implemented`). Der Adapter bediente die Route
nicht aus dem Vorrender-Cache, sondern führte sie zur Laufzeit aus, und dort
gibt es kein Dateisystem. Aufgefallen erst beim Prüfen gegen `wrangler dev`.
Als statische Datei ist das Problem strukturell weg.

### Hero-Video → `public/hero/`

`hero.mp4`, Pfad in `HERO_VIDEO`. Das **Poster kommt aus der Pipeline** — liegt
`bilder/hero/standbild.jpg` vor, wird es als Poster gesetzt und dient ohne Video auch selbst als
Hero.

**Das Poster ist nicht optional** — iPhones spielen im Energiesparmodus gar kein Video ab, auch
kein stummes. Ohne Poster sehen diese Besucher eine schwarze Fläche.

| | Wert | Warum |
|---|---|---|
| Tonspur | **gar keine**, nicht nur stumm | Spart Bytes, garantiert Autoplay auf iOS |
| Länge | 8–15 s | Läuft in Schleife |
| Auflösung | 1920×1080 | Der Hero schneidet ohnehin zu |
| Größe | **unter 3 MB** | Lädt vor allem anderen |

```
ffmpeg -i original.mov -an -t 12 -vf "scale=1920:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 26 -preset slow -movflags +faststart public/hero/hero.mp4

ffmpeg -i public/hero/hero.mp4 -ss 2 -vframes 1 -q:v 2 bilder/hero/standbild.jpg
```

`-an` entfernt die Tonspur komplett, `-movflags +faststart` lässt das Video starten, bevor es
fertig geladen ist. Das Standbild geht nach `bilder/`, nicht nach `public/` — es soll durch die
Pipeline.

**Nicht nach `public/` gehören:** Rohdateien, interne Notizen und Bilder mit ungeklärten Rechten.

## Tests und Werkzeuge

**Testläufer: Vitest** (`npm test`, `npm run test:watch`). Konfiguration in `vitest.config.mts`,
Tests liegen neben dem Code als `lib/*.test.ts`.

**Getestet wird ausschließlich die reine Logik in `lib/`** — die Validierung des Anfrageformulars
und die Ableitungen aus den Inhalten. Für die Oberfläche gibt es den Browser-Durchlauf im
Abschnitt darunter; ein zweites, halbes Browser-Abbild wäre Aufwand ohne zusätzliche Sicherheit.

Ein Teil der Tests prüft **die Daten selbst** auf Zusagen, auf die sich der Code verlässt: dass
Slugs eindeutig sind (sie werden URLs), dass jede Arbeit eine bekannte Kategorie und einen Credit
trägt, und dass jede Leistung nur auf existierende Arbeiten verweist. Ein Tippfehler in
`content.ts` ließe eine Arbeit sonst stillschweigend verschwinden.

**Linting: ESLint mit Flat Config** (`npm run lint`, Konfiguration in `eslint.config.mjs`).

⚠️ **`next lint` gibt es in Next 16 nicht mehr.** Bis 2026-08-28 stand es trotzdem in der
`package.json` — der Befehl las „lint" als Verzeichnisnamen und brach ab. Das Skript war also
wirkungslos und gab falsche Sicherheit. Wer es zurückändert, schaltet die Prüfung wieder aus.

**Zwei Regeln sind bewusst abgeschaltet**, mit Begründung in der Konfiguration:
`no-html-link-for-pages` (wir verlinken absichtlich mit `<a>`, weil seitenübergreifende View
Transitions echte Navigationen brauchen) und `no-img-element` (der OpenNext-Adapter bringt keinen
Bildoptimierer für `next/image` mit; die Optimierung passiert zur Build-Zeit).

## Geteilte CSS-Bausteine

`app/components/shared.module.css` hält, was mehrere Seiten teilen: den gefüllten CTA-Knopf, die
helle Lesefläche und die Metazeilen-Optik. Eingebunden wird über **`composes`**, nicht über
globale Klassen — so bleibt die Kapselung der CSS-Modules erhalten und jede Seite benennt
ausdrücklich, was sie übernimmt.

⚠️ Anlass war ein Befund aus dem Review: Der CTA-Knopf stand **dreimal** als eigene Kopie im
Projekt, inklusive dreifach hartkodiertem Hover-Rot außerhalb des Token-Systems. Wer ihn geändert
hätte, hätte ihn an einem Drittel der Stellen geändert.

## Prüfen vor dem Deploy — nicht mit `next build` aufhören

⚠️ **`npm run build` und `npm start` prüfen die falsche Umgebung.** Das ist ein Node-Server;
live läuft die Seite als Cloudflare Worker über den OpenNext-Adapter — anderer Build, andere
Laufzeit. Ein Build, der in Node durchläuft, kann im Worker scheitern.

Die aussagekräftige Prüfung ist deshalb:

```
npx opennextjs-cloudflare build     # der Build, der auch live gebaut wird
npx wrangler dev --local            # der Worker in der echten Laufzeit (workerd)
```

Erst dagegen testen, nicht gegen `next start`. Am 2026-08-27 lief die gesamte Entwicklung eines
Tages nur gegen den Node-Server — der Adapter-Build wurde erst auf Nachfrage überhaupt einmal
ausgeführt. Er lief zwar durch, aber das war Glück, keine Prüfung.

**Sinnvoll dabei mitzutesten**, weil es im Build nicht auffällt: Topbar-Farbwechsel beim Scrollen
(`IntersectionObserver`), Kategoriefilter, Tastaturfokus, `prefers-reduced-motion`, Mobilbreiten
375px und 320px.

**Bei Änderungen an Bewegung oder Layout zusätzlich** — alles im Browser gegen den laufenden
Worker, nicht aus dem Quelltext geschlossen:

| Was | Wie |
|---|---|
| Waagerechtes Scrollen | `documentElement.scrollWidth > clientWidth` bei **320, 360, 390, 414px** auf jeder Seite. 320px ist der Ernstfall: Dort sprengen deutsche Komposita die Zeile |
| Tippflächen | Jedes `a`/`button`/`input` bei 390px vermessen. Links **im Fließtext** sind laut WCAG 2.5.8 ausgenommen — freistehende Ziele nicht |
| Ruckeln | 2 s gleichmäßig durchscrollen und die Abstände zwischen den Bildern messen, mit `Emulation.setCPUThrottlingRate` auf 4 und 6. Alles über 33 ms ist ein ausgelassenes Bild. **Immer gegen `prefers-reduced-motion: reduce` vergleichen** — nur der Unterschied sagt etwas über die Kosten der Animation aus |
| Bewegung abgeschaltet | Mit `reducedMotion: "reduce"` laden und prüfen, dass **nichts unsichtbar bleibt** und die Seite lesbar ist. Das ist der Fehler, der bei scrollgetriebenen Animationen wirklich passiert |
| Ohne Unterstützung | Im gebauten CSS nachsehen, dass **jede** Regel mit einem unsichtbaren Startzustand innerhalb von `@supports (animation-timeline: …)` steht |

⚠️ **`animation-duration: 0.01ms` schaltet scrollgetriebene Animationen nicht ab.** Sie haben
keine Laufzeit. Abgeschaltet wird, indem die Regel nur unter
`prefers-reduced-motion: no-preference` überhaupt gilt.

**Bei Änderungen an Bildern zusätzlich:** gegen Testbilder prüfen, welche Datei der Browser je
Fenstergröße tatsächlich wählt (`img.currentSrc`) — ein falsches `sizes` fällt sonst nicht auf,
die Seite sieht richtig aus und lädt nur das Doppelte. Und den Kontrast von Schrift über Fotos
**über einem rein weißen Testbild** messen, nicht über dem endgültigen Foto: Der ungünstigste
Fall ist der, der zählt (siehe „Text über Fotos" in `design/UI-SPEC.md`).

**Was auch das nicht abdeckt:** Safari und iOS (lokal steht nur Chromium zur Verfügung), die
Live-Domain selbst, und alles mit echtem Bildmaterial. Nach einem Deploy mit sichtbaren
Änderungen gehört ein Blick auf ein echtes iPhone dazu.

## Hosting & Deploy

- **Hosting**: Cloudflare Worker mit dem Namen `personalwebsite`.
- **Domains**: `jakobsax.de` und `www.jakobsax.de`, beide als Custom Domain direkt am Worker gebunden (Workers & Pages → personalwebsite → Domains & Routes).
- **Deploy-Trigger**: Push auf `main` im GitHub-Repo `jh8yzpy6vj-dot/personalwebsite` — Cloudflare baut und deployed automatisch. Es gibt keine Preview-/Staging-Umgebung; jeder Push geht direkt live (siehe `CLAUDE.md` für die Branch-Regel).
- **DNS**: Nameserver von `jakobsax.de` liegen bei Cloudflare (nicht IONOS). Details und Gefahren dazu stehen in `CLAUDE.md` unter "DNS / Domain".
- **E-Mail**: läuft weiterhin über IONOS (MX-Records zeigen auf `mx00/mx01.ionos.de`). Hat nichts mit dem Website-Hosting zu tun, darf aber bei DNS-Änderungen nicht versehentlich mit gelöscht werden.

## Aktueller Stand (Code)

- Next.js App Router unter `app/` (`layout.tsx`, `page.tsx`, `page.module.css`, `globals.css`).
- Struktur folgt `SITE-PLAN.md`: Header/Nav, Hero, Über-mich-Section, Kontakt-Section, Footer — aktuell mit Platzhalter-Inhalten.
- Farb-Palette als CSS-Variablen in `app/globals.css` hinterlegt (siehe `SITE-PLAN.md` für die Referenztabelle).

## Beschlossene Richtungen — noch nicht umgesetzt (Stand 2026-08-27)

Ergebnis des Feature-/SEO-Brainstorms. **Richtung steht, Code existiert noch nicht.** Sobald ein
Punkt gebaut ist, wird er hier auf „umgesetzt" gesetzt und in `AGENT-LOG.md` protokolliert. Die
Aufgaben selbst stehen in `TODO.md`.

### Kontaktformular

- Formular-Endpoint als Route im bestehenden Worker — **kein zusätzlicher Dienst, kein Backend**.
- **Versand:** ⚠️ MailChannels' Gratis-Versand für Cloudflare Workers ist seit 2024 eingestellt.
  Deshalb ein Transaktions-Mailer mit API — **Resend oder Postmark** (beide mit ausreichendem
  Gratiskontingent für dieses Volumen). API-Key als Worker-Secret über `wrangler secret put`,
  **nicht** in `wrangler.toml` und nicht ins Repo.
- **Spam-Schutz:** Cloudflare Turnstile — läuft im selben Konto, ist datenschutzfreundlich und
  braucht kein Google reCAPTCHA.
- **Felder:** Datum, Ort, Art der Veranstaltung, Budgetrahmen, Freitext, Absenderadresse.
- **Datenschutz:** Die Formulardaten gehen an einen Auftragsverarbeiter — das muss in der
  Datenschutzerklärung stehen, und für den Anbieter wird ein AV-Vertrag gebraucht. Gehört zum
  Launch-Blocker „Pflichtangaben" in `TODO.md`.
- ⚠️ **Folge für den Design-Vertrag:** `design/UI-SPEC.md` führt Fehler- und Ladezustände bisher
  als „nicht anwendbar — statische Seite ohne Formular". Mit dem Formular gilt das nicht mehr;
  die Zustände müssen dort ergänzt werden, **bevor** der Code entsteht.

### Analytics & Datenschutz

- **Cloudflare Web Analytics** (cookielos, keine Einwilligung nötig, keine personenbezogene
  Speicherung). Bewusst **kein** Google Analytics — das würde ein Consent-Banner erzwingen, siehe
  die Anti-Feature-Liste in `SITE-PLAN.md`.
- **Schriften sind bereits unbedenklich:** `next/font/google` lädt die Schriften zur Build-Zeit
  herunter und liefert sie vom eigenen Worker aus. Es gibt **keine** Anfrage des Browsers an ein
  Google-CDN — die bekannte Google-Fonts-Abmahnfalle greift hier nicht. Das darf nicht
  versehentlich rückgängig gemacht werden (kein `<link>` auf `fonts.googleapis.com`).

### Bilder & EXIF

- ✅ **Erledigt am 2026-08-28:** Auslieferung als AVIF/WebP mit `srcset`, Vorschaubildchen als
  Ladezustand, Größenbudget. Beschreibung oben unter „Fotos → `bilder/`".
- ✅ **Erledigt am 2026-08-28 — EXIF-Zeile:** Aufnahmedaten werden zur Build-Zeit mit `exifr`
  ausgelesen, landen im Manifest und werden als statischer Text mitgerendert — keine
  Laufzeit-Abhängigkeit, kein Client-JS. Formatierung in `lib/bilder.ts` (`aufnahmeZeile`),
  Ausgabe auf der Detailseite.
- ✅ **GPS-Tags:** erledigt, an zwei Stellen. Erstens schreibt die Pipeline keine Metadaten in
  die Ausgabedateien. Zweitens liest sie beim EXIF **nur eine abschließende Feldliste**
  (`EXIF_FELDER` in `lib/bilder-regeln.mjs`) — Standortdaten werden gar nicht erst eingelesen.
  ⚠️ **Diese Liste ist eine Sicherheitsgrenze, keine Bequemlichkeit.** Wer sie erweitert, muss
  wissen, was er tut. Verifiziert mit einer Quelldatei, der GPS-Koordinaten eingesetzt wurden:
  im Original vorhanden, im Manifest und in allen Ausgabedateien nicht.
- Ausgegeben werden **vier Werte: Uhrzeit, Belichtungszeit, Blende, ISO**. Brennweite und
  Kamera wären lesbar, machen die Zeile aber länger, ohne mehr zu sagen.
- ⚠️ **Die Uhrzeit wird als Zeichenkette übernommen** (`reviveValues: false`), nicht als Datum
  interpretiert. Im EXIF steht keine Zeitzone — ein `Date` daraus zu bauen hieße, die Zeitzone
  des Build-Rechners anzunehmen, und die Seite zeigte je nach Server eine andere Uhrzeit.
- ⚠️ Kontext wie Wetter steht **nicht** im EXIF und müsste ein optionales Handfeld in
  `lib/content.ts` werden — mit Copy-Freigabe.

### SEO-Technik

- ✅ **Umgesetzt am 2026-08-27:** `metadataBase`, OpenGraph/Twitter-Tags, Canonical,
  `app/robots.ts`, `app/sitemap.ts` und JSON-LD (`app/StructuredData.tsx`) mit `Person` +
  `sameAs` und `ProfessionalService` + `areaServed`.
- **OG-Images zur Build-Zeit** generieren, nicht zur Laufzeit — auf dem Worker ist eine
  Build-Zeit-Lösung die risikoärmere Variante. Noch offen, hängt an Bildmaterial.

### Indexierbarkeit — ein zentraler Schalter

`lib/site.ts` hält zwei technische Werte, bewusst getrennt von den Inhalten in `content.ts`:

- **`SITE_URL`** — die kanonische Basis-URL an genau einer Stelle. Die Domain-Entscheidung
  (`.de` vs. `.media`) ist offen, ein Wechsel ist dadurch ein Einzeiler.
- **`INDEXABLE`** — steht auf `false` und steuert `robots` in `app/layout.tsx` sowie die
  Sitemap-Anmeldung in `app/robots.ts`. Grund: Die Seite ist live und war bis dahin
  uneingeschränkt indexierbar — mit erfundener E-Mail-Adresse, Preisen auf „noch festzulegen",
  ungeprüften Inhalten und **ohne Impressum**.

⚠️ **Feinheit, die oft falsch gemacht wird:** `robots.txt` enthält bewusst **kein** `Disallow`.
`Disallow` verbietet das *Crawlen*, nicht das *Indexieren* — wer beides kombiniert, erreicht das
Gegenteil, weil der Crawler das `noindex` im HTML dann nie liest. Richtig ist: **Crawlen
erlauben, Indexieren per `noindex` verbieten.** Das ist in `app/robots.ts` auskommentiert
festgehalten, damit es niemand „korrigiert".

⚠️ **Keine Platzhalter in strukturierten Daten.** `app/StructuredData.tsx` enthält bewusst keine
Kontaktdaten, solange die Adresse in `content.ts` erfunden ist — Google übernimmt solche Angaben
in Wissensfelder, wo sie schwerer zu korrigieren sind als auf der Seite.
- **Routing:** perspektivisch eine statisch vorgerenderte Route pro Arbeit
  (`/arbeiten/[slug]`), gespeist aus dem bestehenden `WORKS`-Array in `lib/content.ts`. Die
  `id`-Felder dort dienen dann als Slug — sie sind entsprechend stabil zu halten, ein späterer
  Umbenennung wäre ein URL-Bruch.

## Konventionen

- Keine weiteren Frameworks/Build-Tools zusätzlich zum beschlossenen Next.js-Stack einführen, ohne dass es hier dokumentiert wird und beide (Jan & Jakob) das mittragen.
- Sprache im Code/Kommentaren: Deutsch oder Englisch ist beides ok, Konsistenz innerhalb einer Datei anstreben.
- Neue technische Entscheidungen (z.B. "wir nutzen jetzt ein CMS", "wir brauchen ein Kontaktformular mit Backend") hier ergänzen, sobald sie feststehen — nicht erst im Nachhinein.
