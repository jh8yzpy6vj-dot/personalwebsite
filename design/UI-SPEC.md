---
phase: 2
slug: jakobsax-media-erstentwurf
status: approved
shadcn_initialized: false
preset: none
created: 2026-08-26
reviewed_at: 2026-08-26
---

# UI Design Contract — jakobsax.de

> Verbindlicher Design-Vertrag. Bei Widerspruch zu `SITE-PLAN.md` gilt dieses Dokument.
>
> **Grundlage:** das Briefing „Private Website Jakob Sax" (Rev. 5) sowie die Referenz-Seite
> bildmanufaktur.de, deren Struktur übernommen wurde. Ersetzt den vorherigen Entwurf
> (dunkles Theme mit Mint-Akzent) vollständig — der war vor dem Briefing entstanden und ging
> von einer falschen Positionierung aus.

---

## Positionierung (bestimmt das Design)

Jakob Sax ist **Journalist beim SWR** *und* **Fotograf für Straßentheater und zeitgenössischen
Zirkus**. Kerngeschäft ist die Fotografie, Journalismus ist Glaubwürdigkeitsbeleg — keine Ware.
Das Design muss beides zeigen, ohne dass eines das andere entwertet.

**Strukturprinzip: die zwei Hälften.**

| Hälfte | Zweck | Umsetzung |
|--------|-------|-----------|
| **dunkel = sehen** | Fotografie, Bewegtbild. Hier wird gebucht. | Randlose Bilder auf `--buehne`, minimale Typografie |
| **hell = lesen** | Buchbar, Referenzen, Über, Kontakt. Hier wird Vertrauen gelesen. | `--papier`, Serifenschrift, Text vorn |

Der Wechsel selbst ist das Strukturelement. Die dunkle Hälfte steht **oben**: wer bucht, sieht
zuerst Bilder; wer prüft, scrollt weiter.

---

## Seitenstruktur

> **Umgesetzt am 2026-08-27.** Die frühere Einzelseite ist abgelöst; Absicht und Begründung
> stehen in `SITE-PLAN.md`. **Dieser Abschnitt ist noch nicht unabhängig geprüft** — das
> Sign-Off unten deckt den Stand vom 2026-08-26.

| Route | Hälfte | Aufbau |
|-------|--------|--------|
| `/` | Hero dunkel, Rest hell | Hero → `buchbar.` (drei Türen) → `zuletzt.` → `schon fotografiert für.` → `kontakt.` → Footer |
| `/arbeiten` | dunkel | Titel, Filter (`alle.` `festivals.` `bewegtbild.` `redaktion.`), randloses 2-Spalten-Raster (**gap 0**), heller Footer |
| `/arbeiten/[slug]` | Bild dunkel, Kontext hell | Bild → Auftraggeber · Titel · Meta → Rückweg |
| `/leistungen/[slug]` | hell | Eine Seite je Angebot: Zielgruppe, Beschreibung, Eckdaten, Preisanker, passende Arbeiten, CTA |
| `/ueber` | hell | Kurzbio, Belege, Referenzzeile |
| `/kontakt` | hell | Buchungsanfragen / Vertraulich, zweispaltig |
| `/impressum`, `/datenschutz` | hell | Pflichtangaben, `noindex` |
| 404 (`not-found`) | hell | „hier ist nichts." — führt weiter zu Arbeiten, Start, Kontakt |

**Eigene 404-Seite ist Pflicht, nicht Kür.** Ohne sie greift die Next.js-Standardseite: weißer
Grund, englischer Text, kein Bezug zur Seite. Bei eigenen URLs je Arbeit passiert das
zwangsläufig — Tippfehler, alte Links, entfernte Arbeiten. Die Copy **führt weiter statt sich zu
entschuldigen**: Wer dort landet, suchte etwas Bestimmtes und braucht den nächsten Schritt.

**Sprungmarke zum Inhalt.** Erstes fokussierbares Element jeder Seite, unsichtbar bis zum
Tastaturfokus, Ziel `#inhalt` auf dem `<main>`. Ohne sie muss man sich auf *jeder* Seite erst
durch die fixe Topbar tabben. Bewusst mit `transform` aus dem Bild geschoben statt mit
`display: none` — ein so verstecktes Element ist gar nicht fokussierbar und die Marke wirkungslos.

**Genau eine Naht pro Seite.** Der Wechsel dunkel → hell ist das Strukturelement und passiert je
Seite höchstens einmal. Deshalb liegt `zuletzt.` auf der Startseite im **hellen** Bereich und
zeigt **Zeilen statt Kacheln**: Auf der Weiche geht es um Aktualität, nicht um Bilder — die
stehen im Archiv. Ein dunkler Bilderblock zwischen zwei hellen Textblöcken hätte die Naht
verdoppelt.

**Topbar:** trägt nur die Wortmarke und den ●REC-Chip, keine Navigation — über dem Hero soll sie
nicht mit dem Bild konkurrieren. **Die Navigation liegt im Footer** (`arbeiten.` `über.`
`kontakt.` + Rechtliches), auf jeder Seite gleich, der aktuelle Punkt mit `aria-current="page"`
markiert statt verlinkt.

**`variant="light"` ist Pflicht** auf durchgehend hellen Seiten (`LightPage`). Ohne das startet
die Topbar im Dunkel-Modus und die weiße Wortmarke ist auf Papier unlesbar. Auf `/` bleibt der
`IntersectionObserver` auf `#lesen` — die id ist deshalb kein Ankerziel, sondern der
Beobachtungspunkt.

**Kachel = Link.** Im Archiv ist die ganze Kachel klickbar, nicht nur der Titel — bei einem
randlosen Raster ist das Bild die Klickfläche, die Leute erwarten. Der Fokusring liegt **innen**
(`outline-offset: -4px`), sonst schneidet ihn das `overflow: hidden` der Kachel ab.

**Die drei Türen auf `/` sind Anrisse, keine Angebote.** Der vollständige Text steht auf
`/leistungen/[slug]`. Vorher hatten die Angebote keine eigene URL — man konnte weder darauf
verlinken, noch konnte eine Suche nach „Festivalfotograf Rastatt" auf einer Seite *über
Festivalfotografie* landen. Verkauf und Suchmaschine wollen hier dasselbe.

**Detailseiten sind keine Sackgassen.** `vorherige / nächste` innerhalb derselben Kategorie —
wer eine Festivalarbeit anschaut, will die nächste Festivalarbeit sehen, keinen Radiobeitrag.
**Ohne Umlauf:** Am Ende ist Schluss; ein Ring würde vortäuschen, es ginge endlos weiter.

### Bewegung ohne Bibliothek

Drei Browser-Techniken ersetzen, wofür sonst eine Animationsbibliothek nötig wäre. **Alle drei
sind Progressive Enhancement** — wo sie fehlen, verhält sich die Seite wie vorher.

| Technik | Wirkung | Kosten |
|---------|---------|--------|
| `@view-transition` | Seitenwechsel blendet über statt hart umzuschalten | 3 Zeilen CSS, **kein JavaScript** |
| Speculation Rules | Lädt die Zielseite bei erkennbarer Absicht vor — der Klick wirkt sofort | ein `<script type="speculationrules">` |
| `content-visibility: auto` | Kacheln außerhalb des Bildschirms werden nicht gerendert | eine Zeile je Kachel |

⚠️ **`prefers-reduced-motion` schaltet auch den Seitenübergang ab** (`navigation: none`). Die
globale `animation-duration`-Regel greift dort **nicht** — View Transitions brauchen eine eigene
Abschaltung.

⚠️ **Speculation Rules stehen auf `moderate`, nicht `eager`.** Vorgeladen wird erst bei
erkennbarer Absicht, nicht bei jedem Link im Blickfeld — sonst zahlt jemand mit teurem Mobilfunk
für Seiten, die er nie öffnet.

⚠️ **`content-visibility` braucht `contain-intrinsic-size`**, sonst kennt der Browser die Höhe
nicht gerenderter Kacheln nicht und die Bildlaufleiste springt.

**Vorbild für Topbar, ●REC-Marke, Kategoriefilter und randloses Raster war**
[bildmanufaktur.de](https://www.bildmanufaktur.de) — übernommen wurde die Struktur, nicht die
Gestaltung.

**⚠️ Pflichtangaben — Launch-Blocker, teilweise erledigt.** Seit 2026-08-27 existieren
`/impressum` und `/datenschutz` als Gerüst und sind im Footer **verlinkt**. Die frühere
Entscheidung (unverlinkter Text, weil Links ins Leere schlechter wären als keine) ist damit
überholt: Eine erreichbare Seite, die ihre Lücken benennt, ist besser als toter Text.

**Weiterhin offen und Launch-Blocker:** Die Pflichtangaben selbst — ladungsfähige Anschrift,
E-Mail, Umsatzsteuer-Angabe. Solange sie fehlen, zeigen beide Seiten oben einen Hinweis und an
der jeweiligen Stelle einen sichtbaren Platzhalter in `--rec`. Gesteuert über
`LEGAL_DATA_COMPLETE` in `lib/legal.ts`. Siehe `TODO.md`.

**Regel für die Rechtsseiten:** Sie gehören zur hellen „lesen"-Hälfte und nutzen ausschließlich
die bestehenden Tokens — keine fünfte Schriftgröße, kein drittes Gewicht. Die Topbar läuft dort
mit `variant="light"`; ohne das startete sie im Dunkel-Modus und die weiße Wortmarke wäre auf
Papier unlesbar.

**⚠️ Keine internen Notizen im gerenderten Text.** Beim Bau der Seiten standen zunächst
Arbeitshinweise („hier stand früher ein Verweis auf die OS-Plattform …") und ⚠️-Emoji in der
sichtbaren Copy — beides verstößt gegen den Copywriting Contract unten (Emoji sind dort
ausdrücklich ausgeschlossen) und gehört in Code-Kommentare. Beim Prüfen der gerenderten Seiten
aufgefallen und korrigiert.

**Topbar-Verhalten:** Sie gehört optisch zu der Hälfte, über der sie steht — über `--buehne`
transparent mit heller Wortmarke, über `--papier` mit Papier-Grund, `--stein`-Unterkante und
dunkler Wortmarke. Ohne diesen Wechsel wäre die weiße Wortmarke auf dem hellen Bereich
unlesbar (im Test bestätigt). Umgesetzt via `IntersectionObserver` auf `#lesen`.

---

## Bildbehandlung & Fokuspunkt

| Element | Regel |
|---------|-------|
| Hero | Höhe `82vh` (mobil `72vh`), `min-height: 420px`. Randlos, `object-fit: cover`. Video: `loop`, `muted`, `playsinline` — ohne Ton, ohne Bedienelemente. |
| Kachel | Seitenverhältnis **4:3** am Desktop, **4:5 mobil**, `object-fit: cover`. Randlos aneinanderstoßend (`gap: 0`). |
| Metazeile | Liegt **über** dem Bild am unteren Rand, auf einem Verlauf nach Schwarz — nie unter dem Bild. |

**Fokuspunkt:** Im Hero ist das **Bild** der primäre Anker, nicht die Schrift — der
Positionierungssatz sitzt bewusst unten und tritt hinter das Motiv zurück. In der hellen Hälfte
übernimmt der Sektionstitel (28px) die Ankerrolle, in `buchbar.` zusätzlich der rote CTA als
einziger gefüllter Button. Auf einer Kachel führt der Blick vom Bild über das rote
Auftraggeber-Label zum Titel.

**Warum die Kachel mobil hochkant wird:** Einspaltig ist eine 4:3-Kachel auf 375px nur rund
280px hoch. Ein zweizeiliger Titel plus Metazeile belegt davon fast die Hälfte — mit echten Fotos
würde der Text das Motiv verdecken. 4:5 gibt dem Bild den Raum zurück und nutzt das hohe Display
besser. Beim Mobil-Test aufgefallen, vorher stand hier nur 4:3.

**Wenn die Bilder gut sind, ist jedes erklärende Wort davor ein Verlust** — deshalb keine
Überschrift über dem Hero, kein Text über dem Motiv außer der einen Zeile unten.

---

## Farbe

Tokens aus dem Briefing:

| Token | Hex | Einsatz |
|-------|-----|---------|
| `--rec` | `#E11B1B` | **Seine eigene Bildmarke** (●REC). Chip-Fläche, Punkte, aktive Filter-Unterkante, Fokusring, Unterstreichungen |
| `--buehne` | `#0E0E10` | Dunkle Hälfte — Galerieflächen, fast neutral, damit die Fotos die Farbe machen |
| `--papier` | `#F4F3EF` | Helle Hälfte — Lesebereiche |
| `--stein` | `#D9D5CC` | Trennlinien, ruhige Abstufung |
| `--ton` | `#6E7873` | Basiswert für Meta-/Sekundärtext |

**60/30/10:** `--buehne`/`--papier` als dominante Flächen (60), Bilder und `--stein`-Abstufungen
(30), `--rec` als einziger Akzent (10).

**Accent reserved for:** ●REC-Chip in der Topbar, Punkt vor der Ortsangabe, Punkt in der
Bild-Platzhalterkachel, Unterkante des aktiven Filters, Fokusring, Unterstreichungsfarbe von
Links im Lesebereich, Auftraggeber-Label auf den Kacheln, Randstreifen des Hinweises auf
unvollständige Pflichtangaben, sichtbare Lücken (`[ … FEHLT ]`). **Nicht** für Fließtext, nicht
für Überschriften, nicht für alle interaktiven Elemente.

**Zwei gefüllte `--rec`-Flächen, mit Begründung:**

1. Der **Primary CTA** — der einzige gefüllte Button im sichtbaren Layout.
2. Die **Sprungmarke zum Inhalt** — sie ist nur bei Tastaturfokus sichtbar und steht damit nie
   gleichzeitig mit dem CTA im Bild. Als Barrierefreiheits-Element muss sie sich maximal
   abheben; sie konkurriert nicht um Aufmerksamkeit, weil sie erst erscheint, wenn jemand sie
   aktiv ansteuert. Beim Code-Review als Vertragskonflikt aufgefallen und hier aufgelöst.

### Zugängliche Textvarianten (Abweichung mit Begründung)

Die Briefing-Tokens verfehlen als **kleiner Text** die im Briefing selbst gesetzte Untergrenze
von 4.5:1 — gemessen im Browser: `--ton` auf `--papier` = 4.11, `--rec` auf Schwarz = 4.37,
`--papier` auf `--rec` = 4.32. Deshalb: die Markenfarben bleiben unverändert für Flächen,
Punkte, Linien und Fokus; **kleiner Text** nutzt diese Varianten:

| Token | Hex | Kontrast | Einsatz |
|-------|-----|----------|---------|
| `--ton-papier` | `#5C665F` | 5.37:1 auf `--papier` | Meta-Text in der hellen Hälfte |
| `--ton-buehne` | `#7A857F` | 5.04:1 auf `--buehne` | Meta-Text in der dunklen Hälfte |
| `--rec-text` | `#EE3B3B` | 5.32:1 auf Schwarz | Auftraggeber-Label auf Kacheln |
| `--auf-rec` | `#FFFFFF` | 4.80:1 auf `--rec` | Schrift und Punkt im ●REC-Chip |

Gemessenes Minimum über die gesamte Seite: **4.80:1**.

---

## Typografie

**Genau 4 Größen, genau 2 Gewichte.** Alle sieben Rollen sind vollständig deklariert — mehrere
Rollen teilen sich bewusst eine Größe und unterscheiden sich über Schriftschnitt, Gewicht und
Farbe:

| Rolle | Schrift | Größe | Gewicht | Zeilenhöhe |
|-------|---------|-------|---------|------------|
| Display (Positionierung im Hero) | Bricolage Grotesque | 56px | 700 | 1.0 |
| Heading (Sektionstitel, Wortmarke) | Bricolage Grotesque | 28px | 700 | 1.2 |
| Subheading (Leistungstitel, Kontakt-Überschriften, Kachel-Titel) | Bricolage Grotesque | 18px | 700 | 1.2 |
| Body (Fließtext) | Newsreader | 18px | 400 | 1.6 |
| Label (Filter, CTA, Links) | Martian Mono | 14px | 400 | 1.4 |
| Meta (Credits, Eckdaten, Footer) | Martian Mono | 14px | 400 | 1.4 |
| Screenreader-Überschrift (unsichtbar) | — | 28px | — | — |

Skala: 14 · 18 · 28 · 56 — Abstände 1.29 / 1.56 / 2.0, keine zu nah beieinanderliegenden Werte.

**Mobil (≤ 700px)** stufen zwei Rollen innerhalb derselben Skala herunter — das ist vertraglich
gedeckt und **kein** Verstoß:

| Rolle | Desktop | Mobil |
|-------|---------|-------|
| Display (Positionierung) | 56px | 28px |
| Wortmarke in der Topbar | 28px | 18px |

**Kein Wert unter 14px.** Ein früherer Entwurf sah zusätzlich 12px für Credits vor — verworfen,
weil 12px und 14px **derselbe** Schriftschnitt (Martian Mono 400/1.4) waren und mit Faktor 1.17
zu dicht lagen. Die Rollenteilung der drei Schriftfamilien rechtfertigt drei Größen, nicht fünf.

Die unsichtbare Screenreader-Überschrift bekommt eine explizite Größe, damit die
Browser-Vorgabe (1.5em → 27px) keinen undeklarierten Wert in die Skala einschleppt.

**Eingebunden über `next/font/google`** — kein externer Ladevorgang zur Laufzeit, Fallbacks
sind gesetzt.

**Schreibweise:** Sektionstitel und Filter durchgehend **klein mit Schlusspunkt**
(`buchbar.` `kontakt.` `festivals.`). Das ist belegt seine eigene Handschrift, keine
Design-Erfindung. Eigennamen im Fließtext bleiben normal geschrieben.

---

## Spacing

4er-Skala: 4 · 8 · 16 · 24 · 32 · 48 · 64px als `--space-xs` bis `--space-3xl`.

**Barrierefreiheits-Untergrenze:** Klickflächen mindestens 44×44px, umgesetzt via
`min-height: 44px` auf Links, Buttons und Filter — **auch auf der Wortmarke in der Topbar.** Sie
ist auf allen Unterseiten der Weg zurück zur Startseite, also ein echtes Navigationsziel; die
Schrift allein ergab nur 22px Höhe (beim Mobil-Test aufgefallen).

**Eine begründete Ausnahme: Links im Fließtext.** Ein Link mitten in einem Satz („mehr über
mich", „SWR-Autorenseite") bleibt auf Zeilenhöhe. WCAG 2.5.8 nimmt Ziele *innerhalb eines
Textblocks* ausdrücklich von der Mindestgröße aus, und 44px hohe Inline-Links würden den
Zeilenfluss zerreißen. Die Regel gilt weiterhin für **alle eigenständigen** Links und Buttons.

**Topbar-Höhe als Token:** `--topbar-h` (92px Desktop, 76px mobil), im Browser gemessen.
Ankersprünge und der obere Abstand jeder Seite hängen daran. Vorher standen an **vier Stellen**
handgerechnete Werte — als die Topbar durch die 44px-Untergrenze wuchs, wurden alle vier still
falsch und der Titel auf `/arbeiten` stand mobil nur noch 3px unter der Leiste. Wer Innenabstand
oder Schriftgröße der Topbar ändert, muss `--topbar-h` neu messen.

**Ausnahmen:**
- `scroll-margin-top`: `--topbar-h` plus `--space-md`. Ohne das landen Ankersprünge unter der
  fixen Topbar.
- Das Arbeiten-Raster hat bewusst **gap: 0** — randlos aneinanderstoßende Kacheln sind das
  übernommene Kernmerkmal der Referenz.
- Die ●REC-Marke hat **durchgehend 8px** Durchmesser, an allen drei Fundstellen (Topbar-Chip,
  Ortsangabe im Hero, Platzhalterkachel). Ein Markenzeichen in drei Größen wäre eine
  Inkonsistenz.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Positionierung (H1) | „fotografie für kultur & theater im öffentlichen raum" — seine eigene Selbstbeschreibung, unverändert |
| Primary CTA | „Anfrage stellen" (Verb + Nomen). Erscheint auf `/` **zweimal mit genau demselben Label**: am Ende von `buchbar.` und unter `kontakt.` Einziger gefüllter Button der Seite (`--rec`-Fläche, `--auf-rec`-Schrift), als Konstante `CTA_LABEL` in `app/page.tsx` gehalten. **Zwei verschieden beschriftete rote Knöpfe wären zwei konkurrierende Aufforderungen** — beim Umbau einmal passiert und korrigiert. **Ziel ist dauerhaft `/kontakt`, nicht `mailto:`** — auch jetzt, wo die Adresse echt ist: Dort ist nach Absicht getrennt (Buchung / vertraulich), und dort landet das Anfrageformular. Ein `mailto:` von der Startseite würde an dieser Trennung vorbeiführen. Auf `/kontakt` selbst steht der `mailto:`-Knopf, gesteuert über `LEGAL_DATA_COMPLETE`. |
| Kontakt-Trennung | „buchungsanfragen." / „vertraulich." |
| Vertraulich-Hinweis | „Für Hinweise an mich als Journalist. Ich behandle Quellen vertraulich und nenne niemanden ohne Absprache." |
| Leerzustand Kachel | „Bild folgt" — ehrlicher Platzhalter, solange Bildmaterial fehlt |
| Fehlzustand | Nicht anwendbar — statische Seite ohne Formular |
| Destruktive Aktion | Nicht anwendbar |

**Tonalität** (aus der Tonalitätsanalyse des Briefings): erste Person, aktiv, konkrete Nennungen
(Sender, Format, Jahr), kurze Sätze. **Nicht** verwenden: „durfte", „mega", Emoji, Werbe-Sprech
über Emotionen und unvergessliche Momente. Zielregister: präzise, konkret, unangestrengt.

**⚠️ Sämtliche Copy ist unbestätigt.** Alle Texte stammen aus dem Briefing und sind **nicht von
Jakob freigegeben**. Besonders: die Adresse `hallo@jakobsax.media` ist ein **erfundener
Platzhalter**, ebenso die vertraulichen Kanäle und alle Preis-/Lieferzeit-Angaben („noch
festzulegen"). Nichts davon gilt als freigegebene Copy — siehe Launch-Blocker in `TODO.md`.

**Credit-Pflicht:** Jede Arbeit trägt Auftraggeber, Rolle und Jahr. Das ist keine Kür — saubere
Credits sind belegt seine Arbeitsweise, und sie decken die Nutzungsrechtefrage mit ab.

---

## UI Considerations

Applicable state considerations resolved: **4 covered, 3 backstop, 0 unresolved**

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Arbeiten-Raster (`list-collection`) | 🧪 backstop | Filter kann theoretisch 0 Treffer liefern. Aktuell hat jede Kategorie mindestens einen Eintrag, daher kein sichtbarer Leerzustand — sobald Kategorien dazukommen oder leer laufen können, Leerzustands-Copy ergänzen und visuell prüfen. |
| empty | Bildkachel (`media`) | ✅ covered | Fehlt ein Bild, rendert die Kachel den Platzhalter mit ●-Punkt und „Bild folgt" statt eines kaputten `img` — im Browser bestätigt. Der Platzhalter trägt bewusst `aria-hidden="true"`: „Bild folgt" ist eine Notiz an uns, keine Information für Nutzende — die Metazeile darunter trägt Auftraggeber, Titel und Jahr und bleibt für Screenreader vollständig lesbar. |
| loading | Hero-Video (`media`) | 🧪 backstop | Solange `HERO_VIDEO` `null` ist, greift ein Farbverlauf-Platzhalter. Mit echtem Video: Poster-Bild setzen (`HERO_POSTER`), damit vor dem Laden keine schwarze Fläche steht — zu verifizieren, sobald das Video vorliegt. |
| error | Kontaktbereich (`interactive-control`) | ✅ covered | Nur `mailto:`-Links, kein Formular, keine Netzwerkoperation — kein Fehlerzustand möglich. |
| zero-one-many | Arbeiten-Raster (`list-collection`) | ✅ covered | Einspaltig auf Mobil, zweispaltig ab 700px; getestet mit 1, 4 und 9 Kacheln über den Filter — Layout trägt in allen drei Fällen. |
| long-text | Kachel-Titel (`static-content`) | ✅ covered | Titel brechen im Blockfluss um; Metazeile setzt sich aus optionalen Feldern zusammen und lässt fehlende Werte weg statt leere Trenner zu zeigen. |
| overflow | Filterzeile (`interactive-control`) | 🧪 backstop | `flex-wrap: wrap` gesetzt, bei 375px bestätigt (bricht auf zwei Zeilen um, kein horizontales Scrollen). Bei weiteren Kategorien erneut prüfen. |

---

## Motion

- Topbar wechselt Farbe mit 160ms Übergang beim Hälftenwechsel.
- Filter-Zustände mit 120ms Farbübergang.
- `prefers-reduced-motion: reduce` schaltet alle Übergänge global ab (in `globals.css`).
- **Sonst nichts.** Kein Parallax, kein Ken Burns über Standbildern, keine Filter über Fotos.
  Bei guten Fotos ist jeder Effekt ein Abzug.

> 📌 Zu dieser Regel liegt **ein begründeter Änderungsvorschlag** vor (der „Burst") — siehe
> „Geplante Erweiterungen" weiter unten. Bis der geprüft ist, gilt die Regel oben unverändert.

---

## Qualitätsuntergrenze

- [x] Voll responsiv, kein horizontales Scrollen (bei 375px und Desktop bestätigt)
- [x] Sichtbarer Tastaturfokus (`:focus-visible`, 2px `--rec`)
- [x] Semantische Struktur (`ul`/`li` für das Raster, `button` mit `aria-pressed` für Filter)
- [x] Kontraste ≥ 4.5:1 (gemessenes Minimum 4.80:1)
- [x] Klickflächen ≥ 44px
- [ ] `srcset`, moderne Bildformate, Lazy Loading unterhalb des Falzes, Hero eager — **offen,
      greift erst mit echtem Bildmaterial** (`loading="lazy"` ist bereits gesetzt)
- [ ] Alt-Texte, die die Szene beschreiben — Feld `alt` existiert pro Arbeit, muss mit den
      Bildern befüllt werden

---

## Geplante Erweiterungen — noch **nicht** Vertragsbestandteil

> ⚠️ **Dieser Abschnitt ist vom Sign-Off unten nicht gedeckt.** Er hält Änderungsvorschläge aus
> dem Feature-Brainstorm vom 2026-08-27 fest, damit sie begründet dokumentiert sind, **bevor**
> Code entsteht (so verlangt es `CLAUDE.md`). Jeder Punkt muss vor der Umsetzung vom
> `gsd-ui-checker` geprüft und dann in den regulären Vertrag oben eingearbeitet werden.
> Die Aufgaben selbst stehen in `TODO.md`, die Technik in `TECH-STACK.md`.

### 1. Der Burst — Änderungsvorschlag zum Motion-Vertrag

**Was:** Beim Hover (Desktop) bzw. Tap (Touch) spielt eine Kachel fünf Frames derselben
Aufnahmeserie mit ~6 fps ab — die vier daneben und den einen, der es geworden ist — und bleibt
auf dem gewählten Bild stehen. Mono-Zeile darunter: `5 bilder. eins zählt.`

**Warum das kein Verstoß gegen „Bei guten Fotos ist jeder Effekt ein Abzug" ist:** Die bisherige
Regel richtet sich gegen Effekte, die **über** ein Foto gelegt werden (Parallax, Ken Burns,
Filter) — sie schmücken das Bild, statt es zu zeigen. Der Burst legt nichts über das Bild; er
zeigt **weitere echte Bilder desselben Fotografen**. Er behauptet nicht, was die Copy sagt
(„Ein Moment auf dem Hochseil passiert genau einmal") und was im `über.`-Text steht
(„antizipieren, warten, im richtigen Moment auslösen") — er belegt es. Damit fällt er unter die
Tonalitätsregel *konkrete Nennungen statt Eigenschaftswörter*, nicht unter Dekoration.

**Bedingungen, ohne die der Vorschlag hinfällig ist:**

| Regel | Grund |
|-------|-------|
| `prefers-reduced-motion: reduce` → Standbild, kein Burst | Die globale Abschaltung in `globals.css` gilt weiter, ohne Ausnahme |
| Kein Autoplay, nie im Viewport ausgelöst | Neun gleichzeitig flackernde Kacheln wären genau der Zirkus, den die Motion-Regel verhindern soll |
| Hover nur bei `pointer: fine` | Auf Touch sonst unbeabsichtigt beim Scrollen ausgelöst |
| Höchstens eine Kachel gleichzeitig | siehe oben |
| Endzustand ist immer der gewählte Frame | Der Effekt darf nie auf einem schwächeren Bild stehen bleiben |
| Frames werden erst bei Interaktion geladen | Sonst verfünffacht sich das Ladegewicht der Startseite und widerspricht dem Ladezeit-Ziel |

**Voraussetzung:** fünf Frames je Arbeit. Ohne Bildmaterial nicht umsetzbar.

### 2. EXIF-Zeile

**Was:** Unter dem Bild eine Zeile aus den echten Aufnahmedaten, z.B.
`22:14 uhr · 1/500 · f/2.8 · iso 6400`.

**Typografie:** nutzt die **bestehende** Rolle *Meta* (Martian Mono, 14px, 400, 1.4) — **keine
neue Größe, kein neues Gewicht**, die Skala 14 · 18 · 28 · 56 bleibt unangetastet.
**Farbe:** `--ton-buehne` in der dunklen Hälfte, `--ton-papier` in der hellen.
**Schreibweise:** klein, mit `·` als Trenner — konsistent zur bestehenden Metazeile.

⚠️ Zwei Einschränkungen, die die Copy betreffen: **GPS-Tags müssen vor der Auslieferung raus**,
und **Wetter oder Lichtsituation stehen nicht im EXIF** — wenn solcher Kontext gewünscht ist,
braucht es ein optionales Handfeld in `lib/content.ts` und damit eine Copy-Freigabe.

### 3. Anfrageformular auf `/kontakt` — Zustände und Regeln

> Am 2026-08-27 **vor** dem Code festgelegt, wie `CLAUDE.md` es verlangt.

**Die Hierarchie ändert sich auf dieser einen Seite.** Der Absende-Button des Formulars wird dort
der Primary CTA und damit der einzige gefüllte Button; **der `mailto:`-Weg bleibt sichtbar, aber
als schlichter Textlink.** Zwei gefüllte Knöpfe nebeneinander wären zwei konkurrierende
Aufforderungen — und die inhaltlich richtige Reihenfolge ist ohnehin: Formular zuerst,
E-Mail als Ausweg für alle, die keins ausfüllen wollen.

**Felder** (Reihenfolge = Reihenfolge im Kopf des Anfragenden): Art der Veranstaltung · Datum ·
Ort · Budgetrahmen · Nachricht · Name · E-Mail. Pflicht sind nur **Name, E-Mail und Nachricht** —
jedes zusätzliche Pflichtfeld kostet Anfragen.

**Der Budgetrahmen ist ein Auswahlfeld, kein Freitext**, mit einer ausdrücklichen Option „weiß
ich noch nicht". Er beantwortet die Preisfrage, ohne dass ein Preis festgelegt werden muss.

| Zustand | Verhalten |
|---------|-----------|
| **idle** | Absende-Button aktiv, keine Meldungen sichtbar |
| **submitting** | Button deaktiviert, Beschriftung wechselt zu „wird gesendet…", Felder bleiben lesbar und **behalten ihre Werte** |
| **success** | Formular wird durch eine Bestätigung ersetzt, die sagt, **was als Nächstes passiert** — nicht bloß „Danke" |
| **error** | Fehlermeldung **über** dem Formular, **alle Eingaben bleiben erhalten**, Button wieder aktiv. Copy nennt den `mailto:`-Ausweg |
| **Validierungsfehler** | Je Feld unter dem Feld, `aria-invalid` und `aria-describedby` gesetzt; Fokus springt auf das erste fehlerhafte Feld |
| **Versand nicht konfiguriert** | Fehlt der API-Schlüssel, antwortet die Route mit einer klaren Meldung, die auf die E-Mail-Adresse verweist — **nie eine stille Fehlermeldung** |

**Barrierefreiheit:** Erfolgs- und Fehlermeldung liegen in einer `role="status"`-Region, damit
Screenreader sie ankündigen. Nach dem Absenden wandert der Fokus dorthin — sonst merkt man
mit Tastatur oder Screenreader nicht, dass etwas passiert ist.

**Spam:** Ein verstecktes Honeypot-Feld plus Mindest-Ausfüllzeit als Grundschutz. Turnstile wird
ergänzt, sobald ein Site-Key vorliegt — bis dahin **kein Platzhalter-Widget**.

**Datenschutz:** Unter dem Formular ein Satz mit Link auf `/datenschutz`. ⚠️ Die
Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert — sie muss **im selben
Schritt** um Formular und Versanddienstleister ergänzt werden, in dem das Formular live geht.

**Typografie:** Feldbeschriftungen und Hilfetexte nutzen die bestehende Rolle *Label* (Martian
Mono 14px), Eingabefelder die Rolle *Body*. **Keine neue Größe, kein neues Gewicht.**

### 4. Offene Punkte der Qualitätsuntergrenze, jetzt mit Zielwert

Die beiden unerledigten Haken unter „Qualitätsuntergrenze" bekommen eine messbare Vorgabe:
AVIF/WebP mit `srcset`, LQIP-Blur als Ladezustand, Hero eager mit Größenbudget, alles andere
lazy. **Zielbild: die Seite steht auf dem Festivalgelände bei schlechtem Mobilfunk in unter einer
Sekunde.** Das ist kein Nice-to-have — es ist der Zustand, in dem ein Kurator sie tatsächlich
öffnet.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — | — | not applicable — kein shadcn, keine Registry. Reines CSS mit Custom Properties und CSS-Modules, siehe `TECH-STACK.md`. |

---

## Checker Sign-Off

> Dieser Block gehört dem `gsd-ui-checker`, nicht dem Verfasser. Er wird erst nach einer
> tatsächlich durchgeführten Prüfung ausgefüllt.

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-08-26 durch `gsd-ui-checker` (dritter Durchgang; die ersten beiden
ergaben BLOCKED — fehlender CTA, fünf Schriftgrößen, ins Leere zeigender Launch-Blocker-Verweis).

**Geltungsbereich:** Dieses Sign-Off deckt den Vertragsstand vom 2026-08-26. Der am 2026-08-27
ergänzte Abschnitt „Geplante Erweiterungen" ist **ausdrücklich nicht** davon gedeckt und braucht
eine eigene Prüfung, bevor daraus Code wird.
