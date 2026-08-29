# bilder/ — hier kommen die Originale rein

Kurzfassung für Jan und Jakob: **Datei richtig benennen, in den passenden
Ordner legen, pushen. Mehr ist nicht zu tun.** Alles Weitere — Zuschneiden auf
mehrere Größen, moderne Formate, Vorschaubildchen — passiert beim Bauen der
Seite automatisch (`scripts/bilder.mjs`).

## Wohin welche Datei

| Was | Wohin | Dateiname |
|---|---|---|
| Leitbild einer Arbeit | `bilder/arbeiten/` | genau die `id` der Arbeit aus `lib/content.ts`, z. B. `tete-a-tete-2026.jpg` |
| Standbild fürs Hero | `bilder/hero/` | `standbild.jpg` |
| **Porträt von Jakob** | `bilder/` (direkt darin) | `portrait.jpg` |

Die `id` steht in `lib/content.ts` bei jeder Arbeit ganz oben (`id: "..."`).
Sie ist zugleich die Adresse der Seite: `jakobsax.de/arbeiten/tete-a-tete-2026`.

Erlaubte Endungen: `.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.webp`.
Groß-/Kleinschreibung im Dateinamen zählt.

Liegt zu einer Arbeit keine Datei da, zeigt die Seite weiterhin ihren
Platzhalter („Bild folgt"). Das ist kein Fehler.

**Das Porträt** erscheint an zwei Stellen: im Kurzanriss auf der Startseite und
oben auf `/ueber`. **Es wird nicht zugeschnitten** — quer oder hochkant, beides
geht, das Bild behält seine Form. Fehlt es, zeigt die Startseite einen
Platzhalter und `/ueber` einfach direkt den Text.

⚠️ Die Bildbeschreibung dazu steht in `lib/content.ts` unter
`ABOUT.portraitAlt` und beschreibt die **aktuelle** Aufnahme. Wer das Foto
austauscht, muss sie mit austauschen.

## Wie groß sollen die Originale sein

**Lange Kante rund 2400–3000 px, JPEG in guter Qualität.** Größer schadet
nicht, bringt aber nichts: Ausgeliefert wird ohnehin höchstens 2400 px breit.
Kleiner als 1200 px sollte es nicht sein, sonst ist das Bild auf großen
Bildschirmen weich.

Nicht nötig — und bitte auch nicht machen:

- vorher selbst verkleinern oder mehrere Größen anlegen
- in WebP oder AVIF umwandeln
- Wasserzeichen einbauen

## ⚠️ Beim Export: Kameradaten drin lassen, Standort raus

Unter dem Bild erscheint automatisch eine Zeile mit den Aufnahmedaten:

```
22:14 uhr · 1/500 · f/2.8 · iso 6400
```

Sie kommt aus dem EXIF der Datei — **nichts einzutragen, nichts zu pflegen.**
Sie erscheint aber nur, wenn die Angaben beim Export erhalten bleiben.

In Lightroom (und den meisten anderen Programmen) gibt es beim Export ein
Feld „Metadaten". Richtig ist **„Alle außer Kamera- und Camera-Raw-Infos"
NICHT** — das entfernt genau die Werte, die wir zeigen wollen. Richtig ist
die Einstellung, die **Kamera-Informationen behält**.

Um die Standortdaten musst du dich **nicht** kümmern: Die Pipeline liest sie
gar nicht erst ein und schreibt sie in keine ausgelieferte Datei.

Ist kein EXIF da, erscheint einfach keine Zeile. Das ist kein Fehler.

## Bildstrecke und Kontaktbogen

Zu jeder Arbeit gibt es zwei optionale Ordner. Beide sind freiwillig — fehlen
sie, erscheint der jeweilige Abschnitt einfach nicht.

| Was | Wohin | Dateinamen |
|---|---|---|
| **Bildstrecke** — die kuratierte Folge, waagerecht durchblätterbar | `bilder/arbeiten/<id>/` | `01.jpg`, `02.jpg`, … |
| **Kontaktbogen** — alle Frames derselben Aufnahmeserie | `bilder/arbeiten/<id>/serie/` | `01.jpg`, `02.jpg`, … und beim Treffer `03-gewaehlt.jpg` |

⚠️ **Führende Null nicht vergessen.** Sortiert wird nach Dateiname; ohne sie
stünde `10` vor `2`.

**`-gewaehlt` am Dateinamen** markiert im Kontaktbogen das Bild, das es
geworden ist — es bekommt den roten Rahmen. Genau eins pro Serie. Ist keins
markiert, gibt es eben keine Markierung.

Der Kontaktbogen lebt davon, dass die Frames **Sekunden auseinanderliegen**
und das im EXIF steht: Darunter erscheint die Uhrzeit auf die Sekunde genau,
und genau das ist die Aussage — vier daneben, einer sitzt.

## Was mit den Daten passiert

- **Metadaten werden beim Verarbeiten entfernt.** Damit sind insbesondere
  **GPS-Koordinaten aus den ausgelieferten Dateien draußen** — die Originale
  hier im Ordner behalten sie.
- Die Drehung aus dem EXIF wird vorher angewendet, Hochformate bleiben also
  hochkant.
- Erzeugt werden AVIF und WebP in bis zu fünf Breiten plus ein JPEG als
  Rückfall. Die Ergebnisse landen unter `public/b/` und sind **nicht** im Git —
  sie entstehen bei jedem Build neu.

## Alt-Texte

Der Alt-Text steht **nicht** hier, sondern bei der Arbeit in `lib/content.ts`
(Feld `alt`). Er beschreibt die Szene, nicht das Bild: „Höhenartistik über dem
Ehrenhof des Rastatter Schlosses", nicht „Foto von einem Artisten". Fehlt er,
setzt die Seite eine Notlösung aus Titel, Auftraggeber und Jahr ein — die ist
korrekt, aber nichts wert.

## Rechte

⚠️ Bevor ein Bild hier landet: Nutzungsrechte und Persönlichkeitsrechte müssen
geklärt sein. Bei Auftritten im öffentlichen Raum betrifft das Künstlerinnen,
Künstler **und** Publikum. Siehe die entsprechenden Punkte in `TODO.md` — sie
sind Launch-Blocker.

## Selbst ausprobieren

```
npm run bilder      # nur die Pipeline
npm run build       # baut die Seite, Pipeline läuft automatisch vorher
```
