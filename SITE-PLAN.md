# SITE-PLAN.md — Aufbau, Design & Inhalt der Seite

Dieses Dokument legt fest, wie die Seite aussieht, wo was hinkommt und mit welchen Farben/Links gearbeitet wird. Wird aktualisiert, sobald Design- oder Struktur-Entscheidungen getroffen werden — **vor** der Umsetzung im Code, nicht danach.

⚠️ **Status: Erster Entwurf / Platzhalter.** Der eigentliche Zweck der Seite (CV? Portfolio? Business?) und echte Inhalte sind laut `TODO.md` (Langfristig) noch offen. Struktur, Farben und Layout hier sind ein sinnvoller Startpunkt, kein finales Ergebnis — beim Ausfüllen mit echtem Content jederzeit anpassen.

## Seitenstruktur (eine Seite, Scroll-Sections)

| Reihenfolge | Section | Inhalt (Platzhalter) |
|---|---|---|
| 1 | Header/Nav | Name links, Navigations-Links rechts (Über mich, Kontakt) |
| 2 | Hero | Name groß, Rolle/Tagline, kurzer Einleitungssatz |
| 3 | Über mich | Bio-Text, evtl. Foto (noch nicht vorhanden) |
| 4 | Kontakt | E-Mail, Social-Links als Buttons |
| 5 | Footer | Kleine Copyright-/Meta-Zeile |

Weitere Sections (z.B. Portfolio/Projekte, Skills, Lebenslauf) kommen erst dazu, wenn der Zweck der Seite geklärt ist.

## Farb-Palette

Dunkles Theme, ein Akzentton. Als CSS-Variablen im Code hinterlegt (`app/globals.css`), hier die Referenz:

| Name | Hex | Verwendung |
|---|---|---|
| `--bg` | `#0f1115` | Seitenhintergrund |
| `--surface` | `#171a21` | Karten/Boxen, Header-Hintergrund |
| `--text` | `#eef0f4` | Haupttext |
| `--muted` | `#9aa3b2` | Nebentext, Bio, Footer |
| `--accent` | `#6ee7b7` | Buttons, Hervorhebungen, Rolle/Tagline |

## Typografie

- System-Font-Stack (kein Web-Font-Import nötig): `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Name/Hero: groß und fett
- Fließtext: ruhig, gut lesbar, Zeilenhöhe ~1.6

## Navigation & Links

- Nav-Links (Platzhalter, aktuell Anker auf derselben Seite): `#ueber-mich`, `#kontakt`
- Kontakt-Buttons (Platzhalter, echte Werte fehlen noch): E-Mail (`mailto:`), LinkedIn, GitHub
- Sobald echte Profile/Adressen feststehen, hier eintragen und im Code ersetzen.

## Offene Fragen (siehe auch TODO.md → Langfristig)

- Zweck der Seite (bestimmt, ob z.B. eine Portfolio-/Projekte-Section dazukommt)
- Echtes Foto/Bildmaterial
- Echte Kontakt-/Social-Links
- Ob eine zweite Sprache (Englisch) gebraucht wird
