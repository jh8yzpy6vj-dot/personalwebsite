# TODO.md — Offene Aufgaben

Hier stehen alle offenen Aufgaben, aufgeteilt in kurzfristig und langfristig.

**Regel für kurzfristige Todos:** Wenn ein kurzfristiger Punkt erledigt ist, wird er hier **entfernt** und stattdessen als Eintrag in `AGENT-LOG.md` dokumentiert (siehe dort für Format).

**Regel für langfristige Todos:** Bleiben hier stehen, bekommen aber ein Status-Symbol:
- 🔲 offen / noch nicht begonnen
- ⏳ in Arbeit
- ✅ erledigt (Log-Eintrag in `AGENT-LOG.md` verlinken, dann den Punkt hier nach kurzer Zeit archivieren/entfernen)

---

## 🚫 LAUNCH-BLOCKER — muss erledigt sein, bevor die Seite öffentlich beworben wird

> ⚠️ Achtung: Laut `TECH-STACK.md` geht **jeder Push auf `main` sofort live**. Zwischen „hier notiert" und „öffentlich online" steht nichts. Diese Punkte deshalb vor dem Push abarbeiten oder den Push zurückhalten.

- [ ] **Pflichtangaben — Gerüst steht, Daten fehlen.** ⏳ `/impressum` und `/datenschutz` existieren seit 2026-08-27 mit vollständiger Struktur und Rechtstexten und sind im Footer verlinkt. **Es fehlen nur noch Jakobs Daten** — einzutragen in `lib/legal.ts`, danach dort `LEGAL_DATA_COMPLETE = true` setzen:
  - **ladungsfähige Anschrift** (§ 5 DDG, ein Postfach genügt nicht). ⚠️ Für Journalisten ein sensibler Punkt — die Adresse wird öffentlich. Übliche Lösungen: Geschäftsadresse, Coworking-Space oder ein Anbieter für ladungsfähige Adressen.
  - **E-Mail-Adresse** (dieselbe wie im Launch-Blocker „Kontaktdaten")
  - **USt-IdNr., falls vorhanden** (`DE` + neun Ziffern). § 5 DDG fordert sie nur „soweit vorhanden" — ohne eine erscheint der Abschnitt gar nicht, und ein Hinweis auf § 19 UStG ist **nicht** nötig (der gehört auf Rechnungen). ⚠️ **Niemals die normale Steuernummer eintragen** — nicht gefordert und ein unnötiges Risiko.
  - **§ 18 Abs. 2 MStV, falls einschlägig:** Der Abschnitt erscheint nur, wenn `mstvResponsible` gesetzt ist. Ein reines Portfolio ist in der Regel kein journalistisch-redaktionelles Angebot; eigene Beiträge oder redaktionell aufbereitete Bildstrecken können die Pflicht auslösen.
  - ⚠️ **Von jemandem gegenlesen lassen, der Rechtsberatung darf.** Struktur und Bausteine sind üblich, aber nicht anwaltlich geprüft.
  - **Beim Umsetzen des Kontaktformulars und der Analytics:** Die Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert. Formular, Versanddienstleister, Turnstile und Web Analytics müssen dort ergänzt werden, sobald sie live sind — Stellen sind in `app/datenschutz/page.tsx` als Kommentar markiert.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Kontaktdaten sind Platzhalter:** `hallo@jakobsax.media` ist erfunden, die vertraulichen Kanäle (Signal/Threema/PGP) stehen auf „noch einzutragen". Echte Werte einsetzen oder die Blöcke entfernen.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Dürfen SWR-Beiträge eingebettet werden, oder nur auf die Autorenseite verlinkt?
- [ ] **Bild- und Persönlichkeitsrechte** an den Festivalfotos klären: Was darf werblich auf die eigene Seite, was nur ins Kundenarchiv? Bei Auftritten im öffentlichen Raum sind Persönlichkeitsrechte von Künstlerinnen, Künstlern und Publikum ein reales Thema.
- [ ] **Referenznennungen freigeben lassen:** Dürfen tête-à-tête und der Bayerische Kanu-Verband namentlich genannt werden?

## Reihenfolge (Stand 2026-08-27)

Ergebnis des Feature-/SEO-Brainstorms — die ehrliche Priorität, damit niemand an der falschen
Stelle anfängt:

1. **Bildmaterial** — ohne Fotos ist alles andere Kosmetik (siehe Kurzfristig)
2. **Launch-Blocker** — Impressum/Datenschutz, echte Kontaktdaten (siehe oben)
3. **Anfrageformular mit Budgetband** — der größte Conversion-Hebel
4. **SEO-Grundausstattung + URL pro Arbeit**
5. **Burst-Effekt**
6. **EXIF-Zeile**

> ⚠️ **Die Seite hat aktuell null Fotos.** Jede Kachel zeigt „Bild folgt", der Hero einen
> Farbverlauf. Der SITE-PLAN sagt: „Ein Festivalkurator sieht drei Fotos und weiß Bescheid" —
> aktuell sieht er drei graue Flächen. Laut Briefing schlagen 12–20 wirklich starke Bilder 60
> gute. Jedes Feature unten verbessert eine Seite, deren Kernversprechen noch nicht eingelöst ist.

## Kurzfristig

- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Wichtig — manueller Schritt in Cloudflare nötig:** Im Cloudflare Dashboard → Workers & Pages → personalwebsite → Settings → Build prüfen/setzen: Build command auf `npx opennextjs-cloudflare build`, Deploy command auf `npx wrangler deploy`. Ohne diese Umstellung erkennt Cloudflare das neue Next.js-Projekt beim nächsten Push evtl. nicht richtig (vorher war es eine reine statische Seite ohne Build-Schritt).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt. Danach: `srcset`, moderne Formate, Alt-Texte, die die Szene beschreiben (Feld `alt` existiert je Arbeit in `lib/content.ts`).
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video liefern, zusätzlich ein Poster-Bild (`HERO_POSTER`) setzen.
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **Bestandsaufnahme der Arbeiten — Voraussetzung für die neue Archivstruktur.** `lib/content.ts` enthält neun Einträge; das ist der **dokumentierte**, nicht der tatsächliche Bestand — Jakob hat deutlich mehr. Ohne zu wissen, wie viel es gibt und was gezeigt werden **darf**, lässt sich das Archiv nicht sinnvoll gliedern (asymmetrische Raster brauchen Masse, und die Rechtefrage entscheidet pro Arbeit über die Zeigbarkeit).
  - ⏳ **Vorlage ist fertig** (`bestandsaufnahme-arbeiten.csv` + Anleitung, am 2026-08-27 an Jan geschickt, siehe `AGENT-LOG.md`). Erfasst je Arbeit: Jahr, Auftraggeber, Titel, Ort, Rolle, Kategorie, vorhandenes Material, **Nutzungsrechte, Freigabe des Auftraggebers, erkennbare Personen**, Link zur Originalquelle.
  - **Offen:** Jakob ausfüllen lassen, dann die Daten nach `lib/content.ts` überführen.
- [ ] **Seitenstruktur unabhängig prüfen lassen.** Der Umbau (Startseite als Weiche, `/arbeiten`, `/arbeiten/[slug]`, `/ueber`, `/kontakt`) ist am 2026-08-27 umgesetzt, und der Abschnitt „Seitenstruktur" in `design/UI-SPEC.md` ist nachgezogen — aber **vom `gsd-ui-checker` noch nicht geprüft**. Das Sign-Off dort deckt weiterhin nur den Stand vom 2026-08-26.
- [ ] **Drei Türen: Bilder und Preisanker fehlen noch.** Der Block steht auf der Startseite, zeigt aber nur Text aus `SERVICES`. Es fehlen je drei starke Bilder und der Preisanker — letzterer beantwortet die Frage, die ein Kulturamt zuerst hat. Hängt an „Bildmaterial" und am langfristigen Punkt „Preisangaben".
- [ ] **Projektkontext je Arbeit.** Die Detailseiten zeigen aktuell nur Credits und den Hinweis „Beschreibung und Bildstrecke folgen". Zwei Sätze Kontext je Arbeit schreiben, dann in `lib/content.ts` ein Feld `context` ergänzen und in `app/arbeiten/[slug]/page.tsx` ausgeben (Stelle ist im Code markiert). **Nicht erfinden** — die Sätze müssen von Jakob kommen.
- [ ] **Lebenslauf verlinken.** `/ueber` hat bewusst keinen CV-Link, weil es noch keinen gibt. Sobald ein ausführlicher Lebenslauf vorliegt (Notion o.ä.), dort verlinken.
- [ ] **Anfrageformular statt reinem `mailto:`.** `mailto:` ist derzeit der schwächste Punkt der Seite: Wer im Kulturamt mit Webmail arbeitet, klickt „E-Mail schreiben" und es passiert nichts oder ein leeres Outlook geht auf. Ersatz: kleines Formular auf dem Worker mit **strukturierten Feldern** — Datum, Ort, Art der Veranstaltung, Budgetrahmen. Qualifiziert die Anfrage, statt nur bequemer zu sein. `mailto:` bleibt sichtbar als Fallback daneben. Technik und offene Punkte siehe `TECH-STACK.md`, Abschnitt „Kontaktformular"; Zustands-Abdeckung siehe `design/UI-SPEC.md`.
- [ ] **Budgetband im Formular** — löst das Preisproblem, ohne einen Preis festzulegen. Drei bis vier Bänder („unter 500 · 500–1.500 · über 1.500 · weiß ich noch nicht") filtern unpassende Anfragen weg und liefern Jakob Marktdaten, bevor er sich auf einen Tagessatz festlegen muss. Hängt am langfristigen Punkt „Preisangaben".
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner nötig** ist. Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.
- [ ] **Ein Zitat von tête-à-tête einholen.** Ein Satz der Festivalleitung mit Namen und Funktion schlägt drei Absätze Selbstbeschreibung. Billigstes Vertrauenselement überhaupt — braucht nur eine Freigabe-Mail, die für die Referenznennung ohnehin fällig ist (siehe Launch-Blocker).

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- 🔲 **Preisangaben:** Briefing empfiehlt einen Richtwert („Tagessatz ab €"), weil Festivals und Kulturämter mit festen Budgets planen — das spart beiden Seiten die Hälfte der Anfragen. Aktuell steht überall „noch festzulegen".
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- 🔲 **Bildstrecken statt Einzelbilder:** Das Briefing empfiehlt als Ausbaustufe kuratierte Strecken (8–12 Bilder je Festival mit kurzem Vorspann) statt eines reinen Rasters. Sinnvoll, sobald genug Material da ist. **Bekommt seinen Ort durch den nächsten Punkt.**
- 🔲 **Eine eigene URL pro Arbeit** (`/arbeiten/tete-a-tete-2026` statt nur Kacheln auf der Startseite). Die stärkste strukturelle SEO-Entscheidung: Damit rankt jede Bildstrecke für den Festivalnamen — und das Festivalpublikum, das „tête-à-tête Rastatt 2026 Fotos" sucht, ist genau das Publikum, aus dem Auftraggeber kommen. Statisch vorgerendert, kein Laufzeit-Mehraufwand. Gibt den Bildstrecken (Punkt darüber) gleichzeitig ihren Platz. Struktur siehe `SITE-PLAN.md`.
- 🔲 **OG-Images pro Arbeit.** Wenn ein Festival den Link in die WhatsApp-Gruppe wirft, ist die Vorschaukarte die halbe Miete. Zur Build-Zeit generiert, ein Bild pro Arbeit. Hängt an „URL pro Arbeit" und an Bildmaterial.
- 🔲 **Der Burst** — beim Hover/Tap spielt eine Kachel fünf Frames derselben Serie mit ~6 fps ab und bleibt auf dem gewählten Bild stehen. Zeigt statt behauptet, was die eigene Copy sagt („Ein Moment auf dem Hochseil passiert genau einmal") und was im „über."-Text steht: antizipieren, warten, auslösen. **Widerspricht dem bisherigen Motion-Vertrag** — die begründete Vertragsänderung steht in `design/UI-SPEC.md`, Abschnitt „Geplante Erweiterungen", und muss vor dem Code vom Checker geprüft werden. Braucht fünf Frames je Arbeit, also Bildmaterial.
- 🔲 **EXIF-Zeile unter dem Bild** — `22:14 uhr · 1/500 · f/2.8 · iso 6400`, zur Build-Zeit automatisch aus den Dateien gelesen, null Pflegeaufwand. Für Kuratoren und Kollegen sofort lesbar als „der weiß, was er tut", und passt exakt zur Tonalitätsregel *konkrete Nennungen statt Eigenschaftswörter*. ⚠️ Zwei Punkte: **GPS-Daten müssen beim Ausliefern raus**, und **Wetter steht nicht im EXIF** — falls gewünscht, ein optionales Handfeld in `lib/content.ts`. Details in `TECH-STACK.md` und `design/UI-SPEC.md`.
- 🔲 **Ladezeit als Qualitätsmerkmal.** Unspektakulär, aber real: Der Kurator schaut sich das auf dem Festivalgelände mit schlechtem LTE an. Eine Fotoseite, die in unter einer Sekunde steht, ist in dieser Branche selten genug, um aufzufallen. AVIF/WebP mit `srcset`, LQIP-Blur beim Laden, hartes Größenbudget fürs Hero. Ergänzt die offenen Punkte der Qualitätsuntergrenze in `design/UI-SPEC.md`.
