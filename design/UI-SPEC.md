---
phase: 3
slug: jakobsax-praesenz
status: draft
shadcn_initialized: false
preset: none
created: 2026-10-08
reviewed_at: —
---

# UI Design Contract — jakobsax.de

> Verbindlicher Design-Vertrag. Bei Widerspruch zu `SITE-PLAN.md` gilt dieses Dokument.
>
> **Grundlage:** Jakobs Konzept vom 2026-10-08 (im Wortlaut oben in `SITE-PLAN.md`) und seine
> Entscheidungen E1–E12 (`TODO.md`, Abschnitt „UMBAU", Schritt 0). Ersetzt den Vertrag der
> Auftragsseite vom 2026-08-26 vollständig. Was davon entfallen ist und warum, steht ganz unten
> unter „Abgelöst"; den alten Vertrag im Wortlaut enthält der Git-Verlauf (Stand `9a04e0d`).
>
> ✅ **Der Code folgt diesem Vertrag seit dem 2026-10-08** (Branch `main-wlv97t`, Log in
> `AGENT-LOG.md`). Ausnahme: die Schriften — bis die Lizenzdateien da sind, laufen Ersatzschriften
> (`TECH-STACK.md`, „Schriften"). Live ist der Umbau erst nach dem Merge nach `main`.
>
> **2026-10-14, Jans Entscheidung (mittags):** `/foto` wurde eine Übersicht nach Kategorien mit
> Detailseiten je Arbeit. **Am selben Abend auf Jakobs Rückmeldung zurückgenommen:** `/foto` ist
> jetzt **Hero mit Blende über 6–8 Bilder → ein Mosaik aus allen Bildern**, nach Kategorie
> sortiert, ohne sichtbare Grenzen. Damit gilt **E4** (ein Mosaik) wieder und **E8** (keine
> Detailseiten) ebenso; neu ist allein die Blende oben. Siehe *`/foto`*.

---

## Positionierung (bestimmt das Design)

**Die Seite verkauft nichts.** Sie ist eine Präsenz für Jakobs Arbeit — Fotos und Filme — und
tritt selbst zurück. Jakob: „Die Website soll durch meine Arbeit überzeugen, durch die Bilder und
Filme, nicht durch meine Fresse."

Daraus folgen drei Regeln, an denen sich jede Entscheidung unten messen lassen muss:

1. **Das Material ist die Gestaltung.** Eine Fläche, eine Schriftfarbe, eine einzige Akzentfarbe
   für die eigene Marke. Alles, was nicht Foto, Film oder Navigation ist, muss sich rechtfertigen.
2. **Pro Arbeit genau zwei Angaben: Titel und Kunde.** Keine Rolle, kein Ort, kein Jahr als eigene
   Angabe, keine Aufnahmedaten. (Der Textkasten der Detailseiten vom 2026-10-14 ist mit ihnen
   entfallen.)
3. **Keine Aufforderung.** Kein Knopf, kein Preis, kein Formular, kein „Anfrage stellen". Wer
   Jakob erreichen will, findet eine Zeile auf `/ueber`.

---

## Seitenstruktur

| Route | Aufbau | Sichtbarer Text |
|-------|--------|-----------------|
| `/` | **Seit dem 2026-10-10 (Jans Entscheidung) wieder eine scrollende Startseite**, siehe *Startseite* unten: Hero → Über-mich-Anriss → zwei Wege (foto, film) → Highlights → Footer | Positionierungszeile und Orte im Hero, „jakob." mit zwei Sätzen, Beschriftung der Wege |
| `/foto` | **Seit 2026-10-14 abends:** randloses Hero mit Blende über 6–8 ausgewählte Bilder → **ein** Mosaik aus allen Bildern, nach Kategorie sortiert, ohne Zwischenüberschriften → Footer. Keine Detailseiten. Siehe *`/foto`* | Bildbeschriftung beim Überfahren und im Lichtkasten — sonst kein Text |
| `/film` | Topbar, darunter ein Raster aus Standbildern; jede Kachel ist ein Link nach außen | je Film „Titel – Kunde" unter dem Standbild |
| `/ueber` | Topbar, darunter zweispaltig: Bild links, rechts 3–4 Zeilen und eine Kontaktzeile. Darunter seit 2026-10-14 ein Mosaik aus den Bildern der Kategorie „Über mich" aus Jakobs Liste (`original/ueber/NN`) | 3–4 Zeilen, Kontaktzeile |
| `/impressum`, `/datenschutz` | Topbar, Lesespalte | Pflichttext |
| 404 | Topbar, eine Zeile, zwei Wege | „Hier ist nichts." · foto · film |

Auf **jeder** Seite unten der Footer mit **Impressum · Datenschutz**, auch auf `/`. ⚠️ Er darf
nicht fehlen: Das Impressum muss von jeder Seite aus „leicht erkennbar und unmittelbar
erreichbar" sein (§ 5 DDG).

### Startseite

> **Entscheidung von Jan am 2026-10-10:** Die reine Videoseite (E3) hat die Startseite „getötet".
> Zurück kommt der alte Aufbau aus Hero und Über-mich-Anriss, ergänzt um Wege und Highlights.
> Das hebt E3 und die Regel „kein Text über dem Hero außer dem Schriftzug" für `/` auf.

| Block | Inhalt | Fläche |
|-------|--------|--------|
| **Hero** | Wie vor dem Umbau: Medium in voller Fensterhöhe (Video → Standbild → `HERO_ERSATZ` → Verlauf), unten links als `<h1>` die Positionierungszeile „fotografie für kultur & theater im öffentlichen raum", darunter ●-Punkt und „rastatt · stuttgart". Pause-Knopf unten rechts, sobald ein Video läuft | dunkel, Verlauf unter dem Text deckend 0.80 |
| **Über-mich-Anriss** | Wie vor dem Umbau: Porträt links (420px, ohne Zuschnitt), rechts „jakob.", die zwei Sätze aus `ABOUT.zeilen`, darunter „→ mehr erfahren" nach `/ueber`. Fehlt das Porträt: Platzhalter „Porträt folgt" | **hell** (`--schrift` als Fläche, `--grund` als Schrift) |
| **Wege** | Zwei große Bild-Buttons nebeneinander (untereinander ≤ 700px): „foto" und „film", je mit einem Bild als Grund und „→". Bild für foto: `WEGE.foto` aus `lib/content.ts`; für film das Standbild des ersten Films, sonst eine dunkle Fläche mit ▶ | dunkel |
| **Highlights** | Überschrift „highlights.", darunter vier Fotos im Hochformat 4:5 nebeneinander (2×2 bis 900px). Welche, steht in `HIGHLIGHTS` in `lib/content.ts`; fehlt ein Bild, steht dort ein Platzhalter „Highlight folgt". Jede Kachel führt nach `/foto` (am 2026-10-14 ein paar Stunden lang auf die Detailseite) | dunkel |
| **Footer** | `SiteFooter` wie auf allen Seiten | dunkel |

### /foto

> **Jakobs Rückmeldung vom 2026-10-14 (abends), freigegeben von Jan:** keine Detailseiten, keine
> Kategorie-Kacheln. Oben die besten Bilder mit der Blende, darunter **ein einziges Mosaik** mit
> allen Bildern — nach Kategorien sortiert, aber ohne sichtbare Grenzen. Löst die Übersicht mit
> Detailseiten ab, die am selben Tag ein paar Stunden live war (Abschnitt „Übersicht und
> Detailseite" im Git-Verlauf, Stand `0a2dab8`).

| Block | Regel |
|-------|-------|
| **Hero** | Randlos unter der deckenden Topbar, Höhe `calc(100svh - var(--topbar-h))`, mindestens 420px; am Telefon (≤ 700px) höchstens 4:5 (`125vw`), damit das Mosaik in Reichweite beginnt. Darin die **Blende** (siehe *Motion*) über **sechs bis acht** Bilder aus `FOTO_HERO` in `lib/content.ts`, jedes mit seinem Ausschnitt. Oben rechts der Zähler „n / m" mit Strichen (aktiver Strich `--schrift`, die anderen weiß mit 0.32 — **nicht** Rot) und der Pause-Knopf. **Jeder Strich ist ein Knopf** und springt zu seinem Bild (seit 2026-10-16). Die Trefferfläche ist 24×24px, der Strich darin bleibt 17×2px. Links und rechts in halber Höhe je ein **Pfeil** (‹ ›) für zurück und weiter, in derselben Form wie im Lichtkasten (44px rund, `--grund` mit 0.60). Die Pfeile gibt es nur mit echtem Zeigegerät (`hover: hover` und `pointer: fine`), sie erscheinen beim Überfahren des Heros oder bei Tastaturfokus (120ms Überblendung). Auf Touch wischt man stattdessen. **Kein Text im Bild** — kein Titel, keine Beschriftung |
| **Mosaik** | 48px (`--space-2xl`) unter dem Hero, in der Inhaltsbreite von `/foto`. **Alle** Bilder aller Fotoarbeiten, unbeschnitten — Regeln wie unter *Bildbehandlung*. Geordnet nach Kategorie (`KATEGORIEN`: festival · theater · paddeln · journalismus), darin nach `FOTOS`, darin Startbild zuerst. **Keine Zwischenüberschriften, keine Abstände zwischen Kategorien** — die Ordnung ist da, aber man sieht keine Grenze. Die Bilder des Heros stehen hier noch einmal |
| Detailseiten | **Gibt es nicht.** `/foto/<id>` leitet mit 307 auf `/foto` (nicht 308, damit der Weg frei bleibt, falls sie je zurückkommen) |
| Nur mit Bild | Eine Arbeit ohne Bild erscheint nicht. **Keine Platzhalter** — der gezeichnete Goldbarren für „Tödliches Gold" ist mit dem Umbau entfallen; die Arbeit kommt, sobald die Fotos da sind |

**Beschriftung je Bild:** Nennt Jakobs Liste für ein Bild eine eigene Überschrift (meist die
Compagnie), heißt es „{Bildtitel} – {Titel}", z. B. „Cie. Dyptik – at.tension"; sonst trägt es
„Titel – Kunde" der Arbeit. Hat eine Arbeit keinen Kunden (Festivals, für die Jakob keinen
genannt hat), steht nur der Titel da — ohne Strich.

**Navigation:** foto · film · über mich — in dieser Reihenfolge, an **einer** Stelle definiert
(`lib/nav.ts`), aus der Topbar und Footer lesen. Rechtliches steht **nur** im Footer bzw. auf `/`
unten links, nie im Header.

**Keine sichtbaren Seitentitel** auf `/foto`, `/film` und `/ueber`. Die aktive Seite zeigt die
Navigation (siehe Topbar). Jede Seite trägt trotzdem eine `<h1>` — **visuell verborgen**, damit
Screenreader und Suchmaschinen wissen, wo sie sind. Die Rechtsseiten und die 404-Seite zeigen
ihren Titel sichtbar: Dort wird gelesen.

**Sprungmarke zum Inhalt.** Erstes fokussierbares Element jeder Seite, unsichtbar bis zum
Tastaturfokus, Ziel `#inhalt` auf dem `<main>`. Mit `transform` aus dem Bild geschoben, nicht mit
`display: none` — so versteckt wäre sie gar nicht fokussierbar.

### Topbar

| | `/` | alle anderen Seiten |
|---|---|---|
| Links | „jakob sax" und ●REC (seit 2026-10-10 — der Schriftzug steht nicht mehr mittig im Hero) | „jakob sax" (Link auf `/`) und daneben ●REC |
| Rechts | Navigation | Navigation |
| Fläche | transparent über dem Hero, mit dem Abdunklungsstreifen aus *Text über Bewegtbild*; scrollt mit dem Hero weg | **deckend `--grund`**, `position: sticky` |
| Höhe | `--topbar-h` | `--topbar-h` |

**Abgelöst am 2026-10-10 — warum ●REC auf `/` bis dahin allein in der Ecke stand:** Über einem laufenden Video ist es genau das, was
es auf einem Kameradisplay ist — die Anzeige, dass aufgenommen wird. Der Schriftzug steht dort
ohnehin groß in der Mitte; ein zweiter in der Ecke wäre doppelt.

**Deckend statt durchsichtig auf den Unterseiten:** Über dem Mosaik liefe sonst Bildinhalt durch
Schriftzug und Navigation. Die alte Lösung (eine Füllung, die sich beim Scrollen aufbaut) war die
Reparatur genau dieses Fehlers — eine deckende Fläche von Anfang an braucht keine Reparatur.

**Kein Menü-Knopf, keine ausgeklappte Liste.** Drei Ziele passen ausgeschrieben auch aufs
Telefon. ⚠️ Bei **320px** mit der echten Schrift nachmessen. Passt es nicht, rutscht die
Navigation **unter** „jakob sax" in eine zweite Zeile — sie wird nicht eingeklappt. (`--topbar-h`
mobil dann neu messen.)

**Aktive Seite:** markiert mit einem **●-Punkt in `--rec` vor dem Label**, dazu `aria-current="page"`.
Form statt nur Farbe — für Menschen mit Farbsehschwäche ist der Punkt das Signal. Es ist derselbe
Punkt wie im ●REC: hier wird gerade aufgenommen.

---

## Bildbehandlung

| Element | Regel |
|---------|-------|
| **Hero-Video** | **Volle Fensterhöhe** (`100svh`, `min-height: 420px`), randlos, `object-fit: cover`. `autoplay muted loop playsinline`, Standbild als `poster`. ⚠️ `svh`, nicht `vh` — mit `vh` ragt es auf dem Telefon unter der ein- und ausfahrenden Browserleiste heraus. |
| Hero ohne Video | Das Standbild allein, gleiche Regeln. **Das Standbild muss für sich tragen**: iPhones im Energiesparmodus spielen gar kein Video ab. |
| Hero ohne beides | **Ein Foto aus `/foto` trägt das Hero** (`HERO_ERSATZ` in `lib/content.ts`), gleiche Regeln wie das Standbild. Begründung: Eine schwarze Fläche ist als erster Eindruck einer Seite, die durch Bilder überzeugen soll, das Schwächste, was es gibt. Querformat, möglichst ohne erkennbare Gesichter. Sobald `hero/standbild` im Bucket liegt, hat es Vorrang. |
| Hero ohne alles | Fläche `--grund` mit Schriftzug. Gültiger Zustand, kein Fehler. |
| **Mosaik** (`/foto`, `/ueber`) | Die Bilder in **drei ungleich breiten Spalten** (bei weniger als drei Bildern so viele Spalten wie Bilder) (Gewichte 1.18 / 0.9 / 1.12); **auf `/foto` vier** (dazu 0.96) — seit 2026-10-15, Jakob: „die Bilder noch nen Ticken kleiner", verteilt **in die jeweils kürzeste Spalte** (seit 2026-10-16; gerechnet aus Seitenverhältnis und Spaltengewicht beim Rendern, nicht im Browser). Die erste Reihe liest sich damit weiterhin 1-2-3(-4). **Kein Bild wird beschnitten** — jedes steht in seiner eigenen Form. Unter 860px eine Spalte, die Bilder tragen dann `order`, damit die Reihenfolge stimmt. Kein JavaScript im Layout. |
| Mosaik — Reihenfolge | Auf `/foto` nach Kategorie, darin nach `FOTOS` (siehe *`/foto`*). Innerhalb einer Arbeit: Startbild, dann nach Dateiname (`01`, `02`, …) — beim Hochladen in der Reihenfolge von Jakobs Liste vergeben. **Keine Sortierung nach Jahr** — die Abfolge ist Jakobs Kuration. |
| **Hero von `/foto`** | `object-fit: cover`, Ausschnitt je Bild aus `lib/bildausschnitte.ts`, sonst mittig. `sizes` **je Bild** aus Hero-Höhe und Seitenverhältnis (`heroSizes` in `lib/bilder.ts`; gilt ebenso für das Hero der Startseite) — ⚠️ nie pauschal `100vw`: Ein Querformat im hohen Hero wird am Telefon durch `cover` mehr als dreimal so breit wie der Bildschirm, mit `100vw` lädt der Browser eine viel zu kleine Stufe und das Bild wird unscharf (2026-10-15). Erstes Bild `fetchpriority="high"`. Die weiteren Bilder hängen erst eine Standzeit vor ihrem Auftritt im Dokument, nie die ganze Folge auf einmal. |
| Mosaik — warum so | ⚠️ Die ungleichen Breiten sind der Hebel, nicht Zierde: Gleich breite Spalten stellen Hochformate zwangsläufig gleich hoch nebeneinander. ⚠️ Reihenweise, nicht spaltenweise (`column-count` kann das nicht) — sonst läse sich die obere Reihe 1-3-5. ⚠️ **Aber nicht blind reihum** (so bis 2026-10-16): Reihum ignoriert die Formate. Auf `/foto` endeten die vier Spalten bei 1440px um bis zu 1200px versetzt, unten stand eine Spalte mehrere Bilder lang allein. Jan: „sie ist verbuggt". Wer stets die kürzeste Spalte füllt, hält die Enden auf weniger als eine Bildhöhe beisammen. Zwei gescheiterte Vorstufen (Flanken, Zeilensatz) sind im alten Vertrag dokumentiert. |
| **Beschriftung im Mosaik** | Die Beschriftung des Bildes (siehe *Beschriftung je Bild*) erscheint **beim Überfahren mit der Maus und bei Tastaturfokus**, unten im Bild auf einem Verlauf (siehe *Text über Fotos*). Nur unter `@media (hover: hover) and (pointer: fine)` für das Überfahren; auf Touch gibt es kein Überfahren, dort ist der Lichtkasten der Weg. Sonst ist die Fläche textfrei. |
| **Lichtkasten** | Jede Mosaikkachel öffnet groß: Klick oder `Enter`; `←`/`→` blättert **über alle Bilder der Seite**; `Esc` und ein Klick neben das Bild schließen. Bild `contain` auf `--grund`, darunter die Beschriftung. `sizes` **je Bild** aus der Fensterhöhe und dem Seitenverhältnis (`kastenSizes` in `lib/bilder.ts`) — sonst lüde ein Hochformat die größte Stufe, um sie auf ein Drittel zu verkleinern. ⚠️ **`position: fixed`, nie `absolute`** — sonst springt die Seite beim Öffnen an den Anfang und man steht nach dem Schließen oben. ⚠️ Beim Schließen geht der Fokus **auf die Kachel zurück**, von der er kam. Ohne Skript ist jede Kachel ein gewöhnlicher Link auf die Bilddatei. **Öffnen und Schließen:** Das Foto wächst aus seiner Kachel in den Lichtkasten und kehrt beim Schließen in die Kachel des **zuletzt gezeigten** Bildes zurück — wie in einer Foto-App (siehe *Motion*). Geht der Fokus nach dem Blättern auf diese Kachel statt auf die ursprüngliche, ist das Absicht: Man steht dort, wo man zuletzt hingesehen hat. |
| **Film-Standbild** (`/film`) | Festes Seitenverhältnis **16:9**, `object-fit: cover`. Ausschnitt je Bild aus `lib/bildausschnitte.ts` (Schlüssel `film/<id>`), sonst mittig. Die **ganze Kachel** — Standbild und Beschriftung — ist der Link. |
| Film-Standbild — Quelle | **Liegt bei uns** (`original/film/<id>.jpg` im Bucket). ⚠️ Keine Vorschaubilder von YouTube, Vimeo oder der Mediathek nachladen: Das wäre bei jedem Seitenaufruf eine Anfrage an Dritte und gehörte in die Datenschutzerklärung. **Keine eingebetteten Player.** |
| **Porträt** (`/ueber`) | **Ohne Zuschnitt** — das Bild bringt seine Form mit. Begrenzt wird die **Höhe** (`max-height: 80svh`), sonst schiebt ein Hochformat den Text unter die Falz. |
| Ecken | **Genau ein Radius** (`--radius-bild`, 12px) für Mosaikkacheln, Film-Standbilder und Porträt. Das Hero-Video und das Hero von `/foto` sind randlos und haben keinen. |
| **Was kein Bild hat, erscheint nicht** | Eine Fotoarbeit ohne Bilder und ein Film ohne Standbild werden **nicht** angezeigt — keine Platzhalterkachel. Eine Seite, die nur aus Bildern besteht, darf keine grauen Flächen zeigen. `npm run medien` nennt, was fehlt. Keine Ausnahme mehr — der Goldbarren-Platzhalter für „Tödliches Gold" ist am 2026-10-14 entfallen. |
| Auslieferung | WebP **und** AVIF mit `srcset` in bis zu **sieben** Breiten (480–4000, seit 2026-10-14; vorher bis 2400), JPEG als Rückfall, `width`/`height` am `img` gegen Layoutsprünge. Erzeugt von `npm run medien`, nicht im Deploy. ⚠️ Beide Formate müssen **dieselben** Breiten abdecken — sonst greift der Browser still zur kleineren Stufe und rechnet hoch. |
| Breite der Quelle | Eine Quelle liefert nur die Breiten, die sie hat; es wird nie hochskaliert. Die **Breite** entscheidet über die Schärfe, nicht die Pixelzahl. |
| Ladezustand | Ein 16px breites Vorschaubildchen als Datei-URI im HTML füllt die Fläche, bis das Foto da ist. Kein Skript, keine zusätzliche Anfrage. |
| Laden | Hero-Standbild und erstes Bild der Blende `fetchpriority="high"`. Im Mosaik die ersten drei sofort, alle weiteren `loading="lazy"`. Auf `/film` die ersten zwei sofort. |
| Originale | Liegen in **voller Auflösung** im Bucket (nur Standort- und andere Metadaten entfernt, `npm run verkleinern -- … --original`). ⚠️ Der Bucket ist öffentlich — wer die Adresse kennt, kann das volle Original laden. So gewollt (Jan, 2026-10-14). |

**Wenn die Bilder gut sind, ist jedes erklärende Wort davor ein Verlust.** Deshalb keine
Überschrift über dem Mosaik, keine Einleitung über dem Filmraster. (Ausgenommen: die Startseite
seit dem 2026-10-10.)

---

## Farbe

**Eine Fläche, eine Schriftfarbe, ein Akzent** (E1, E2). Die Seite ist durchgehend dunkel; die
frühere Teilung in eine dunkle „sehen"- und eine helle „lesen"-Hälfte entfällt.

| Token | Hex | Einsatz |
|-------|-----|---------|
| `--grund` | `#0E0E10` | Die einzige Fläche. Fast neutral, damit die Fotos die Farbe machen |
| `--schrift` | `#F4F3EF` | Alle Schrift, Fokusring, Unterstreichungen — 17.4:1 auf `--grund` |
| `--leise` | `#7A857F` | Zurückgenommene Schrift: Footer, Leerzustand, Alt-Text bei Ladefehler — 5.04:1 auf `--grund` |
| `--rec` | `#E11B1B` | **Seine Bildmarke.** Siehe unten |
| `--auf-rec` | `#FFFFFF` | Schrift im ●REC-Chip — 4.80:1 auf `--rec` |

**Accent reserved for — abschließend:**

1. der **●REC-Chip** (Fläche `--rec`, Schrift und Punkt `--auf-rec`)
2. der **Punkt vor dem aktiven Navigationsziel** (4.0:1 auf `--grund`, über der Grenze von 3:1
   für Nicht-Text)
3. die **Sprungmarke zum Inhalt** (Fläche `--rec`) — nur bei Tastaturfokus sichtbar, sie
   konkurriert also nie um Aufmerksamkeit

**Nicht** für: Schrift, Links, Fokusring, Unterstreichungen, Knöpfe, Trennlinien, Hover-Zustände.
Gerade weil Rot die einzige Farbe auf der Seite ist, trägt es nur, solange es selten ist.

**Fokusring:** 2px `--schrift`, `outline-offset: 2px` — außer an Bildkacheln, dort **innen**
(`outline-offset: -4px`), sonst schneidet ihn der abgerundete Rand ab. Über Fotos zusätzlich ein
1px-Schatten in `--grund`, damit der Ring auch vor hellem Bildinhalt sichtbar bleibt.

**Gemessenes Minimum für Text: 4.80:1** (`--auf-rec` auf `--rec`). Alle Werte sind gegen die
Hex-Werte berechnet; im Browser nachmessen, sobald die Tokens im Code stehen.

### Text über Fotos und Bewegtbild

Kontrast über Bildern wird **über einem rein weißen Testbild** gemessen, nicht über dem
endgültigen Foto: Der ungünstigste Fall ist der, der zählt. `text-shadow` hilft dem Auge, zählt
für die Untergrenze aber nicht.

| Stelle | Lösung | Untergrenze |
|--------|--------|-------------|
| Schriftzug in der Mitte des Videos | Radiale Abdunklung hinter dem Schriftzug: `--grund` mit **0.55** in der Mitte, auslaufend auf 0 bei etwa 60 % der Bildbreite. Der Rest des Videos bleibt unverändert | 3:1 (große Schrift) |
| Topbar und Rechtliches über dem Video | Streifen oben bzw. unten (`.medien-scrim`): deckend **0.60** hinter der Schrift, blendet nur im äußeren Innenabstand aus | 4.5:1 für 14px, 3:1 für den Schriftzug |
| Beschriftung im Mosaik (Überfahren) | Verlauf am unteren Bildrand, **deckend 0.80**, solange Text darauf steht; blendet nur im oberen Innenabstand aus | 4.5:1 |

⚠️ **Ein Verlauf über die volle Höhe des Textblocks hilft nicht** — er ist genau dort am
schwächsten, wo die oberste Zeile steht. Deshalb deckend unter dem Text, ausblendend nur darüber.
Alle drei Werte sind Startwerte und werden im Browser über Weiß nachgemessen.

---

## Typografie

**Zwei Familien, genau zwei Schnitte, genau vier Größen.**

| Familie | Schnitt | Wofür |
|---------|---------|-------|
| **Druk Wide** | Bold (700) | Schriftzug, Wortmarke, Navigation, Überschriften der Rechtsseiten und der 404-Seite |
| **Avenir Next** | Regular (400) | Alles andere: Beschriftungen, die Zeilen auf `/ueber`, Kontaktzeile, Footer, Rechtstexte |

| Rolle | Schrift | Größe | Zeilenhöhe |
|-------|---------|-------|------------|
| Display (Positionierungszeile im Hero auf `/`) | Druk Wide Bold | **56px** · mobil **36px** | 1.1 |
| Heading (404-Zeile) | Druk Wide Bold | 36px | 1.1 |
| Wortmarke (Topbar), Überschriften der Rechtsseiten | Druk Wide Bold | 18px | 1.1 |
| Navigation | Druk Wide Bold | 14px | 1.1 |
| Body (Zeilen auf `/ueber`, Rechtstexte) | Avenir Next Regular | 18px | 1.6 |
| Beschriftung („Titel – Kunde", Kontaktzeile, Footer) | Avenir Next Regular | 14px | 1.4 |
| Screenreader-Überschrift (unsichtbar) | — | 36px | — |

**Skala: 14 · 18 · 36 · 56.** (Bis 2026-10-10: 96 für den kurzen Schriftzug „jakob sax"; für die lange Positionierungszeile wieder 56 wie vor dem Umbau.) Mobil (≤ 700px) stuft nur das Display von 56 auf 36 herunter,
innerhalb derselben Skala. **Kein Wert unter 14px.**

⚠️ **Die Größen des Displays sind Startwerte und müssen mit der echten Schrift nachgemessen
werden.** Druk Wide ist extrem breit; „jakob sax" darf bei **320px** Fensterbreite nicht
umbrechen und nicht über den Rand laufen. Passt 36px dort nicht, wird der Wert gesenkt und die
Skala hier angepasst — nicht per Einzelfall im CSS.

**Schreibweise (E7):** Schriftzug, Wortmarke und Navigation **klein, ohne Schlusspunkt**:
„jakob sax", „foto", „film", „über mich". Der Punkt-Stil der alten Seite (`arbeiten.`) entfällt.
Fließtext und Beschriftungen in normaler Groß- und Kleinschreibung.

**Eingebunden über `next/font/local`, selbst ausgeliefert vom eigenen Worker.** Kein Laden von
einem fremden Server (Adobe Fonts, Google-CDN, Monotype) — das wäre eine Datenübermittlung an
Dritte. Rückfallschriften mit angepasster Größe (`adjustFontFallback`), damit beim Laden nichts
springt. Lizenz und Ablage der Dateien: `TECH-STACK.md`, Abschnitt „Schriften".

---

## Spacing

4er-Skala: 4 · 8 · 16 · 24 · 32 · 48 · 64px als `--space-xs` bis `--space-3xl`.

| Stelle | Wert |
|--------|------|
| Seitenrand | 16px (`--space-md`) bis 700px, 32px (`--space-xl`) darüber |
| Abstand zwischen Mosaikspalten und -bildern | 16px (`--space-md`) bis 860px, 24px (`--space-lg`) darüber |
| Abstand im Filmraster | 32px (`--space-xl`) senkrecht, 24px (`--space-lg`) waagerecht |
| Beschriftung unter dem Film-Standbild | 8px (`--space-sm`) Abstand zum Bild |
| Größte Inhaltsbreite | `/foto` 1600px · `/film` 1400px · `/ueber` 1100px · Rechtstexte 720px |

**Filmraster:** einspaltig bis 700px, zweispaltig darüber. Drei Spalten erst ab 1400px —
Standbilder brauchen Größe, um zu wirken.

**`/ueber`:** ab 800px zweispaltig, Bild **5/12**, Text **7/12**, Abstand `--space-2xl`. Text
oben bündig mit dem Bild. Darunter untereinander, Bild zuerst.

**Barrierefreiheits-Untergrenze:** Klickflächen mindestens 44×44px — Navigation, Wortmarke,
Pause-Knopf, Footer-Links, Lichtkasten-Knöpfe. **Ausnahme: Links im Fließtext** (die Kontaktzeile
auf `/ueber`, Links in den Rechtstexten) bleiben auf Zeilenhöhe; WCAG 2.5.8 nimmt Ziele innerhalb
eines Textblocks ausdrücklich aus.

**Topbar-Höhe als Token:** `--topbar-h`, im Browser gemessen. Sticky-Versatz und
`scroll-margin-top` hängen daran. Wer Innenabstand oder Schriftgröße der Topbar ändert, muss
neu messen — sonst werden alle abhängigen Stellen still falsch.

**●REC-Punkt:** durchgehend **8px** Durchmesser, im Chip wie vor dem aktiven Navigationsziel.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Schriftzug, Wortmarke | „jakob sax" |
| Hero auf `/` | „fotografie für kultur & theater im öffentlichen raum" (Jakobs Instagram-Bio, klein geschrieben) · „rastatt · stuttgart" |
| Anriss auf `/` | „jakob." · zwei Sätze aus `ABOUT.zeilen` · „→ mehr erfahren" |
| Wege auf `/` | „foto" · „film" (Druk Wide 36px) mit „→"; Screenreader: „Alle Fotos" bzw. „Alle Filme" |
| Highlights auf `/` | „highlights." · Platzhalter „Highlight folgt" |
| Navigation | „foto", „film", „über mich" |
| **Beschriftung einer Arbeit** | „{Titel} – {Kunde}". Halbgeviertstrich (–, U+2013) mit je einem Leerzeichen. Beispiele: „WiWaWo 2026 – Bayerischer Kanuverband", „Y-Kollektiv: Tödliches Gold – SWR/ARD" |
| Kundennamen | **Ohne Rechtsformzusatz** (kein e.V., GmbH, gGmbH) — E10. Mehrere Auftraggeber mit Schrägstrich **ohne** Leerzeichen („SWR/ARD") |
| Titel | So, wie Jakob ihn schreibt. Doppelpunkt erlaubt („Y-Kollektiv: Tödliches Gold") |
| Externes Ziel (nur Screenreader) | an die Beschriftung angehängt: „, auf YouTube" bzw. „auf Vimeo", „in der ARD Mediathek" — abgeleitet aus der Adresse. Sichtbar steht nur ein kleines ↗ (`aria-hidden`) |
| `/ueber` | 3–4 Zeilen **von Jakob**, erste Person. Bis sie vorliegen, die beiden bisher freigegebenen Absätze (Journalist beim SWR; Aufmerksamkeit auf dem Festivalplatz). Nichts erfinden |
| Kontaktzeile | „mail@jakobsax.de · Instagram · SWR-Autorenseite" — drei Links, sonst nichts (E6, E12) |
| Footer | „Impressum · Datenschutz" |
| Pause-Knopf | sichtbar ein Symbol; `aria-label` „Video anhalten" bzw. „Video abspielen" |
| Lichtkasten | Beschriftung des Bildes darunter; Knöpfe mit `aria-label` „Schließen", „Vorheriges Bild", „Nächstes Bild" |
| Kategorien | „festival", „theater", „paddeln", „journalismus" — klein, ohne Punkt. „journalismus" heißt in Jakobs Liste „SWR"; umbenannt, weil STRG_F vom NDR ist |
| Hero auf `/foto` | Nur der Zähler „n / m" und der Pause-Knopf (Screenreader: „Bilder anhalten" / „Bilder abspielen") |
| 404 | „Hier ist nichts." — darunter „foto" und „film" als Wege. Führt weiter, statt sich zu entschuldigen |
| Leerzustand `/foto`, `/film` | „Fotos folgen." bzw. „Filme folgen." in `--leise`. Soll live nie erscheinen (siehe *Zustände*) |
| Visuell verborgene `<h1>` | „Fotos von Jakob Sax", „Filme von Jakob Sax", „Über Jakob Sax" |

**Was es nicht gibt:** keinen Call to Action, keinen Preis, kein „buchen", „anfragen", „jetzt",
keine Positionierungszeile, keine Ortsangabe im Hero, keine Rolle, keine Aufnahmedaten.

**Tonalität** (für die Zeilen auf `/ueber`): erste Person, aktiv, konkrete Nennungen statt
Eigenschaftswörter, kurze Sätze. **Nicht:** „durfte", „mega", Emoji, Werbe-Sprech über Emotionen
und unvergessliche Momente. Zielregister: präzise, konkret, unangestrengt.

⚠️ **Keine internen Notizen im gerenderten Text.** Arbeitshinweise gehören in Code-Kommentare.

⚠️ **Sämtliche Copy braucht Jakobs Freigabe** — Titel, Kundennamen, die Zeilen auf `/ueber`.

---

## Motion

| Was | Regel |
|-----|-------|
| Hero-Video | Läuft in Schleife. **Pause-Knopf ist Pflicht** (WCAG 2.2.2: Was sich länger als fünf Sekunden von selbst bewegt, muss sich anhalten lassen). Unten rechts, 44×44px, `--schrift` auf `--grund` mit 0.60 Deckung. Die Wahl bleibt für die Sitzung erhalten (`sessionStorage`), damit das Video nach einem Seitenwechsel nicht wieder anläuft. |
| `prefers-reduced-motion: reduce` | **Kein Autoplay.** Das Standbild steht, der Knopf zeigt „abspielen". Wer das Video sehen will, startet es selbst. |
| Video im Hintergrund-Tab | Pausiert, solange die Seite nicht sichtbar ist (`visibilitychange`). Spart Akku und Datenvolumen. |
| Beschriftung im Mosaik | Erscheint mit 120ms Überblendung (`opacity`). Höchstens **drei Zeilen** (`line-clamp`), sonst deckt ein langer Titel ein kleines Querformat zu; vollständig steht er im Lichtkasten. |
| **●REC blinkt, solange das Hero-Video läuft** | Der Punkt im Chip geht im Sekundentakt an und aus (`opacity`, harter Wechsel) — die Aufnahmeleuchte einer Kamera. Hält jemand das Video an, steht der Punkt. Ohne Video, ohne Autoplay und unter `reduce` blinkt nichts. Nur auf `/`; auf den Unterseiten steht er immer. WCAG 2.2.2 ist erfüllt, weil der Pause-Knopf auch das Blinken anhält; 1 Hz liegt weit unter der Grenze von drei Blitzen je Sekunde (2.3.1). |
| Wege und Highlights auf `/` | Beim Überfahren (nur `hover: hover` und `pointer: fine`) wird das Bild um 3 % größer und der Pfeil rückt 8px nach rechts — 400ms, `transform`. Unter `reduce` nichts. |
| **Lichtkasten öffnen/schließen** | View Transition: Das Foto bewegt sich aus der Kachel an seinen Platz im Kasten (300ms, `cubic-bezier(0.2, 0, 0, 1)`), der Grund blendet über. Nur `transform` und `opacity`. Unter `reduce` und in Browsern ohne View Transitions öffnet er sofort. |
| Seitenwechsel | `@view-transition` blendet über. Unter `reduce` aus (`navigation: none` — die globale `animation-duration`-Regel greift bei View Transitions nicht). |
| **Blende im Hero von `/foto`** (seit 2026-10-14) | Die Bilder aus `FOTO_HERO` wechseln nacheinander: **Standzeit 4 s, Blende 1,2 s** — drei ungleiche, versetzte Flächen decken das nächste Bild in Ausschnitten auf (je 520 ms, überlappend), dann deckt es ganz auf (420 ms). Dazu eine langsame Fahrt des laufenden Bildes (`scale` 1 → 1.07 über Standzeit plus Blende), **nur eine Richtung**. Geblendet wird nur in ein fertig geladenes Bild; die Folge steht, solange das Hero zu weniger als 25 % sichtbar ist. Unter `reduce`, ohne Skript und bei einem Bild steht das Startbild. Die Zahlen stehen **nur** in `Blende.tsx`. Warum so und welche drei Fehler die erste Fassung hatte: `AGENT-LOG.md`, 2026-09-13 |
| **Blende — Wischen, Pfeile, Striche** (seit 2026-10-16) | Pfeile und Striche (siehe *`/foto`*, Hero) wechseln genauso wie ein Wisch, mit derselben Überblendung, dem Abbruch und dem Neustart der Standzeit. Ein Strich springt direkt, auch über mehrere Bilder. Auf Touch wischt man durch die Folge: nach links das nächste Bild, nach rechts das vorige, im Kreis wie der Takt. Erkannt ab 40px waagerecht, und nur, wenn die Geste deutlich waagerechter als senkrecht ist (Faktor 1,5). Senkrechtes Scrollen und Zoomen bleiben frei (`touch-action: pan-y pinch-zoom`). Der Wechsel ist **keine** Blockblende, sondern eine Überblendung (420 ms, Wert aus `AUFDECK_MS`): Das alte Bild blendet über dem neuen aus, seine Fahrt steht dabei still. Eine laufende Blende bricht ab, die Standzeit beginnt von vorn. Unter `reduce` ein harter Schnitt. Nur Touch — mit der Maus wird nicht gezogen. Jan: „am handy soll man swipen können" |
| Blende — WCAG 2.2.2 | Die Folge bewegt sich länger als fünf Sekunden von selbst, deshalb ein **Pause-Knopf** unter dem Zähler oben rechts — gleiche Form wie am Hero-Video (44×44px, `--schrift` auf `--grund` mit 0.60), `aria-label` „Bilder anhalten" bzw. „Bilder abspielen". Angehalten steht auch die Fahrt. Der Knopf erscheint nur, wenn die Folge wirklich läuft (nicht unter `reduce`, nicht bei einem Bild). |
| **Sonst nichts.** | Kein Aufsteigen beim Scrollen, kein Fortschrittsbalken, kein Parallax, keine Filter über Fotos. Blende, Fahrt und Wischen **nur** im Hero von `/foto`. Bei guten Fotos ist jeder weitere Effekt ein Abzug. |

**Nur `opacity` und `transform`.** Alles andere zwingt den Browser zu neuem Layout und ruckelt auf
dem Telefon.

**Vorladen ohne Bibliothek:** Speculation Rules auf `moderate` (vorgeladen wird erst bei
erkennbarer Absicht, nicht jeder Link im Blickfeld — sonst zahlt jemand mit teurem Mobilfunk
für Seiten, die er nie öffnet). `content-visibility: auto` auf Mosaikkacheln **nur mit**
`contain-intrinsic-size`, sonst springt die Bildlaufleiste.

---

## Zustände

Applicable state considerations resolved: **10 covered, 1 backstop, 0 unresolved**

| Kategorie | Element | Status | Lösung |
|-----------|---------|--------|--------|
| loading | Hero-Video | ✅ covered | Standbild als `poster`, sofort sichtbar; das Video übernimmt, sobald es läuft |
| empty | Hero ohne Video | ✅ covered | Standbild allein, kein Pause-Knopf |
| empty | Hero ohne Video und Standbild | ✅ covered | Foto aus `HERO_ERSATZ`; fehlt auch das: Fläche `--grund` mit Schriftzug |
| error | Hero-Video lädt nicht / iOS-Energiesparmodus | ✅ covered | Das Poster bleibt stehen; der Knopf zeigt „abspielen" |
| loading | Mosaikkachel, Film-Standbild, Porträt | ✅ covered | Vorschaubildchen aus dem Manifest, deckungsgleich mit dem späteren Bild |
| error | Bild kommt nicht an | ✅ covered | Der Browser zeichnet den Alt-Text in die Bildbox — Schrift, Größe (14px) und Farbe (`--leise`) sind dafür gesetzt |
| empty | Fotoarbeit ohne Bilder, Film ohne Standbild | ✅ covered | Erscheint nicht (siehe *Bildbehandlung*) |
| empty | `/foto` oder `/film` ganz ohne Inhalt | 🧪 backstop | Eine Zeile „Fotos folgen." bzw. „Filme folgen." Live soll das nie erscheinen: Der Umbau geht erst mit mindestens einer Fotoarbeit und drei Filmen live (`TODO.md`, Schritt 6) |
| zero-one-many | Mosaik | ✅ covered | Mit 1, 2, 3 und 20+ Bildern prüfen — bei einem Bild steht es in Spalte 1, die anderen bleiben leer; vertretbar, weil der Zustand nur vor dem Livegang vorkommt |
| long-text | Beschriftung | ✅ covered | Bricht im Blockfluss um; `hyphens: auto` mit `lang="de"` plus `overflow-wrap` als Netz |
| overflow | Topbar bei 320px | ✅ covered | Navigation rutscht in eine zweite Zeile statt einzuklappen (siehe *Topbar*) |

---

## Qualitätsuntergrenze

- [ ] Sichtbarer Tastaturfokus (`:focus-visible`, 2px `--schrift`), auch über Fotos
- [ ] Semantische Struktur: `<nav>` mit `aria-current`, Mosaik und Filmraster als `ul`/`li`,
      genau eine `<h1>` je Seite
- [ ] Kontraste ≥ 4.5:1 für Text, ≥ 3:1 für große Schrift und Nicht-Text — **im Browser
      nachgemessen**, über Fotos gegen ein weißes Testbild
- [ ] Klickflächen ≥ 44px (Ausnahme: Links im Fließtext)
- [ ] **Jeder `:hover`-Zustand** steht in `@media (hover: hover) and (pointer: fine)` — auf
      Touch bleibt er sonst nach dem Antippen hängen (gemessen am Lichtkasten, 2026-10-08)
- [ ] `theme-color` in `--grund`, damit die Statusleiste am Telefon nicht weiß über der
      dunklen Seite steht
- [ ] Kein waagerechtes Scrollen bei **320, 360, 390 und 414px** auf allen Seiten
- [ ] Pause-Knopf per Tastatur erreichbar, Zustand für Screenreader angesagt
- [ ] `prefers-reduced-motion`: kein Autoplay, keine Übergänge, nichts bleibt unsichtbar
- [ ] Lichtkasten: Fokusfalle, `Esc`, Fokus zurück auf die Kachel, Scrollposition bleibt
- [ ] `srcset` mit gleicher Breitenabdeckung für AVIF und WebP; im Browser geprüft, welche Datei
      je Fenstergröße gewählt wird (`img.currentSrc`)
- [ ] Startseite auf gedrosseltem 4G: Standbild als größtes Element in **unter 2,5 s**
- [ ] Alt-Texte, die die Szene beschreiben — bis Jakob sie liefert, Rückfall „Titel – Kunde,
      Bild n" (korrekt, aber schwach)

Alle Punkte offen, weil der Code noch dem alten Vertrag folgt. Sie werden in Schritt 6 des
Umbaus abgehakt.

---

## Verwaltung (/admin)

> Seit 2026-10-17. Nur für Jakob (und Jan), hinter einem Passwort, `noindex` und in
> `robots.txt` gesperrt. Technik, Secrets und Ablauf: `TECH-STACK.md`, „Verwaltung (/admin)".

- **Dieselben Tokens wie die Seite:** dunkle Fläche `--grund`, eine Schriftfarbe `--schrift`,
  `--leise` für Zurückgenommenes, Schrift `--font-text`, nur die Größen **14px** (Label) und
  **18px** (Text). Flächen und Linien sind Mischungen aus `--schrift` und `--grund`
  (6 %, 11 %, 22 %), keine neuen Farben.
- ⚠️ **Einzige Ausnahme von der Farbregel: `--rec` markiert in der Verwaltung Fehler**, die das
  Speichern blockieren. Begründung: Die Verwaltung sieht kein Besucher, und ein solcher Fehler muss
  sofort auffallen. Sonst auch hier kein Rot — Löschen-Knöpfe bleiben farblos.
- **Anmeldung:** dieselbe Fläche, mittig „Verwaltung", ein Feld „Passwort" und der Hauptknopf
  „Anmelden", höchstens 360px breit. Falsches Passwort: „Das Passwort stimmt nicht." als
  Fehlertext (`--rec`, siehe oben). Nach zu vielen Versuchen (Anmeldebremse, seit 2026-10-20):
  „Zu viele Versuche. Warte eine Minute und versuch es dann noch einmal." — derselbe Fehlertext
  an derselben Stelle, ebenfalls `--rec`: Auch hier kommt Jakob nicht weiter, bis er etwas tut
  (warten), also gilt dieselbe Begründung wie für die blockierenden Fehler.
- **Aufbau:** Kopf mit „Verwaltung", Link zur Seite und „Abmelden" (fragt nach, wenn noch
  Ungespeichertes da ist oder Bilder hochgeladen werden — **genau einmal**: „Ungespeicherte
  Änderungen gehen verloren. Trotzdem abmelden?" bzw. „Es werden noch Bilder hochgeladen — das
  bricht ab. Trotzdem abmelden?", bei beidem „Ungespeicherte Änderungen gehen verloren, und das
  Hochladen bricht ab. Trotzdem abmelden?"; danach kein zweites „Seite verlassen?" des Browsers);
  darunter Reiter
  **Fotos · Hero · Arbeiten · Über mich · Filme · Startseite · Papierkorb · Verlauf**
  (Pfeiltasten wechseln den Reiter); unten eine feste Leiste mit Speicherstand, optionaler
  Nachricht und „Speichern".
- **Ordnen** per Ziehen (Maus und Touch) und zusätzlich per Knöpfen „nach oben / nach unten"
  für Tastatur und Screenreader. Ausblenden statt Löschen ist der Normalfall; Gelöschtes liegt
  **30 Tage** im Papierkorb und lässt sich zurückholen.
- **Hero:** dieselbe Spanne wie auf `/foto` (siehe *`/foto`* → Hero), gezählt werden nur
  **sichtbare** Bilder; außerhalb davon erscheint eine Warnung, ohne ein einziges sichtbares Bild
  ein Fehler, der das Speichern sperrt. Ausgeblendete und gelöschte Bilder behalten ihren Platz in
  der Liste („ausgeblendet — erscheint nicht" bzw. „im Papierkorb — erscheint nicht"), der Kopf
  nennt sie: „{n} sichtbare Bilder (dazu {m} ausgeblendet oder gelöscht)". Begründung
  (2026-10-21): Löschen nahm ein Bild bisher aus dem Hero, und Wiederherstellen brachte es nicht
  zurück — Jakob glaubte, alles sei wie vorher.
- **Bildausschnitt:** Die Fläche, auf die Jakob tippt, hat genau die Form des Bilds (höchstens
  60svh hoch, sonst die volle Breite) — ein Tipp an den Bildrand ergibt 0 % bzw. 100 %, und der
  Kreis sitzt dort, wo der gespeicherte Wert hinzeigt. Die beiden Rahmen (16:9, 4:5) und „Jetzt:
  …" stehen **direkt neben dem Bild**, sobald der Platz 640px breit ist (Reiter Hero am PC), sonst
  darunter (Seitenpanel, Handy). Begründung (2026-10-21): Vorher war die Fläche breiter als das
  Bild; am PC ergab der linke Bildrand bis zu 37 %, und die Rahmen begannen unter dem Fenster.
- **Startseite, Bildplätze:** Zur Wahl stehen nur die sichtbaren Fotos aus `/foto` — nur die kann
  die Startseite zeigen. Zeigt ein Platz trotzdem auf etwas anderes, sagt die Zeile, warum er
  leer bleibt: „· ausgeblendet — der Platz bleibt auf der Seite leer", „· im Papierkorb — …",
  „· kein Foto aus /foto — …". Begründung (2026-10-21): Ein Bild von „Über mich" ließ sich wählen,
  der Platz blieb auf der Seite aber leer, ohne Warnung.
- **Neuer Film:** Titel, Kunde und „Link zum Film" in einem Formular; „Film anlegen" ist erst frei,
  wenn alle drei da sind, darunter leise „Titel, Kunde und Link braucht jeder Film. Das Standbild
  lädst du danach hoch." Adressfelder (Filme, Instagram, SWR, Hero-Video) ergänzen beim Verlassen
  ein fehlendes „https://". Begründung (2026-10-21): Ein Film nur mit Titel war sofort ein Fehler,
  der jedes Speichern sperrte — auch das von allem anderen.
- **Dialoge und Seitenpanel:** schließen über ✕, `Esc` oder einen Klick auf den abgedunkelten
  Rand — nur wenn Drücken **und** Loslassen dort lagen. Ein Tipp in die leere Fläche des Panels
  oder Text markieren und daneben loslassen schließt nicht; am Handy ist das Panel ganzflächig,
  hat also keinen Rand und schließt über ✕. Nach jeder Aktion im Dialog („Leer lassen", Bild
  gewählt, „Verstanden", „Abbrechen" …) steht der Fokus wieder auf dem Knopf, der ihn geöffnet
  hat, sofern es ihn noch gibt. Liegt das Bild im Papierkorb, zeigt das Panel statt „Ersetzen"
  ein Band „Dieses Bild liegt im Papierkorb. …" mit „Wiederherstellen" (Band, kein Fehlertext —
  Rot bleibt Speicher-Fehlern vorbehalten). Begründung (2026-10-21): Das Panel schloss bei einem
  Fehltipp unter die Knöpfe, und nach jeder Wahl im Dialog stand der Fokus am Seitenanfang.
- **Speicherstand-Texte:** „Ungespeicherte Änderungen." · „Speichert …" · „Gespeichert. Wird
  veröffentlicht … (1–2 Minuten)" · „Gespeichert und live." · „Alles gespeichert." ·
  „Speichern ist noch nicht eingerichtet." · „Wiederhergestellt, aber der neue Stand ließ sich
  nicht laden. Bitte neu laden." (seit 2026-10-20; Vorrang vor allen außer „nicht eingerichtet",
  daneben in der Leiste der Knopf „Neu laden", Speichern bleibt gesperrt — sonst schriebe das
  nächste Speichern den alten Inhalt still über den wiederhergestellten) ·
  „Lädt noch {n} Bild/Bilder hoch — bitte die Seite offen lassen." (seit 2026-10-21; solange
  nichts ungespeichert ist, mit Vorrang vor „Gespeichert …" und „Alles gespeichert."; dazu warnt
  der Browser beim Schließen oder Neuladen des Tabs wie bei Ungespeichertem). Begründung: Vorher
  stand während des Hochladens „Alles gespeichert.", und Schließen brach die ganze Schlange
  ohne Rückfrage ab.
- **Abgelaufene Anmeldung** (seit 2026-10-21): „Die Anmeldung ist abgelaufen. Melde dich in einem
  neuen Tab neu an, komm hierher zurück und versuch es noch einmal — deine Änderungen hier
  bleiben erhalten." Steht der Text in der Leiste (Speichern gescheitert), folgt dahinter der Link
  **„In neuem Tab anmelden ↗"** (`/admin`, neuer Tab); ebenso einmal unten im Bereich
  „Hochladen und Verarbeitung" und in der Rückfrage zum Verwerfen — **nicht** in jeder
  Hochlade-Zeile. Begründung: Vorher hieß es „Lade die Seite neu" — wer dem folgte, verlor alles
  Ungespeicherte. Das Sitzungs-Cookie gilt für alle Tabs; nach der Anmeldung im zweiten Tab
  klappt es hier wieder.
- **Hochladen und Verarbeitung** (Bereich über den Reitern, seit 2026-10-21): Je Datei eine Zeile —
  Name, Zustand leise („wartet" · „{n} %" · „hochgeladen" · „abgebrochen"; „nicht hochgeladen"
  normal, der Grund darunter als Fehlertext) und rechts leise Knöpfe (44px): **„Abbrechen"**
  solange sie wartet oder lädt, **„Noch einmal"** und **„Ausblenden"**, wenn sie abgebrochen oder
  gescheitert ist („Noch einmal" nur, wenn die Datei noch da ist; ein neues Bild bekommt dabei die
  nächste freie Nummer). Klappt ein späteres Hochladen auf dasselbe feste Ziel (Ersetzen, Porträt,
  Standbild), verschwinden dessen alte Fehlerzeilen. Kommt 90 Sekunden lang kein Fortschritt:
  „Die Übertragung kam 90 Sekunden lang nicht voran — vermutlich ist die Verbindung weg. Versuch
  es noch einmal." — bewusst kein festes Zeitlimit, 40 MB über eine langsame Leitung dürfen dauern.
  Ließ sich die Verarbeitung nicht anstoßen: „Hochgeladen, aber die Verarbeitung ließ sich nicht
  starten." (bzw. „{n} Bilder warten auf die Verarbeitung."), darunter der Grund als Fehlertext
  und der Knopf **„Noch einmal versuchen"** (sonst „Verarbeitung starten"). War der letzte Lauf
  rot und läuft gerade keiner, folgt unter „Die Verarbeitung ist fehlgeschlagen …" leise
  „Scheitert es immer wieder, liegt es meist an einem Bild. Verwirf es und lade es neu als JPEG
  exportiert noch einmal hoch:" und die wartenden Bilder (Bezeichnung wie im Papierkorb), je mit
  **„Verwerfen"**. Rückfrage „„{Bild}" verwerfen?" mit „Das Bild wurde noch nicht verarbeitet.
  Verwerfen löscht es aus dem Eingang; auf der Seite ändert sich nichts. Exportier es am besten
  neu als JPEG und lade es noch einmal hoch.", Knöpfe „Verwerfen" (Hauptknopf) und „Abbrechen";
  sie schließt erst nach Erfolg, sonst steht der Grund darin. Begründung: Ein hängender Upload
  hielt die ganze Schlange für immer auf, Fehlerzeilen ließen sich nicht entfernen, nach einem
  gescheiterten Anstoß gab es keinen Knopf (und gleichzeitig „Die Verarbeitung startet gleich."),
  und ein Bild, an dem die Action scheitert, konnte nur Jan im R2-Dashboard entfernen.
- **Band „Inzwischen wurde der Inhalt anderswo geändert (zum Beispiel hat die Bildverarbeitung
  den Papierkorb geleert). Beim Speichern gibt es deshalb eine Rückfrage."** (seit 2026-10-21) —
  wie „nicht eingerichtet", keine eigene Farbe. Erscheint, wenn die Verarbeitung eine neue Fassung
  des Inhalts mitbringt, während Ungespeichertes da ist. Ohne Ungespeichertes wird der neue Stand
  still übernommen. Begründung: Vorher kam der Konflikt erst beim Speichern, ohne Vorwarnung.
- **Dialog „Inzwischen hat jemand anderes gespeichert"** (bei gleichzeitigem Speichern): nennt,
  was verloren ginge — „Neu laden verwirft: {Zusammenfassung wie beim Speichern}." — und „Abbrechen
  lässt deine Änderungen hier stehen, damit du sie dir ansehen kannst — speichern lassen sie sich
  so aber nicht." Ohne Ungespeichertes (Konflikt beim Wiederherstellen) nur „Neu laden holt den
  neuesten Stand; danach kannst du es noch einmal versuchen." und der Knopf heißt „Neu laden".
  Der Dialog schließt erst, wenn das Laden geklappt hat; sonst steht der Grund als Fehlertext darin.
  Begründung (2026-10-20): Vorher hieß es nur „Merk dir vorher, was du geändert hast" — zehn
  Umsortierungen kann sich niemand merken, und ein gescheitertes Laden schloss den Dialog still.
- **Neu laden gescheitert, Stand schon da:** Band wie „nicht eingerichtet", keine eigene Farbe:
  „Neu laden hat nicht geklappt: {Grund}" mit dem Knopf „Noch einmal laden". Neu laden aus Band
  oder Leiste fragt nach, wenn Ungespeichertes verloren ginge.
- **Verlauf:** Die Nachricht einer Speicherung bricht um statt abgeschnitten zu werden (am Handy
  hilft `title` nicht). Der Eintrag direkt unter dem aktuellen Stand heißt **„Letzte Speicherung
  zurücknehmen"** (Rückfrage „Letzte Speicherung zurücknehmen?", Knopf „Zurücknehmen"), ältere
  „Diesen Stand wiederherstellen". Die Rückfrage lädt den alten Stand („Lädt …") und sagt dann,
  was geschieht; der Knopf ist erst frei, wenn das feststeht:
  - „**Wiederherstellen ändert:** {Zusammenfassung}." und darunter „Bilder, die mit diesem Stand
    wieder im Papierkorb liegen, bekommen ab heute wieder volle 30 Tage." bzw. „Die Bilddateien
    selbst bleiben, wie sie sind."
  - „Dieser Stand ist derselbe wie jetzt." — Knopf gesperrt.
  - „Dieser Stand passt nicht mehr zu den heutigen Regeln und lässt sich nicht direkt
    zurückholen:" als Fehlertext, darunter die Befunde (Ort leise, dann Text, 14px) und „Wenn du
    ihn brauchst, gib Jan Bescheid." — Knopf gesperrt.
  Nach dem Klick bleibt die Rückfrage mit „Stellt wieder her …" offen, bis der neue Stand geladen
  ist (bis zu einigen Sekunden); erst dann steht unten „Gespeichert. Wird veröffentlicht …".
  Lehnt der Server ab, stehen sein Text (Fehlertext) und die Befunde über den Einträgen.
  Begründung (2026-10-20): Vorher stand dort nur „Alles, was danach gespeichert wurde, ist dann
  nicht mehr zu sehen" — aus Entwickler-Nachrichten im Verlauf erfährt Jakob nicht, was das ist.
  Nach jedem Speichern, Neuladen oder Wiederherstellen wird die Liste neu geholt; bis sie da ist,
  steht „Lädt …" über der alten Liste und ihre Knöpfe sind gesperrt. Fehlt die eigene letzte
  Speicherung auch nach mehreren Versuchen, steht dort als Band „Deine letzte Speicherung steht
  hier noch nicht. Gleich noch einmal „Aktualisieren“, dann lässt sich wieder ein Stand
  zurückholen." — Knöpfe weiter gesperrt. Begründung (2026-10-21): Die alte Liste blieb stehen,
  und „Letzte Speicherung zurücknehmen" zeigte auf den Eintrag davor.
- **Zeilenlisten** (Hero, Arbeiten, Filme, Papierkorb, Verlauf): eine Spalte, so breit wie der
  Platz; lange Titel enden mit „…" (im Verlauf brechen sie um). Kein waagerechtes Scrollen
  zwischen 320 und 414px — vorher legte der längste Titel die Breite der Liste fest.
- **Band im Entwicklungsmodus** (nur `next dev` mit Schreibfreigabe, nie in Produktion):
  „Entwicklungsmodus — Speichern schreibt auf {Repo}@{Branch}. Ist das main, geht es sofort
  live." Dasselbe Band wie „Speichern ist noch nicht eingerichtet", keine eigene Farbe — es ist
  ein Hinweis für Jan, kein Fehler.
- **Qualitätsuntergrenze wie oben:** Trefferflächen ≥ 44px, sichtbarer Fokus, nutzbar ab
  **375px** Breite, `:hover` nur unter `(hover: hover) and (pointer: fine)`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — | — | not applicable — kein shadcn, keine Registry, kein Tailwind. Reines CSS mit Custom Properties und CSS-Modules, siehe `TECH-STACK.md` |

---

## Abgelöst — der Vertrag der Auftragsseite (gültig 2026-08-26 bis 2026-10-08)

Der alte Vertrag steht im Wortlaut im Git-Verlauf (`git show 9a04e0d:design/UI-SPEC.md`). Hier
nur, was entfallen ist und warum — damit niemand es aus Versehen zurückholt:

| Entfallen | Warum |
|-----------|-------|
| Zwei Hälften (dunkel = sehen, hell = lesen), die Naht, `--papier`, `--stein` | Eine Fläche ist reduzierter (E1). Ohne Lesetexte gibt es keine „lesen"-Hälfte mehr |
| Primary CTA „Anfrage stellen", `buchbar.`, drei Türen, Preisanker, Anfrageformular | Die Seite verkauft nichts |
| Positionierungszeile und Orte im Hero | Mittig steht nur der Schriftzug |
| Porträt auf der Startseite (`jakob.`) | „Nicht durch meine Fresse" — das Porträt steht nur noch auf `/ueber` |
| Kachelraster mit Kategoriefilter, Detailseiten, Blende im Hero, Kontaktbogen, EXIF-Zeile | Pro Arbeit nur noch Titel und Kunde; Fotos stehen im Mosaik. ↩ Am 2026-10-14 kamen Detailseiten und Kategorien für ein paar Stunden zurück und wurden am Abend wieder entfernt. **Geblieben ist allein die Blende** — im Hero von `/foto`, siehe *`/foto`* |
| Bricolage Grotesque, Newsreader, Martian Mono | Ersetzt durch Druk Wide und Avenir Next (Jakobs Vorgabe) |
| Punkt-Schreibweise (`arbeiten.`) | Nicht in Jakobs Konzept (E7) |
| Scrollgetriebene Bewegung, roter Fortschrittsbalken, Menü-Dialog | Reduktion; drei Navigationsziele brauchen kein Menü |
| Rot für Links, Fokusring, Auftraggeber-Label | Rot ist jetzt allein dem ●REC vorbehalten (E2) |
| Selbst gehostete Filme mit Player | Filme werden verlinkt, nicht gespeichert |
| Der Burst (geplante Erweiterung) | Nie gebaut; ohne Kacheln gibt es keinen Ort dafür |

**Was aus dem alten Vertrag übernommen ist**, weil es erkauft wurde: `svh` statt `vh`, der
Lichtkasten mit `position: fixed` und Fokusrückgabe, das Mosaik mit ungleichen Spalten reihum,
gleiche Breiten für AVIF und WebP, Kontrastmessung über Weiß, die Sprungmarke per `transform`,
`--topbar-h` als gemessenes Token, Speculation Rules auf `moderate`, keine Schriften von fremden
Servern, Navigation an einer Stelle.

---

## Checker Sign-Off

> Dieser Block gehört dem `gsd-ui-checker`, nicht dem Verfasser. Er wird erst nach einer
> tatsächlich durchgeführten Prüfung ausgefüllt.

- [ ] Dimension 1 Copywriting
- [ ] Dimension 2 Visuals
- [ ] Dimension 3 Color
- [ ] Dimension 4 Typography
- [ ] Dimension 5 Spacing
- [ ] Dimension 6 Registry Safety

**Approval:** ausstehend. Das Sign-Off vom 2026-08-26 galt dem abgelösten Vertrag und überträgt
sich nicht.
