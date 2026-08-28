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

⚠️ **Alles unter `public/` wird unverändert und öffentlich ausgeliefert** — der Pfad in der URL
entspricht dem Pfad im Ordner, nur ohne `public`. Deshalb steht diese Anleitung hier und **nicht**
als `public/README.md`: Die lag dort kurzzeitig und wäre unter `jakobsax.de/README.md` für jeden
lesbar gewesen, inklusive der Hinweise auf ungeklärte Bildrechte. Beim Code-Review aufgefallen.

| Datei | Erreichbar unter | In `lib/content.ts` |
|---|---|---|
| `public/hero/hero.mp4` | `jakobsax.de/hero/hero.mp4` | `"/hero/hero.mp4"` |
| `public/arbeiten/tete-a-tete-2026.jpg` | `jakobsax.de/arbeiten/…` | `"/arbeiten/tete-a-tete-2026.jpg"` |

**Der führende Schrägstrich ist Pflicht** — ohne ihn wird die Datei auf Unterseiten nicht
gefunden.

### Bilder der Arbeiten → `public/arbeiten/`

**Dateiname = die `id` der Arbeit aus `lib/content.ts`.**

- JPEG, sRGB, **1600 px an der langen Kante** (die Kacheln sind höchstens ~720 px breit, das
  reicht auch für Retina), Qualität ~80, **unter 500 KB**.
- Seitenverhältnis egal — die Kacheln schneiden auf 4:3 (mobil 4:5) zu. Wichtige Bildteile also
  nicht ganz an den Rand legen.
- ⚠️ **Standortdaten beim Export entfernen, Kameradaten drin lassen.** Die geplante EXIF-Zeile
  liest Uhrzeit, Blende und ISO — die Lightroom-Option „Alle Metadaten außer
  Kamera-Informationen" wäre genau falsch herum.

### Hero-Video → `public/hero/`

Zwei Dateien, beide nötig: `hero.mp4` und `hero-poster.jpg`.

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

ffmpeg -i public/hero/hero.mp4 -ss 2 -vframes 1 -q:v 2 public/hero/hero-poster.jpg
```

`-an` entfernt die Tonspur komplett, `-movflags +faststart` lässt das Video starten, bevor es
fertig geladen ist.

**Nicht nach `public/` gehören:** Rohdateien, interne Notizen und Bilder mit ungeklärten Rechten.

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

- Auslieferung als **AVIF/WebP mit `srcset`**, LQIP-Blur als Ladezustand, hartes Größenbudget
  fürs Hero. Ziel ist eine Seite, die auf dem Festivalgelände bei schlechtem LTE sofort steht.
- **EXIF-Zeile:** Aufnahmedaten werden **zur Build-Zeit** ausgelesen (z.B. mit `exifr`) und als
  statischer Text mitgerendert — keine Laufzeit-Abhängigkeit, kein Client-JS.
- ⚠️ **GPS-Tags müssen entfernt werden**, bevor Bilder ausgeliefert werden. Bei Aufnahmeorten und
  bei einem Journalisten ist das kein Randthema.
- ⚠️ Aus dem EXIF kommen nur **Uhrzeit, Blende, Belichtungszeit, ISO, Brennweite, Kamera**.
  Kontext wie Wetter steht **nicht** im EXIF und müsste ein optionales Handfeld in
  `lib/content.ts` werden.

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
