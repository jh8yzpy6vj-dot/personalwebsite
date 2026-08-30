# SITE-PLAN.md — Aufbau, Design & Inhalt der Seite

Struktur und Absicht: welche Bereiche gibt es, was kommt wohin, was ist noch offen.

> 📐 **Verbindliche Design-Werte stehen in [`design/UI-SPEC.md`](design/UI-SPEC.md).** Dieses
> Dokument beschreibt die Absicht, das UI-SPEC den genauen Vertrag (Abstände, Schriftgrößen,
> Farbregeln, Copy, Bildbehandlung). **Bei Widerspruch gilt das UI-SPEC.**

## Was die Seite leisten soll

Aufgabe in einem Satz: *aus „ich habe etwas von ihm gesehen" ein „ich will mit ihm arbeiten oder
reden" machen.*

Jakob Sax hat **drei Standbeine**, und die Seite muss alle drei tragen, ohne dass eines das
andere entwertet:

1. **Fotografie & Video für Kultur und Theater im öffentlichen Raum** — das kommerzielle
   Kerngeschäft. Foto steht vor Video.
2. **Redaktioneller Journalismus** (SWR, Klima und Wirtschaft) — Glaubwürdigkeitsanker, **keine
   Ware**.
3. **Filmworkshops / Medienpädagogik** — kleineres, eigenständiges Angebot.

**Drei Zielgruppen:**
- **Festivalleitungen, Kulturämter, Veranstalter, Compagnien** — entscheiden über *Bilder*, nicht
  über Text. Ein Festivalkurator sieht drei Fotos und weiß Bescheid.
- **Redaktionen** — was kann er, was hat er gemacht, wie erreiche ich ihn?
- **Quellen und Menschen, die ihn nach einem Beitrag googeln** — ist der seriös, und wie erreiche
  ich ihn vertraulich?

### Wie diese Zielgruppen die Seite überhaupt finden

Drei Suchanlässe, jeder mit einer anderen Konsequenz für die Struktur:

| Wer sucht | Wonach | Einschätzung |
|-----------|--------|--------------|
| Veranstalter, Kulturämter | „Festivalfotograf Rastatt", „Straßentheater Fotograf Baden-Württemberg" | Nische fast ohne Konkurrenz — Platz 1 ist realistisch |
| Quellen, Zuschauer nach einem Beitrag | „Jakob Sax" | Muss **neben** der SWR-Autorenseite stehen, nicht dahinter. Dafür sorgt `sameAs` in den strukturierten Daten |
| Festivalpublikum | „tête-à-tête Rastatt 2026 Fotos" | Der unterschätzte Kanal — genau das Publikum, aus dem Auftraggeber kommen |

Der dritte Anlass ist der Grund, warum jede Arbeit perspektivisch eine **eigene URL** bekommt
(`/arbeiten/tete-a-tete-2026`) statt nur eine Kachel auf der Startseite: Nur so kann eine
Bildstrecke für den Festivalnamen ranken. Siehe `TODO.md`, Langfristig.

## Strukturprinzip: nach Frage sortieren, nicht nach Medium oder Zeit

Eine Portfolioseite hat nicht die Aufgabe, Arbeiten auszustellen, sondern **die eine Frage zu
beantworten, mit der jemand gekommen ist** — bevor er wieder weg ist. Aus den drei Zielgruppen
oben folgen drei Fragen, und daraus die Struktur:

| Frage | Wer fragt | Wird beantwortet von |
|-------|-----------|----------------------|
| „Kann der, was ich brauche?" | Festivals, Kulturämter, Veranstalter | Startseite (drei Türen) → `/arbeiten` |
| „Ist der gut, und ist der seriös?" | Redaktionen, Menschen nach einem Beitrag | `/ueber`, Detailseiten, Credits |
| „Wie erreiche ich ihn?" | alle drei, auf verschiedenen Wegen | `/kontakt`, getrennt nach Absicht |

**Zwei Achsen kommen ausdrücklich nicht in Frage als primäre Sortierung:**

- **Chronologie.** Niemand fragt „was hat er 2024 gemacht?". Gefragt wird „hat er sowas wie
  meins schon gemacht?". Je größer der Bestand, desto teurer wird das Scrollen durch Jahre, in
  denen das eigene Thema nicht vorkommt. Aktualität ist trotzdem ein Signal — sie bekommt den
  `zuletzt.`-Block auf der Startseite, aber nicht die Gliederung des Archivs.
- **Medium.** „Foto/Video/Text" ist die Sicht des Herstellers, nicht die des Bestellers. Ein
  Veranstalter denkt in Anlässen, nicht in Dateiformaten.

### Die zwei Hälften — jetzt auf Navigationsebene

Das bisherige Prinzip *dunkel = sehen, hell = lesen* bleibt inhaltlich gültig, wandert aber von
der **Scroll-Ebene auf die Navigations-Ebene**: Früher war es „oben dunkel, unten hell" auf einer
einzigen Seite. Mit wachsendem Bestand trägt das nicht mehr — eine Seite, die alles zeigt, zeigt
nichts.

- **Angebot** (`/`, `/arbeiten`, `/arbeiten/[slug]`) — hier wird gebucht.
- **Person** (`/ueber`) — hier wird Vertrauen gelesen. Der Journalismus lebt hier.

**Warum die Trennung bleiben muss:** Der Journalismus muss auffindbar und prominent sein, darf
aber **keine Ware** werden. Stünden SWR-Beiträge als Portfolio-Kacheln neben einem Aftermovie,
verkaufte er seine Recherche — das beschädigt beides. Als eigener Bereich ist er ein Beleg:
*der Mann arbeitet in einer Klimaredaktion, der erfindet nichts.* Genau darin liegt der Wert für
die Fotografie-Kundschaft, und er entsteht nur durch die Trennung.

## Seitenstruktur (Stand 2026-08-27)

> ✅ **Umgesetzt am 2026-08-27.** Die frühere Einzelseite ist abgelöst und unten unter
> „Abgelöst" nur noch zur Nachvollziehbarkeit dokumentiert. Die verbindlichen Gestaltungswerte
> stehen in [`design/UI-SPEC.md`](design/UI-SPEC.md).
>
> **Eine Präzisierung beim Bauen:** Pro Seite gibt es **genau eine Naht** dunkel → hell. Deshalb
> liegt `zuletzt.` auf der Startseite im hellen Bereich und zeigt **Zeilen statt Kacheln** — auf
> der Weiche geht es um Aktualität, nicht um Bilder; die stehen im Archiv. Ein dunkler
> Bilderblock zwischen zwei hellen Textblöcken hätte die Naht verdoppelt und damit genau das
> Strukturelement entwertet, das die zwei Hälften ausmacht.

### Die Routen

| Route | Job | Inhalt |
|-------|-----|--------|
| `/` | **Die Zehn-Sekunden-Antwort.** Weiche, kein Archiv | siehe unten |
| `/arbeiten` | **Das Archiv.** Hier darf es tief werden | Kategorie als Hauptachse, Jahr als Filter und Label |
| `/arbeiten/[slug]` | **Die einzelne Arbeit** | Bildstrecke, Kontext, Credits, Link zur Originalquelle |
| `/ueber` | **Die Person** | Ausführliche Bio, Werdegang, Journalismus, CV-Link |
| `/kontakt` | **Erreichbarkeit, nach Absicht getrennt** | Buchungsanfrage (Formular) / vertraulich (für Quellen) |
| `/impressum`, `/datenschutz` | Pflichtseiten | siehe Launch-Blocker in `TODO.md` |

Der entscheidende Unterschied zum bisherigen Stand: **Die Startseite hört auf, das Archiv zu
sein.** Sie wird zur Weiche.

### Startseite — jeder Block hat genau einen Job

> **Reihenfolge am 2026-08-29 auf Jans Ansage geändert.** Vorher standen die drei Türen direkt
> hinter dem Hero. Die alte Fassung steht unter der Tabelle.

| # | Block | Job |
|---|-------|-----|
| 1 | Hero | Ein Bild, ein Satz. Eine **Behauptung**, kein Stimmungsbild. **Volle Fensterhöhe** — darunter darf nichts hervorlugen, sonst ist es ein Ausschnitt und kein Bild. Video kurz, stumm, mit sofort geladenem Standbild, das für sich funktioniert |
| 2 | `jakob.` | Porträt, zwei Sätze, ein Weiterweg auf `/ueber`. Beantwortet die Frage, mit der jemand eine Fotografenseite öffnet: **wer ist das** |
| 3 | `arbeiten.` | Das Material — dasselbe randlose Kachelraster wie im Archiv, gekürzt auf sechs. Der eigentliche Beleg, und der Grund, überhaupt weiterzuscrollen |
| 4 | Vertrauen, kurz | Auftraggeberzeile und der Weg auf `/ueber`. Bewusst knapp. Ein **Zitat** fehlt noch (siehe TODO.md) |
| 5 | **Drei Türen** (`buchbar.`) | Festivalfotografie · Bewegtbild · Filmworkshops. Je ein Satz, Eckdaten, **ein Preisanker**, und als Abschluss der einzige gefüllte Knopf der Seite |

Die Startseite soll in unter einer Minute lesbar sein.

**Warum das Angebot nach hinten gewandert ist.** Direkt hinter dem Hero war es die Antwort auf
eine Frage, die zu dem Zeitpunkt noch niemand gestellt hat. Die Reihenfolge ist jetzt
**sehen → wer → was → Angebot**: Erst das Bild, dann die Person, dann der Beleg, dann der Preis.
Wer bis `buchbar.` gescrollt hat, hat sich die Frage inzwischen selbst gestellt.

**Was dabei entfallen ist:** `zuletzt.` als Zeilenliste (das Material zeigt jetzt Bilder statt
Titel) und der eigene Abschnitt `kontakt.` (er trug nur einen Satz und einen zweiten roten Knopf;
der Satz steht jetzt am Ende von `buchbar.`).

### Das Archiv

**Kategorie ist die primäre Achse, das Jahr ist ein Label** (Begründung im Strukturprinzip oben).
Innerhalb einer Kategorie ist ein asymmetrisches Bento-Raster sinnvoll — große Kacheln für die
starken Arbeiten, kleine für den Rest. Dort ist es am richtigen Ort, weil dort die Masse liegt
und der Besucher bereits gefiltert hat.

⚠️ **Asymmetrische Raster brauchen Masse.** Bei ein bis zwei Kacheln pro Block liest man die
Lücken als Mangel, nicht als Komposition. Vor der Umsetzung muss die Bestandsaufnahme zeigen,
wie viele Arbeiten je Kategorie tatsächlich zeigbar sind.

### Detailseite

Acht bis zwölf Bilder, kurzer Vorspann, saubere Credits, Link zur Originalquelle. Gleichzeitig
der wichtigste SEO-Hebel der Seite — nur eine eigene URL kann für einen Festivalnamen ranken.

**Hier — und nur hier — steht auch der Film**, wenn es zu einer Arbeit einen gibt (die vier
Aftermovies für den Bayerischen Kanu-Verband). Seit dem 2026-08-29 gebaut: über der Bildstrecke,
mit Bedienelementen, ohne Autoplay. Das ist die Einlösung von „Video gehört auf die Detailseite"
weiter unten unter *Bewusst nicht Teil der Struktur*.

⚠️ **Redaktionelle Arbeiten: verlinken statt einbetten.** SWR- und NDR-Material auf einer
gewerblichen Privatseite einzubetten ist rechtlich sehr wahrscheinlich nicht gedeckt, und die
Nebentätigkeitsfrage ist offen (siehe Launch-Blocker). Ein Link auf die Mediathek ist zudem das
glaubwürdigere Signal.

### Bewusst nicht Teil der Struktur

- **Kein Sticky Scrubber / Index Rail.** Er navigiert zu wenigen Zielen, ist barrierefrei
  aufwendig (Tastatur, ARIA, 44px-Touch-Target), und sobald Kategorie die Hauptachse ist, hat er
  kein Bezugssystem mehr.
- **Keine Autoplay-Videos in mehreren Kacheln gleichzeitig.** Mehrere parallele Dekoder lassen
  das Scrollen auf Mittelklasse-Geräten ruckeln, und iOS spielt im Energiesparmodus ohnehin
  nichts ab — jede Kachel braucht ein Standbild, das für sich trägt. Video gehört auf die
  Detailseite.
- **Keine Chronologie als Archiv-Gliederung** (siehe Strukturprinzip).

### Vibe: jung und nahbar — wodurch tatsächlich

Nahbarkeit entsteht durch **Konkretheit und Stimme**, nicht durch weiche Ecken und Verläufe.
Steril werden Agenturseiten, weil kein Mensch darin vorkommt. Was wirkt: ein echtes Foto von ihm,
erste Person, Bildunterschriften, die etwas sagen („22:14 Uhr, letzter Durchgang, das Seil war
nass"), und die Bereitschaft zu zeigen, dass etwas schiefgehen kann. **Animation macht eine Seite
teuer, nicht jung.**

### Abgelöst — die bisherige Einzelseiten-Struktur

Der Vollständigkeit halber, weil der Code aktuell noch so aussieht:

| # | Bereich | Hälfte | Inhalt |
|---|---------|--------|--------|
| 1 | Topbar (fix) | wechselnd | Wortmarke + ●REC-Chip |
| 2 | Hero | dunkel | Randloses Video, darüber Positionierungssatz + Orte |
| 3 | Filter | dunkel | `alle.` `festivals.` `bewegtbild.` `redaktion.` |
| 4 | Arbeiten | dunkel | Randloses 2-Spalten-Raster, pro Kachel Auftraggeber · Titel · Ort · Rolle · Jahr |
| 5 | buchbar. | hell | Drei Leistungen mit Zielgruppe und Eckdaten, dann der CTA |
| 6 | schon fotografiert für. | hell | Referenzzeile |
| 7 | über. | hell | Kurzbio erste Person + Link zur SWR-Autorenseite |
| 8 | kontakt. | hell | Buchungsanfragen / Vertraulich |
| 9 | Footer | hell | Impressum · Datenschutz, Instagram |

**Vorbild für diese Struktur war** [bildmanufaktur.de](https://www.bildmanufaktur.de) — fixe
Topbar mit Wortmarke, randloses Hero-Video, Kategoriefilter, randlos aneinanderstoßendes
Kachelraster mit Sender-/Auftraggeber-Label. Übernommen wurde die Struktur, nicht die Gestaltung.
Die Topbar, die ●REC-Marke, der Kategoriefilter und das randlose Raster bleiben auch in der neuen
Struktur erhalten — sie wandern von `/` nach `/arbeiten`.

## Inhalte

Alle Inhalte liegen zentral in [`lib/content.ts`](lib/content.ts) — Arbeiten, Leistungen,
Referenzen, Bio, Kontakt. Wer Inhalte ändert, ändert nur diese Datei.

⚠️ **Alle Angaben stammen aus dem Briefing und sind nicht von Jakob freigegeben.** Siehe die
Launch-Blocker in [`TODO.md`](TODO.md).

## Bewusst (noch) nicht enthalten

- **Onetake-Arbeiten** — liefen über eine Firma, an der Jakob nicht mehr beteiligt ist; Freigabe
  und Nutzungsrechte sind ungeklärt.
- **Preisangaben** — das Briefing empfiehlt einen Richtwert („Tagessatz ab €"), er steht aber
  noch nicht fest.
- **Bildstrecken** — als Ausbaustufe vorgesehen (8–12 Bilder je Festival mit kurzem Vorspann),
  sinnvoll erst mit genug Material.
- **Impressum und Datenschutz** — Pflichtseiten, müssen vor dem Livegang angelegt werden.

## Bewusst gar nicht gebaut (Anti-Features)

Der Abschnitt darüber listet Dinge, die **noch** fehlen. Hier stehen Dinge, gegen die wir uns
entschieden haben — damit die Diskussion nicht alle drei Monate von vorn losgeht (Stand
2026-08-27):

- **Kein Blog.** Ein Blog mit drei Beiträgen aus 2026 ist schlechter als keiner — er signalisiert
  „aufgegeben".
- **Kein Instagram-Feed-Embed.** Tracking-Problem, bricht regelmäßig, und es schickt Besucher weg,
  statt sie zur Anfrage zu führen. Ein Textlink reicht.
- **Keine selbstgebaute Kundengalerie.** Picdrop oder Pixieset kosten wenig und lösen Auswahl,
  Download und Rechte-Handling. Das selbst zu bauen ist ein Halbjahresprojekt.
- **Kein Cookie-Banner** — und das ist ein Feature, kein Verzicht. Mit cookieloser Analytics
  braucht die Seite keine Einwilligung. Das muss so bleiben, sobald jemand „nur kurz Google
  Analytics" vorschlägt.
- **Kein Hero-Karussell.** Wer drei Bilder gleich wichtig findet, hat keins ausgewählt.
- **Kein Effekt an der dunkel/hell-Naht.** Der harte Wechsel ist die beste Idee des Entwurfs; er
  wirkt, *weil* er hart ist. Nicht dekorieren.

## Tonalität

Erste Person, aktiv. Konkrete Nennungen (Sender, Format, Jahr) statt Eigenschaftswörtern —
der Leser soll sich das Bild selbst bauen. Kurze, direkte Sätze. Saubere Credits.

**Nicht:** „durfte" (untergräbt auf einer Auftragsseite die Autorität), „mega", Emoji,
Werbe-Sprech über magische Atmosphäre und unvergessliche Momente. Wer sonst über Klimapolitik
schreibt, kann das daneben nicht schreiben.

Zielregister: *präzise, konkret, unangestrengt* — wie ein guter Hörfunkbeitrag.
