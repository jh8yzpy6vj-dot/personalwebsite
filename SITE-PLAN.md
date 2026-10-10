# SITE-PLAN.md — Aufbau, Design & Inhalt der Seite

Struktur und Absicht: welche Bereiche gibt es, was kommt wohin, was ist noch offen.

> 📐 **Verbindliche Design-Werte stehen in [`design/UI-SPEC.md`](design/UI-SPEC.md).** Dieses
> Dokument beschreibt die Absicht, das UI-SPEC den genauen Vertrag (Abstände, Schriftgrößen,
> Farbregeln, Copy, Bildbehandlung). **Bei Widerspruch gilt das UI-SPEC.**

## 🧭 Neuausrichtung vom 2026-10-08 — Jakobs Konzept

> ✅ **Das ist die Richtung, seit dem 2026-10-08.** Die Abschnitte direkt darunter beschreiben die
> neue Seite; die bisherige, auf Aufträge ausgerichtete Fassung steht unverändert am Ende unter
> „Abgelöst". Umsetzungsplan und Entscheidungen (E1–E12): [`TODO.md`](TODO.md), Abschnitt
> „UMBAU". Gestaltungsregeln: [`design/UI-SPEC.md`](design/UI-SPEC.md).

Jakobs Zwischenfeedback, im Wortlaut:

> **Was ist mir wichtig:**
> Die Website soll durch meine Arbeit überzeugen, durch die Bilder und Filme nicht durch meine
> Fresse. Außerdem möchte ich nichts verkaufen, also kein „hier buchen", sondern die Website
> soll mehr einfach eine Präsenz sein für das, was ich mache.
>
> **Designtechnische Leitlinien:**
> - Möglichst wenig Text und Schrift
> - Header soll ein kurzes Video sein, ähnlich wie bei bildmanufaktur.de, mittig Schriftzug
>   jakob sax
> - Pro Referenz 2 Dinge: Titel & Kunde z.B. WiWaWo 2026 – Bayerischer Kanuverband e.V. oder
>   Y-Kollektiv: Tödliches Gold – SWR/ ARD
> - Überschriften in Druk Wide Bold, Text in Avenir Next
> - Möglichst wenig Farben, alles ehr reduziert → Website bietet Bühne für die Inhalte und ist
>   nicht selbst zu präsent
>
> **Unterseiten:**
> - Startseite (Video)
> - Foto (Mosaik aus Fotos)
> - Film (Diverse Filme alle verlinkt → nicht auf Website selbst gespeichert)
> - Über mich (seitlich Bild, rechts 3-4 Zeilen zu mir)
> - Impressum (nicht im Header)

**Was sich daraus ändert, in einem Satz:** Die bisherige Aufgabe („aus ‚ich habe etwas von ihm
gesehen' ein ‚ich will mit ihm arbeiten' machen") entfällt. Die Seite zeigt Arbeit und tritt
selbst zurück. Damit entfallen Angebot, Preise, Anfrageformular und Detailseiten, und die Seite
wird deutlich kleiner.

## Was die Seite leisten soll

**Eine Präsenz, keine Verkaufsseite.** Wer Jakobs Namen sucht, unter einem Beitrag auf ihn stößt
oder von einem Festival kommt, soll in wenigen Sekunden sehen, was er macht — an der Arbeit
selbst, nicht an einer Beschreibung davon. Danach ist der Job der Seite erledigt.

Was daraus folgt:

- **Die Arbeit spricht, die Seite schweigt.** Fotos und Filme sind der Inhalt; Schrift ist
  Beschriftung, nicht Botschaft. Jede Zeile Text muss sich rechtfertigen.
- **Keine Aufforderung.** Kein Angebot, kein Preis, kein Formular, kein „hier buchen". Wer Jakob
  erreichen will, findet E-Mail und Instagram auf `/ueber` — erreichbar, aber nicht beworben.
- **Pro Arbeit zwei Angaben: Titel und Kunde.** Mehr nicht.
- **Jakob tritt hinter die Arbeit zurück.** Ein Bild von ihm gibt es nur auf `/ueber`.

### Journalismus und Auftragsarbeit stehen jetzt nebeneinander

Die alte Struktur trennte beides streng, mit gutem Grund: Stünden SWR-Beiträge als Ware neben
einem Aftermovie, verkaufte er seine Recherche. **Dieser Grund entfällt, weil nichts mehr
verkauft wird.** Auf `/film` steht „Y-Kollektiv: Tödliches Gold – SWR/ARD" neben „WiWaWo 2026 –
Bayerischer Kanuverband" — beides ist Arbeit, die er gemacht hat, und so wird es gezeigt.

⚠️ **Was bleibt:** Redaktionelle Beiträge werden **verlinkt, nie eingebettet** — rechtlich
(Nutzungsrechte der Sender) und weil der Link auf die Mediathek das glaubwürdigere Signal ist. Die
Frage nach der SWR-Nebentätigkeit ist mit dem Wegfall des Angebots kleiner geworden, aber nicht
erledigt (`TODO.md`, Launch-Blocker).

## Seitenstruktur

| Route | Job | Inhalt |
|-------|-----|--------|
| `/` | **Der erste Eindruck.** | Seit dem 2026-10-10 (Jans Entscheidung) wieder scrollend: Hero mit Positionierungszeile wie vor dem Umbau, Über-mich-Anriss, zwei Wege zu foto und film, vier Highlights, Footer. Details: UI-SPEC, „Startseite" |
| `/foto` | **Die Fotos.** | Ein Mosaik aus den Fotos aller Arbeiten, ohne Zwischenzeilen. Titel und Kunde erst beim Überfahren und in der Großansicht |
| `/film` | **Die Filme.** | Standbild und „Titel – Kunde" je Film; jeder führt nach außen (YouTube, Vimeo, Mediathek). Kein Film liegt auf der Seite selbst |
| `/ueber` | **Wer.** | Bild seitlich, daneben 3–4 Zeilen, darunter E-Mail, Instagram, SWR-Autorenseite |
| `/impressum`, `/datenschutz` | Pflicht | Nur im Footer verlinkt, nicht im Header |

**Navigation:** foto · film · über mich. Die genauen Gestaltungsregeln — Topbar, Mosaik,
Filmraster, Farbe, Schrift, Copy — stehen in [`design/UI-SPEC.md`](design/UI-SPEC.md).

**Vorbild für die Startseite:** [bildmanufaktur.de](https://www.bildmanufaktur.de) — Video über
die volle Fläche, der Name in der Mitte. Übernommen wird die Anmutung, nicht die Gestaltung.

### Warum es keine Detailseiten mehr gibt

Bisher hatte jede Arbeit eine eigene Seite mit Vorspann, Credits, Aufnahmedaten und Bildstrecke.
Das ist fast alles Text, und Jakob will „möglichst wenig Text und Schrift". Die Fotos stehen im
Mosaik, die Filme liegen bei den Plattformen. **Was dabei verloren geht:** eine eigene Adresse je
Festival, die für dessen Namen in der Suche ranken könnte. Das war ein Argument, um Aufträge zu
gewinnen — für eine Präsenz ist es entbehrlich. Wer „Jakob Sax" sucht, findet die Seite weiterhin;
dafür sorgen der Name und die Verknüpfung mit der SWR-Autorenseite in den strukturierten Daten.

## Inhalte

Alle Inhalte liegen in [`lib/content.ts`](lib/content.ts): die Fotoarbeiten (`FOTOS`), die Filme
(`FILME`) und die Zeilen für `/ueber`. Wer Inhalte ändert, ändert nur diese Datei. Bilder liegen
im R2-Bucket (`TECH-STACK.md`, „Medien").

- **Die Reihenfolge in der Datei ist die Reihenfolge auf der Seite.** Keine automatische
  Sortierung — welche Arbeit vorne steht, ist Jakobs Entscheidung, und die Seite zeigt genau sie.
- **Was kein Bild hat, erscheint nicht.** Eine Arbeit ohne Fotos und ein Film ohne Standbild
  tauchen nicht auf, statt eine graue Kachel zu zeigen.
- **Kundennamen ohne Rechtsform** (kein „e.V.", keine „GmbH").

⚠️ **Nichts davon ist von Jakob freigegeben**, solange er es nicht ausdrücklich bestätigt hat —
siehe Launch-Blocker in [`TODO.md`](TODO.md).

**Bewusst nicht enthalten:** die Onetake-Arbeiten (liefen über eine Firma, an der Jakob nicht mehr
beteiligt ist; Rechte ungeklärt) und Filmworkshops als eigener Bereich (E9 — ein Film aus einem
Workshop kann trotzdem in `/film` stehen).

## Bewusst gar nicht gebaut (Anti-Features)

Damit die Diskussion nicht alle drei Monate von vorn losgeht (Stand 2026-10-08):

- **Kein Angebot, kein Preis, kein Formular, kein Call to Action.** Der Kern der Neuausrichtung.
- **Keine Detailseiten, keine Kategorien, kein Filter.** Siehe oben.
- **Keine eingebetteten Player** (YouTube, Vimeo, Mediathek). Ein eingebetteter Player lädt beim
  Seitenaufruf Inhalte und Tracker eines Dritten und müsste in die Datenschutzerklärung —
  ein Link tut das nicht.
- **Kein Text, der nicht Titel, Kunde, die Zeilen auf `/ueber` oder Pflichttext ist.** Keine
  Einleitung, keine Positionierungszeile, keine Bildunterschriften mit Aufnahmedaten.
- **Kein Blog.** Ein Blog mit drei Beiträgen aus 2026 ist schlechter als keiner — er signalisiert
  „aufgegeben".
- **Kein Instagram-Feed-Embed.** Tracking-Problem, bricht regelmäßig. Ein Textlink reicht.
- **Keine selbstgebaute Kundengalerie.** Picdrop oder Pixieset lösen Auswahl, Download und Rechte.
- **Kein Cookie-Banner** — und das ist ein Feature. Mit cookieloser Analytics braucht die Seite
  keine Einwilligung. Das muss so bleiben, sobald jemand „nur kurz Google Analytics" vorschlägt.
- **Kein Hero-Karussell.** Ein Video, ausgewählt.
- **Keine Schriften von fremden Servern** (Adobe Fonts, Google-CDN). Selbst ausliefern.

## Tonalität

Gilt für das wenige, was an Text bleibt — vor allem die Zeilen auf `/ueber`.

Erste Person, aktiv. Konkrete Nennungen (Sender, Format, Jahr) statt Eigenschaftswörtern — der
Leser soll sich das Bild selbst bauen. Kurze, direkte Sätze.

**Nicht:** „durfte", „mega", Emoji, Werbe-Sprech über magische Atmosphäre und unvergessliche
Momente. Wer sonst über Klimapolitik schreibt, kann das daneben nicht schreiben.

Zielregister: *präzise, konkret, unangestrengt* — wie ein guter Hörfunkbeitrag.

---

## Abgelöst — die Auftragsseite (gültig 2026-08-26 bis 2026-10-08)

> Alles ab hier beschreibt die **bisherige** Ausrichtung: eine Seite, die aus Interesse eine
> Anfrage machen sollte, mit drei Standbeinen, drei Zielgruppen, Angeboten, Preisen, Formular und
> einer Detailseite je Arbeit. **Es gilt nicht mehr.** Es bleibt stehen, damit nachvollziehbar
> ist, warum die Seite so gebaut war und was beim Umbau bewusst aufgegeben wurde. Die Abschnitte
> sind unverändert übernommen, nur eine Gliederungsebene tiefer gesetzt.

### Was die Seite leisten soll

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

#### Wie diese Zielgruppen die Seite überhaupt finden

Drei Suchanlässe, jeder mit einer anderen Konsequenz für die Struktur:

| Wer sucht | Wonach | Einschätzung |
|-----------|--------|--------------|
| Veranstalter, Kulturämter | „Festivalfotograf Rastatt", „Straßentheater Fotograf Baden-Württemberg" | Nische fast ohne Konkurrenz — Platz 1 ist realistisch |
| Quellen, Zuschauer nach einem Beitrag | „Jakob Sax" | Muss **neben** der SWR-Autorenseite stehen, nicht dahinter. Dafür sorgt `sameAs` in den strukturierten Daten |
| Festivalpublikum | „tête-à-tête Rastatt 2026 Fotos" | Der unterschätzte Kanal — genau das Publikum, aus dem Auftraggeber kommen |

Der dritte Anlass ist der Grund, warum jede Arbeit perspektivisch eine **eigene URL** bekommt
(`/arbeiten/tete-a-tete-2026`) statt nur eine Kachel auf der Startseite: Nur so kann eine
Bildstrecke für den Festivalnamen ranken. Siehe `TODO.md`, Langfristig.

### Strukturprinzip: nach Frage sortieren, nicht nach Medium oder Zeit

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

#### Die zwei Hälften — jetzt auf Navigationsebene

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

### Seitenstruktur (Stand 2026-08-27)

> ✅ **Umgesetzt am 2026-08-27.** Die frühere Einzelseite ist abgelöst und unten unter
> „Abgelöst" nur noch zur Nachvollziehbarkeit dokumentiert. Die verbindlichen Gestaltungswerte
> stehen in [`design/UI-SPEC.md`](design/UI-SPEC.md).
>
> **Eine Präzisierung beim Bauen:** Pro Seite gibt es **genau eine Naht** dunkel → hell. Deshalb
> liegt `zuletzt.` auf der Startseite im hellen Bereich und zeigt **Zeilen statt Kacheln** — auf
> der Weiche geht es um Aktualität, nicht um Bilder; die stehen im Archiv. Ein dunkler
> Bilderblock zwischen zwei hellen Textblöcken hätte die Naht verdoppelt und damit genau das
> Strukturelement entwertet, das die zwei Hälften ausmacht.

#### Die Routen

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

#### Startseite — jeder Block hat genau einen Job

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

#### Das Archiv

**Kategorie ist die primäre Achse, das Jahr ist ein Label** (Begründung im Strukturprinzip oben).
Innerhalb einer Kategorie ist ein asymmetrisches Bento-Raster sinnvoll — große Kacheln für die
starken Arbeiten, kleine für den Rest. Dort ist es am richtigen Ort, weil dort die Masse liegt
und der Besucher bereits gefiltert hat.

⚠️ **Asymmetrische Raster brauchen Masse.** Bei ein bis zwei Kacheln pro Block liest man die
Lücken als Mangel, nicht als Komposition. Vor der Umsetzung muss die Bestandsaufnahme zeigen,
wie viele Arbeiten je Kategorie tatsächlich zeigbar sind.

#### Detailseite

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

#### Bewusst nicht Teil der Struktur

- **Kein Sticky Scrubber / Index Rail.** Er navigiert zu wenigen Zielen, ist barrierefrei
  aufwendig (Tastatur, ARIA, 44px-Touch-Target), und sobald Kategorie die Hauptachse ist, hat er
  kein Bezugssystem mehr.
- **Keine Autoplay-Videos in mehreren Kacheln gleichzeitig.** Mehrere parallele Dekoder lassen
  das Scrollen auf Mittelklasse-Geräten ruckeln, und iOS spielt im Energiesparmodus ohnehin
  nichts ab — jede Kachel braucht ein Standbild, das für sich trägt. Video gehört auf die
  Detailseite.
- **Keine Chronologie als Archiv-Gliederung** (siehe Strukturprinzip).

#### Vibe: jung und nahbar — wodurch tatsächlich

Nahbarkeit entsteht durch **Konkretheit und Stimme**, nicht durch weiche Ecken und Verläufe.
Steril werden Agenturseiten, weil kein Mensch darin vorkommt. Was wirkt: ein echtes Foto von ihm,
erste Person, Bildunterschriften, die etwas sagen („22:14 Uhr, letzter Durchgang, das Seil war
nass"), und die Bereitschaft zu zeigen, dass etwas schiefgehen kann. **Animation macht eine Seite
teuer, nicht jung.**

#### Abgelöst — die bisherige Einzelseiten-Struktur

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

### Inhalte

Alle Inhalte liegen zentral in [`lib/content.ts`](lib/content.ts) — Arbeiten, Leistungen,
Referenzen, Bio, Kontakt. Wer Inhalte ändert, ändert nur diese Datei.

⚠️ **Alle Angaben stammen aus dem Briefing und sind nicht von Jakob freigegeben.** Siehe die
Launch-Blocker in [`TODO.md`](TODO.md).

### Bewusst (noch) nicht enthalten

- **Onetake-Arbeiten** — liefen über eine Firma, an der Jakob nicht mehr beteiligt ist; Freigabe
  und Nutzungsrechte sind ungeklärt.
- **Preisangaben** — das Briefing empfiehlt einen Richtwert („Tagessatz ab €"), er steht aber
  noch nicht fest.
- **Bildstrecken** — als Ausbaustufe vorgesehen (8–12 Bilder je Festival mit kurzem Vorspann),
  sinnvoll erst mit genug Material.
- **Impressum und Datenschutz** — Pflichtseiten, müssen vor dem Livegang angelegt werden.

### Bewusst gar nicht gebaut (Anti-Features)

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

### Tonalität

Erste Person, aktiv. Konkrete Nennungen (Sender, Format, Jahr) statt Eigenschaftswörtern —
der Leser soll sich das Bild selbst bauen. Kurze, direkte Sätze. Saubere Credits.

**Nicht:** „durfte" (untergräbt auf einer Auftragsseite die Autorität), „mega", Emoji,
Werbe-Sprech über magische Atmosphäre und unvergessliche Momente. Wer sonst über Klimapolitik
schreibt, kann das daneben nicht schreiben.

Zielregister: *präzise, konkret, unangestrengt* — wie ein guter Hörfunkbeitrag.
