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
| `/` | Hero, Porträt und Material dunkel, Rest hell | Hero (volle Fensterhöhe) → `jakob.` (Porträt, zwei Sätze, Weiterweg) → `arbeiten.` (Kachelraster) → **Naht** → `schon fotografiert für.` → `buchbar.` (drei Türen, Hinweis, CTA) → Footer |
| `/arbeiten` | dunkel | Titel, Filter (`alle.` `festivals.` `bewegtbild.` `redaktion.`), randloses 2-Spalten-Raster (**gap 0**), heller Footer |
| `/arbeiten/[slug]` | Hero dunkel, Kontext hell | Vollbild-Hero als **Blende** über Leitbild und Strecke, Titel und Meta darauf → **Naht** → Aufnahmezeile und Text → **Mosaik** der Strecke (anklickbar) → Film → Kontaktbogen → Rückweg |
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

**Genau eine Naht pro Seite** — mit **einer** bewusst gesetzten Ausnahme. Der Wechsel dunkel → hell
ist das Strukturelement und passiert je Seite höchstens einmal.

⚠️ **Die Startseite hat seit dem 2026-09-13 drei Wechsel:** Hero dunkel → `jakob.` **hell** →
`arbeiten.` dunkel → Rest hell. Von Jan ausdrücklich so entschieden, nachdem ihm die Konsequenz
genannt wurde: „so wie ichs gesagt hab, hero dunkel, jakob hell, arbeiten dunkel, footer hell."

Der Grund, der dafür spricht: Das Porträt ist dunkel und im Gegenlicht aufgenommen. Auf
`--buehne` verlor es seine Ränder und ging in den Grund über — der Block, der zeigen soll, wer
hinter der Seite steht, war der unauffälligste der Seite. Auf Papier steht er.

Der Preis, der dagegen spricht und bleibt: Die Naht ist kein Strukturelement mehr, sondern ein
Farbwechsel unter mehreren. Wer die Regel später wieder herstellen will, hat zwei Wege ohne
diesen Preis — Naht hinter das Hero (dann wird `arbeiten.` mit hell, und der Kachelblock steht
anders als `/arbeiten`), oder `jakob.` unter `arbeiten.` schieben (dann kommt „was" vor „wer",
was Jan am 2026-08-30 bewusst andersherum entschieden hatte). Beide standen zur Wahl.

**Folge für die Topbar:** Sie wechselt weiterhin erst bei `#lesen` auf Papier-Grund. Über dem
hellen `jakob.` steht sie also als deckender dunkler Balken. Das ist lesbar und beabsichtigt —
die Alternative wäre, den Beobachtungspunkt auf den Anriss zu legen, und dann stünde über dem
**dunklen** `arbeiten.` dunkle Schrift auf dunklem Grund. Von zwei Unstimmigkeiten die harmlose.

**Reihenfolge der Startseite, geändert am 2026-08-29 auf Jans Ansage: Hero → wer → was →
Angebot.** Vorher stand `buchbar.` direkt hinter dem Hero — die Antwort auf eine Frage, die zu
dem Zeitpunkt noch niemand gestellt hat. Wer auf einer Fotografenseite landet, will erst sehen,
dann wissen, wer das ist, und zuletzt, was es kostet.

⚠️ **Dieser Absatz galt bis zum 2026-09-13 und ist von der Ausnahme oben überholt.** Er lautete:
„Hero, Porträt und Material sind zusammen das ‚Sehen'; darunter beginnt einmalig das ‚Lesen'.
Deshalb steht der Kurzanriss über Jakob auf dunklem Grund, obwohl er Text ist — zwei Sätze und
ein Porträt sind Bildseite, ein Textblock wäre es nicht. Die Alternative (Anriss hell) hätte die
Naht auf drei Wechsel verdreifacht."

Die Abwägung war richtig beschrieben, nur die Gewichtung ist heute eine andere: Mit einem echten
Foto im Block zeigte sich, dass ein dunkles Gegenlichtporträt auf `--buehne` verschwindet. Die
verdreifachte Naht ist der bekannte und in Kauf genommene Preis, nicht ein übersehener Fehler.

**`zuletzt.` als Zeilenliste ist entfallen.** An seiner Stelle steht `arbeiten.` mit demselben
randlosen Kachelraster wie das Archiv — die Startseite soll Material zeigen, nicht Titel
aufzählen. Beide benutzen jetzt dieselbe Komponente (`Kachelraster.tsx`), damit sie nicht
auseinanderlaufen.

**Der eigene Abschnitt `kontakt.` ist entfallen.** Er trug nur einen Hinweissatz und denselben
roten Knopf wie `buchbar.` darüber — zwei gefüllte Knöpfe auf einer Seite verstoßen gegen die
Regel unten. Der Hinweissatz steht jetzt am Ende von `buchbar.`, direkt über dem einen CTA.

**Topbar:** Wortmarke, ●REC-Chip und rechts der **Menü-Knopf** (drei Striche). Keine
ausgeschriebene Navigation — die würde über dem Hero mit dem Bild konkurrieren, und genau das
soll die Topbar nicht.

**Das Menü ist bewusst auch am Desktop eingeklappt.** Mit acht Seiten reichte der Footer allein
nicht mehr; wer sich orientieren will, soll nicht bis ans Seitenende scrollen müssen. Ein
ausgeklapptes Menü über dem Hero war die Alternative — sie hätte das Bild verdeckt.

**Umgesetzt als natives `<dialog>` mit `showModal()`.** Fokusfalle, Escape-Taste und die
Darstellung über allem anderen bringt der Browser mit. Kein `z-index`-Wettlauf, keine selbst
gebaute Tastaturlogik, keine Bibliothek. Zwei Dinge muss der Code dennoch selbst tun:
`aria-expanded` beim nativen Escape-Schließen mitziehen, und den **Fokus auf den Knopf
zurückgeben** — sonst landet man mit der Tastatur nach dem Schließen am Seitenanfang.

**Die aktive Seite wird mit einem roten Punkt markiert, nicht nur eingefärbt.** Farbe allein wäre
für Menschen mit Farbsehschwäche kein Signal; die Form ist es. Gilt auch für Unterseiten:
Auf `/arbeiten/wiwawo-52` ist `arbeiten.` markiert, sonst wirkt das Menü dort orientierungslos.

**Navigation an einer Stelle:** `lib/nav.ts` versorgt Topbar-Menü **und** Footer. Zwei getrennte
Listen würden beim nächsten neuen Bereich auseinanderlaufen — so entstehen Menüs, in denen eine
Seite fehlt. Die Leistungen erzeugt die Datei aus `SERVICES`, damit eine neue Leistung
automatisch im Menü steht.

**Der Footer behält seine Navigation.** Er ist der Weg für alle, die bis ans Ende gelesen haben;
das Menü der für alle anderen. Rechtliches steht **nur** im Footer.

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

**Mit ← und → blättert man durch die Kategorie.** Wer Fotos anschaut, kommt
aus Lightroom oder der Vorschau des Betriebssystems; dort blättern die
Pfeiltasten. Die sichtbaren Links `vorherige / nächste` bleiben — die Tasten
sind eine Abkürzung, kein Ersatz, und ohne JavaScript ändert sich nichts.
Sie greifen **nicht** in Eingabefeldern, bei offenem Menü, mit Zusatztaste
(`Alt+←` ist im Browser „zurück") und nicht in waagerecht scrollenden
Bereichen wie der Bildstrecke — die markieren sich mit `data-blaettern="aus"`.

**Detailseiten sind keine Sackgassen.** `vorherige / nächste` innerhalb derselben Kategorie —
wer eine Festivalarbeit anschaut, will die nächste Festivalarbeit sehen, keinen Radiobeitrag.
**Ohne Umlauf:** Am Ende ist Schluss; ein Ring würde vortäuschen, es ginge endlos weiter.

### Bewegung ohne Bibliothek

Vier Browser-Techniken ersetzen, wofür sonst eine Animationsbibliothek nötig wäre. **Alle vier
sind Progressive Enhancement** — wo sie fehlen, verhält sich die Seite wie vorher.

| Technik | Wirkung | Kosten |
|---------|---------|--------|
| `@view-transition` | Seitenwechsel blendet über statt hart umzuschalten | 3 Zeilen CSS, **kein JavaScript** |
| Speculation Rules | Lädt die Zielseite bei erkennbarer Absicht vor — der Klick wirkt sofort | ein `<script type="speculationrules">` |
| `content-visibility: auto` | Kacheln außerhalb des Bildschirms werden nicht gerendert | eine Zeile je Kachel |
| `animation-timeline: view()` / `scroll()` | Scrollgetriebene Bewegung, siehe *Motion* | CSS, **kein JavaScript**, läuft nicht im Haupt-Thread |

⚠️ **`prefers-reduced-motion` schaltet auch den Seitenübergang ab** (`navigation: none`). Die
globale `animation-duration`-Regel greift dort **nicht** — View Transitions brauchen eine eigene
Abschaltung.

⚠️ **Speculation Rules stehen auf `moderate`, nicht `eager`.** Vorgeladen wird erst bei
erkennbarer Absicht, nicht bei jedem Link im Blickfeld — sonst zahlt jemand mit teurem Mobilfunk
für Seiten, die er nie öffnet.

⚠️ **`content-visibility` braucht `contain-intrinsic-size`**, sonst kennt der Browser die Höhe
nicht gerenderter Kacheln nicht und die Bildlaufleiste springt.

⚠️ **`content-visibility: auto` und `animation-timeline: view()` vertragen sich** — die
übersprungene Kachel animiert beim Eintreten trotzdem. Im Browser nachgemessen, weil es die
naheliegende Vermutung ist, dass ein nicht gerendertes Element auch nicht animiert.

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
| Hero | **Volle Fensterhöhe** (`100svh`, `min-height: 420px`), randlos, `object-fit: cover`. Video: `loop`, `muted`, `playsinline` — ohne Ton, ohne Bedienelemente. ⚠️ `svh` und nicht `vh`: `vh` meint auf dem Telefon die Höhe ohne die ein- und ausfahrende Browserleiste, das Hero ragte damit unten heraus. |
| Ecken | **Genau ein Radius** (`--radius-bild`, 12px) — so wie es genau vier Schriftgrößen gibt. Er gilt für Fotos, die **präsentiert** werden: Leitbild, Mosaikkachel, Film. **Nicht** für das Kachelraster auf `/arbeiten`: Das ist ein *Index* und stößt absichtlich randlos aneinander wie ein Kontaktbogen — dichte, harte Kanten sind dort die Aussage. Die beiden Modi sind damit unterscheidbar: Index ist flächig, Detailseite ist Präsentation. ⚠️ **Neu am 2026-09-12.** Vorher war alles hart gekantet; Jan zur Detailseite: „nicht so kastenmäßig aneinander klatschen". |
| Leitbild (Detailseite) | **Vollbild-Hero** über `100svh`, randlos, `object-fit: cover`, mit Titel und Metazeile darüber auf einem Verlauf nach Schwarz. ⚠️ **Der Zuschnitt ist am 2026-09-13 zurückgeholt worden — bewusst.** Vom 2026-09-12 bis dahin stand hier „ohne Zuschnitt, höhenbegrenzt“: richtig, solange das Leitbild die einzige Fläche für ein ganzes Foto war. Seit die Bildstrecke ganze Bilder zeigt, ist die Aufgabe verteilt — das Hero liefert die Wucht, die Strecke die Vollständigkeit. Jan: „lass das Leitbild als full size hero element“. **Mobil (≤ 700px) ist das Hero nicht bildschirmfüllend, sondern breit** (`aspect-ratio: 4/3`), und der Titel steht **unter** dem Bild statt darauf: Ein Querformat in eine hohe, schmale Box zu zwingen schnitt den halben Bildinhalt weg, und ein Titel in einer 4:3-Box kämpft gegen das Motiv. So sind Bild und Titel ohne Scrollen zu sehen, der Text lugt darunter hervor. ⚠️ `svh`, nicht `vh` — sonst ragt das Hero unter der ein- und ausfahrenden Browserleiste heraus. |
| Blende im Hero | **Seit dem 2026-09-13 steht im Hero kein Standbild mehr, sondern eine Folge** aus Leitbild und Bildstrecke. Übergang ist eine **Blockblende**: drei ungleich große, versetzt gesetzte Flächen zeigen den nächsten Ausschnitt, danach schlägt das ganze Bild um. Feste Werte: **Standzeit 4 s, Dauer 1,2 s**, dazu eine Fahrt von 7 % über die Standzeit. Jan, nachdem beides zusammenhing: „man sieht das bild nicht so recht und die transition ist auch zu schnell“ — **Standzeit und Dauer sind zwei Entscheidungen und müssen zwei Werte bleiben.** ⚠️ Der Ausschnitt jedes Blocks muss sich mit dem Endbild **decken**: Das Bild im Block trägt Herogröße und ist nur verschoben. Mit einem eigenen `cover` je Block zerfällt das Motiv in Kacheln, statt durchzubrechen. ⚠️ Drei harte Pflichten: **nur das erste Bild** wird vorgeladen (es ist der LCP, der Rest lädt beim Weiterschalten), die Folge **steht still, solange das Hero nicht im Bild ist**, und unter `prefers-reduced-motion: reduce` gibt es **gar keine Folge**, sondern allein das Leitbild. Ohne Skript ebenso: das Leitbild, serverseitig gerendert. ⚠️ **Drei weitere Pflichten, live erkauft** (Jan am 2026-09-13: „die hero animation ist krass am hängen, das sieht aus wie Pixelfehler nicht wie eine gewollte animation"): **(a) Während der Blende bewegt sich nur das laufende Bild.** Blöcke und eintreffendes Bild stehen still und decken sich damit zwangsläufig; trügen beide eine Fahrt, müsste sie auf den Bruchteil genau übereinstimmen — in der ersten Fassung tat sie das bei jedem zweiten Bild nicht, und das Motiv sprang. **(b) Die Fahrt hat nur eine Richtung.** Abwechselnd hinein und hinaus hieße: jedes zweite Bild beginnt bei 1.07, die Blöcke aber bei 1 — derselbe Versatz von der anderen Seite. Die Wiederholung ist der Preis dafür, dass es sitzt. **(c) Geblendet wird nur in ein fertig geladenes Bild**, und jedes Bild hängt eine Standzeit früher unsichtbar im Dokument. Sonst zeigen die Blockausschnitte im Moment der Blende schlicht noch nichts. Jede Bildlage behält außerdem ihre Adresse — beim Tausch liegt mindestens ein Bildaufbau mit dem alten Inhalt dazwischen. ⚠️ **Und zwei Pflichten zum Takt selbst** (Jan, zweite Runde: „die drei vierecke kommen nicht nacheinander, sondern gleichzeitig … die Transition muss smooth sein"): **(d) Die Flächen stehen erst mit Deckkraft 0 im Dokument, die Klasse zum Aufkommen folgt einen Bildaufbau später.** Ein Element, dessen *erste* berechnete Deckkraft schon der Endwert ist, bekommt keinen Übergang — CSS überblendet nur zwischen zwei Werten. Ohne diesen Zwischenschritt erscheinen alle drei schlagartig und die Staffelung läuft ins Leere. **(e) Eine Fläche blendet länger auf, als der Versatz zur nächsten beträgt** (520 ms gegen 340 ms) — sonst ist es ein Gänsemarsch und keine Bewegung. Der Wechsel auf das nächste Bild erfolgt **nach** der Überblendung, nicht kurz nach ihrem Beginn. Alle Zeiten stehen **ausschließlich** in `Blende.tsx` und gehen als CSS-Eigenschaften an die Bühne; doppelt geführt liefen sie beim ersten Taktwechsel sofort auseinander. |
| Bildausschnitt im Hero | **Je Bild von Hand gewählt**, als `object-position` in `lib/bildausschnitte.ts` (`"arbeiten/wiwawo-53/02": "50% 78%"`). Gewählt wird nicht geschätzt: Es gibt ein Werkzeug, in dem der Punkt auf dem ganzen Foto gezogen wird und ein roter Rahmen zeigt, was im Hero übrig bleibt. ⚠️ **Eine Zwischenstufe mit Endungen am Dateinamen (`-oben`, `-unten`) ist am selben Tag wieder verworfen worden** — drei Stufen sind zu grob, und jede Änderung hätte Umbenennen im Bucket **und** einen Medien-Lauf gekostet. Jan: „da werden wir glaub ich nicht glücklich mit." Ein Ausschnitt ist außerdem kein *Name*, den die Konvention-statt-Konfiguration-Regel schützen will — er steht nirgendwo sonst und kann nur von einem Menschen kommen, der das Foto ansieht. Ein Test hält jeden Eintrag gegen das Manifest, damit kein Wert nach einer Umbenennung still ins Leere zeigt. ⚠️ **Der Grund ist Arithmetik, nicht Geschmack:** Ein Hochformat (4672 × 7008) zeigt in einem 1920 × 1080-Hero **37,5 % seiner Höhe** — bei jeder Einstellung. Welche 37,5 % die richtigen sind, entscheidet allein das Motiv: beim Lagerfeuer unten, beim Porträt mittig, beim Sprung oben. Bis zum 2026-09-13 stand hier pauschal `center 38%` mit der Begründung „in Wildwasserbildern ist oben das Geschehen“; Jan hat an drei Bildern gezeigt, dass das nicht trägt. **Mittig ist der einzig vertretbare Standard**, weil er bei keinem Motiv grob falsch liegt. ⚠️ Die Blockflächen der Blende tragen **denselben** Wert wie das Bild, das sie aufdecken — sonst zeigen sie einen anderen Bildteil als das Ergebnis. **Das Mosaik ist davon nicht berührt:** Dort wird nichts beschnitten, der Wert wirkt ausschließlich im Hero. |
| Porträt | **Ohne Zuschnitt** — kein festes Seitenverhältnis, das Bild bringt seine Form mit. Anders als eine Rasterkachel muss es sich an keinem Nachbarn ausrichten, und ein erzwungenes Hochformat schnitte beim vorliegenden Querformat den halben Bildinhalt weg. Begrenzt wird stattdessen die **Höhe**: im Kurzanriss über die 420px breite Spalte, auf `/ueber` über `max-height: 70svh`. ⚠️ Ohne diese Grenze füllte ein Hochformat auf `/ueber` gut 1500px und schob jeden Satz unter die Falz — beim Prüfen mit einem echten Bild aufgefallen. |
| Kachel | Seitenverhältnis **4:3** am Desktop, **4:5 mobil**, `object-fit: cover`. Randlos aneinanderstoßend (`gap: 0`). |
| Bilder in der hellen Hälfte | **Erlaubt, seit dem 2026-09-13.** Die Regel „dunkel = sehen, hell = lesen“ hielt Fotos aus der hellen Hälfte heraus. Das Mosaik steht jetzt dort — und genau das ist der Punkt: Es ist **Beleg zum Text**, nicht Bühne. Fotos auf Papierweiß unter einer Textspalte ist die Form einer Reportage, und die Seite behauptet nichts anderes. Die **eine Naht** bleibt unberührt: Es gibt weiterhin genau einen Wechsel dunkel → hell pro Seite. Von Jan ausdrücklich freigegeben, zuletzt am 2026-09-13 für das Mosaik bestätigt („der Text wieder mit hellem Hintergrund“). |
| Titel genau einmal | Der Titel einer Arbeit steht **an genau einer Stelle**: am Hero. ⚠️ Im Entwurf stand er am Hero *und* über dem Text — auf dem Desktop durch einen Bildschirm getrennt, auf dem Telefon direkt aufeinander. Der Textblock beginnt deshalb mit der Aufnahmezeile und einer Trennlinie, nicht mit einer zweiten Überschrift. Dasselbe gilt für den Auftraggeber: einmal, in der Metazeile am Hero. |
| Metazeile | Liegt **über** dem Bild am unteren Rand, auf einem Verlauf nach Schwarz — nie unter dem Bild. Form des Verlaufs: siehe „Text über Fotos" unter *Farbe*. |
| Auslieferung | WebP **und** AVIF mit `srcset` in bis zu fünf Breiten (480–2400), ein JPEG als Rückfall, `width`/`height` am `img` gegen Layoutsprünge. Erzeugt von `npm run medien` aus dem R2-Bucket, **nicht** im Deploy; Regeln in `lib/bilder-regeln.mjs`, Bedienung in `TECH-STACK.md`, Abschnitt „Medien". ⚠️ Beide Formate müssen **dieselben** Breiten abdecken. Stand hier vorher „AVIF bis 1600", war es auch so gebaut — der Browser griff dann stillschweigend zur kleineren AVIF-Stufe und rechnete hoch, ohne dass es irgendwo als Fehler auftauchte. Ein End-to-End-Test prüft die Gleichheit seit dem 2026-09-12. |
| Breite der Quelle | Eine Quelle liefert nur die Breiten, die sie **hat** — `breitenFuer()` skaliert nie hoch. ⚠️ Damit entscheidet die **Breite** über die Schärfe, nicht die Pixelzahl: Ein Hochformat mit 2000×3000 hört bei der 1600er-Stufe auf, obwohl es 6 Megapixel mitbringt. Wer ein Hochformat über die volle Fensterbreite zeigt, braucht eine Quelle mit mindestens 2400 px **Breite** — also rund 2400×3600. |
| Ladezustand | Ein 16px breites Vorschaubildchen liegt als Datei-URI im HTML und füllt die Fläche, bis das Foto da ist. Kein Skript, keine zusätzliche Anfrage, kein Umschaltmoment. |
| Bildstrecke → **Mosaik** | Die Bilder der Strecke stehen **unter dem Text** in **drei ungleich breiten Spalten** (Gewichte 1.18 / 0.9 / 1.12), reihum verteilt — Bild 1 in Spalte 1, Bild 2 in Spalte 2, Bild 3 in Spalte 3, Bild 4 wieder in Spalte 1. **Kein Bild wird beschnitten** — das ist der ganze Zweck, denn eine Strecke mischt Hoch- und Querformat (bei `wiwawo-53` fünf zu eins). ⚠️ **Die ungleichen Breiten sind der eigentliche Hebel, nicht Zierde.** Gleich breite Spalten stellen fünf Hochformate zwangsläufig gleich hoch nebeneinander; mit ungleichen bekommen dieselben Bilder verschiedene Höhen und die Fläche wird unregelmäßig. Die Gewichte bleiben dicht beieinander (rund ±15 %) — weiter auseinander wirkt es nicht komponiert, sondern kaputt. ⚠️ **Reihum, nicht spaltenweise:** Sonst läse sich die obere Reihe 1-3-5. Genau das kann der Mehrspaltensatz des Browsers (`column-count`) nicht, deshalb eigene Spalten. **Unter 860px** eine Spalte (`display: contents`); die Bilder tragen dann `order`, sonst lägen sie als 1-4-2-5-3-6 untereinander. Kein JavaScript im Layout. ⚠️ **Zwei gescheiterte Vorstufen, beide am 2026-09-13:** erst die **Flanken** links und rechts vom Text — zusammen mit Hero und Kontaktbogen erschienen dieselben Bilder dreimal, Jan: „das ist zu viel des guten“; dann ein **Zeilensatz** (Zeilen gleicher Höhe, bündige Ränder) — rechnerisch sauber, aber er reiht die Bilder in Dateireihenfolge aneinander und kann Formate gar nicht mischen: fünf Hochformate als Streifen, darunter ein einzelnes Querformat. Jan: „das ist kein mosaik“. **Was gegenüber den Flanken verloren geht und bewusst hingenommen ist:** Sie waren die einzige Stelle, an der ein Bild groß und unausweichlich war; jetzt entscheidet der Besucher per Klick. Nebenbei fällt die alte Grenze weg, dass das Layout an der Textlänge hing. |
| Lichtkasten | Jede Mosaikkachel öffnet groß: Klick oder `Enter`, `←`/`→` blättert, `Esc` schließt, ein Klick neben das Bild ebenfalls. Das Bild steht `contain` auf fast schwarzem Grund, darunter die **volle** Aufnahmezeile. ⚠️ **`position: fixed`, niemals `absolute`.** Im Entwurf lag der Kasten absolut im scrollenden Element und damit am *Anfang des Inhalts*, nicht im Sichtfeld; der Browser scrollte beim Fokussieren dorthin, und nach dem Schließen stand man wieder ganz oben. Jans Befund: „beim schließen von einem bild in großer ansicht landet man wieder ganz oben“. ⚠️ Beim Schließen geht der Fokus **auf die Kachel zurück**, die ihn geöffnet hat — das ist zugleich die Barrierefreiheits-Pflicht und das, was die Scrollposition hält. **Ohne Skript** ist die Kachel ein gewöhnlicher Link auf die Bilddatei; der Kasten ist eine Aufwertung, kein Fundament. |
| Film einer Arbeit | In der **hellen** Hälfte **unter** dem Textblock, über die volle Breite, in `16/9`, höchstens 1040px breit. **Mit** Bedienelementen, **ohne** Autoplay, `preload="metadata"`; Poster ist das Leitbild. Anders als das Hero ist er etwas, das man ansieht, nicht etwas, das läuft — ein Film mit Ton, der von selbst startet, ist auf einer Portfolioseite eine Zumutung. ⚠️ **Stand bis zum 2026-09-13 zwischen Leitbild und Bildstrecke.** Seit die Strecke unter dem Text steht, gibt es dort keinen Platz mehr: Ein Aftermovie ist ein eigener Auftritt, keine Beigabe. Er steht deshalb **unter** dem Mosaik. |
| Kontaktbogen | In der **hellen** Hälfte bei Titel und Metazeile: kleine Frames derselben Serie, der gewählte mit rotem `outline`, darunter die Uhrzeit **auf die Sekunde**. Er ist ein Beleg zum Lesen, nicht die Fläche zum Sehen. |
| Seitenübergang | Kachel und Detailbild tragen denselben `view-transition-name`; das Foto wandert beim Klick von der einen Position in die andere. Siehe *Motion*. |
| Aufnahmezeile | Auf der Detailseite **unter dem Bild**, in der hellen Hälfte: `22:14 uhr · 1/500 · f/2.8 · iso 6400`. Nutzt die bestehende Rolle *Meta* — keine neue Größe, kein neues Gewicht. Erscheint nur, wenn die Datei Aufnahmedaten mitbringt; fehlende Einzelwerte fallen ersatzlos weg. ⚠️ **Unter jeder Mosaikkachel steht die volle Zeile, nicht die kurze.** Bis zum 2026-09-13 trug die Strecke nur `Uhrzeit · iso` mit der Begründung, Blende und Zeit wiederholten sich. Jan hat das aufgehoben: „mach die Kameradaten mal mit Blende und Zeit rein, vollständig halt“ — für ein Fotografenportfolio sind die Daten selbst ein Teil der Aussage, auch wenn sie sich wiederholen. `streckenZeile()` bleibt für den Kontaktbogen, wo der Platz je Frame wirklich knapp ist. |

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

### Text über Fotos (Nachtrag 2026-08-28)

Die Zahlen oben wurden gegen **schwarze Flächen** gemessen — denn solange kein Bildmaterial da
war, war jede Kachel schwarz und der Hero ein dunkler Farbverlauf. Mit echten Fotos gilt das
nicht mehr: Hinter derselben Schrift kann ein weißer Himmel oder ein Bühnenscheinwerfer liegen.

Ein Verlauf, der über die **volle Höhe** des Textblocks ausblendet, hilft dabei nicht — er ist
genau dort am schwächsten, wo die oberste Zeile steht. Gemessen über einem rein weißen Testfoto
ergab der vorherige Kachelverlauf (`0.85`, volle Höhe) für die drei Zeilen **2.51:1, 2.27:1 und
1.24:1**.

**Regel:** Wo Schrift über einem Foto liegt, ist der Verlauf **deckend, solange Text darauf
steht, und blendet ausschließlich im oberen Innenabstand aus** (`calc(100% - <Innenabstand
oben>)`). Die Deckung richtet sich nach der hellsten denkbaren Bildstelle — reinem Weiß:

| Stelle | Deckung | Gemessen über Weiß | Nötig |
|--------|---------|--------------------|-------|
| Kachel-Metazeile | `0.94` | 4.86:1 (`--rec-text`), 17.26:1 (Titel), 5.01:1 (`--ton-buehne`) | 4.5:1 |
| Hero-Bildunterschrift | `0.80` | 11.38:1 (`--papier`, 56px), 8.63:1 (`--stein`) | 3:1 / 4.5:1 |
| Streifen unter der Topbar (`.medien-scrim`, nur über Medien) | `0.60` | 7.15:1 — ohne den Streifen 1.66:1 | 3:1 |

Warum drei verschiedene Werte: Die Kacheln tragen Rot und Grau und brauchen am meisten; Hero und
Topbar tragen nahezu weiße Schrift und kämen mit weniger aus. Jeder dunklere Verlauf als nötig
verschluckt Bild — und Bild ist hier das Produkt.

⚠️ `text-shadow` (an der Wortmarke vorhanden) hilft dem Auge, **zählt für diese Untergrenze
aber nicht** und ersetzt keinen Verlauf.

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

Applicable state considerations resolved: **7 covered, 3 backstop, 0 unresolved**

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Arbeiten-Raster (`list-collection`) | 🧪 backstop | Filter kann theoretisch 0 Treffer liefern. Aktuell hat jede Kategorie mindestens einen Eintrag, daher kein sichtbarer Leerzustand — sobald Kategorien dazukommen oder leer laufen können, Leerzustands-Copy ergänzen und visuell prüfen. |
| empty | Bildkachel (`media`) | ✅ covered | Fehlt ein Bild, rendert die Kachel den Platzhalter mit ●-Punkt und „Bild folgt" statt eines kaputten `img` — im Browser bestätigt. Der Platzhalter trägt bewusst `aria-hidden="true"`: „Bild folgt" ist eine Notiz an uns, keine Information für Nutzende — die Metazeile darunter trägt Auftraggeber, Titel und Jahr und bleibt für Screenreader vollständig lesbar. |
| loading | Hero-Video (`media`) | ✅ covered | Ohne Video und ohne Standbild greift ein Farbverlauf-Platzhalter. Liegt `original/hero/standbild.jpg` im Bucket, dient es als Poster des Videos und — ohne Video — selbst als Hero. Am 2026-08-29 mit einem echten Video und einem echten Standbild gegen `wrangler dev` geprüft. |
| loading | Bildkachel (`media`) | ✅ covered | Bis das Foto da ist, füllt das Vorschaubildchen aus dem Manifest die Fläche — im Browser mit blockierten Bildanfragen bestätigt. Es ist Teil des HTML, also vor der ersten Bildanfrage sichtbar, und deckungsgleich mit dem späteren Ausschnitt (`cover` in beiden Fällen), sodass beim Umschalten nichts springt. |
| error | Bildkachel (`media`) | ✅ covered | Kommt die Datei nicht an, zeichnet der Browser den Alt-Text in die Bildbox. Schriftart, Größe (`--text-label`) und Farbe (`--ton-buehne`) sind dafür gesetzt, sonst erschiene er in der Serifen-Vorgabe des Browsers — mitten in einer Seite mit genau vier Schriftgrößen. |
| error | Kontaktbereich (`interactive-control`) | ✅ covered | Nur `mailto:`-Links, kein Formular, keine Netzwerkoperation — kein Fehlerzustand möglich. |
| zero-one-many | Arbeiten-Raster (`list-collection`) | ✅ covered | Einspaltig auf Mobil, zweispaltig ab 700px; getestet mit 1, 4 und 9 Kacheln über den Filter — Layout trägt in allen drei Fällen. |
| long-text | Kachel-Titel (`static-content`) | ✅ covered | Titel brechen im Blockfluss um; Metazeile setzt sich aus optionalen Feldern zusammen und lässt fehlende Werte weg statt leere Trenner zu zeigen. |
| overflow | Topbar über scrollendem Inhalt (`navigation`) | ✅ covered | Die dunkle Leiste ist durchsichtig, damit über dem Hero das Bild durchläuft — auf `/arbeiten` lief dadurch die Metazeile einer Kachel durch die Wortmarke. Behoben durch eine Füllung, die sich über die ersten `--topbar-h` Scrollpixel aufbaut; **im Grundzustand deckend**, damit die Lesbarkeit nicht an der Animation hängt. Bei 390px und 1200px im Browser bestätigt. |
| overflow | Filterzeile (`interactive-control`) | 🧪 backstop | `flex-wrap: wrap` gesetzt, bei 375px bestätigt (bricht auf zwei Zeilen um, kein horizontales Scrollen). Bei weiteren Kategorien erneut prüfen. |

---

## Motion

- Topbar wechselt Farbe mit 160ms Übergang beim Hälftenwechsel.
- Filter-Zustände mit 120ms Farbübergang.
- **Scrollgetriebene Bewegung** — drei Stück, abschließend aufgezählt (siehe unten).
- `prefers-reduced-motion: reduce` schaltet alle Übergänge global ab (in `globals.css`).
- **Sonst nichts.** Kein Parallax, kein Ken Burns über Standbildern, keine Filter über Fotos.
  Bei guten Fotos ist jeder Effekt ein Abzug.

### Scrollgetriebene Bewegung (Vertragsänderung 2026-08-28)

**Vorher stand hier „sonst nichts".** Die Regel wurde auf Jans ausdrückliche Ansage geändert;
sie ist nicht aufgehoben, sondern präzisiert: Sie richtet sich weiterhin gegen alles, was
**über ein Foto gelegt** wird. Keine der drei Bewegungen unten tut das — sie bewegen Kacheln
und Leiste, nie den Bildinhalt.

| Wo | Was | Warum es kein Schmuck ist |
|----|-----|---------------------------|
| Kacheln, die drei Türen, die `zuletzt.`-Zeilen | Steigen beim Eintreten auf (28px bzw. 14px, `opacity` 0→1) | Der Fortschritt hängt an der **Scrollposition**, nicht an einer Uhr: rückwärts scrollen zeigt es rückwärts. Das führt den Blick beim Eintreten, statt eine Ankunft zu inszenieren |
| Topbar, Unterkante | Roter Balken wächst mit dem Scrollfortschritt | Gehört zum ●REC-Chip: die Anzeige, die zu „Aufnahme läuft" passt. **Auf dem Handy die einzige Fortschrittsanzeige überhaupt** — dort gibt es keine dauerhafte Bildlaufleiste |
| Topbar, Fläche | Füllt sich über die ersten `--topbar-h` Scrollpixel mit `--buehne` | **Behebt einen Fehler:** Auf `/arbeiten` lief die Metazeile einer Kachel durch die Wortmarke. Ein Verlauf reicht dafür nicht — er dunkelt den Grund ab, die fremde Schrift bleibt darunter stehen |
| Kachel → Detailseite | Das Foto wandert von der Kachelposition in den großen Rahmen (`view-transition-name: bild-<slug>`) | Kein Effekt **über** dem Bild, sondern das Bild selbst, das seinen Platz wechselt. Zeigt, dass man dieselbe Sache weiter ansieht, statt eine neue Seite zu öffnen. ⚠️ `object-fit: cover` an den Schnappschüssen ist Pflicht — sonst quetscht sich das Motiv zwischen der 4:3-Kachel und dem Leitbild sichtbar. Seit das Leitbild nicht mehr zuschneidet, hat die Gruppe am Ende genau die Form des Fotos, `cover` deckt sich dort also mit dem Endzustand — Anfang und Ende sitzen damit beide exakt |

**Bedingungen, die Vertragsbestandteil sind:**

| Regel | Grund |
|-------|-------|
| Nur `opacity` und `transform` | Die beiden Eigenschaften ohne neues Layout und ohne Neuzeichnen. Alles andere ruckelt auf dem Handy |
| `animation-timeline`, kein `IntersectionObserver`, keine Bibliothek | Läuft im Browser selbst und nicht im Haupt-Thread — deshalb kann es das Scrollen nicht ins Stocken bringen. Gemessen: bei sechsfach gedrosselter CPU **kein einziges ausgelassenes Bild**, mit wie ohne Animation |
| Startzustand ausschließlich **innerhalb** von `@supports` | Sonst wäre in Browsern ohne Unterstützung die halbe Seite dauerhaft unsichtbar |
| Abschalten über `prefers-reduced-motion: no-preference`, nicht über `animation-duration` | Scrollgetriebene Animationen haben keine Laufzeit — die globale Abschaltung greift bei ihnen nicht |
| **Lesbarkeit darf nie an der Animation hängen** | Die Topbar-Füllung ist im Grundzustand **deckend**. Ohne Unterstützung und bei `reduce` bleibt die Leiste gefüllt: weniger schön, aber lesbar |

> 📌 Zum Motion-Vertrag liegt **ein weiterer begründeter Änderungsvorschlag** vor (der „Burst") —
> siehe „Geplante Erweiterungen" weiter unten. Er ist von dieser Änderung nicht gedeckt.

---

## Qualitätsuntergrenze

- [x] Sichtbarer Tastaturfokus (`:focus-visible`, 2px `--rec`)
- [x] Semantische Struktur (`ul`/`li` für das Raster, `button` mit `aria-pressed` für Filter)
- [x] Kontraste ≥ 4.5:1 (gemessenes Minimum 4.80:1)
- [x] Klickflächen ≥ 44px — **mit der Ausnahme für Links im Fließtext**, die WCAG 2.5.8
      ausdrücklich vorsieht (`SWR-Autorenseite` auf `/ueber`, die Mailadresse auf den
      Leistungsseiten, `Datenschutzerklärung` im Einwilligungstext). Alle **freistehenden**
      Ziele — Kacheln, Menüknopf, Filter, Formularfelder, Absendeknopf — sind bei 390px
      nachgemessen ≥ 44px. Die Formularfelder stehen zusätzlich auf 18px Schriftgröße, sonst
      zoomt iOS beim Hineintippen die Seite
- [x] Kein waagerechtes Scrollen bei **320, 360, 390 und 414px** auf allen acht Seiten
      nachgemessen. `hyphens: auto` (braucht `lang="de"`) plus `overflow-wrap` als Netz —
      deutsche Komposita wie „Straßentheaterfestival" sprengten sonst 320px-Geräte
- [x] Scrollen bleibt bei **sechsfach gedrosselter CPU** bei 60 Bildern/s, mit wie ohne
      Animation; keine langen Aufgaben, CLS 0. ⚠️ Gemessen in headless Chromium — das ersetzt
      keinen Test auf einem echten Telefon
- [x] `srcset`, moderne Bildformate, Lazy Loading unterhalb des Falzes, Hero eager — Pipeline
      steht und ist im Browser gegen Testbilder verifiziert (gewählte Datei je Fenstergröße
      gemessen). **Mit den echten Fotos erneut prüfen**, insbesondere die Dateigrößen: Das
      Budget warnt ab 200 kB bei 1200px und bricht ab 1,5 MB ab (`lib/bilder-regeln.mjs`)
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

### 2. EXIF-Zeile — ✅ umgesetzt am 2026-08-28, steht jetzt oben im Vertrag

Der Vorschlag ist eingelöst und in *Bildbehandlung & Fokuspunkt* aufgenommen. Was davon
unverändert gilt:

**Typografie:** nutzt die **bestehende** Rolle *Meta* (Martian Mono, 14px, 400, 1.4) — **keine
neue Größe, kein neues Gewicht**, die Skala 14 · 18 · 28 · 56 bleibt unangetastet.
**Farbe:** `--ton-papier`, weil die Zeile in der hellen Hälfte steht.
**Schreibweise:** klein, mit `·` als Trenner — konsistent zur bestehenden Metazeile.

Was sich in der Umsetzung geändert hat:

- **Die GPS-Frage ist strenger gelöst als geplant.** Statt Standortdaten zu entfernen, werden
  sie **gar nicht erst gelesen**: Die Pipeline gibt `exifr` eine abschließende Feldliste mit
  (`EXIF_FELDER`). Was nie eingelesen wird, kann auch nicht versehentlich im Manifest landen.
- **Die Uhrzeit wird als Zeichenkette übernommen, nicht als Datum interpretiert.** Im EXIF steht
  keine Zeitzone; ein `Date` daraus zu bauen hieße, die Zeitzone des Build-Rechners anzunehmen —
  dann zeigte die Seite je nach Server eine andere Uhrzeit.
- **Kamera und Brennweite bleiben draußen.** Beide wären lesbar, machen die Zeile aber länger,
  ohne mehr zu sagen. Vier Werte sind die Zeile aus dem Vorschlag.

⚠️ Offen bleibt: **Wetter oder Lichtsituation stehen nicht im EXIF** — wenn solcher Kontext
gewünscht ist, braucht es ein optionales Handfeld in `lib/content.ts` und damit eine
Copy-Freigabe.

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
