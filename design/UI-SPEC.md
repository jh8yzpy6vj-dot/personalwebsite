---
phase: 1
slug: personalwebsite-erstentwurf
status: approved
shadcn_initialized: false
preset: none
created: 2026-08-26
reviewed_at: 2026-08-26
---

# Phase 1 — UI Design Contract (jakobsax.de, Erstentwurf)

> Visual and interaction contract für die persönliche Website von Jakob Sax. Erstellt als
> standalone Ersatz für den GSD-Orchestrator-Flow — Grundlage sind `CLAUDE.md`, `SITE-PLAN.md`,
> `TECH-STACK.md`, `TODO.md` und der bestehende Platzhalter-Code (`app/page.tsx`,
> `app/page.module.css`, `app/globals.css`). Verifiziert werden kann dies später vom
> `gsd-ui-checker`.
>
> ⚠️ **Status:** Erster Entwurf. Der eigentliche Zweck der Seite (CV/Portfolio/Business) ist laut
> `TODO.md` noch offen. Alle Copywriting-Werte unten sind bewusst konkrete, aber vorläufige
> Platzhalter — sie sind klar als PLATZHALTER markiert und müssen überschrieben werden, sobald
> der echte Zweck feststeht.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (bewusste Entscheidung) |
| Preset | not applicable |
| Component library | none |
| Icon library | none — falls später Social-Icons gebraucht werden: einzelne Inline-SVGs ohne zusätzliche Paket-Abhängigkeit, keine Icon-Library |
| Font | System-Font-Stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` (bereits in `app/globals.css`, kein Web-Font-Import) |

**Begründung "Tool: none":** `TECH-STACK.md` legt explizit fest, "keine unnötige Komplexität
einbauen (kein Build-Framework, kein Static-Site-Generator)" für den aktuellen Umfang der Seite.
Tailwind/shadcn würden eine zusätzliche Abhängigkeit + Build-Schritt-Komplexität einführen, die
für eine kleine, statische persönliche Seite mit aktuell einer Handvoll Sections nicht
gerechtfertigt ist. Weiterarbeit mit reinem CSS: CSS-Custom-Properties (`globals.css`) für
Tokens + CSS-Modules (`page.module.css`) pro Komponente/Section — Muster, das bereits im Code
etabliert ist. Die shadcn-Init-Gate-Frage wurde deshalb nicht interaktiv gestellt.

---

## Spacing Scale

Deklarierte Werte (Vielfache von 4px):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-Abstände, enge Inline-Abstände |
| sm | 8px | Kompakte Element-Abstände (z.B. Link-Untergruppen) |
| md | 16px | Standard-Element-Abstand (Absatzabstände, Button-Innenabstand vertikal) |
| lg | 24px | Section-interner Innenabstand, Button-Innenabstand horizontal |
| xl | 32px | Layout-Lücken zwischen größeren Blöcken, Header-Innenabstand horizontal |
| 2xl | 48px | Größere vertikale Abstände (mobil: Section-Padding) |
| 3xl | 64px | Section-Padding vertikal (Desktop) — entspricht dem bereits bestehenden `4rem` in `.section` |

**Exceptions:**
- Touch-Targets (Nav-Links, Kontakt-Buttons) müssen auf Mobile mindestens 44×44px effektive
  Klickfläche haben (Accessibility-Mindestmaß) — Button-Innenabstand ggf. so anpassen, dass die
  Gesamthöhe inkl. Padding 44px erreicht, auch wenn der reine Innenabstand-Wert selbst kleiner
  ist.
- Bestehender Code weicht an zwei Stellen leicht von der Skala ab (Header-Padding `1.25rem` =
  20px statt 16/24px; Button-Padding `0.6rem/1.1rem` = 9.6px/17.6px statt 8/16px). Beim nächsten
  Durchgang auf `md`(16px)/`lg`(24px) vereinheitlichen.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label (Nav, Buttons, Footer, Tagline) | 14px | 400 | 1.4 |
| Body (Fließtext/Bio) | 16px | 400 | 1.6 |
| Heading (Section-Titel, Header-Name) | 24px | 700 | 1.2 |
| Display (Hero-Name) | 40px | 700 | 1.1 |

Genau 2 Gewichte: **400 (Regular)** für Fließtext/Label, **700 (Bold)** für Headings/Display.

**Abweichung vom Platzhalter-Code:** Aktuell nutzt der Code teils `font-weight: 600` (Rolle/
Tagline, Kontakt-Buttons). Für die 2-Gewichte-Regel auf **700** vereinheitlichen — visuell kaum
unterscheidbar bei dieser Schriftgröße, hält den Font-Weight-Vertrag aber sauber.

Die Tagline/Rolle im Hero (`--accent`-Farbe) nutzt die **Label**-Rolle (14px/700), nicht eine
eigene Größe.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0f1115` (`--bg`) | Seitenhintergrund, Haupt-Content-Fläche |
| Secondary (30%) | `#171a21` (`--surface`) | Sticky Header/Nav-Leiste; zukünftige Karten/Boxen |
| Accent (10%) | `#6ee7b7` (`--accent`) | Ausschließlich: Hero-Tagline/Rolle, Kontakt-Buttons (Hintergrund), Fokus-/Hover-Indikatoren interaktiver Elemente |
| Destructive | not applicable in diesem Scope | Aktuell keine destruktiven Aktionen (keine Formulare, kein Löschen). Falls später ein Kontaktformular mit z.B. Abo-Abmeldung dazukommt: `#f87171` (Rot, passend zum dunklen Theme) reservieren. |

Zusätzliche Textfarben (nicht Teil der 60/30/10-Flächenaufteilung, sondern Textfarben-Tokens):
`--text` (`#eef0f4`) für Haupttext, `--muted` (`#9aa3b2`) für Nebentext (Bio, Footer, Nav-Links
im Ruhezustand).

**Accent reserved for:** Hero-Tagline/Rolle-Text, Kontakt-Buttons (E-Mail/LinkedIn/GitHub) als
Hintergrundfarbe, Fokus-Ring auf interaktiven Elementen. **Nicht** für Section-Titel, normale
Fließtext-Links oder die Nav-Links im Header (die bleiben `--muted` → `--text` im Hover, siehe
bestehender Code).

---

## Visual Hierarchy

Primärer Fokuspunkt der Hero-Section (erste Section, die der Besuch sieht): der **Display-Name**
("Jakob Sax", 40px/700) ist der primäre visuelle Anker — größte Schriftgröße, höchster Kontrast
(`--text` auf `--bg`). Die **Tagline/Rolle** direkt darunter ist der sekundäre Blickpunkt, über die
`--accent`-Farbe hervorgehoben (nicht über Größe). Der Bio-Fließtext ist bewusst zurückhaltend
(`--muted`, 16px/400) und tritt hinter Name und Tagline zurück. In den Sections "Über mich" und
"Kontakt" übernimmt jeweils die Section-Überschrift (24px/700) die gleiche Anker-Rolle auf
Section-Ebene; in "Kontakt" sind zusätzlich die Accent-Buttons der klar dominante interaktive
Fokuspunkt gegenüber dem einleitenden Fließtext.

---

## Copywriting Contract

> ⚠️ Alle Einträge unten sind konkrete, aber **vorläufige PLATZHALTER**, da der Zweck der Seite
> laut `TODO.md` (Langfristig) noch nicht feststeht. Keine erfundenen Fakten über Jakob Sax —
> nur generische, aber spezifische Formulierungen als Ausgangspunkt.

| Element | Copy |
|---------|------|
| Primary CTA | "E-Mail schreiben" (mailto-Link im Kontakt-Bereich; ersetzt das aktuelle knappe "E-Mail"-Label für einen klaren Verb+Nomen-CTA) — **PLATZHALTER**, austauschbar sobald echter Ansprechzweck feststeht (z.B. "Termin anfragen" bei Business-Zweck, "Lebenslauf anfordern" bei CV-Zweck) |
| Empty state heading | "Noch keine Projekte veröffentlicht" — **PLATZHALTER**, relevant erst sobald eine Portfolio-/Projekte-Section ergänzt wird (aktuell keine Liste/Kollektion auf der Seite vorhanden) |
| Empty state body | "Hier erscheinen bald ausgewählte Projekte und Arbeiten." — **PLATZHALTER**, gleiche Abhängigkeit wie oben |
| Error state | "Nachricht konnte nicht gesendet werden. Bitte versuche es erneut oder schreib mir direkt eine E-Mail." — **PLATZHALTER**, relevant erst falls ein Kontaktformular mit Versand-Logik ergänzt wird (aktuell nur reine `mailto:`-Links, kein Formular, kein Fehlerfall möglich) |
| Destructive confirmation | Not applicable — keine destruktiven Aktionen im aktuellen Scope (statische Seite ohne Formulare, ohne Datenlöschung/Abmeldung) |

---

## UI Considerations

> Populated by the ui-phase UI-consideration probe. Shape-rooted UI *state* coverage
> (empty / loading / error / populated / partial / overflow / zero-one-many / long-text).

Applicable state considerations resolved: **4 covered, 2 backstop, 0 unresolved** (Kategorien
`empty`, `populated`, `partial`, `zero-one-many` sind aktuell **not applicable** — die Seite hat
im jetzigen Scope kein `form`-, `list-collection`- oder `media`-Element: keine Formulare, keine
Liste/Kollektion, kein Bildmaterial. Diese Kategorien werden relevant, sobald z.B. eine
Portfolio-/Projekte-Liste oder ein Kontaktformular ergänzt wird.)

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| loading | Header-Nav (`nav`) | ✅ covered | Nav ist rein statisch/serverseitig gerendert (Next.js, Anker-Links auf derselben Seite), keine asynchrone Datenladung — kein Loading-Zustand nötig. |
| error | Header-Nav (`nav`) | ✅ covered | Keine Netzwerk-/Datenoperation hinter der Nav (nur Seiten-Anker) — kein Error-Zustand möglich. |
| overflow | Header-Nav (`nav`) | 🧪 backstop | Nav braucht `flex-wrap: wrap` (aktuell nicht gesetzt), damit bei wachsender Linkzahl oder sehr schmalen Viewports (~320px) kein horizontales Scrollen/Clipping entsteht — visuell auf kleinen Viewports zu verifizieren. |
| overflow | Bio-Text Hero/Über-mich (`static-content`) | ✅ covered | Fließtext bricht im normalen Blockfluss um; `max-width: 640px` auf `.section` verhindert überlange Zeilen unabhängig vom Viewport. |
| long-text | Bio-Text Hero/Über-mich (`static-content`) | 🧪 backstop | Echter Bio-Text ist laut `TODO.md` noch nicht final; Section muss bei mehreren Absätzen/deutlich längerem Text weiterhin lesbar bleiben ohne Layout-Bruch — zu verifizieren, sobald echter Content vorliegt. |
| long-text | Kontakt-Buttons/Nav-Links (`interactive-control`) | ✅ covered | Alle Link-/Button-Labels sind kurze, feste Begriffe (max. 2 Wörter: "Über mich", "Kontakt", "E-Mail schreiben", "LinkedIn", "GitHub") — geringes Overflow-Risiko im aktuellen Scope. |

<!-- Status vocabulary (locked by probe-core projectTruths):
     ✅ covered   → a plain truth string lifted into must_haves.truths
     🧪 backstop  → a flat scalar { statement, verification: backstop }; at verify time, no explicit
                    evidence → insufficient_spec → human_needed (never a silent pass, #1154)
     ⚠ unresolved → an explicit planner assumption (surfaced, never silently dropped)
     Rows are REPLACED (not appended) on a probe re-run — idempotent. -->

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| — | — | not applicable — kein shadcn/keine Registry im Einsatz (siehe Design System → Tool: none) |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS (nach Ergänzung "Visual Hierarchy"-Sektion; ursprünglich FLAG)
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-08-26 (gsd-ui-checker, standalone-Verifikation ohne GSD-Orchestrator)
