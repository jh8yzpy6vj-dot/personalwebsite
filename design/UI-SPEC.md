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
> ⏳ **Der Code folgt diesem Vertrag in den Schritten 2–5 des Umbaus.** Bis der Umbau ausgeliefert
> ist, entspricht die Live-Seite noch dem alten Vertrag. Das ist die Reihenfolge, die `CLAUDE.md`
> verlangt: erst der Vertrag, dann der Code.

---

## Positionierung (bestimmt das Design)

**Die Seite verkauft nichts.** Sie ist eine Präsenz für Jakobs Arbeit — Fotos und Filme — und
tritt selbst zurück. Jakob: „Die Website soll durch meine Arbeit überzeugen, durch die Bilder und
Filme, nicht durch meine Fresse."

Daraus folgen drei Regeln, an denen sich jede Entscheidung unten messen lassen muss:

1. **Das Material ist die Gestaltung.** Eine Fläche, eine Schriftfarbe, eine einzige Akzentfarbe
   für die eigene Marke. Alles, was nicht Foto, Film oder Navigation ist, muss sich rechtfertigen.
2. **Pro Arbeit genau zwei Angaben: Titel und Kunde.** Keine Rolle, kein Ort, kein Jahr als eigene
   Angabe, keine Beschreibung, keine Aufnahmedaten.
3. **Keine Aufforderung.** Kein Knopf, kein Preis, kein Formular, kein „Anfrage stellen". Wer
   Jakob erreichen will, findet eine Zeile auf `/ueber`.

---

## Seitenstruktur

| Route | Aufbau | Sichtbarer Text |
|-------|--------|-----------------|
| `/` | Video in voller Fensterhöhe. Darüber: oben links ●REC, oben rechts die Navigation, mittig der Schriftzug „jakob sax", unten rechts der Pause-Knopf. **Nichts darunter, kein Scrollen.** | Schriftzug, Navigation |
| `/foto` | Topbar, darunter ein Mosaik aus den Fotos aller Arbeiten, in Dateireihenfolge, **ohne Zwischenzeilen** | keiner; „Titel – Kunde" erst beim Überfahren und im Lichtkasten |
| `/film` | Topbar, darunter ein Raster aus Standbildern; jede Kachel ist ein Link nach außen | je Film „Titel – Kunde" unter dem Standbild |
| `/ueber` | Topbar, darunter zweispaltig: Bild links, rechts 3–4 Zeilen und eine Kontaktzeile | 3–4 Zeilen, Kontaktzeile |
| `/impressum`, `/datenschutz` | Topbar, Lesespalte | Pflichttext |
| 404 | Topbar, eine Zeile, zwei Wege | „Hier ist nichts." · foto · film |

Auf jeder Seite unten der Footer mit **Impressum · Datenschutz** — außer auf `/`: Dort gibt es
keinen Footer, weil es kein Scrollen gibt. Die beiden Links stehen auf `/` stattdessen klein
unten links im Video, gegenüber dem Pause-Knopf. ⚠️ Sie dürfen nicht fehlen: Das Impressum muss
von jeder Seite aus „leicht erkennbar und unmittelbar erreichbar" sein (§ 5 DDG).

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
| Links | **nur ●REC** | „jakob sax" (Link auf `/`) und daneben ●REC |
| Rechts | Navigation | Navigation |
| Fläche | transparent über dem Video, mit dem Abdunklungsstreifen aus *Text über Bewegtbild* | **deckend `--grund`**, `position: sticky` |
| Höhe | `--topbar-h` | `--topbar-h` |

**Warum ●REC auf `/` allein in der Ecke steht:** Über einem laufenden Video ist es genau das, was
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
| Hero ohne beides | Fläche `--grund` mit Schriftzug. Gültiger Zustand, kein Fehler. |
| **Mosaik** (`/foto`) | Die Fotos aller Arbeiten in **drei ungleich breiten Spalten** (Gewichte 1.18 / 0.9 / 1.12), **reihum** verteilt (Bild 1 → Spalte 1, Bild 2 → Spalte 2, Bild 3 → Spalte 3, Bild 4 → Spalte 1). **Kein Bild wird beschnitten** — jedes steht in seiner eigenen Form. Unter 860px eine Spalte, die Bilder tragen dann `order`, damit die Reihenfolge stimmt. Kein JavaScript im Layout. |
| Mosaik — Reihenfolge | Arbeiten in der Reihenfolge von `FOTOS` in `lib/content.ts`, innerhalb einer Arbeit nach Dateiname (`01`, `02`, …). **Keine Sortierung nach Jahr** — die Abfolge ist Jakobs Kuration. |
| Mosaik — warum so | ⚠️ Die ungleichen Breiten sind der Hebel, nicht Zierde: Gleich breite Spalten stellen Hochformate zwangsläufig gleich hoch nebeneinander. ⚠️ Reihum, nicht spaltenweise (`column-count` kann das nicht) — sonst läse sich die obere Reihe 1-3-5. Zwei gescheiterte Vorstufen (Flanken, Zeilensatz) sind im alten Vertrag dokumentiert. |
| **Beschriftung im Mosaik** | „Titel – Kunde" erscheint **beim Überfahren mit der Maus und bei Tastaturfokus**, unten im Bild auf einem Verlauf (siehe *Text über Fotos*). Nur unter `@media (hover: hover)` für das Überfahren; auf Touch gibt es kein Überfahren, dort ist der Lichtkasten der Weg. Sonst ist die Fläche textfrei. |
| **Lichtkasten** | Jede Mosaikkachel öffnet groß: Klick oder `Enter`; `←`/`→` blättert **über alle Bilder der Seite**, nicht nur innerhalb einer Arbeit; `Esc` und ein Klick neben das Bild schließen. Bild `contain` auf `--grund`, darunter „Titel – Kunde". ⚠️ **`position: fixed`, nie `absolute`** — sonst springt die Seite beim Öffnen an den Anfang und man steht nach dem Schließen oben. ⚠️ Beim Schließen geht der Fokus **auf die Kachel zurück**, von der er kam. Ohne Skript ist jede Kachel ein gewöhnlicher Link auf die Bilddatei. |
| **Film-Standbild** (`/film`) | Festes Seitenverhältnis **16:9**, `object-fit: cover`. Ausschnitt je Bild aus `lib/bildausschnitte.ts` (Schlüssel `film/<id>`), sonst mittig. Die **ganze Kachel** — Standbild und Beschriftung — ist der Link. |
| Film-Standbild — Quelle | **Liegt bei uns** (`original/film/<id>.jpg` im Bucket). ⚠️ Keine Vorschaubilder von YouTube, Vimeo oder der Mediathek nachladen: Das wäre bei jedem Seitenaufruf eine Anfrage an Dritte und gehörte in die Datenschutzerklärung. **Keine eingebetteten Player.** |
| **Porträt** (`/ueber`) | **Ohne Zuschnitt** — das Bild bringt seine Form mit. Begrenzt wird die **Höhe** (`max-height: 80svh`), sonst schiebt ein Hochformat den Text unter die Falz. |
| Ecken | **Genau ein Radius** (`--radius-bild`, 12px) für Mosaikkacheln, Film-Standbilder und Porträt. Das Hero-Video ist randlos und hat keinen. |
| **Was kein Bild hat, erscheint nicht** | Eine Fotoarbeit ohne Bilder und ein Film ohne Standbild werden **nicht** angezeigt — keine Platzhalterkachel. Eine Seite, die nur aus Bildern besteht, darf keine grauen Flächen zeigen. `npm run medien` nennt, was fehlt. |
| Auslieferung | WebP **und** AVIF mit `srcset` in bis zu fünf Breiten (480–2400), JPEG als Rückfall, `width`/`height` am `img` gegen Layoutsprünge. Erzeugt von `npm run medien`, nicht im Deploy. ⚠️ Beide Formate müssen **dieselben** Breiten abdecken — sonst greift der Browser still zur kleineren Stufe und rechnet hoch. |
| Breite der Quelle | Eine Quelle liefert nur die Breiten, die sie hat; es wird nie hochskaliert. Die **Breite** entscheidet über die Schärfe, nicht die Pixelzahl. |
| Ladezustand | Ein 16px breites Vorschaubildchen als Datei-URI im HTML füllt die Fläche, bis das Foto da ist. Kein Skript, keine zusätzliche Anfrage. |
| Laden | Hero-Standbild `fetchpriority="high"`. Auf `/foto` die ersten drei Bilder sofort, alle weiteren `loading="lazy"`. Auf `/film` die ersten zwei sofort. |

**Wenn die Bilder gut sind, ist jedes erklärende Wort davor ein Verlust.** Deshalb keine
Überschrift über dem Mosaik, keine Einleitung über dem Filmraster, kein Text über dem Hero außer
dem Schriftzug.

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
| Display (Schriftzug auf `/`) | Druk Wide Bold | **96px** · mobil **36px** | 1.0 |
| Heading (404-Zeile) | Druk Wide Bold | 36px | 1.1 |
| Wortmarke (Topbar), Überschriften der Rechtsseiten | Druk Wide Bold | 18px | 1.1 |
| Navigation | Druk Wide Bold | 14px | 1.1 |
| Body (Zeilen auf `/ueber`, Rechtstexte) | Avenir Next Regular | 18px | 1.6 |
| Beschriftung („Titel – Kunde", Kontaktzeile, Footer) | Avenir Next Regular | 14px | 1.4 |
| Screenreader-Überschrift (unsichtbar) | — | 36px | — |

**Skala: 14 · 18 · 36 · 96.** Mobil (≤ 700px) stuft nur das Display von 96 auf 36 herunter,
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
| Navigation | „foto", „film", „über mich" |
| **Beschriftung einer Arbeit** | „{Titel} – {Kunde}". Halbgeviertstrich (–, U+2013) mit je einem Leerzeichen. Beispiele: „WiWaWo 2026 – Bayerischer Kanuverband", „Y-Kollektiv: Tödliches Gold – SWR/ARD" |
| Kundennamen | **Ohne Rechtsformzusatz** (kein e.V., GmbH, gGmbH) — E10. Mehrere Auftraggeber mit Schrägstrich **ohne** Leerzeichen („SWR/ARD") |
| Titel | So, wie Jakob ihn schreibt. Doppelpunkt erlaubt („Y-Kollektiv: Tödliches Gold") |
| Externes Ziel (nur Screenreader) | an die Beschriftung angehängt: „, auf YouTube" bzw. „auf Vimeo", „in der ARD Mediathek" — abgeleitet aus der Adresse. Sichtbar steht nur ein kleines ↗ (`aria-hidden`) |
| `/ueber` | 3–4 Zeilen **von Jakob**, erste Person. Bis sie vorliegen, die beiden bisher freigegebenen Absätze (Journalist beim SWR; Aufmerksamkeit auf dem Festivalplatz). Nichts erfinden |
| Kontaktzeile | „mail@jakobsax.de · Instagram · SWR-Autorenseite" — drei Links, sonst nichts (E6, E12) |
| Footer | „Impressum · Datenschutz" |
| Pause-Knopf | sichtbar ein Symbol; `aria-label` „Video anhalten" bzw. „Video abspielen" |
| Lichtkasten | „Titel – Kunde" unter dem Bild; Knöpfe mit `aria-label` „Schließen", „Vorheriges Bild", „Nächstes Bild" |
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
| Beschriftung im Mosaik | Erscheint mit 120ms Überblendung (`opacity`). |
| Seitenwechsel | `@view-transition` blendet über. Unter `reduce` aus (`navigation: none` — die globale `animation-duration`-Regel greift bei View Transitions nicht). |
| **Sonst nichts.** | Kein Aufsteigen beim Scrollen, kein Fortschrittsbalken, keine Blende, kein Parallax, kein Ken Burns, keine Filter über Fotos. Bei guten Fotos ist jeder Effekt ein Abzug. |

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
| empty | Hero ohne Video und Standbild | ✅ covered | Fläche `--grund` mit Schriftzug |
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
| Kachelraster mit Kategoriefilter, Detailseiten, Blende im Hero, Kontaktbogen, EXIF-Zeile | Pro Arbeit nur noch Titel und Kunde; Fotos stehen im Mosaik |
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
