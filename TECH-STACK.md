# TECH-STACK.md — Technische Vorgaben & Konventionen

Verbindliche technische Fakten und Regeln für dieses Projekt. Bei jeder technischen Entscheidung (Framework, Hosting-Änderung, neue Abhängigkeit) **muss** diese Datei aktualisiert werden.

## Ziel-Stack (Framework)

- **Framework**: Next.js (App Router) mit **TypeScript** — wie beim CLAER-Projekt.
- **Cloudflare-Adapter**: `@opennextjs/cloudflare`. Next.js baut normalerweise für Node-Server/Vercel; dieser Adapter übersetzt den Next.js-Build so, dass er als **Cloudflare Worker** läuft. Ohne diesen Adapter funktioniert ein Next.js-Projekt auf Cloudflare Workers nicht sauber — das ist der "Connector", den es braucht.
- **Build-Command** (Cloudflare Build-Konfiguration): `npx opennextjs-cloudflare build` — falls eine ältere Next.js-Version (z.B. 14) verwendet wird, zusätzlich das Flag `--dangerouslyUseUnsupportedNextVersion` anhängen (siehe CLAER-Projekt als Referenz, dort war das nötig).
- **TypeScript**: durchgängig für neuen Code, kein plain JavaScript mehr für neue Dateien.
- Status: **Umgesetzt.** Next.js 16.3.3 + `@opennextjs/cloudflare` 1.20.3 (offiziell unterstützte Kombination, kein Legacy-Flag nötig). Lokal via `npm run build` und `npx opennextjs-cloudflare build` getestet.
- ✅ **Erledigt am 2026-08-27:** Die Build-/Deploy-Befehle im Cloudflare-Dashboard (Workers & Pages → personalwebsite → Settings → Build) sind auf den Next.js-Workflow umgestellt (`npx opennextjs-cloudflare build` / `npx wrangler deploy`). Erster erfolgreicher Build und Livegang mit dem neuen Stack bestätigt.

## ✅ Umbau „Präsenz statt Verkauf" (beschlossen 2026-10-08, im Code umgesetzt 2026-10-08)

Die Seite ist nach Jakobs Konzept umgebaut (`SITE-PLAN.md`, Plan in `TODO.md`, Abschnitt
„UMBAU", Log in `AGENT-LOG.md`). **Alles in diesem Abschnitt steht im Code — mit einer
Ausnahme: die Schriften** (siehe „Schriften"; bis die Lizenzdateien da sind, laufen freie
Ersatzschriften). Wo ein älterer Abschnitt weiter unten dem widerspricht, gilt dieser.

| Bereich | Bisher | Nach dem Umbau | Schritt |
|---------|--------|----------------|---------|
| Routen | `/`, `/arbeiten`, `/arbeiten/[slug]`, `/leistungen/[slug]`, `/kontakt`, `/ueber`, Pflichtseiten | `/`, `/foto`, `/film`, `/ueber`, Pflichtseiten | 4, 5 |
| Weiterleitungen | — | in `next.config.mjs`, dauerhaft (308): `/arbeiten` und `/arbeiten/:slug` → `/foto`, `/leistungen/:slug` → `/`, `/kontakt` → `/ueber` | 5 |
| Inhalte | `WORKS`, `CATEGORIES`, `SERVICES`, `REFERENCES`, `CONTACT` | `FOTOS` (`id`, `titel`, `kunde`), `FILME` (dazu `link`), `ABOUT` | 2 |
| Schriften | Bricolage Grotesque, Newsreader, Martian Mono über `next/font/google` | Druk Wide Bold und Avenir Next über `next/font/local` — siehe „Schriften" unten | 3 |
| Kontaktformular | Route `app/api/anfrage`, `lib/anfrage.ts`, `lib/mailer.ts`, Resend, Turnstile | **entfällt ersatzlos.** Keine Worker-Secrets `RESEND_API_KEY`, `ANFRAGE_AN`, `ANFRAGE_VON`; kein AV-Vertrag nötig | 5 |
| Filme | selbst ausgeliefert aus `original/video/<id>.mp4` | **verlinkt**, nicht gespeichert. Nur das Standbild liegt bei uns: `original/film/<id>.jpg` | 2, 4 |
| Bucket-Pfade | siehe „Wohin welche Datei" | `original/arbeiten/<id>/01.jpg …` **bleibt**; neu `original/film/<id>.jpg`; entfallen: `original/arbeiten/<id>.jpg` (Leitbild), `…/serie/`, `original/video/` | 2 |
| EXIF | als Aufnahmezeile angezeigt | **nicht mehr angezeigt.** Die GPS-Sperre (`EXIF_FELDER`) bleibt unverändert — sie ist Schutz, nicht Anzeige | 2 |
| Vorschaukarten | je Arbeit eine plus `start.jpg` | nur noch `start.jpg` | 2 |
| Strukturierte Daten | `Person` + `ProfessionalService` | nur `Person` mit `sameAs` | 4 |
| Linkprüfung | — | `npm run links`: ruft jeden `FILME[].link` ab, meldet alles außer 200. **Nicht im Build** — ein Deploy darf nicht davon abhängen, ob YouTube antwortet | 2 |
| Cache-Control für HTML | fehlt (siehe `TODO.md`) | wird im Umbau gesetzt — bei einem Strukturumbau ist altes HTML im Edge-Cache besonders tückisch | 3 |

⚠️ **Warum die Filme nicht mehr bei uns liegen:** Jakobs Vorgabe („alle verlinkt, nicht auf
Website selbst gespeichert"). Folge: **Links verfallen.** ARD- und SWR-Mediathek depublizieren
nach Ablauf der Verweildauer. Deshalb die Linkprüfung, und deshalb wo möglich dauerhafte Orte
bevorzugen (YouTube-Kanal von Y-Kollektiv/funk, eigener Kanal). Ein eingebetteter Player kommt
nicht in Frage — er lädt beim Seitenaufruf Inhalte und Tracker eines Dritten.

## Schriften

> Beschlossen am 2026-10-08 (E5). ⏳ **Übergang:** Die Lizenzdateien liegen noch nicht vor, und
> das Repo ist (Stand 2026-10-08) nicht nachweislich privat. Bis dahin nennt `app/globals.css`
> „Druk Wide" und „Avenir Next" zuerst (wo installiert, z. B. Avenir Next auf Apple-Geräten,
> erscheinen sie) und fällt sonst auf **Archivo** (Breitenachse auf 125 %) und **Figtree**
> zurück — beide über `next/font/google` zur Build-Zeit geladen und vom eigenen Worker
> ausgeliefert, also ohne Anfrage an Google. Umstellen auf `next/font/local` in
> `app/layout.tsx`, sobald die drei Punkte unten geklärt sind.

| Familie | Schnitt | Hersteller | Lizenz |
|---------|---------|------------|--------|
| **Druk Wide** | Bold | Commercial Type | Jakob hat eine Lizenz — **Art noch bestätigen** (siehe unten) |
| **Avenir Next** | Regular | Linotype / Monotype | Jakob hat eine Lizenz — **Art noch bestätigen** |

**Eingebunden über `next/font/local`, ausgeliefert vom eigenen Worker.** Nie von einem fremden
Server (Adobe Fonts, Google-CDN, Monotype-CDN) — das wäre eine Datenübermittlung an Dritte und
gehörte in die Datenschutzerklärung. Nur die Schnitte einbinden, die das UI-SPEC nutzt; jede
Datei kostet Ladezeit.

⚠️ **Drei Dinge müssen geklärt sein, bevor eine Schriftdatei ins Projekt kommt:**

1. **Ist es eine Web-Lizenz?** Schriften werden getrennt für Desktop, Web, App und Video
   lizenziert. Eine Desktop-Lizenz erlaubt in aller Regel **nicht**, die Datei auf einem Server
   abzulegen. Festzuhalten (hier, in dieser Tabelle): Lizenzart, Lizenznehmer, Grenze der
   Seitenaufrufe, ob Selbsthosting erlaubt ist. Die Lizenzurkunde selbst gehört **nicht** ins
   Repo.
2. **⚠️ Das GitHub-Repo `jh8yzpy6vj-dot/personalwebsite` ist öffentlich** (geprüft am
   2026-10-08). Eine eingecheckte Schriftdatei wäre damit für jeden herunterladbar — das ist
   Weitergabe, und die erlaubt praktisch keine kommerzielle Lizenz, auch keine Web-Lizenz.
   **Vorher das Repo auf privat stellen** (GitHub → Settings → Danger Zone → Change visibility).
   Der Cloudflare-Build hat über die GitHub-App weiterhin Zugriff; nach dem Umstellen einen
   Deploy abwarten und prüfen, dass er durchläuft. Bis dahin: **keine Schriftdatei committen.**
3. **Dürfen die Vorschaukarten die Schrift verwenden?** `scripts/og.mjs` rendert Schrift in ein
   JPEG und braucht dafür TTF/OTF (Satori kann kein WOFF2, siehe `assets/fonts/README.md`). Ob
   die Lizenz Schrift in erzeugten Bildern deckt, steht im Lizenztext. Wenn nicht: die
   Vorschaukarte mit Schriftzug als fertigem Bild aus einem Programm mit Desktop-Lizenz.

**Rückfallweg für Avenir Next**, falls es nur eine Desktop-Lizenz gibt: den Namen in CSS
benennen statt die Datei mitzuliefern (`font-family: "Avenir Next", …`). Auf macOS und iOS ist
sie vorinstalliert und erscheint dort ohne Download; Windows und Android zeigen dann einen freien
Ersatz, der mit `next/font/google` mitgeliefert wird. Damit ist keine Web-Lizenz nötig. Für Druk
Wide gibt es diesen Weg nicht — sie ist nirgends vorinstalliert.

**Ablage:** `app/fonts/` (WOFF2 für die Seite), `assets/fonts/` (TTF/OTF für die
Vorschaukarten). Beide Ordner **erst nach Punkt 2** befüllen.

## Medien (Fotos und Videos) — sie liegen im R2-Bucket, nicht im Repo

**Seit dem 2026-08-29 liegt kein einziges Foto und kein Video mehr im Git.** Beides liegt im
Cloudflare-R2-Bucket, und der Build fasst es nicht an — er liest nur zwei eingecheckte
Manifestdateien. Warum, in einem Satz: Zwölf unbearbeitete Kameradateien hatten 134 MB in den
Git-Verlauf gebracht (dort bleiben sie für immer) und den Cloudflare-Build auf rund sechs
Minuten getrieben, weil er sie bei **jedem** Deploy neu berechnete.

### Wie es jetzt läuft

```
Datei in den Bucket legen  →  npm run medien  →  Manifeste committen  →  Deploy
   (auch per Dashboard)       (lokal, einmalig)    (zwei kleine .json)
```

1. **Ablegen** — im Cloudflare-Dashboard unter R2 → `<Bucket>` → `original/…`, oder per
   `rclone`/S3-Werkzeug. Dafür braucht niemand Git und niemand einen Editor: **Jakob kann das
   selbst.**
2. **`npm run medien`** — läuft **lokal auf einem eurer Rechner**, nie im Deploy. Holt neue und
   geänderte Originale, erzeugt alle Größen und Formate, legt sie unter `b/…` zurück in den
   Bucket, schreibt die Manifeste und danach die Vorschaukarten.
3. **Committen** — `lib/bilder-manifest.json`, `lib/video-manifest.json` und die geänderten
   Karten in `public/og/`. ⚠️ **Ohne diesen Commit sieht die Seite die neuen Bilder nicht.**

`npm run medien -- --probe` zeigt vorher, was passieren würde: holt nichts, rechnet nichts,
schreibt nichts.

### Wohin welche Datei

> ⏳ **Ändert sich mit dem Umbau (Schritt 2), siehe oben.** Es bleiben: `original/arbeiten/<id>/`
> mit `01.jpg`, `02.jpg`, … (die Fotos im Mosaik auf `/foto`), Hero-Video, Hero-Standbild,
> Porträt. Neu: **`original/film/<id>.jpg`** — das Standbild je Film, Querformat; `<id>` ist die
> `id` aus `FILME` in `lib/content.ts`. Es entfallen: Leitbild `original/arbeiten/<id>.jpg`,
> Kontaktbogen `…/serie/`, Filme unter `original/video/`. Standbilder für Filme dürfen schon
> jetzt abgelegt werden; bis Schritt 2 meldet die Pipeline sie als „gehört zu nichts", das ist
> harmlos.

Alles unter dem Präfix `original/` im Bucket:

| Was | Schlüssel im Bucket | Dateiname |
|---|---|---|
| Leitbild einer Arbeit | `original/arbeiten/` | genau die `id` der Arbeit aus `lib/content.ts`, z. B. `tete-a-tete-2026.jpg` |
| **Bildstrecke** — die Folge, die im Hero läuft und darunter als Mosaik steht | `original/arbeiten/<id>/` | `01.jpg`, `02.jpg`, … |
| **Kontaktbogen** — alle Frames derselben Aufnahmeserie | `original/arbeiten/<id>/serie/` | `01.jpg`, `02.jpg`, … und beim Treffer `03-gewaehlt.jpg` |
| Film zu einer Arbeit (Aftermovie) | `original/video/` | `<id>.mp4` |
| Hero-Standbild | `original/hero/` | `standbild.jpg` |
| Hero-Video | `original/hero/` | `film.mp4` |
| **Porträt von Jakob** | `original/` (direkt darin) | `portrait.jpg` |

Die `id` steht in `lib/content.ts` bei jeder Arbeit ganz oben (`id: "..."`) und ist zugleich die
Adresse der Seite: `jakobsax.de/arbeiten/tete-a-tete-2026`.

Erlaubte Endungen für Bilder: `.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.webp`; für Videos
`.mp4`, `.webm`, `.mov`. Groß-/Kleinschreibung zählt.

Es gibt **kein Bildfeld in `content.ts`** — Konvention statt Konfiguration. Ein zusätzliches
`image` wäre eine zweite Stelle mit demselben Namen und damit eine Stelle, an der er falsch
stehen kann.

⚠️ **Führende Null nicht vergessen** (`01`, nicht `1`). Sortiert wird nach Dateiname; ohne sie
stünde `10` vor `2`.

⚠️ **Der Bildausschnitt im Hero steht in `lib/bildausschnitte.ts`**, eine Zeile je Bild:

    "arbeiten/wiwawo-53/02": "50% 78%",   // Lagerfeuer sitzt unten

Der Schlüssel ist derselbe Pfad wie im Manifest (`arbeiten/<id>` fürs Leitbild,
`arbeiten/<id>/01` für die Strecke), der Wert ein `object-position`: erst waagerecht, dann
senkrecht. Ohne Eintrag steht das Bild mittig.

**Nicht schätzen — es gibt ein Werkzeug dafür:** Bilder laden, Punkt auf dem Foto ziehen, der rote
Rahmen zeigt, was im Hero übrig bleibt, unten fällt die fertige Datei heraus.
→ <https://claude.ai/code/artifact/ca3af403-f535-4e52-97e6-633cd9414c34>

Warum das je Bild gewählt werden muss: Ein Hochformat (4672 × 7008) zeigt in einem
1920 × 1080-Hero nur **37,5 % seiner Höhe** — bei jeder Einstellung. Welche 37,5 % die richtigen
sind, weiß nur, wer das Bild kennt. Eine feste Regel liegt bei jedem zweiten Motiv daneben; genau
das war am 2026-09-13 der Fall, als hier pauschal 38 % standen.

⚠️ **Eine Änderung hier braucht weder Bucket-Zugriff noch `npm run medien`** — Datei bearbeiten,
pushen, fertig. Eine Zwischenstufe mit Endungen am Dateinamen (`-oben`, `-unten`) ist am
2026-09-13 wieder verworfen worden: drei Stufen sind zu grob, und jede Änderung hätte Umbenennen
im Bucket **und** einen neuen Medien-Lauf verlangt.

**Das Mosaik unter dem Text ist davon nicht betroffen** — dort wird nichts beschnitten, jedes
Bild steht in voller Form. Der Wert wirkt **ausschließlich** im Hero.

⚠️ **`-gewaehlt` am Dateinamen** markiert im Kontaktbogen das Bild, das es geworden ist — es
bekommt den roten Rahmen. Genau eins pro Serie. Ist keins markiert, gibt es keine Markierung.
Der Kontaktbogen lebt davon, dass die Frames **Sekunden auseinanderliegen** und das im EXIF
steht: Darunter erscheint die Uhrzeit auf die Sekunde genau, und genau das ist die Aussage —
vier daneben, einer sitzt.

Liegt zu einer Arbeit keine Datei da, zeigt die Seite ihren Platzhalter („Bild folgt"). Das ist
kein Fehler. **Umgekehrt schon:** Eine Datei, deren Name zu keiner `id` passt, erscheint
nirgends. Die Pipeline sagt das ausdrücklich und **bevor** sie rechnet:

```
! arbeiten/©JakobSax_WiWaWo26_JPG6785: gehört zu nichts und erscheint nirgends
  auf der Seite. Erwartet wird eine id aus content.ts (tete-a-tete-2026, …).
```

**Zwölf Fotos von einem Ereignis sind keine zwölf Leitbilder, sondern eine Bildstrecke** — die
gehört nach `original/arbeiten/<id>/`. Und wenn es die Arbeit in `lib/content.ts` noch gar nicht
gibt, muss sie dort zuerst angelegt werden.

**Das Porträt** erscheint im Kurzanriss der Startseite und oben auf `/ueber`. **Es wird nicht
zugeschnitten** — quer oder hochkant, beides geht, das Bild behält seine Form; auf `/ueber` ist
nur seine Höhe auf 70 % des Bildschirms begrenzt. ⚠️ Die Bildbeschreibung dazu steht in
`lib/content.ts` unter `ABOUT.portraitAlt` und beschreibt die **aktuelle** Aufnahme. Wer das
Foto austauscht, muss sie mit austauschen.

### Zugangsdaten — sie gehören nicht ins Repo

`npm run medien` braucht fünf Werte. Sie gehören in **`.dev.vars`** im Projektordner (die Datei
ist bereits von Git ausgenommen) — **niemals in eine eingecheckte Datei.** Das Skript liest sie
von dort selbst ein; was schon in der Shell steht, gewinnt. Format wie bei `wrangler`:

```
R2_ACCOUNT_ID=…
R2_ACCESS_KEY_ID=…
R2_SECRET_ACCESS_KEY=…
R2_BUCKET=jakobsax-medien
R2_PUBLIC_URL=https://medien.jakobsax.de
```

| Variable | Woher |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare-Dashboard → R2 → rechts „Account ID" |
| `R2_ACCESS_KEY_ID` | R2 → „Manage API Tokens" → Token mit **Object Read & Write** für genau diesen Bucket |
| `R2_SECRET_ACCESS_KEY` | dito, wird **nur einmal** angezeigt |
| `R2_BUCKET` | Name des Buckets |
| `R2_PUBLIC_URL` | die öffentliche Adresse, z. B. `https://medien.jakobsax.de` |
| `R2_S3_ENDPOINT` | **nur bei einem Bucket mit Jurisdiction** — siehe unten |

⚠️ **Buckets mit Jurisdiction haben einen anderen S3-Endpunkt.** Wer beim Anlegen „European
Union (EU)" wählt (hinterher nicht mehr änderbar), bekommt
`<konto>.eu.r2.cloudflarestorage.com` statt `<konto>.r2.cloudflarestorage.com`. Ohne das `.eu.`
greift jede Anfrage ins Leere. Der sichere Weg ist, die Zeile **„S3 API"** aus R2 → Bucket →
Settings zu kopieren und als `R2_S3_ENDPOINT` einzutragen — der Bucketname darf dranhängen, er
wird abgeschnitten:

```
R2_S3_ENDPOINT=https://<konto>.eu.r2.cloudflarestorage.com/<bucket>
```

Alternativ reicht `R2_JURISDICTION=eu`. Ohne beides bleibt es beim Standard, und der stimmt für
Buckets ohne Jurisdiction.

⚠️ **`R2_PUBLIC_URL` sollte eine eigene Custom Domain sein** (R2 → Settings → Public access →
Custom Domain), nicht die `…r2.dev`-Adresse: Die ist von Cloudflare ausdrücklich nicht für den
Dauerbetrieb gedacht und hat eine Ratenbegrenzung.

⚠️ Die Adresse landet **fest in den Manifesten**. Ein Domainwechsel heißt: `npm run medien`
einmal neu laufen lassen. Das merkt die Pipeline von selbst und schreibt alle Einträge neu.

⚠️ **`scripts/r2.mjs` läuft ausschließlich lokal.** Es wird von keinem Worker-Code und von keinem
Build-Schritt importiert. Wenn das jemals nötig scheint, ist etwas anderes falsch.

### Was die Pipeline erzeugt

| | |
|---|---|
| Skripte | `scripts/medien.mjs` (Bilder und Videos); es startet am Ende selbst `scripts/og.mjs` (Vorschaukarten). ⚠️ **Nicht** als `medien.mjs && og.mjs` in `package.json` verketten — npm hängt die Argumente hinter die ganze Kette, `npm run medien -- --probe` liefe damit als echter Lauf |
| Zugriff auf R2 | `scripts/r2.mjs`, signiert mit `aws4fetch` (88 kB, keine Abhängigkeiten) statt mit dem AWS-SDK |
| Regeln | `lib/bilder-regeln.mjs` (Breiten, Qualitäten, Budget). ⚠️ Nach Änderungen dort `PIPELINE_VERSION` erhöhen, sonst hält der Zwischenspeicher alte Dateien für aktuell |
| Ergebnis | `b/…` im Bucket, `lib/bilder-manifest.json`, `lib/video-manifest.json`, `public/og/*.jpg` |
| Im Git | **die Manifeste und die Vorschaukarten** — sonst nichts. `.medien-cache/` ist ignoriert |
| Zugriff im Code | `bildZurArbeit(id)` / `bild(schluessel)` aus `lib/bilder.ts`, `videoZurArbeit(id)` / `heroVideo()` aus `lib/video.ts` |

Erzeugt werden **AVIF und WebP in bis zu fünf Breiten (480–2400)**, dazu ein JPEG als Rückfall
und ein 16 px breites Vorschaubildchen, das als Datei-URI im Manifest und damit im HTML landet.
**Nie hochskaliert.**

⚠️ **AVIF war bis zum 2026-09-12 bei 1600 gekappt** — eine reine Bauzeit-Entscheidung aus der
Zeit, als der Cloudflare-Build jedes Bild bei jedem Deploy neu rechnete. Mit dem R2-Umbau ist
sie hinfällig geworden, blieb aber stehen, und das kostete sichtbar Qualität: Das Detailbild
läuft mit `sizes="100vw"`, ein Retina-Bildschirm fordert über 2000px an, fand im AVIF-Satz aber
nur 1600 und rechnete hoch. Messwerte und die ganze Begründung stehen in `lib/bilder-regeln.mjs`.

**Ein Format darf dem anderen nie hinterherhinken** — sonst greift der Browser stillschweigend
zur schlechteren Auflösung, ohne dass es irgendwo als Fehler auftaucht.

Die Ableitungen liegen unter `b/` im **selben Baum** wie die Originale unter `original/`, mit der
Breite im Dateinamen: `b/arbeiten/tete-a-tete-2026-1200.avif`. Gehashte Namen wären
platzsparender, aber im Dashboard könnte dann niemand mehr nachsehen, was wozu gehört.
Ausgeliefert werden sie mit `cache-control: public, max-age=31536000, immutable`.

**Verwaiste Ableitungen räumt die Pipeline weg** — was unter `b/` liegt und zu keinem Original
mehr gehört, wird gelöscht. Umgekehrt merkt sie auch, wenn unter `b/` etwas fehlt, das laut
Zwischenspeicher da sein müsste, und erzeugt es neu.

**Größenbudget:** Warnung ab 200 kB für die 1200er-AVIF-Variante, **Abbruch** ab 1,5 MB für jede
Variante. Der Abbruch ist kein Feinschliff, sondern fängt den Fall ab, dass jemand einen
Screenshot oder ein unkomprimiertes PNG einkippt.

### Vorgaben für die Originale — bitte vorher verkleinern

**Lange Kante rund 2400–3000 px, JPEG in sRGB, guter Qualität, unter 3 MB.** Kleiner als 1200 px
sollte es nicht sein, sonst ist das Bild auf großen Bildschirmen weich. Seitenverhältnis egal,
die Kacheln schneiden auf 4:3 (mobil 4:5) zu; wichtige Bildteile also nicht ganz an den Rand
legen.

**Keine unbearbeiteten Kameradateien.** Ausgeliefert wird ohnehin höchstens 2400 px — alles
darüber wird weggeworfen, kostet aber Bandbreite beim Hochladen, Rechenzeit beim Verarbeiten und
Speicher im Bucket. Die Pipeline **warnt** ab 4000 px Kantenlänge oder 6 MB; sie bricht nicht ab.
Wer die Warnung sieht, sollte das Original ersetzen, nicht ignorieren.

**Einmal auf 2400–3000 px exportieren, das ist der ganze Aufwand.** Nicht nötig — und bitte auch
nicht machen: mehrere Größen selbst anlegen, in WebP oder AVIF umwandeln, Wasserzeichen einbauen.

#### `npm run verkleinern` nimmt einem genau das ab

Wer einen Ordner voller Kameradateien hat, muss weder verkleinern noch umbenennen:

```
npm run verkleinern -- <ordner> --arbeit wiwawo-53 --leitbild JPG7043.JPG
npm run verkleinern -- <ordner> --serie tete-a-tete-2026
npm run verkleinern -- <datei>  --einzel portrait
```

Das Skript legt einen fertigen `original/`-Baum unter `.medien-vorbereitet/` an: auf 3000 px
verkleinert, als JPEG, **richtig benannt** (`<id>.jpg` fürs Leitbild, `<id>/01.jpg`, `02.jpg`, …
für die Strecke). Der Ordner lässt sich als Ganzes ins R2-Dashboard ziehen; mit `--hochladen`
schiebt das Skript ihn selbst in den Bucket.

Ohne `--leitbild` wird die **erste Datei** zum Leitbild — eine Notlösung, keine Auswahl. Welches
Bild die Kachel trägt, ist eine fotografische Entscheidung.

⚠️ **Das Skript entfernt die Standortdaten, behält aber die Aufnahmedaten.** Das ist an dieser
Stelle wichtiger als bei den Ableitungen: Die Originale liegen unter `original/` in einem
**öffentlichen** Bucket (die Videos werden von dort ausgeliefert) und sind über ihre Adresse
abrufbar. `sharp` kennt nur ganz oder gar nicht — ohne Angabe verschwindet jedes Metadatum,
mit `withMetadata()` bleibt auch GPS. Deshalb liest das Skript die fünf Felder aus `EXIF_FELDER`
aus und schreibt genau die zurück. Kameramarke, Modell und Urheberzeile fallen dabei mit weg.

⚠️ Die `id` wird **vor** dem Rechnen gegen `lib/content.ts` geprüft. Gibt es die Arbeit dort
nicht, bricht das Skript ab und nennt die bekannten ids — statt zwölf Dateien zu verarbeiten,
die nirgends erscheinen. Genau das ist beim ersten Upload passiert.

**Beim Export: Kameradaten drin lassen.** Unter dem Bild erscheint automatisch eine Zeile
`22:14 uhr · 1/500 · f/2.8 · iso 6400`. Sie kommt aus dem EXIF — nichts einzutragen, nichts zu
pflegen —, aber nur, wenn die Angaben beim Export erhalten bleiben. In Lightroom heißt die
richtige Einstellung im Feld „Metadaten" **nicht** „Alle außer Kamera- und Camera-Raw-Infos"
(das entfernt genau die Werte, die wir zeigen wollen), sondern die, die **Kamera-Informationen
behält**. Ist kein EXIF da, erscheint einfach keine Zeile; das ist kein Fehler.

**Um die Standortdaten muss sich niemand kümmern.** Die Pipeline liest ausschließlich die fünf
Felder aus `EXIF_FELDER` in `lib/bilder-regeln.mjs` — GPS wird gar nicht erst eingelesen und
landet in keiner ausgelieferten Datei und in keinem Manifest. Diese Liste ist eine
**Sicherheitsgrenze, keine Bequemlichkeit**: Bei Aufnahmeorten und bei einem Journalisten ist das
kein Randthema. `sharp` schreibt darüber hinaus gar keine Metadaten mit, die EXIF-Ausrichtung
wird vorher angewendet (`.rotate()`), sonst lägen Hochformate aus dem Telefon quer.

⚠️ **Alt-Texte stehen nicht im Dateinamen**, sondern bei der Arbeit in `lib/content.ts` (Feld
`alt`). Sie beschreiben die Szene, nicht das Bild: „Höhenartistik über dem Ehrenhof des Rastatter
Schlosses", nicht „Foto von einem Artisten". Fehlt der Text, setzt die Seite eine Notlösung aus
Titel, Auftraggeber und Jahr ein — die ist korrekt, aber nichts wert.

⚠️ **Bevor ein Bild in den Bucket kommt:** Nutzungs- und Persönlichkeitsrechte müssen geklärt
sein. Bei Auftritten im öffentlichen Raum betrifft das Künstlerinnen, Künstler **und** Publikum.
Siehe `TODO.md` — das sind Launch-Blocker.

### Videos — sie werden nicht umgerechnet

> ⏳ **Mit dem Umbau bleibt nur das Hero-Video.** Filme zu Arbeiten werden verlinkt, nicht mehr
> ausgeliefert; die rechte Spalte der Tabelle und der Absatz zu Untertiteln entfallen. Für das
> Hero-Video zusätzlich: **Anfang und Ende müssen ineinander übergehen**, es läuft in Schleife
> unter dem Schriftzug — ein sichtbarer Sprung alle zwölf Sekunden fällt mehr auf als jeder
> Schnitt.

Anders als Bilder rührt die Pipeline Videos nicht an. Sie verzeichnet nur, was da ist, und die
Datei wird direkt aus dem Bucket ausgeliefert. Umrechnen bräuchte ffmpeg im Werkzeugkasten und
gehört ohnehin in die Hand dessen, der den Schnitt gemacht hat. **Also bitte fertig exportieren:**

| | Hero-Video (`original/hero/film.mp4`) | Film zu einer Arbeit (`original/video/<id>.mp4`) |
|---|---|---|
| Tonspur | **gar keine**, nicht nur stumm | mit Ton, er wird nur auf Wunsch abgespielt |
| Länge | 8–15 s, läuft in Schleife | so lang wie nötig |
| Format | H.264 in MP4, `+faststart` | H.264 in MP4, `+faststart` |
| Seitenverhältnis | egal, der Hero schneidet zu | **16:9** — der Rahmen richtet sich danach |
| Auflösung | 1920×1080 | 1920×1080 |
| Größe | **unter 8 MB** (die Pipeline warnt darüber) | keine harte Grenze, aber Vernunft |

```
# Hero: ohne Ton, kurz, klein
ffmpeg -i original.mov -an -t 12 -vf "scale=1920:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 26 -preset slow -movflags +faststart film.mp4

# Standbild daraus (kommt in den Bucket nach original/hero/standbild.jpg)
ffmpeg -i film.mp4 -ss 2 -vframes 1 -q:v 2 standbild.jpg
```

`-an` entfernt die Tonspur komplett, `-movflags +faststart` lässt das Video starten, bevor es
fertig geladen ist.

**Das Hero-Poster ist nicht optional** — iPhones spielen im Energiesparmodus gar kein Video ab,
auch kein stummes. Ohne `original/hero/standbild.jpg` sehen diese Besucher eine schwarze Fläche.
Dasselbe Standbild dient, solange kein Video da ist, auch selbst als Hero.

Filme zu Arbeiten laufen **nicht** von selbst und laden nur ihre Metadaten vor. Sie haben
**keine Untertitel** — sobald eine `.vtt` vorliegt, gehört sie als `<track>` in
`app/components/Film.tsx`; eine leere Spur wäre schlechter als keine, weil sie Barrierefreiheit
vortäuscht. Siehe `TODO.md`.

`HERO_VIDEO` in `lib/content.ts` ist der **Ausnahmeweg** für ein extern gehostetes Video (etwa
bei einem Streamingdienst) und hat Vorrang vor dem Bucket. Normalfall ist `null`.

### Vorschaukarten (OpenGraph)

> ⏳ **Mit dem Umbau nur noch eine Karte** (`start.jpg`) für alle Seiten — ohne Detailseiten gibt
> es keine Karte je Arbeit. Die Schriften wechseln auf Druk Wide und Avenir Next, **sofern die
> Lizenz Schrift in erzeugten Bildern erlaubt** (siehe „Schriften").

`scripts/og.mjs` erzeugt je Arbeit und einmal für die Seite selbst eine Karte unter
`public/og/<id>.jpg` (1200×630). Referenziert wird sie in `app/layout.tsx` und in
`generateMetadata` der Detailseite.

**Das ist die Karte, die WhatsApp und Slack zeigen.** Sie funktioniert schon ohne Fotos — dann
trägt sie Wortmarke, ●REC-Chip, Auftraggeber, Titel und Metazeile auf `--buehne`. Sobald Fotos da
sind, liegt das Foto dahinter, mit demselben Verlauf wie über den Kacheln.

| | |
|---|---|
| Quelle des Fotos | der lokale Zwischenspeicher `.medien-cache/`, nicht der Bucket. Fehlt er, entsteht die Karte **ohne** Foto statt gar nicht |
| Schriften | `assets/fonts/*.ttf` — nur lokal gelesen, **nicht** ausgeliefert. Warum doppelt: siehe `assets/fonts/README.md` |
| Format | **JPEG, nicht PNG.** `ImageResponse` liefert PNG; mit Foto waren das ~970 kB je Karte. Über sharp als JPEG sind es ~35 kB. Budget: Warnung ab 250 kB |
| Im Git | **ja** — rund zehn Dateien à 35 kB. So ist die Seite ohne den Bucket vollständig |
| Node | **≥ 22.18**, weil das Skript `lib/content.ts` direkt liest (Typen-Stripping). Kann Node das nicht, bricht nichts ab: Warnung, keine Karten |

⚠️ **Warum das nicht als `app/**/opengraph-image.tsx` gebaut ist**, obwohl Next genau das
anbietet: Genau so stand es zuerst da, `next build` hat die Karten sauber vorgerendert — **und im
echten Worker gaben sie 500 zurück** (`[unenv] fs.readFile is not implemented`). Der Adapter
bediente die Route nicht aus dem Vorrender-Cache, sondern führte sie zur Laufzeit aus, und dort
gibt es kein Dateisystem. Aufgefallen erst beim Prüfen gegen `wrangler dev`. Als statische Datei
ist das Problem strukturell weg.

### Was noch nach `public/` gehört — und was nicht

⚠️ **Alles unter `public/` wird unverändert und öffentlich ausgeliefert** — der Pfad in der URL
entspricht dem Pfad im Ordner, nur ohne `public`. Deshalb steht diese Anleitung hier und **nicht**
als `public/README.md`: Die lag dort kurzzeitig und wäre unter `jakobsax.de/README.md` für jeden
lesbar gewesen, inklusive der Hinweise auf ungeklärte Bildrechte. Beim Code-Review aufgefallen.

**Nicht nach `public/` gehören:** Rohdateien, interne Notizen und Bilder mit ungeklärten Rechten.
Fotos gehören generell nicht mehr dorthin, sondern in den Bucket.

## ⚠️ `package-lock.json` — nicht von Hand anfassen

Cloudflare baut mit **`npm ci`**, und das ist streng: Passt das Lockfile nicht exakt zu
`package.json`, bricht der Build ab, bevor überhaupt etwas kompiliert wird. `npm install`
auf dem eigenen Rechner ist dagegen nachsichtig und zieht Fehlendes still nach — der
Unterschied fällt deshalb erst im Deploy auf.

Am 2026-09-12 genau so passiert: Ein Commit „Update package-lock.json" entfernte drei
`@emnapi/*`-Einträge (Zubehör von `sharp` für Systeme ohne fertige Binärdatei). Lokal
lief alles weiter, der Cloudflare-Build scheiterte mit `Missing: @emnapi/runtime from
lock file`.

**Die Ursache ist ein Versionsunterschied:** Jan arbeitet mit **npm 11**, Cloudflare baut
mit **npm 10**. Die beiden räumen optionale, plattformabhängige Pakete unterschiedlich
auf. Ein unter npm 11 erzeugtes Lockfile kann unter npm 10 unvollständig sein.

**Daraus folgt:**

- `package-lock.json` **nie von Hand bearbeiten** — auch nicht im GitHub-Weboberflächen-Editor.
- Ändert sich eine Abhängigkeit: `npm install` laufen lassen und das Ergebnis committen.
- **Vor dem Push prüfen, ob der Build es akzeptiert** — dieselbe Prüfung, die Cloudflare macht:

  ```
  npm ci --dry-run
  ```

  Meldet das `EUSAGE` oder `Missing: … from lock file`, wäre der Deploy gescheitert.
- Kommt es trotzdem vor, ist die Reparatur ein `npm install` in einer Umgebung mit npm 10
  (oder von Claude aus dieser Sitzung, die auf Linux mit npm 10 läuft) und ein Commit des
  Ergebnisses.

## Tests und Werkzeuge

**Testläufer: Vitest** (`npm test`, `npm run test:watch`). Konfiguration in `vitest.config.mts`,
Tests liegen neben dem Code als `lib/*.test.ts`.

**Getestet wird ausschließlich die reine Logik in `lib/`** — die Validierung des Anfrageformulars
und die Ableitungen aus den Inhalten. (⏳ Die Formulartests entfallen mit dem Umbau, die
Datenzusagen werden auf `FOTOS`/`FILME` umgestellt: ids eindeutig, jeder Film mit
`https://`-Link, Beschriftung im Format „Titel – Kunde".) Für die Oberfläche gibt es den Browser-Durchlauf im
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
Bildoptimierer für `next/image` mit; die Optimierung passiert vorab in `npm run medien`).

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

⏳ **Nach dem Umbau** stattdessen: Pause-Knopf am Hero-Video (Tastatur, Screenreader-Ansage),
Video unter `prefers-reduced-motion` (darf nicht von selbst starten), Lichtkasten über alle
Bilder von `/foto`, Weiterleitungen der alten Adressen, und **die Navigation bei 320px mit der
echten Schrift** — Druk Wide ist so breit, dass „über mich" dort als Erstes umbricht.

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

> ❌ **Verworfen am 2026-10-08** mit der Neuausrichtung: Die Seite verkauft nichts, Kontakt ist
> eine Zeile mit E-Mail und Instagram auf `/ueber` (E6). Das bereits gebaute Formular samt Route
> wird in Schritt 5 des Umbaus entfernt; Resend, AV-Vertrag und Turnstile werden nie gebraucht.
> Der Text darunter bleibt zur Nachvollziehbarkeit stehen.

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
  ⏳ Mit dem Umbau gilt dasselbe für `next/font/local`: Druk Wide und Avenir Next kommen vom
  eigenen Worker, nie von Adobe Fonts oder einem Monotype-CDN (siehe „Schriften").

### Bilder & EXIF

- ✅ **Erledigt am 2026-08-28:** Auslieferung als AVIF/WebP mit `srcset`, Vorschaubildchen als
  Ladezustand, Größenbudget. Beschreibung oben unter „Medien".
- ✅ **Erledigt am 2026-08-28 — EXIF-Zeile:** Aufnahmedaten werden von `npm run medien` mit `exifr`
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
- ✅ **OG-Images vorab erzeugen**, nicht zur Laufzeit — auf dem Worker ist eine statische
  Datei die risikoärmere Variante, und genau das hat sich bestätigt (siehe „Vorschaukarten"
  oben). Umgesetzt; die Karten liegen fertig in `public/og/`.

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
- ❌ **Verworfen am 2026-10-08** (keine Detailseiten mehr, siehe `SITE-PLAN.md`) — der folgende
  Punkt gilt nicht mehr und wird mit dem Umbau durch Weiterleitungen ersetzt.
- **Routing:** perspektivisch eine statisch vorgerenderte Route pro Arbeit
  (`/arbeiten/[slug]`), gespeist aus dem bestehenden `WORKS`-Array in `lib/content.ts`. Die
  `id`-Felder dort dienen dann als Slug — sie sind entsprechend stabil zu halten, ein späterer
  Umbenennung wäre ein URL-Bruch.

## Konventionen

- Keine weiteren Frameworks/Build-Tools zusätzlich zum beschlossenen Next.js-Stack einführen, ohne dass es hier dokumentiert wird und beide (Jan & Jakob) das mittragen.
- Sprache im Code/Kommentaren: Deutsch oder Englisch ist beides ok, Konsistenz innerhalb einer Datei anstreben.
- Neue technische Entscheidungen (z.B. "wir nutzen jetzt ein CMS", "wir brauchen ein Kontaktformular mit Backend") hier ergänzen, sobald sie feststehen — nicht erst im Nachhinein.
