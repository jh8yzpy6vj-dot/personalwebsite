# TODO.md — Offene Aufgaben

Hier stehen alle offenen Aufgaben.

**Wer macht was:** Der Abschnitt „🙋 Nur Jan & Jakob können das" führt kompakt auf, was an einem
Menschen hängt — Freigaben, Konten, Material, Entscheidungen. Alles andere kann Claude selbst
erledigen. Die ausführlichen Beschreibungen stehen weiterhin unter „Kurzfristig" und
„Langfristig"; die Personenliste verweist nur darauf, damit es nicht zwei Wahrheiten gibt.

**Regel für kurzfristige Todos:** Wenn ein kurzfristiger Punkt erledigt ist, wird er hier **entfernt** und stattdessen als Eintrag in `AGENT-LOG.md` dokumentiert (siehe dort für Format).

**Regel für langfristige Todos:** Bleiben hier stehen, bekommen aber ein Status-Symbol:
- 🔲 offen / noch nicht begonnen
- ⏳ in Arbeit
- ✅ erledigt (Log-Eintrag in `AGENT-LOG.md` verlinken, dann den Punkt hier nach kurzer Zeit archivieren/entfernen)

---

## 🧭 UMBAU: Präsenz statt Verkauf — Umsetzungsplan (Stand 2026-10-08)

> **Grundlage:** Jakobs Konzept vom 2026-10-08, im Wortlaut oben in `SITE-PLAN.md`. Es ersetzt
> die bisherige Ausrichtung („aus Gesehenem eine Anfrage machen"). **Die Seite verkauft nichts
> mehr** — kein Angebot, kein Preis, kein Formular, kein „hier buchen". Sie ist eine Bühne für
> Fotos und Filme und tritt selbst zurück.
>
> **Die Reihenfolge ist verbindlich:** erst die Entscheidungen (Schritt 0), dann der Vertrag
> (Schritt 1), dann der Code (Schritte 2–6). So verlangt es `CLAUDE.md`: Widerspricht eine
> Änderung dem UI-SPEC, wird zuerst der Vertrag angepasst.
>
> ⚠️ **Viele Punkte weiter unten in dieser Datei werden durch den Umbau hinfällig.** Sie bleiben
> stehen, bis Schritt 1.4 sie mit Log-Eintrag entfernt. Bis dahin gilt bei Widerspruch dieser
> Abschnitt.

### Zielbild

| Route | Inhalt | Text auf der Seite |
|-------|--------|--------------------|
| `/` | Video in voller Fensterhöhe, mittig der Schriftzug „jakob sax", darüber die Navigation | Schriftzug und Navigation, sonst nichts |
| `/foto` | Mosaik aus den Fotos aller Arbeiten, jedes Bild in seiner eigenen Form | „Titel – Kunde", erst beim Überfahren bzw. im Lichtkasten (E4) |
| `/film` | Raster aus Standbildern, jedes ein Link nach außen (YouTube, Vimeo, Mediathek) | je Film „Titel – Kunde" |
| `/ueber` | Bild links, rechts 3–4 Zeilen, darunter E-Mail und Instagram | 3–4 Zeilen |
| `/impressum`, `/datenschutz` | Pflichtseiten | nur im Footer verlinkt, nicht im Header |

**Navigation:** foto · film · über mich. Der Schriftzug führt zur Startseite.

**Fällt weg:** `/arbeiten`, `/arbeiten/[slug]`, `/leistungen/[slug]`, `/kontakt`, das
Anfrageformular samt API-Route, Preisanker, „Anfrage stellen", Referenzzeile, Porträt auf der
Startseite („nicht durch meine Fresse"), EXIF-Zeile, Kontaktbogen, selbst gehostete Filme.

**Was wiederverwendet wird:** Medien-Pipeline (R2, `npm run medien`, AVIF/WebP, GPS-Entfernung),
Hero mit Video und Standbild, `Mosaik` mit Lichtkasten und Blättertasten, `Bild`, `LegalPage`,
Impressum/Datenschutz, Sicherheits-Header, `INDEXABLE`-Schalter.

---

### Schritt 0 — Entscheidungen (Jakob, mit Jan)

Jede Frage hat eine Empfehlung. **Bis jemand widerspricht, wird mit der Empfehlung gebaut.** Die
Stellen sind so angelegt, dass ein späterer Wechsel billig bleibt (letzte Spalte).

✅ = **von Jakob entschieden am 2026-10-08** (über Jan). Für die übrigen gilt die Empfehlung, bis
jemand widerspricht.

| # | Frage | Empfehlung | Warum | Wo ein Wechsel ansetzt |
|---|-------|------------|-------|------------------------|
| E1 | Grundfläche hell oder dunkel? | **Dunkel, eine einzige Fläche** für die ganze Seite | Das Video im Hero geht nahtlos in die Seite über; Fotos und Standbilder tragen auf fast Schwarz am stärksten; eine Fläche statt zwei Hälften ist die reduzierteste Form | drei Farb-Tokens in `app/globals.css` |
| E2 ✅ | Bleibt das rote ●REC als Akzent? | **Entschieden: Das ●REC bleibt.** Rot ist die **einzige** Farbe neben Grund und Schrift und dem ●REC vorbehalten. Ob es zusätzlich den Fokusring trägt, legt 1.2 fest — sonst nirgends | Seine Bildmarke. Als einzige Farbe auf einer sonst farblosen Seite wirkt sie stärker als vorher | Token `--rec` bleibt |
| E3 | Ist die Startseite nur das Video? | **Ja**, nichts darunter, kein Scrollen | Konzept: „Startseite (Video)". Alles andere hat eine eigene Seite | `app/page.tsx` |
| E4 ✅ | Foto: ein Mosaik oder nach Arbeit gruppiert? | **Entschieden: ein Mosaik, ohne Zwischenzeilen.** Arbeiten hintereinander. „Titel – Kunde" beim Überfahren (nur mit Maus) und im Lichtkasten (überall) | Die Fläche bleibt textfrei, die Zuordnung trotzdem erreichbar | Zwischenzeilen wären eine Zeile in `app/foto/page.tsx` |
| E5 ✅ | Schriftlizenzen? | **Entschieden: Jakob hat die Lizenzen.** Beide Schriften werden selbst ausgeliefert (`next/font/local`), kein Ersatz. ⚠️ Vorher prüfen, dass es eine **Web**-Lizenz ist (siehe 1.3), und die `woff2`-Dateien besorgen (Schritt 7) | Eine Desktop-Lizenz erlaubt in der Regel nicht, die Schrift in eine Website einzubetten | je Familie eine CSS-Variable |
| E6 ✅ | Kontakt? | **Entschieden: E-Mail und Instagram als Zeile auf `/ueber`.** Kein Formular, keine vertraulichen Kanäle | Kein „hier buchen", aber erreichbar bleiben. Ein Vertraulichkeitsversprechen ohne eingerichtete Kanäle ist schlimmer als keines | `lib/content.ts` |
| E7 | Schreibweise | Wie im Konzept: „jakob sax" klein; Navigation klein, **ohne** Schlusspunkt | Der Punkt-Stil (`arbeiten.`) gehört zur alten Gestaltung, Jakobs Konzept nutzt ihn nicht | Labels in `lib/nav.ts` |
| E8 | Detailseiten je Arbeit? | **Weg** | Im Konzept nicht vorgesehen, und sie bestehen vor allem aus Text. Verlust: eine eigene URL je Festival für die Suche — das war ein Verkaufsargument | Weiterleitungen in `next.config.mjs` |
| E9 | Filmworkshops? | **Kein eigener Bereich.** Ein Film aus dem Workshop kann in `/film` stehen | Nicht im Konzept, ohne Angebotsseiten gibt es keinen Ort dafür | — |
| E10 ✅ | Kundennamen | **Entschieden: ohne „e.V."**, also „WiWaWo 2026 – Bayerischer Kanuverband". Daraus als Copy-Regel fürs UI-SPEC: **keine Rechtsformzusätze** (e.V., GmbH, gGmbH) in der Beschriftung | Kürzer, und die Rechtsform sagt dem Betrachter nichts | `lib/content.ts` |
| E11 | Externe Filmlinks im selben Tab? | **Ja, selber Tab** | Der Zurück-Knopf führt zurück; neue Tabs ungefragt zu öffnen ist eine Barriere | `app/film/page.tsx` |
| E12 | SWR-Autorenseite auf `/ueber` verlinken? | **Ja, als eine Zeile** neben E-Mail und Instagram | Kostet keinen Text, und sie verknüpft für Google „Jakob Sax, SWR" mit dieser Seite (`sameAs`) | `lib/content.ts` |

---

### Schritt 1 — Vertrag und Dokumente (Claude, kein Code)

- [ ] **1.1 `SITE-PLAN.md` neu fassen.** Zielbild und Absicht aus dem Konzept. Die bisherigen
  Abschnitte (drei Standbeine, Zielgruppen, Startseite als Weiche, drei Türen, Archiv) wandern
  unter „Abgelöst" — **verschieben, nicht löschen**, damit nachvollziehbar bleibt, warum sie
  einmal galten. Anti-Features ergänzen: kein Angebot, kein Preis, kein Formular, kein Text, der
  nicht Titel, Kunde oder die 3–4 Zeilen auf `/ueber` ist.
  - Dabei ausdrücklich festhalten: Die alte Regel „Journalismus ist keine Ware, deshalb getrennt
    vom Angebot" **erledigt sich**, weil es kein Angebot mehr gibt. Y-Kollektiv steht in `/film`
    neben einem Aftermovie, und das ist jetzt richtig.
- [ ] **1.2 `design/UI-SPEC.md` neu schreiben.** Abschnitte:
  - Positionierung (Präsenz statt Verkauf) und Seitenstruktur (Tabelle oben)
  - Farbe nach E1/E2: Grund, Schrift, gedämpfte Schrift, Linie. Kontrastwerte nachrechnen
  - Typografie: **zwei Familien** (Druk Wide Bold für Schriftzug, Navigation und Seitentitel;
    Avenir Next für alles andere), neue Größenskala, Mobilstufen
  - Copy: Format „Titel – Kunde" (Halbgeviertstrich mit Leerzeichen, wie im Konzept), Labels der
    Navigation, 404-Text, Leerzustände
  - Bildbehandlung: Mosaik unbeschnitten (wie bisher), Film-Standbilder in festem Seitenverhältnis
    mit Ausschnitt aus `lib/bildausschnitte.ts`, Hero-Video mit Abdunklung unter dem Schriftzug
  - Motion: Hero-Video mit **Pause-Knopf** (Pflicht, siehe 4.1), `prefers-reduced-motion`
  - Zustände: kein Video, kein Standbild, Arbeit ohne Bilder, Film ohne Standbild, leere Seite
  - **Sign-Off neu einholen** (`gsd-ui-checker`). Das alte deckt einen Entwurf, den es dann nicht
    mehr gibt
- [ ] **1.3 `TECH-STACK.md` nachziehen.**
  - **Schriften:**
    - **Jakob hat die Lizenzen (E5).** Beide Familien — *Druk Wide Bold* (Commercial Type) und
      *Avenir Next* (Linotype/Monotype) — werden über `next/font/local` aus `app/fonts/` selbst
      ausgeliefert.
    - ⚠️ **Vor dem Einchecken klären, welche Lizenz es ist.** Schriften werden getrennt für
      Desktop, Web, App und Video lizenziert. Nur eine **Web-Lizenz** erlaubt, die Datei auf
      einem Server abzulegen. In `TECH-STACK.md` festhalten: Lizenzart, Lizenznehmer, Grenze der
      Seitenaufrufe (falls vorhanden), ob Selbsthosting erlaubt ist. Die Lizenzurkunde selbst
      gehört **nicht** ins Repo.
    - Falls es für Avenir Next nur eine Desktop-Lizenz gibt, ist der Rückfallweg der
      Systemname `font-family: "Avenir Next", …`. Auf macOS und iOS ist sie vorinstalliert und
      erscheint dort ohne Download; Windows und Android bekommen einen freien Ersatz. Damit ist
      keine Web-Lizenz nötig.
    - Nur die Schnitte einbinden, die das UI-SPEC wirklich nutzt — jede Datei kostet Ladezeit.
    - ⚠️ **Keine Schrift von einem fremden Server laden** (Adobe Fonts, Google-CDN). Das wäre eine
      Datenübermittlung an Dritte und müsste in die Datenschutzerklärung.
    - ⚠️ **Vorschaukarten (`scripts/og-karte.mjs`) rendern Schrift in ein Bild.** Ob die Lizenz
      das deckt, mit prüfen.
  - **Wegfall:** Mailer/Resend, AV-Vertrag, Turnstile, Worker-Secrets `RESEND_API_KEY`,
    `ANFRAGE_AN`, `ANFRAGE_VON`.
  - **Bucket-Pfade:** neu `original/film/<id>.jpg` für Standbilder; `original/video/<id>.mp4` und
    `…/serie/` entfallen. `original/arbeiten/<id>/01.jpg …` **bleibt unverändert**, damit nichts
    neu hochgeladen werden muss.
  - Weiterleitungen (5.3) und Linkprüfung (2.5).
- [ ] **1.4 `TODO.md` aufräumen.** Hinfällig werden — jeweils mit kurzer Begründung in den
  Log-Eintrag, dann hier entfernen:
  - Kurzfristig: Versand des Anfrageformulars, Turnstile, drei Türen, Zitat von tête-à-tête,
    Projektkontext je Arbeit, Beschreibungstexte, Lebenslauf verlinken, Bildausschnitte im Hero
    der Detailseite, Seitenstruktur prüfen lassen (wird durch 1.2 ersetzt), `wiwawo-53`
    gegenlesen (`role`/`category` gibt es nicht mehr; bleibt nur die Frage nach Titel und Kunde)
  - Langfristig: Preisangaben, „Startseite wiederholt sich", „Trägt die Archivstruktur?",
    „Kategorien mischen zwei Denkweisen", „`content.ts` mischt fünf Belange", Untertitel für die
    Filme, eigene URL pro Arbeit, Kontaktbogen, EXIF-Zeile
  - Launch-Blocker: vertrauliche Kanäle (entfallen, entschieden mit E6), Mailer-Teil der
    Datenschutzerklärung
  - Personenliste: Preisrahmen, vertrauliche Kanäle, Lebenslauf, Zitat (Jakob); Mailer, Turnstile
    (Jan)
  - Die Bestandsaufnahme (CSV) schrumpft auf zwei Listen: Fotoarbeiten und Filme (siehe Schritt 7)
- [ ] **1.5 Log-Eintrag** in `AGENT-LOG.md`.

---

### Schritt 2 — Datenmodell und Medien (Claude)

- [ ] **2.1 `lib/content.ts` neu.** Statt `WORKS`, `CATEGORIES`, `SERVICES`, `REFERENCES`:

      export type Fotoarbeit = { id: string; titel: string; kunde: string; jahr: number };
      export type Film       = { id: string; titel: string; kunde: string; jahr: number; link: string };
      export const FOTOS: Fotoarbeit[] = [ … ];
      export const FILME: Film[] = [ … ];

  - **Die Reihenfolge in der Datei ist die Reihenfolge auf der Seite.** Keine Sortierung nach
    Jahr — die Auswahl und Abfolge ist Jakobs Kuration, und genau die soll die Seite zeigen.
  - `id` bleibt der Ordnername im Bucket: `wiwawo-53` behält seine sieben Bilder ohne neuen
    Upload.
  - `ABOUT` schrumpft auf `zeilen` (3–4), `portraitAlt`, `email`, `instagram`, `swr`. `CONTACT`
    und die vertraulichen Kanäle entfallen.
  - Startbestand aus dem, was belegt ist: Foto `wiwawo-53`; Filme WiWaWo 50–52, Y-Kollektiv
    „Tödliches Gold" — **Links und Standbilder fehlen** (Schritt 7). Nichts erfinden: Einträge
    ohne Link bleiben draußen.
- [ ] **2.2 `lib/works.ts` → `lib/arbeiten.ts`.** Nur noch: `beschriftung(a)` →
  `"Titel – Kunde"`, `fotosMitBildern()`, `filmeMitStandbild()`.
  - **Regel: Was kein Bild hat, erscheint nicht.** Eine Seite, die nur aus Bildern besteht, darf
    keine grauen Platzhalterkacheln zeigen. `npm run medien` nennt stattdessen, was fehlt.
- [ ] **2.3 `lib/bilder.ts` / `lib/video.ts` ausdünnen.** Raus: `serieZurArbeit`,
  `aufnahmeZeile`, `streckenZeile`, `videoZurArbeit`. Neu: `standbildZumFilm(id)` →
  `film/<id>`. `heroVideo()` bleibt.
  - ⚠️ **Die GPS-Entfernung in `scripts/exif.mjs` bleibt** — nur die Anzeige der EXIF-Zeile
    fällt weg, nicht der Schutz.
  - Alt-Texte: je Bild optional, sonst Rückfall auf „Titel – Kunde, Bild n". Korrekt, aber
    schwach — echte Beschreibungen kommen von Jakob.
  - `arbeiten/wiwawo-53` (Leitbild ohne Nummer): beim Umbau ansehen und entweder als erstes Bild
    ins Mosaik nehmen oder aus dem Bucket entfernen.
- [ ] **2.4 `scripts/medien.mjs` → `pruefeZuordnung`** auf die neuen Pfade umstellen:
  `arbeiten/<id>/NN` gegen `FOTOS`, `film/<id>` gegen `FILME`, dazu `hero/film`,
  `hero/standbild`, `portrait`. Zusätzlich warnen: Fotoarbeit ohne Bilder, Film ohne Standbild.
- [ ] **2.5 Linkprüfung: `npm run links`** (neues Skript). Ruft jeden `FILME[].link` ab und meldet
  alles außer 200. **Bewusst nicht im Build:** Ein Build darf nicht davon abhängen, ob YouTube
  gerade antwortet.
  - Grund: **ARD- und SWR-Mediathek depublizieren nach Ablauf der Verweildauer.** Ein toter Link
    auf einer Seite, die nur aus Links besteht, ist ein sichtbarer Mangel. Wo es einen dauerhaften
    Ort gibt (YouTube-Kanal von Y-Kollektiv/funk), den bevorzugen.
- [ ] **2.6 `scripts/og.mjs`:** Nur noch eine Karte (`start.jpg`) für alle Seiten — ohne
  Detailseiten gibt es keine Karte je Arbeit. Neue Schrift, keine Positionierungszeile. Alte
  Karten räumt das Skript selbst weg.
- [ ] **2.7 Tests:** `lib/works.test.ts` → `lib/arbeiten.test.ts` (ids eindeutig, jeder Film hat
  einen `https://`-Link, Beschriftung im richtigen Format, Arbeiten ohne Bild fallen heraus).
  Aus `lib/bilder.test.ts` die Teile zu Blende, Kontaktbogen und Aufnahmezeile entfernen;
  Mosaik, Bildausschnitte und Manifest bleiben.

---

### Schritt 3 — Gestaltungsgrundlage (Claude, nach 1.2)

- [ ] **3.1 `app/globals.css`:** Tokens nach UI-SPEC. Die Hälften-Logik (`--buehne`/`--papier`,
  Naht, `#lesen`) fällt weg. `medien-scrim` bleibt für den Hero.
- [ ] **3.2 Schriften in `app/layout.tsx`:** Bricolage Grotesque, Newsreader und Martian Mono
  raus; Druk Wide Bold und Avenir Next über `next/font/local` rein. Rückfallschriften mit
  angepasster Größe, damit beim Laden nichts springt.
- [ ] **3.3 `Topbar` neu und einfacher.** Kein `<dialog>`-Menü mehr — drei Ziele passen
  ausgeschrieben auch aufs Telefon (bei 320 px Breite nachmessen; passt es nicht, rutscht die
  Navigation unter den Schriftzug, sie wird nicht eingeklappt). Kein Hälften-Beobachter.
  - **●REC bleibt (E2)** und steht beim Schriftzug: in der Topbar und auf `/` beim großen
    Schriftzug in der Mitte. Die genaue Stelle legt 1.2 fest.
  - Auf `/` steht links **kein** Schriftzug, weil er groß in der Mitte des Videos steht. Auf allen
    anderen Seiten links „jakob sax", rechts die Navigation.
  - Aktive Seite markiert (`aria-current`), wie bisher über `isCurrent`.
- [ ] **3.4 `SiteFooter`:** Impressum · Datenschutz. Sonst nichts.
- [ ] **3.5 `Cache-Control` für HTML** (steht unter „Kurzfristig") **in diesen Umbau vorziehen.**
  Bei einem Strukturumbau ist veraltetes HTML im Edge-Cache besonders tückisch: alte Seiten mit
  Links auf Routen, die es nicht mehr gibt.

---

### Schritt 4 — Die Seiten (Claude)

- [ ] **4.1 Startseite `/`.**
  - `<video autoplay muted loop playsinline poster=…>` in voller Fensterhöhe (`100svh`), darüber
    mittig „jakob sax" als `<h1>` (echter Text, kein Bild — Screenreader und Suche).
  - **Pause-Knopf, klein in einer Ecke.** Pflicht nach WCAG 2.2.2: Was sich länger als fünf
    Sekunden von selbst bewegt, muss sich anhalten lassen.
  - `prefers-reduced-motion`: kein Autoplay; Standbild mit Abspielknopf.
  - Rückfälle: kein Video → Standbild; weder noch → leere Fläche mit Schriftzug. **Das Standbild
    muss allein tragen** — iOS spielt im Energiesparmodus nichts automatisch ab.
  - Optional: eine kleinere Fassung fürs Telefon (`<source media=…>`) — erst, wenn das Video da
    ist und die Messung es verlangt.
  - Vorbild für die Anmutung: bildmanufaktur.de.
- [ ] **4.2 `/foto`.**
  - `Mosaik` über alle Fotoarbeiten in Dateireihenfolge. Die Komponente bekommt je Bild die
    Beschriftung mit; der Lichtkasten zeigt „Titel – Kunde" und blättert über **alle** Bilder
    der Seite, nicht nur innerhalb einer Arbeit.
  - Beschriftung beim Überfahren nur mit `@media (hover: hover)`. Auf Touch ist der Lichtkasten
    der Weg.
  - Ladezeit: die ersten Bilder sofort, der Rest `loading="lazy"`; Größen über `MOSAIK_SIZES`.
    Mit wachsendem Bestand prüfen, ob die Seite noch schnell steht.
- [ ] **4.3 `/film`.**
  - Raster, zweispaltig ab Tablet, einspaltig am Telefon. Kachel = Standbild in festem
    Seitenverhältnis (16:9) + Zeile „Titel – Kunde" darunter. Die ganze Kachel ist der Link.
  - **Standbilder liegen bei uns** (`film/<id>`), keine Vorschaubilder von YouTube nachladen —
    das wäre eine Anfrage an Google bei jedem Seitenaufruf und gehörte in die
    Datenschutzerklärung.
  - Ziel für Screenreader benennen („auf YouTube"), ein kleines ↗ für Sehende.
- [ ] **4.4 `/ueber`.**
  - Ab Tabletbreite zweispaltig: Bild links, rechts die 3–4 Zeilen, darunter E-Mail, Instagram,
    SWR-Autorenseite. Am Telefon untereinander, Bild zuerst.
  - Porträt aus `original/portrait.jpg` (liegt schon im Bucket). Ob Jakob dieses Bild will oder
    ein anderes, fragen — „nicht durch meine Fresse" heißt mindestens: nur hier.
- [ ] **4.5 Impressum und Datenschutz** auf den neuen Tokens. Datenschutz bereinigen: Formular,
  Versanddienstleister und Turnstile raus (`VERSAND_AKTIV` in `lib/legal.ts` entfällt).
  Beschreiben, was wirklich passiert: Hosting bei Cloudflare, Medien von der eigenen
  Medien-Domain, selbst ausgelieferte Schriften, externe Links erst beim Klick.
- [ ] **4.6 404-Seite** in der neuen Gestaltung; führt weiter zu foto und film.
- [ ] **4.7 Metadaten.**
  - Seitentitel „foto — jakob sax" usw., kurze Beschreibungen.
  - `StructuredData`: nur noch `Person` mit `sameAs` (SWR, Instagram). `ProfessionalService`
    fällt weg — es gibt keinen Dienst mehr.
  - `sitemap.ts`: vier Adressen.

---

### Schritt 5 — Abbau und Weiterleitungen (Claude)

- [ ] **5.1 Löschen:**
  - Routen: `app/arbeiten/`, `app/leistungen/`, `app/kontakt/`, `app/api/anfrage/`
  - Komponenten: `AnfrageForm`, `Kachelraster`, `Kontaktbogen`, `UeberAnriss`, `Works`, `Film`,
    `Blende` (jeweils mit `.module.css`)
  - Bibliotheken: `lib/anfrage.ts` und `lib/anfrage.test.ts`, `lib/mailer.ts`
  - CSS-Module der alten Startseite
- [ ] **5.2 Prüfen, dass nichts ins Leere zeigt:** keine Importe auf Gelöschtes, keine Links auf
  entfernte Routen, keine verwaisten CSS-Klassen. Danach `npm run lint`, `npm test`,
  `npm run build`, `npm run cf:build`.
- [ ] **5.3 Weiterleitungen in `next.config.mjs`** (dauerhaft, 308):

  | Von | Nach |
  |-----|------|
  | `/arbeiten` und `/arbeiten/:slug` | `/foto` |
  | `/leistungen/:slug` | `/` |
  | `/kontakt` | `/ueber` |

  Die Seite war nie indexiert. Die Weiterleitungen sind trotzdem billig und fangen Links ab, die
  schon herumgeschickt wurden.

---

### Schritt 6 — Prüfen und ausliefern

- [ ] **6.1 Lokal im Worker-Laufzeitmodell** (`npm run cf:preview`), nicht nur `next dev`.
- [ ] **6.2 Im Browser:**
  - Breiten 375 / 768 / 1440
  - nur Tastatur: Fokus sichtbar, Lichtkasten, Pause-Knopf
  - `prefers-reduced-motion`
  - Video fällt aus → Standbild
  - gedrosseltes 4G: Startseite mit Standbild als größtem Element unter 2,5 s
- [ ] **6.3 UI-Prüfung** gegen das neue UI-SPEC (`gsd-ui-checker`).
- [ ] **6.4 Ein einziger Push.** ⚠️ `main` geht sofort live. Die Schritte 2–5 deshalb **lokal als
  einzelne Commits** sammeln und erst zusammen pushen, wenn 6.1–6.3 bestanden sind. Sonst steht
  zwischendurch eine halb umgebaute Seite online, mit Navigation auf Seiten, die es noch nicht
  oder nicht mehr gibt.
  - Alternative: Arbeitsbranch mit Cloudflare-Vorschau. Das wäre eine Änderung am Workflow und
    müsste laut `CLAUDE.md` erst dort eingetragen werden. Für einen einmaligen Umbau einer
    ungelisteten Seite lohnt das nicht.
- [ ] **6.5 Log-Einträge** in `AGENT-LOG.md`, je abgeschlossenem Schritt.

---

### Schritt 7 — Material von Jakob (läuft parallel, ab sofort)

**Der eigentliche Engpass.** Im Bucket liegen heute acht Bilder (sieben von `wiwawo-53`, ein
Porträt) und **kein einziges Video**. Eine Seite, die nur aus Arbeit besteht, ist ohne Material
leer — der Code ist in Schritt 2–6 schneller fertig als das.

| Was | Vorgaben | Ablage |
|-----|----------|--------|
| **Hero-Video** | stumm, 8–15 s, Anfang und Ende gehen ineinander über (Loop), H.264-MP4, 1920 px breit, unter 8 MB (Details und ffmpeg-Zeile in `TECH-STACK.md`, „Medien") | `original/hero/film.mp4` |
| **Standbild zum Video** | ein Frame aus dem Video, der allein trägt | `original/hero/standbild.jpg` |
| **Fotos** | Auswahl je Arbeit; über alle Arbeiten lieber 20–40 starke als 100 gute | `original/arbeiten/<id>/01.jpg`, `02.jpg`, … |
| **Liste Fotoarbeiten** | je Zeile: Titel, Kunde, Jahr | an Jan/Claude → `lib/content.ts` |
| **Liste Filme** | je Zeile: Titel, Kunde, Jahr, **Link** | an Jan/Claude → `lib/content.ts` |
| **Standbild je Film** | Querformat | `original/film/<id>.jpg` |
| **Über mich** | 3–4 Zeilen; Wahl des Bildes | `lib/content.ts`, `original/portrait.jpg` |
| **Schriftdateien** | Druk Wide Bold und Avenir Next als `woff2` (Web-Fassung aus dem Lizenzpaket), dazu die Angabe, welche Lizenz es ist (E5) | an Jan/Claude → `app/fonts/` |

- **WiWaWo 50–52** liegen nirgends öffentlich, die Seite hat sie bisher selbst ausliefern wollen.
  Für `/film` müssen sie auf YouTube oder Vimeo (eigener Kanal oder der des BKV).
- **Freigaben bleiben nötig, auch ohne Verkauf:**
  - Bild- und Persönlichkeitsrechte an den Fotos
  - Nennung der Kunden
  - SWR-Nebentätigkeit: Ist **Verlinken** von eigenen Beiträgen unproblematisch? Vermutlich
    ja, aber fragen.

---

### Schritt 8 — Danach

- [ ] `npm run links` regelmäßig laufen lassen, z. B. vierteljährlich oder als geplanter Lauf.
- [ ] `INDEXABLE` auf `true`, sobald die verbleibenden Launch-Blocker erledigt sind. Übrig nach
  dem Umbau: Rechtstexte prüfen lassen, Bild- und Persönlichkeitsrechte, Kundennennung,
  Nebentätigkeit, Jakobs Freigabe aller Texte.
- [ ] Domain-Entscheidung (`.de`/`.media`), cookielose Analytics — beide unverändert offen.

### Umfang und Abhängigkeiten

| Schritt | Wer | Hängt an | Umfang |
|---------|-----|----------|--------|
| 0 Entscheidungen | Jakob, Jan | — | ein Gespräch |
| 1 Vertrag | Claude | 0 (oder Empfehlungen) | mittel |
| 2 Datenmodell | Claude | 1 | mittel |
| 3 Grundlage | Claude | 1.2, Schriftdateien von Jakob | mittel |
| 4 Seiten | Claude | 2, 3 | groß |
| 5 Abbau | Claude | 4 | klein |
| 6 Ausliefern | Claude, Jan (Push) | 5 | klein |
| 7 Material | Jakob | — | **der lange Pol** |

Die Schritte 1–6 sind ohne Material baubar: Die Seiten zeigen dann ehrlich, was da ist. Live
geht der Umbau aber am besten erst, wenn mindestens das **Hero-Standbild**, **eine Fotoarbeit**
und **drei Filme mit Standbild** vorliegen. Sonst ist `/film` leer.

---

## 🚫 LAUNCH-BLOCKER — muss erledigt sein, bevor die Seite öffentlich beworben wird

> ⚠️ Achtung: Laut `TECH-STACK.md` geht **jeder Push auf `main` sofort live**. Zwischen „hier notiert" und „öffentlich online" steht nichts. Diese Punkte deshalb vor dem Push abarbeiten oder den Push zurückhalten.

- [ ] **Pflichtangaben — Daten sind drin, Prüfung fehlt.** ✅ Anschrift (Röttererbergstraße 1, 76437 Rastatt) und E-Mail (`mail@jakobsax.de`) sind am 2026-08-27 eingetragen, `LEGAL_DATA_COMPLETE` steht auf `true`. Offen bleibt:
  - ⚠️ **Von jemandem gegenlesen lassen, der Rechtsberatung darf.** Struktur und Bausteine sind üblich, aber **nicht anwaltlich geprüft**. Das ist der eigentliche verbleibende Blocker.
  - ✅ **Wohnadresse: von Jakob am 2026-08-27 ausdrücklich bestätigt.** Das Risiko (dauerhaft öffentlich auffindbar, bei einem Journalisten mit Rechtsextremismus-Recherche relevant) und die Alternativen wurden vorher benannt. Nicht ohne Rücksprache ändern.
  - **USt-IdNr., falls vorhanden** (`DE` + neun Ziffern) in `lib/legal.ts` ergänzen. § 5 DDG fordert sie nur „soweit vorhanden" — ohne eine erscheint der Abschnitt gar nicht, und ein Hinweis auf § 19 UStG ist **nicht** nötig (der gehört auf Rechnungen). ⚠️ **Niemals die normale Steuernummer eintragen.**
  - **§ 18 Abs. 2 MStV, falls einschlägig:** Der Abschnitt erscheint nur, wenn `mstvResponsible` gesetzt ist. Ein reines Portfolio ist in der Regel kein journalistisch-redaktionelles Angebot; eigene Beiträge oder redaktionell aufbereitete Bildstrecken können die Pflicht auslösen.
  - **Beim Umsetzen des Kontaktformulars und der Analytics:** Die Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert. Formular, Versanddienstleister, Turnstile und Web Analytics müssen dort ergänzt werden, sobald sie live sind — Stellen sind in `app/datenschutz/page.tsx` als Kommentar markiert.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Vertrauliche Kanäle sind noch Platzhalter.** ✅ Die E-Mail-Adresse ist seit 2026-08-27 echt (`mail@jakobsax.de`, ersetzt den erfundenen Platzhalter). ⚠️ **Signal, Threema und PGP stehen weiterhin auf „noch einzutragen"** — echte Werte einsetzen oder den Block entfernen. Ein Vertraulichkeitsversprechen an Quellen ohne funktionierenden Kanal ist schlimmer als keines.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Dürfen SWR-Beiträge eingebettet werden, oder nur auf die Autorenseite verlinkt?
- [ ] **Bild- und Persönlichkeitsrechte** an den Festivalfotos klären: Was darf werblich auf die eigene Seite, was nur ins Kundenarchiv? Bei Auftritten im öffentlichen Raum sind Persönlichkeitsrechte von Künstlerinnen, Künstlern und Publikum ein reales Thema.
- [ ] **Referenznennungen freigeben lassen:** Dürfen tête-à-tête und der Bayerische Kanu-Verband namentlich genannt werden?

## 🙋 Nur Jan & Jakob können das — Claude nicht

Kurzliste dessen, was an einem Menschen hängt. **Die Details stehen jeweils weiter unten**, hier
nur, wer was anstoßen muss. Alles, was nicht hier steht, kann Claude selbst erledigen.

### Jakob

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Bilder liefern und auswählen** | Ohne Fotos ist die Seite Kosmetik. 12–20 starke schlagen 60 gute — die Auswahl kann nur er treffen. Technisch ist alles vorbereitet: Datei als `original/arbeiten/<id>.jpg` in den R2-Bucket, fertig (`TECH-STACK.md`, „Medien") |
| 🔲 | **Hero-Video liefern** (stumm, plus Standbild) | Vorgaben in `TECH-STACK.md` |
| 🔲 | **Bestandsaufnahme ausfüllen** (CSV liegt bei Jan) | Nur er weiß, was es gibt und was gezeigt werden darf |
| 🔲 | **Alle Inhalte gegenlesen** | Alles in `lib/content.ts` stammt ungeprüft aus dem Briefing |
| 🔲 | **Zwei Sätze Kontext je Arbeit** schreiben | Wird nicht erfunden |
| 🔲 | **Preisrahmen festlegen** — und sei es „Tagessatz ab X" | Halbiert die unpassenden Anfragen |
| 🔲 | **Vertrauliche Kanäle** einrichten (Signal, Threema, PGP) | ⚠️ Stehen auf „noch einzutragen". Ein Vertraulichkeitsversprechen ohne funktionierenden Kanal ist schlimmer als keines |
| 🔲 | **USt-IdNr. mitteilen**, falls vorhanden | Nie die normale Steuernummer |
| 🔲 | **Nebentätigkeit beim SWR klären** | Genehmigung nötig? Dürfen Beiträge eingebettet werden? |
| 🔲 | **Bild- und Persönlichkeitsrechte klären** | Was darf werblich auf die Seite, was nur ins Kundenarchiv? |
| 🔲 | **Referenznennungen freigeben lassen** (tête-à-tête, BKV) | Dazu gleich um ein **Zitat** bitten — billigstes Vertrauenselement überhaupt |
| 🔲 | **Onetake-Rechte klären**, falls die Arbeiten gezeigt werden sollen | Liefen über eine Firma, an der er nicht mehr beteiligt ist |
| 🔲 | **Lebenslauf anlegen** (Notion o.ä.) | `/ueber` verlinkt bewusst keinen, weil es keinen gibt |

### Jan

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Patches einspielen und pushen** | Claude hat keinen Schreibzugriff |
| 🔲 | **Schreibzugriff für Claude freischalten** | GitHub-App auf „Read and write", siehe unten |
| 🔲 | **Mailer-Anbieter wählen** + Konto + **AV-Vertrag** | Vertrag nach Art. 28 DSGVO, Häkchen im Anbieterkonto |
| 🔲 | **Absenderdomain verifizieren** und **Worker-Secrets setzen** | Nur mit Zugang zum Cloudflare- und Anbieterkonto möglich |
| 🔲 | **Cloudflare Web Analytics aktivieren** | Dashboard, nicht per Code |
| 🔲 | **Turnstile-Site-Key** besorgen, falls gewünscht | Dashboard |
| 🔲 | **DNS abschließend prüfen** (`jakobsax.de`, `www`) | Nach dem 525-Fix nie final getestet |

### Gemeinsam zu entscheiden

| | Was | Stand |
|---|---|---|
| 🔲 | **Rechtstexte anwaltlich prüfen lassen** | ⚠️ **Der letzte echte Launch-Blocker.** Impressum und Datenschutz sind inhaltlich vollständig, aber von mir geschrieben, nicht von einer Kanzlei |
| 🔲 | **Domain: `.de` oder `.media`?** | Meine Empfehlung: `.de` behalten. Vor dem ersten externen Link entscheiden |
| 🔲 | **Tailwind ja oder nein?** | Meine Empfehlung: nein. Braucht laut `TECH-STACK.md` beider Zustimmung |
| 🔲 | **Design-Vertrag unabhängig prüfen lassen** | Der Abschnitt „Seitenstruktur" ist von Claude geschrieben und selbst nicht abgenommen |

---

## Reihenfolge (Stand 2026-08-27)

Ergebnis des Feature-/SEO-Brainstorms — die ehrliche Priorität, damit niemand an der falschen
Stelle anfängt:

1. **Bildmaterial** — ohne Fotos ist alles andere Kosmetik (siehe Kurzfristig)
2. **Launch-Blocker** — Impressum/Datenschutz, echte Kontaktdaten (siehe oben)
3. **Anfrageformular mit Budgetband** — der größte Conversion-Hebel
4. **SEO-Grundausstattung + URL pro Arbeit**
5. **Burst-Effekt**
6. ~~**EXIF-Zeile**~~ — erledigt am 2026-08-28, wird mit den ersten Fotos sichtbar

> ⚠️ **Die Seite hat aktuell null Fotos.** Jede Kachel zeigt „Bild folgt", der Hero einen
> Farbverlauf. Der SITE-PLAN sagt: „Ein Festivalkurator sieht drei Fotos und weiß Bescheid" —
> aktuell sieht er drei graue Flächen. Laut Briefing schlagen 12–20 wirklich starke Bilder 60
> gute. Jedes Feature unten verbessert eine Seite, deren Kernversprechen noch nicht eingelöst ist.

## Kurzfristig

- [ ] **Schreibzugriff für Claude einrichten.** Aktuell kann Claude nicht selbst pushen: Der Git-Proxy der Session hat keine GitHub-Autorisierung für das Repo (`403`), der GitHub-MCP-Zugang nur Leserechte. Änderungen müssen deshalb als ZIP/Bundle exportiert und von Hand eingespielt werden. Zu tun: Claude GitHub App unter https://github.com/apps/claude/installations/select_target für `jh8yzpy6vj-dot/personalwebsite` freigeben (Contents: Read **and write**), und die GitHub-Verbindung unter claude.ai → Einstellungen → Connectors neu verbinden.
  - ⚠️ **Wenn das steht: Claude weiterhin auf einem Arbeitsbranch pushen lassen, nicht auf `main`.** Laut `CLAUDE.md` geht jeder Push auf `main` sofort live, ohne Preview — die Regel „Änderungen vor dem Pushen kurz selbst gegenlesen" existiert genau deswegen. Der Merge nach `main` bleibt eine menschliche Entscheidung.
- [ ] **⚠️ Ersten echten Medien-Lauf abschließen.** Bucket `websitebucket` steht (Stand 2026-08-30), Bilder sind hochgeladen — **aber flach im Wurzelverzeichnis, mit Kameranamen und 11–12 MB**. So findet die Pipeline nichts. Zu tun:
  1. **Public access → Custom Domain** setzen, z. B. `medien.jakobsax.de`. ⚠️ Nicht die `…r2.dev`-Adresse.
  2. **Token** mit **Object Read & Write** für diesen Bucket, dann `.dev.vars` füllen (`R2_BUCKET=websitebucket`). Die Datei ist von Git ausgenommen — **nichts davon committen**.
     ⚠️ Der Bucket liegt in der Jurisdiction **EU**, der S3-Endpunkt heißt deshalb `…eu.r2.cloudflarestorage.com`. Die Zeile „S3 API" aus R2 → Bucket → Settings kopieren und als `R2_S3_ENDPOINT` eintragen.
  3. Das falsch Abgelegte im Bucket löschen und mit **`npm run verkleinern`** neu erzeugen — das benennt, verkleinert und entfernt die Standortdaten in einem Zug.
  4. **`npm run medien -- --probe`**, erst danach `npm run medien` und die Manifeste committen.
  - Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **⚠️ `verkleinern.mjs` begrenzt die falsche Kante.** `scripts/verkleinern.mjs:109` setzt `fit: "inside"` mit 3000×3000 — das begrenzt die **lange** Kante, bei einem Hochformat also die Höhe. Jakobs 4600×7000 wurde damit zu 1971×3000: Die Höhe trifft die 3000, die **Breite fällt auf 2000**. Da `srcset` breitenbasiert ist und `breitenFuer()` nie hochskaliert, hört so ein Bild bei der 1600er-Stufe auf, obwohl es 6 Megapixel mitbringt. Der Kommentar drei Zeilen darüber („ausgeliefert ohnehin höchstens 2400") meint die **Breite** — Kommentar und Code widersprechen sich.
  - ⚠️ **Seit dem 2026-09-12 in der Praxis umgangen**, aber weiterhin falsch: Jan legt die Originale jetzt mit `--original` in voller Größe ab, da greift die Verkleinerung gar nicht. Wer den Schalter **weglässt**, läuft weiter in den Fehler.
  - ✅ Die Budget-Frage dazu ist erledigt: `BUDGET` rechnet seit dem 2026-09-12 **je Megapixel** statt in festen Zahlen, `QUELLE_WARNUNG` steht auf 8000 px / 40 MB. Vorher hätte ein 2400er-Hochformat-AVIF mit rund 2,4 MB die harte Grenze (1,5 MB) gerissen und den ganzen Lauf abgebrochen.
- [ ] **Hochformat in Originalqualität ansehen können.** Jan am 2026-09-12: „ggf will ich ja ein Hochformat in Originalqualität laden."
  - ✅ **Der Weg dorthin steht seit dem 2026-09-13:** Jede Mosaikkachel öffnet im Lichtkasten, und der lädt **erst beim Öffnen** die große Fassung. Die Seite bleibt schnell, weil das nur passiert, wenn es jemand will.
  - **Offen bleibt die eigentliche Frage:** Der Lichtkasten zeigt derzeit die ausgelieferte WebP-Stufe, nicht die Datei aus `original/`. Soll er das Original laden? ⚠️ **Vorher müssen die EXIF-Daten der Originale nachweislich sauber sein (GPS!)** — der Bucket ist öffentlich. Abgesichert ist bisher die Pipeline; `scripts/exif.mjs` räumt die Originale seit dem 2026-09-12 mit auf, ein Nachweis über den **vorhandenen** Bestand fehlt aber.
- [ ] **⚠️ `Cache-Control` für HTML setzen.** Am 2026-09-13 zeigte die Startseite nach einem Deploy weiter die alte Kachel, während die Detailseite bereits die neue war — beide lesen dieselbe Manifest-Zeile, also lag altes **HTML** im Cloudflare-Edge-Cache. Inkognito und harter Reload halfen nicht, erst ein „Purge Everything" im Dashboard.
  - **Bilder sind seit dem Fingerabdruck (`?v=…`) sicher**: gleiche Adresse heißt gleiche Datei. Für HTML gilt das nicht — dort ist die Adresse stabil und der Inhalt ändert sich bei jedem Deploy. Genau die Lücke.
  - Zu tun: Für HTML-Antworten einen Header setzen, der den Edge revalidieren lässt (`Cache-Control: public, max-age=0, must-revalidate` oder `s-maxage=0`), die Bilder unter `b/` aber unangetastet lässt. Sonst muss nach jedem Deploy von Hand gepurgt werden — und **wer das vergisst, merkt es nicht**, weil die Seite ja etwas anzeigt.
- [ ] **Beschreibungstexte für die Arbeiten.** Auf den Detailseiten steht weiterhin nur „Beschreibung folgt." **Zwei bis vier Absätze je Arbeit von Jakob.** ⚠️ Nichts erfinden; bis dahin bleibt der ehrliche Platzhalter stehen.
  - ✅ **Der Layoutdruck ist seit dem 2026-09-13 weg.** Die Flanken hingen an der Textlänge: Bei einem Satz liefen sie unter den Text hinaus und die Mitte wurde zur leeren Rinne. Das Mosaik steht **unter** dem Text und hat diese Kopplung nicht — kurzer Text sieht jetzt dünn aus, aber nicht mehr kaputt. Damit ist der Punkt wieder eine Inhalts- und keine Layoutfrage.
- [ ] **Bildausschnitte im Hero wählen.** Die Detailseite zeigt ihre Bilder im Hero mit `object-fit: cover`; ein Hochformat ist dort zu **37,5 %** zu sehen, und welche 37,5 % das sein sollen, kann nur ein Mensch entscheiden. Ohne Eintrag steht jedes Bild mittig — bei keinem Motiv grob falsch, aber bei manchen eben auch nicht richtig.
  - **Werkzeug:** <https://claude.ai/code/artifact/ca3af403-f535-4e52-97e6-633cd9414c34> — Bilder laden, Punkt ziehen, roter Rahmen zeigt den übrigbleibenden Ausschnitt, unten fällt die fertige Datei heraus.
  - Ergebnis nach `lib/bildausschnitte.ts` kopieren. **Kein `npm run medien` nötig**, kein Bucket-Zugriff — Datei bearbeiten, pushen, fertig.
  - Offen für `wiwawo-53`: alle sieben. Jan hat am 2026-09-13 an drei Bildern gezeigt, dass der alte Pauschalwert nicht trug (Lagerfeuer, Kajakfahrer mit rotem Paddel).
- [ ] **⚠️ `wiwawo-53` gegenlesen.** Am 2026-08-30 angelegt, weil die Fotos „WiWaWo26" zu keiner bestehenden Arbeit passten. **`role` („Kamera, Schnitt") und `category` („bewegtbild") sind von den Geschwistereinträgen übernommen und nicht belegt** — geliefert wurden Fotos, nicht Bewegtbild. `place` fehlt. Jakob fragen, dann in `lib/content.ts` korrigieren.
- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt.
  - ✅ **Die Technik dahinter steht seit 2026-08-28** (`srcset`, AVIF/WebP, Vorschaubildchen, Größenbudget, GPS-Entfernung). Zu tun ist nur noch: **Datei als `original/arbeiten/<id>.jpg` in den Bucket legen** — `<id>` ist die `id` der Arbeit aus `lib/content.ts` — und einmal `npm run medien` laufen lassen. Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - **Offen bleibt der Alt-Text je Arbeit** (Feld `alt` in `lib/content.ts`). Er beschreibt die Szene und wird nicht erfunden. Fehlt er, setzt die Seite eine Notlösung aus Titel, Auftraggeber und Jahr ein — korrekt, aber wertlos.
- [ ] **⚠️ Porträt von Jakob ablegen.** Das Foto vom 2026-08-29 (Gegenlicht, Sonnenuntergang) als **`original/portrait.jpg`** in den Bucket legen und `npm run medien` laufen lassen — dann erscheint es im Kurzanriss der Startseite und oben auf `/ueber`. Es wird **nicht zugeschnitten**, die Form des Bildes bleibt; auf `/ueber` ist nur die Höhe auf 70 % des Bildschirms begrenzt.
  - Claude kann das nicht selbst: Ein Bild aus dem Chat lässt sich nicht ins Repo schreiben. Die Stelle ist gebaut und geprüft, es fehlt nur die Datei.
  - Die Bildbeschreibung steht in `lib/content.ts` (`ABOUT.portraitAlt`) und ist **von der Aufnahme abgeleitet, nicht von Jakob freigegeben** — gegenlesen.
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video als `original/hero/film.mp4` in den Bucket legen, Standbild als `original/hero/standbild.jpg`. Das Standbild dient sowohl als Poster als auch — ohne Video — selbst als Hero; dazu `HERO_ALT` in `lib/content.ts` füllen. Exportvorgaben (ohne Ton, 8–15 s, unter 8 MB, ffmpeg-Zeile) in `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **Bestandsaufnahme der Arbeiten — Voraussetzung für die neue Archivstruktur.** `lib/content.ts` enthält neun Einträge; das ist der **dokumentierte**, nicht der tatsächliche Bestand — Jakob hat deutlich mehr. Ohne zu wissen, wie viel es gibt und was gezeigt werden **darf**, lässt sich das Archiv nicht sinnvoll gliedern (asymmetrische Raster brauchen Masse, und die Rechtefrage entscheidet pro Arbeit über die Zeigbarkeit).
  - ⏳ **Vorlage ist fertig** (`bestandsaufnahme-arbeiten.csv` + Anleitung, am 2026-08-27 an Jan geschickt, siehe `AGENT-LOG.md`). Erfasst je Arbeit: Jahr, Auftraggeber, Titel, Ort, Rolle, Kategorie, vorhandenes Material, **Nutzungsrechte, Freigabe des Auftraggebers, erkennbare Personen**, Link zur Originalquelle.
  - **Offen:** Jakob ausfüllen lassen, dann die Daten nach `lib/content.ts` überführen.
- [ ] **Seitenstruktur unabhängig prüfen lassen.** Der Umbau (Startseite als Weiche, `/arbeiten`, `/arbeiten/[slug]`, `/ueber`, `/kontakt`) ist am 2026-08-27 umgesetzt, und der Abschnitt „Seitenstruktur" in `design/UI-SPEC.md` ist nachgezogen — aber **vom `gsd-ui-checker` noch nicht geprüft**. Das Sign-Off dort deckt weiterhin nur den Stand vom 2026-08-26.
- [ ] **Drei Türen: Bilder und Preisanker fehlen noch.** Der Block steht auf der Startseite, zeigt aber nur Text aus `SERVICES`. Es fehlen je drei starke Bilder und der Preisanker — letzterer beantwortet die Frage, die ein Kulturamt zuerst hat. Hängt an „Bildmaterial" und am langfristigen Punkt „Preisangaben".
- [ ] **Projektkontext je Arbeit.** Die Detailseiten zeigen aktuell nur Credits und den Hinweis „Beschreibung und Bildstrecke folgen". Zwei Sätze Kontext je Arbeit schreiben, dann in `lib/content.ts` ein Feld `context` ergänzen und in `app/arbeiten/[slug]/page.tsx` ausgeben (Stelle ist im Code markiert). **Nicht erfinden** — die Sätze müssen von Jakob kommen.
- [ ] **Lebenslauf verlinken.** `/ueber` hat bewusst keinen CV-Link, weil es noch keinen gibt. Sobald ein ausführlicher Lebenslauf vorliegt (Notion o.ä.), dort verlinken.
- [ ] **Versand des Anfrageformulars scharfschalten.** ⏳ Das Formular steht seit 2026-08-27 auf `/kontakt`, inklusive Validierung, aller Zustände und Spam-Grundschutz. **Es kann nur noch nicht zustellen** — dafür fehlen:
  1. Konto bei **Resend** (oder Postmark, dann `lib/mailer.ts` anpassen) und ein **Auftragsverarbeitungsvertrag**.
  2. Eine bei dem Anbieter **verifizierte Absenderdomain**.
  3. Drei Worker-Secrets setzen: `npx wrangler secret put RESEND_API_KEY`, `ANFRAGE_AN`, `ANFRAGE_VON`.
  4. `VERSAND_AKTIV` in `lib/legal.ts` auf `true` — das schaltet den Absatz zum Versanddienstleister in der Datenschutzerklärung frei. ⚠️ **Erst nach dem AV-Vertrag**, beides gehört zusammen.
  - Bis dahin antwortet die Route mit einer klaren Meldung, die auf die E-Mail-Adresse verweist — keine Anfrage geht still verloren.
- [ ] **Turnstile ergänzen**, sobald ein Site-Key vorliegt. Aktuell nur Honeypot und Mindest-Ausfüllzeit als Grundschutz. Beim Aktivieren die Datenschutzerklärung mitziehen (Stelle im Code markiert).
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner nötig** ist. Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.
- [ ] **Ein Zitat von tête-à-tête einholen.** Ein Satz der Festivalleitung mit Namen und Funktion schlägt drei Absätze Selbstbeschreibung. Billigstes Vertrauenselement überhaupt — braucht nur eine Freigabe-Mail, die für die Referenznennung ohnehin fällig ist (siehe Launch-Blocker).

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- 🔲 **Preisangaben:** Briefing empfiehlt einen Richtwert („Tagessatz ab €"), weil Festivals und Kulturämter mit festen Budgets planen — das spart beiden Seiten die Hälfte der Anfragen. Aktuell steht überall „noch festzulegen".
- 🔲 **Die Startseite wiederholt sich.** Die drei Türen zeigen denselben Text wie die Leistungsseiten, der Vertrauensblock denselben Absatz wie `/ueber`. Bei einer Weiche nicht per se falsch — aber jede Textänderung wirkt an zwei Stellen, ohne dass das jemand steuert. Sobald echte Texte da sind: **eigene, kürzere Anrisse** für die Startseite schreiben, nicht dieselben Sätze in kurz. (Aus dem Review vom 2026-08-28.)
- 🔲 **Trägt die Archivstruktur den Bestand?** `/arbeiten` mit Filter plus eine Detailseite je Arbeit ist für neun Einträge viel Apparat. Das ist eine bewusste Wette auf die Bestandsaufnahme. Ergibt sie, dass es bei zwölf bis fünfzehn zeigbaren Arbeiten bleibt, wäre ein einfacheres Archiv ehrlicher — **nach der Bestandsaufnahme neu entscheiden**, nicht vorher. (Aus dem Review vom 2026-08-28.)
- 🔲 **Die Kategorien mischen zwei Denkweisen.** `festivals` und `bewegtbild` sind Anlass bzw. Medium, `redaktion` ist eine Rolle. Ein Veranstalter denkt in Anlässen. In `SITE-PLAN.md` notiert, aber nicht behoben. ⚠️ Die Kategorie steckt in keiner URL — eine Änderung kostet also kein Ranking, solange die `id` je Arbeit gleich bleibt. (Aus dem Review vom 2026-08-28.)
- 🔲 **`lib/content.ts` mischt fünf Belange** (Hero, Arbeiten, Leistungen, Referenzen, Bio, Kontakt) auf zwölf Exporten. Bei der aktuellen Größe überschaubar, aber es wächst in die falsche Richtung. **Mit echtem Bestand** in `works.ts`, `services.ts` und `about.ts` trennen — vorher wäre es Aufwand ohne Nutzen. (Aus dem Review vom 2026-08-28.)
- ✅ **Bilder und Videos nach R2 ausgelagert — umgesetzt am 2026-08-29.** Der Cloudflare-Build verarbeitet kein Bild mehr; er liest nur noch `lib/bilder-manifest.json` und `lib/video-manifest.json`. Verarbeitet wird lokal mit `npm run medien`, die Originale und die fertigen Varianten liegen im R2-Bucket. Vorgezogen (geplant war „sobald die Bildstrecken kommen"), weil zwölf Kameradateien den Build zum Hängen gebracht und 134 MB in den Git-Verlauf getragen hatten. Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
  - ⚠️ **Der erste echte Lauf steht noch aus.** Geprüft ist alles gegen eine S3-Attrappe (44 Prüfungen) und gegen `wrangler dev` mit echten Dateien — **aber nie gegen einen echten R2-Bucket**, weil in der Sitzung keine Zugangsdaten vorlagen. Jan muss Bucket, Token und Custom Domain anlegen und einmal `npm run medien -- --probe` laufen lassen.
  - **Der Preis, wie vorhergesagt:** ein manueller Schritt vor jedem Push mit neuen Bildern, plus Bucket und Token. Dafür kann Jakob die Dateien jetzt **per Cloudflare-Dashboard** hochladen und braucht kein Git mehr — das ist unter dem Strich der einfachere Weg für ihn, nicht der schwerere.
- 🔲 **Untertitel für die Filme.** Die Filme zu den Arbeiten haben keinen `<track>`. Das ist bewusst — eine leere Spur wäre schlechter als keine, weil sie Barrierefreiheit vortäuscht. Sobald je Film eine `.vtt` vorliegt, gehört sie in `app/components/Film.tsx`. Bei einem Aftermovie ohne Sprache ist das verzichtbar, bei allem mit O-Ton nicht.
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- ✅ **Bildstrecken statt Einzelbilder** — **umgesetzt am 2026-08-29** als waagerechter Filmstreifen auf der Detailseite, ohne JavaScript. **Braucht von Jakob die Bilder** nach `original/arbeiten/<id>/` im Bucket, benannt `01.jpg`, `02.jpg`, … Der im Briefing erwähnte **kurze Vorspann je Strecke fehlt noch** — das ist Copy und kommt von Jakob (siehe „Projektkontext je Arbeit").
- 🔲 **Eine eigene URL pro Arbeit** (`/arbeiten/tete-a-tete-2026` statt nur Kacheln auf der Startseite). Die stärkste strukturelle SEO-Entscheidung: Damit rankt jede Bildstrecke für den Festivalnamen — und das Festivalpublikum, das „tête-à-tête Rastatt 2026 Fotos" sucht, ist genau das Publikum, aus dem Auftraggeber kommen. Statisch vorgerendert, kein Laufzeit-Mehraufwand. Gibt den Bildstrecken (Punkt darüber) gleichzeitig ihren Platz. Struktur siehe `SITE-PLAN.md`.
- ✅ **OG-Images pro Arbeit.** Wenn ein Festival den Link in die WhatsApp-Gruppe wirft, ist die Vorschaukarte die halbe Miete. **Umgesetzt am 2026-08-29** (`scripts/og.mjs`), Log-Eintrag in `AGENT-LOG.md`. ⚠️ Anders als der Rest **wirkt das schon heute ohne Fotos**: Die Karte trägt Wortmarke, ●REC-Chip, Auftraggeber, Titel und Metazeile. Mit Fotos wird sie besser, aber sie ist nicht leer.
- ✅ **Statt des Burst: der Kontaktbogen.** **Umgesetzt am 2026-08-29.** Alle Frames der Serie stehen nebeneinander, der gewählte rot gerahmt, darunter die Uhrzeit auf die Sekunde. Ruhiger als die geplante Hover-Animation und aus drei Gründen besser: Er versteckt den Beleg nicht hinter einer Geste, funktioniert auf Touch (wo es kein Hover gibt), und er braucht keine Ausnahme von der Motion-Regel. **Braucht von Jakob fünf Frames je Arbeit** nach `original/arbeiten/<id>/serie/` im Bucket — Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - Der ursprüngliche Vorschlag steht weiterhin in `design/UI-SPEC.md` unter „Geplante Erweiterungen": ~~beim Hover/Tap spielt eine Kachel fünf Frames derselben Serie mit ~6 fps ab und bleibt auf dem gewählten Bild stehen.~~ Zeigt statt behauptet, was die eigene Copy sagt („Ein Moment auf dem Hochseil passiert genau einmal") und was im „über."-Text steht: antizipieren, warten, auslösen. **Widerspricht dem bisherigen Motion-Vertrag** — die begründete Vertragsänderung steht in `design/UI-SPEC.md`, Abschnitt „Geplante Erweiterungen", und muss vor dem Code vom Checker geprüft werden. Braucht fünf Frames je Arbeit, also Bildmaterial.
- ✅ **EXIF-Zeile unter dem Bild** — `22:14 uhr · 1/500 · f/2.8 · iso 6400`, zur Build-Zeit automatisch aus den Dateien gelesen, null Pflegeaufwand. **Umgesetzt am 2026-08-28**, Log-Eintrag in `AGENT-LOG.md`.
  - GPS wird **gar nicht erst eingelesen** (abschließende Feldliste), nicht nachträglich entfernt.
  - ⚠️ **Sichtbar wird die Zeile erst mit echten Fotos** — und nur, wenn deren EXIF beim Export erhalten bleibt. Lightroom & Co. bieten „alle Metadaten entfernen"; das nimmt auch die Kameradaten. Richtig ist die Einstellung, die **Kamera-Informationen behält und Standortdaten entfernt** — Letzteres macht die Pipeline ohnehin.
  - **Offen bleibt:** Wetter oder Lichtsituation stehen nicht im EXIF. Falls solcher Kontext gewünscht ist, braucht es ein optionales Handfeld in `lib/content.ts` und eine Copy-Freigabe von Jakob.
- ⏳ **Ladezeit als Qualitätsmerkmal.** Unspektakulär, aber real: Der Kurator schaut sich das auf dem Festivalgelände mit schlechtem LTE an. Eine Fotoseite, die in unter einer Sekunde steht, ist in dieser Branche selten genug, um aufzufallen.
  - ✅ **Umgesetzt am 2026-08-28** (Log-Eintrag dort): AVIF/WebP mit `srcset`, Vorschaubildchen beim Laden, Größenbudget, `content-visibility` war schon da.
  - **Erst mit echten Fotos abschließend zu bewerten** — bis dahin sagt keine Messung etwas aus. Dann prüfen: Bleiben die 1200er-Varianten unter 200 kB (die Pipeline warnt), und wie lange steht die Startseite auf einer gedrosselten Verbindung?
