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

Übernommen von bildmanufaktur.de, angepasst an die zwei Hälften:

| # | Bereich | Hälfte | Inhalt |
|---|---------|--------|--------|
| 1 | Topbar (fix) | wechselnd | Wortmarke + ●REC-Chip |
| 2 | Hero | dunkel | Randloses Video (`loop`, `muted`, `playsinline`), darüber Positionierungssatz + Orte |
| 3 | Filter | dunkel | `alle.` `festivals.` `bewegtbild.` `redaktion.` |
| 4 | Arbeiten-Raster | dunkel | 2 Spalten, **gap 0**, randlos. Pro Kachel: Auftraggeber, Titel, Ort · Rolle · Jahr |
| 5 | buchbar. | hell | Drei Leistungen mit Zielgruppe, Beschreibung, Eckdaten |
| 6 | schon fotografiert für. | hell | Referenzzeile |
| 7 | über. | hell | Kurzbio erste Person + Link SWR-Autorenseite |
| 8 | kontakt. | hell | Buchungsanfragen / Vertraulich (zweispaltig) |
| 9 | Footer | hell | Impressum · Datenschutz, Instagram |

**⚠️ Pflichtangaben — Launch-Blocker.** „Impressum · Datenschutz" steht derzeit als reiner Text
ohne Verlinkung im Footer, weil die Seiten noch nicht existieren. Das ist bewusst so: Links auf
nicht existierende Pflichtseiten wären schlechter als gar keine, und eine Pflichtseite mit
Platzhaltertext wäre rechtlich wertlos. **Vor dem Livegang zwingend:** `/impressum` und
`/datenschutz` mit echten Inhalten anlegen (§ 5 DDG, DSGVO) und hier verlinken. Siehe `TODO.md`.

**Topbar-Verhalten:** Sie gehört optisch zu der Hälfte, über der sie steht — über `--buehne`
transparent mit heller Wortmarke, über `--papier` mit Papier-Grund, `--stein`-Unterkante und
dunkler Wortmarke. Ohne diesen Wechsel wäre die weiße Wortmarke auf dem hellen Bereich
unlesbar (im Test bestätigt). Umgesetzt via `IntersectionObserver` auf `#lesen`.

---

## Bildbehandlung & Fokuspunkt

| Element | Regel |
|---------|-------|
| Hero | Höhe `82vh` (mobil `72vh`), `min-height: 420px`. Randlos, `object-fit: cover`. Video: `loop`, `muted`, `playsinline` — ohne Ton, ohne Bedienelemente. |
| Kachel | Seitenverhältnis **4:3**, `object-fit: cover`. Randlos aneinanderstoßend (`gap: 0`). |
| Metazeile | Liegt **über** dem Bild am unteren Rand, auf einem Verlauf nach Schwarz — nie unter dem Bild. |

**Fokuspunkt:** Im Hero ist das **Bild** der primäre Anker, nicht die Schrift — der
Positionierungssatz sitzt bewusst unten und tritt hinter das Motiv zurück. In der hellen Hälfte
übernimmt der Sektionstitel (28px) die Ankerrolle, in `buchbar.` zusätzlich der rote CTA als
einziger gefüllter Button. Auf einer Kachel führt der Blick vom Bild über das rote
Auftraggeber-Label zum Titel.

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
Links im Lesebereich, Auftraggeber-Label auf den Kacheln. **Nicht** für Fließtext, nicht für
Überschriften, nicht für alle interaktiven Elemente.

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

**Barrierefreiheits-Untergrenze (keine Ausnahme — 44 liegt auf der Skala):** Klickflächen
mindestens 44×44px, umgesetzt via `min-height: 44px` auf Links, Buttons und Filter.

**Ausnahmen:**
- `scroll-margin-top`: 88px Desktop, 64px mobil (die Topbar ist dort niedriger). Ohne diese
  Werte landen Ankersprünge unter der fixen Topbar.
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
| Primary CTA | „E-Mail schreiben" (Verb + Nomen). Erscheint **zweimal**: am Ende von `buchbar.` und im Buchungs-Block unter `kontakt.` Einziger gefüllter Button der Seite (`--rec`-Fläche, `--auf-rec`-Schrift). Die Adresse selbst steht darunter als Meta-Text, nicht als Linktext. |
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
