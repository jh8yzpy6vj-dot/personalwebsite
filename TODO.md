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
> ✅ **Die durch den Umbau hinfälligen Punkte sind am 2026-10-08 entfernt** (Begründung je Punkt
> in `AGENT-LOG.md`). Bei Widerspruch zwischen diesem Abschnitt und dem Rest der Datei gilt
> dieser Abschnitt.

### Zielbild

| Route | Inhalt | Text auf der Seite |
|-------|--------|--------------------|
| `/` | Video in voller Fensterhöhe, mittig der Schriftzug „jakob sax", darüber die Navigation | Schriftzug und Navigation, sonst nichts |
| `/foto` | Mosaik aus den Fotos aller Arbeiten, jedes Bild in seiner eigenen Form | „Titel – Kunde", erst beim Überfahren bzw. im Lichtkasten (E4) |
| `/film` | Raster aus Standbildern, jedes ein Link nach außen (YouTube, Vimeo, Mediathek) | je Film „Titel – Kunde" |
| `/ueber` | Bild links, rechts 3–4 Zeilen, darunter E-Mail und Instagram | 3–4 Zeilen |
| `/impressum`, `/datenschutz` | Pflichtseiten | im Footer verlinkt, auf `/` klein unten links im Video; nie im Header |

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

### Schritt 1 — Vertrag und Dokumente ✅ (2026-10-08)

Erledigt, siehe `AGENT-LOG.md`:
- `SITE-PLAN.md` neu gefasst, die alte Fassung steht unverändert unter „Abgelöst“
- `design/UI-SPEC.md` neu geschrieben, der alte Vertrag ist in Git (`9a04e0d`)
- `TECH-STACK.md` um den Abschnitt zum Umbau und um „Schriften“ ergänzt
- diese Datei von hinfälligen Punkten befreit

Offen:

- [ ] **1.6 Sign-Off für das neue UI-SPEC einholen** (`gsd-ui-checker`). Das Sign-Off vom
  2026-08-26 galt dem abgelösten Vertrag und überträgt sich nicht. **Vor Schritt 3.**

---

### Schritt 2 — Datenmodell und Medien (Claude)

- [ ] **2.1 `lib/content.ts` neu.** Statt `WORKS`, `CATEGORIES`, `SERVICES`, `REFERENCES`:

      export type Fotoarbeit = { id: string; titel: string; kunde: string };
      export type Film       = { id: string; titel: string; kunde: string; link: string };
      export const FOTOS: Fotoarbeit[] = [ … ];
      export const FILME: Film[] = [ … ];

  - **Kein `jahr`.** Gezeigt werden nur Titel und Kunde, sortiert wird nach Dateireihenfolge.
    Gehört das Jahr zur Arbeit („WiWaWo 2026“), steht es im Titel.
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

### Schritt 3 — Gestaltungsgrundlage (Claude, nach 1.6)

- [ ] **3.1 `app/globals.css`:** Tokens nach UI-SPEC. Die Hälften-Logik (`--buehne`/`--papier`,
  Naht, `#lesen`) fällt weg. `medien-scrim` bleibt für den Hero.
- [ ] **3.2 Schriften in `app/layout.tsx`** — ⚠️ erst, wenn das Repo privat ist und die Lizenzart
  feststeht (`TECH-STACK.md`, „Schriften“): Bricolage Grotesque, Newsreader und Martian Mono
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
  - Impressum und Datenschutz klein unten links im Video — `/` hat keinen Footer, und das
    Impressum muss von jeder Seite aus erreichbar sein (§ 5 DDG).
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
| **Schriftdateien** | Druk Wide Bold und Avenir Next als `woff2` (Web-Fassung aus dem Lizenzpaket), dazu die Angabe, welche Lizenz es ist (E5) | an Jan/Claude → `app/fonts/` — ⚠️ erst einchecken, wenn das Repo privat ist |

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
  - **Beim Aktivieren der Analytics:** Die Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert. Cloudflare Web Analytics muss dort ergänzt werden, sobald es live ist. Das Kontaktformular entfällt mit dem Umbau (E6); Formular, Versanddienstleister und Turnstile werden in UMBAU-Schritt 4.5 aus der Datenschutzerklärung entfernt.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Und ist es unproblematisch, eigene SWR-Beiträge auf `/film` zu **verlinken**? Eingebettet wird nach dem Umbau nichts mehr.
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
| 🔲 | **Zwei Listen liefern: Fotoarbeiten und Filme** | Je Zeile Titel und Kunde, bei Filmen dazu der Link. Ersetzt die alte Bestandsaufnahme (CSV). Details: UMBAU, Schritt 7 |
| 🔲 | **Alle Inhalte gegenlesen** | Alles in `lib/content.ts` stammt ungeprüft aus dem Briefing |
| 🔲 | **USt-IdNr. mitteilen**, falls vorhanden | Nie die normale Steuernummer |
| 🔲 | **Nebentätigkeit beim SWR klären** | Genehmigung nötig? Ist Verlinken eigener Beiträge unproblematisch? |
| 🔲 | **Bild- und Persönlichkeitsrechte klären** | Was darf werblich auf die Seite, was nur ins Kundenarchiv? |
| 🔲 | **Referenznennungen freigeben lassen** (tête-à-tête, BKV, Sender) | Kunden stehen auf `/foto` und `/film` mit Namen |
| 🔲 | **Onetake-Rechte klären**, falls die Arbeiten gezeigt werden sollen | Liefen über eine Firma, an der er nicht mehr beteiligt ist |
| 🔲 | **Schriftdateien liefern und Lizenzart nennen** | Druk Wide Bold und Avenir Next als `woff2`; Desktop- oder Web-Lizenz? Siehe `TECH-STACK.md`, „Schriften“ |
| 🔲 | **3–4 Zeilen für „Über mich“ schreiben** | Wird nicht erfunden |
| 🔲 | **WiWaWo 50–52 online stellen** (YouTube oder Vimeo) | Filme werden nur noch verlinkt; diese liegen bisher nirgends öffentlich |
| 🔲 | **Hell oder dunkel?** (E1) | Gebaut wird dunkel, bis er widerspricht |

### Jan

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Patches einspielen und pushen** | Claude hat keinen Schreibzugriff |
| 🔲 | **Schreibzugriff für Claude freischalten** | GitHub-App auf „Read and write", siehe unten |
| 🔲 | **Cloudflare Web Analytics aktivieren** | Dashboard, nicht per Code |
| 🔲 | **DNS abschließend prüfen** (`jakobsax.de`, `www`) | Nach dem 525-Fix nie final getestet |
| 🔲 | **GitHub-Repo auf privat stellen** — vor UMBAU-Schritt 3 | Es ist öffentlich; kommerzielle Schriftdateien darin wären öffentliche Weitergabe. Siehe `TECH-STACK.md`, „Schriften“ |

### Gemeinsam zu entscheiden

| | Was | Stand |
|---|---|---|
| 🔲 | **Rechtstexte anwaltlich prüfen lassen** | ⚠️ **Der letzte echte Launch-Blocker.** Impressum und Datenschutz sind inhaltlich vollständig, aber von mir geschrieben, nicht von einer Kanzlei |
| 🔲 | **Domain: `.de` oder `.media`?** | Meine Empfehlung: `.de` behalten. Vor dem ersten externen Link entscheiden |
| 🔲 | **Tailwind ja oder nein?** | Meine Empfehlung: nein. Braucht laut `TECH-STACK.md` beider Zustimmung |

---

## Reihenfolge (Stand 2026-10-08)

Die Priorität steht im Abschnitt **UMBAU** oben: erst der Vertrag, dann der Code, das Material
von Jakob parallel dazu. Die Reihenfolge vom 2026-08-27 (Anfrageformular, URL pro Arbeit, Burst)
ist mit der Neuausrichtung hinfällig.

> ⚠️ **Das Material bleibt der Engpass.** Im Bucket liegen acht Bilder (sieben von `wiwawo-53`,
> ein Porträt) und kein Video. Eine Seite, die nur aus Arbeit besteht, ist ohne Material leer.

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
  - ⏳ **In den Umbau vorgezogen** (UMBAU, Schritt 3.5).
- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt.
  - ✅ **Die Technik dahinter steht seit 2026-08-28** (`srcset`, AVIF/WebP, Vorschaubildchen, Größenbudget, GPS-Entfernung). Zu tun ist nur noch: **Datei als `original/arbeiten/<id>.jpg` in den Bucket legen** — `<id>` ist die `id` der Arbeit aus `lib/content.ts` — und einmal `npm run medien` laufen lassen. Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - **Offen bleibt der Alt-Text je Arbeit** (Feld `alt` in `lib/content.ts`). Er beschreibt die Szene und wird nicht erfunden. Fehlt er, setzt die Seite eine Notlösung aus Titel, Auftraggeber und Jahr ein — korrekt, aber wertlos.
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video als `original/hero/film.mp4` in den Bucket legen, Standbild als `original/hero/standbild.jpg`. Das Standbild dient sowohl als Poster als auch — ohne Video — selbst als Hero; dazu `HERO_ALT` in `lib/content.ts` füllen. Exportvorgaben (ohne Ton, 8–15 s, unter 8 MB, ffmpeg-Zeile) in `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner nötig** ist. Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- ✅ **Bilder und Videos nach R2 ausgelagert — umgesetzt am 2026-08-29.** Der Cloudflare-Build verarbeitet kein Bild mehr; er liest nur noch `lib/bilder-manifest.json` und `lib/video-manifest.json`. Verarbeitet wird lokal mit `npm run medien`, die Originale und die fertigen Varianten liegen im R2-Bucket. Vorgezogen (geplant war „sobald die Bildstrecken kommen"), weil zwölf Kameradateien den Build zum Hängen gebracht und 134 MB in den Git-Verlauf getragen hatten. Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
  - ⚠️ **Der erste echte Lauf steht noch aus.** Geprüft ist alles gegen eine S3-Attrappe (44 Prüfungen) und gegen `wrangler dev` mit echten Dateien — **aber nie gegen einen echten R2-Bucket**, weil in der Sitzung keine Zugangsdaten vorlagen. Jan muss Bucket, Token und Custom Domain anlegen und einmal `npm run medien -- --probe` laufen lassen.
  - **Der Preis, wie vorhergesagt:** ein manueller Schritt vor jedem Push mit neuen Bildern, plus Bucket und Token. Dafür kann Jakob die Dateien jetzt **per Cloudflare-Dashboard** hochladen und braucht kein Git mehr — das ist unter dem Strich der einfachere Weg für ihn, nicht der schwerere.
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- ⏳ **Ladezeit als Qualitätsmerkmal.** Unspektakulär, aber real: Der Kurator schaut sich das auf dem Festivalgelände mit schlechtem LTE an. Eine Fotoseite, die in unter einer Sekunde steht, ist in dieser Branche selten genug, um aufzufallen.
  - ✅ **Umgesetzt am 2026-08-28** (Log-Eintrag dort): AVIF/WebP mit `srcset`, Vorschaubildchen beim Laden, Größenbudget, `content-visibility` war schon da.
  - **Erst mit echten Fotos abschließend zu bewerten** — bis dahin sagt keine Messung etwas aus. Dann prüfen: Bleiben die 1200er-Varianten unter 200 kB (die Pipeline warnt), und wie lange steht die Startseite auf einer gedrosselten Verbindung?
