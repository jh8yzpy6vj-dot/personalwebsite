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

## Strukturprinzip: die zwei Hälften

Statt das Doppelrollen-Problem mit einer Überschrift zu lösen, löst es die Fläche:

- **dunkel = sehen.** Fotografie und Bewegtbild. Randlose Bilder, minimale Typografie. Hier wird
  gebucht.
- **hell = lesen.** Buchbar, Referenzen, Über, Kontakt. Papier, Serifenschrift. Hier wird
  Vertrauen gelesen.

Die dunkle Hälfte steht **oben**: wer bucht, sieht zuerst Bilder; wer prüft, scrollt weiter. Der
Journalismus rutscht bewusst nach unten — er ist Beleg, nicht Angebot.

## Seitenstruktur

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

**Vorbild für die Struktur:** [bildmanufaktur.de](https://www.bildmanufaktur.de) — fixe Topbar
mit Wortmarke, randloses Hero-Video, Kategoriefilter, randlos aneinanderstoßendes Kachelraster
mit Sender-/Auftraggeber-Label. Übernommen wurde die Struktur, nicht die Gestaltung: die zwei
Hälften, die Schriftwahl und die ●REC-Marke sind eigenständig.

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

## Tonalität

Erste Person, aktiv. Konkrete Nennungen (Sender, Format, Jahr) statt Eigenschaftswörtern —
der Leser soll sich das Bild selbst bauen. Kurze, direkte Sätze. Saubere Credits.

**Nicht:** „durfte" (untergräbt auf einer Auftragsseite die Autorität), „mega", Emoji,
Werbe-Sprech über magische Atmosphäre und unvergessliche Momente. Wer sonst über Klimapolitik
schreibt, kann das daneben nicht schreiben.

Zielregister: *präzise, konkret, unangestrengt* — wie ein guter Hörfunkbeitrag.
