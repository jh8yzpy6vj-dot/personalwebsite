# TODO.md — Offene Aufgaben

Hier stehen alle offenen Aufgaben.

**Wer macht was:** Der Abschnitt „🙋 Nur Jan & Jakob können das" führt kompakt auf, was an einem
Menschen hängt — Freigaben, Konten, Material, Entscheidungen. Alles andere kann Claude selbst
erledigen. Die ausführlichen Beschreibungen stehen weiterhin unter „Kurzfristig" und
„Langfristig"; die Personenliste verweist nur darauf, damit es nicht zwei Wahrheiten gibt.

**Regel für kurzfristige Todos:** Wenn ein kurzfristiger Punkt erledigt ist, wird er hier **entfernt** und stattdessen als Eintrag in `AGENT-LOG.md` dokumentiert (siehe dort für Format).

**Regel für langfristige Todos:** Bleiben hier stehen, bekommen aber ein Status-Symbol:
- 🔲 offen / noch nicht begonnen
- ⏳ in Arbeit
- ✅ erledigt (Log-Eintrag in `AGENT-LOG.md` verlinken, dann den Punkt hier nach kurzer Zeit archivieren/entfernen)

---

## 🚫 LAUNCH-BLOCKER — muss erledigt sein, bevor die Seite öffentlich beworben wird

> ⚠️ Achtung: Laut `TECH-STACK.md` geht **jeder Push auf `main` sofort live**. Zwischen „hier notiert" und „öffentlich online" steht nichts. Diese Punkte deshalb vor dem Push abarbeiten oder den Push zurückhalten.

- [ ] **Pflichtangaben — Daten sind drin, Prüfung fehlt.** ✅ Anschrift (Röttererbergstraße 1, 76437 Rastatt) und E-Mail (`mail@jakobsax.de`) sind am 2026-08-27 eingetragen, `LEGAL_DATA_COMPLETE` steht auf `true`. Offen bleibt:
  - ⚠️ **Von jemandem gegenlesen lassen, der Rechtsberatung darf.** Struktur und Bausteine sind üblich, aber **nicht anwaltlich geprüft**. Das ist der eigentliche verbleibende Blocker.
  - ✅ **Wohnadresse: von Jakob am 2026-08-27 ausdrücklich bestätigt.** Das Risiko (dauerhaft öffentlich auffindbar, bei einem Journalisten mit Rechtsextremismus-Recherche relevant) und die Alternativen wurden vorher benannt. Nicht ohne Rücksprache ändern.
  - **USt-IdNr., falls vorhanden** (`DE` + neun Ziffern) in `lib/legal.ts` ergänzen. § 5 DDG fordert sie nur „soweit vorhanden" — ohne eine erscheint der Abschnitt gar nicht, und ein Hinweis auf § 19 UStG ist **nicht** nötig (der gehört auf Rechnungen). ⚠️ **Niemals die normale Steuernummer eintragen.**
  - **§ 18 Abs. 2 MStV, falls einschlägig:** Der Abschnitt erscheint nur, wenn `mstvResponsible` gesetzt ist. Ein reines Portfolio ist in der Regel kein journalistisch-redaktionelles Angebot; eigene Beiträge oder redaktionell aufbereitete Bildstrecken können die Pflicht auslösen.
  - **Beim Umsetzen des Kontaktformulars und der Analytics:** Die Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert. Formular, Versanddienstleister, Turnstile und Web Analytics müssen dort ergänzt werden, sobald sie live sind — Stellen sind in `app/datenschutz/page.tsx` als Kommentar markiert.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Vertrauliche Kanäle sind noch Platzhalter.** ✅ Die E-Mail-Adresse ist seit 2026-08-27 echt (`mail@jakobsax.de`, ersetzt den erfundenen Platzhalter). ⚠️ **Signal, Threema und PGP stehen weiterhin auf „noch einzutragen"** — echte Werte einsetzen oder den Block entfernen. Ein Vertraulichkeitsversprechen an Quellen ohne funktionierenden Kanal ist schlimmer als keines.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Dürfen SWR-Beiträge eingebettet werden, oder nur auf die Autorenseite verlinkt?
- [ ] **Bild- und Persönlichkeitsrechte** an den Festivalfotos klären: Was darf werblich auf die eigene Seite, was nur ins Kundenarchiv? Bei Auftritten im öffentlichen Raum sind Persönlichkeitsrechte von Künstlerinnen, Künstlern und Publikum ein reales Thema.
- [ ] **Referenznennungen freigeben lassen:** Dürfen tête-à-tête und der Bayerische Kanu-Verband namentlich genannt werden?

## 🙋 Nur Jan & Jakob können das — Claude nicht

Kurzliste dessen, was an einem Menschen hängt. **Die Details stehen jeweils weiter unten**, hier
nur, wer was anstoßen muss. Alles, was nicht hier steht, kann Claude selbst erledigen.

### Jakob

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Bilder liefern und auswählen** | Ohne Fotos ist die Seite Kosmetik. 12–20 starke schlagen 60 gute — die Auswahl kann nur er treffen. Technisch ist alles vorbereitet: Datei als `original/arbeiten/<id>.jpg` in den R2-Bucket, fertig (`TECH-STACK.md`, „Medien") |
| 🔲 | **Hero-Video liefern** (stumm, plus Standbild) | Vorgaben in `TECH-STACK.md` |
| 🔲 | **Bestandsaufnahme ausfüllen** (CSV liegt bei Jan) | Nur er weiß, was es gibt und was gezeigt werden darf |
| 🔲 | **Alle Inhalte gegenlesen** | Alles in `lib/content.ts` stammt ungeprüft aus dem Briefing |
| 🔲 | **Zwei Sätze Kontext je Arbeit** schreiben | Wird nicht erfunden |
| 🔲 | **Preisrahmen festlegen** — und sei es „Tagessatz ab X" | Halbiert die unpassenden Anfragen |
| 🔲 | **Vertrauliche Kanäle** einrichten (Signal, Threema, PGP) | ⚠️ Stehen auf „noch einzutragen". Ein Vertraulichkeitsversprechen ohne funktionierenden Kanal ist schlimmer als keines |
| 🔲 | **USt-IdNr. mitteilen**, falls vorhanden | Nie die normale Steuernummer |
| 🔲 | **Nebentätigkeit beim SWR klären** | Genehmigung nötig? Dürfen Beiträge eingebettet werden? |
| 🔲 | **Bild- und Persönlichkeitsrechte klären** | Was darf werblich auf die Seite, was nur ins Kundenarchiv? |
| 🔲 | **Referenznennungen freigeben lassen** (tête-à-tête, BKV) | Dazu gleich um ein **Zitat** bitten — billigstes Vertrauenselement überhaupt |
| 🔲 | **Onetake-Rechte klären**, falls die Arbeiten gezeigt werden sollen | Liefen über eine Firma, an der er nicht mehr beteiligt ist |
| 🔲 | **Lebenslauf anlegen** (Notion o.ä.) | `/ueber` verlinkt bewusst keinen, weil es keinen gibt |

### Jan

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Patches einspielen und pushen** | Claude hat keinen Schreibzugriff |
| 🔲 | **Schreibzugriff für Claude freischalten** | GitHub-App auf „Read and write", siehe unten |
| 🔲 | **Mailer-Anbieter wählen** + Konto + **AV-Vertrag** | Vertrag nach Art. 28 DSGVO, Häkchen im Anbieterkonto |
| 🔲 | **Absenderdomain verifizieren** und **Worker-Secrets setzen** | Nur mit Zugang zum Cloudflare- und Anbieterkonto möglich |
| 🔲 | **Cloudflare Web Analytics aktivieren** | Dashboard, nicht per Code |
| 🔲 | **Turnstile-Site-Key** besorgen, falls gewünscht | Dashboard |
| 🔲 | **DNS abschließend prüfen** (`jakobsax.de`, `www`) | Nach dem 525-Fix nie final getestet |

### Gemeinsam zu entscheiden

| | Was | Stand |
|---|---|---|
| 🔲 | **Rechtstexte anwaltlich prüfen lassen** | ⚠️ **Der letzte echte Launch-Blocker.** Impressum und Datenschutz sind inhaltlich vollständig, aber von mir geschrieben, nicht von einer Kanzlei |
| 🔲 | **Domain: `.de` oder `.media`?** | Meine Empfehlung: `.de` behalten. Vor dem ersten externen Link entscheiden |
| 🔲 | **Tailwind ja oder nein?** | Meine Empfehlung: nein. Braucht laut `TECH-STACK.md` beider Zustimmung |
| 🔲 | **Design-Vertrag unabhängig prüfen lassen** | Der Abschnitt „Seitenstruktur" ist von Claude geschrieben und selbst nicht abgenommen |

---

## Reihenfolge (Stand 2026-08-27)

Ergebnis des Feature-/SEO-Brainstorms — die ehrliche Priorität, damit niemand an der falschen
Stelle anfängt:

1. **Bildmaterial** — ohne Fotos ist alles andere Kosmetik (siehe Kurzfristig)
2. **Launch-Blocker** — Impressum/Datenschutz, echte Kontaktdaten (siehe oben)
3. **Anfrageformular mit Budgetband** — der größte Conversion-Hebel
4. **SEO-Grundausstattung + URL pro Arbeit**
5. **Burst-Effekt**
6. ~~**EXIF-Zeile**~~ — erledigt am 2026-08-28, wird mit den ersten Fotos sichtbar

> ⚠️ **Die Seite hat aktuell null Fotos.** Jede Kachel zeigt „Bild folgt", der Hero einen
> Farbverlauf. Der SITE-PLAN sagt: „Ein Festivalkurator sieht drei Fotos und weiß Bescheid" —
> aktuell sieht er drei graue Flächen. Laut Briefing schlagen 12–20 wirklich starke Bilder 60
> gute. Jedes Feature unten verbessert eine Seite, deren Kernversprechen noch nicht eingelöst ist.

## Kurzfristig

- [ ] **Schreibzugriff für Claude einrichten.** Aktuell kann Claude nicht selbst pushen: Der Git-Proxy der Session hat keine GitHub-Autorisierung für das Repo (`403`), der GitHub-MCP-Zugang nur Leserechte. Änderungen müssen deshalb als ZIP/Bundle exportiert und von Hand eingespielt werden. Zu tun: Claude GitHub App unter https://github.com/apps/claude/installations/select_target für `jh8yzpy6vj-dot/personalwebsite` freigeben (Contents: Read **and write**), und die GitHub-Verbindung unter claude.ai → Einstellungen → Connectors neu verbinden.
  - ⚠️ **Wenn das steht: Claude weiterhin auf einem Arbeitsbranch pushen lassen, nicht auf `main`.** Laut `CLAUDE.md` geht jeder Push auf `main` sofort live, ohne Preview — die Regel „Änderungen vor dem Pushen kurz selbst gegenlesen" existiert genau deswegen. Der Merge nach `main` bleibt eine menschliche Entscheidung.
- [ ] **⚠️ Ersten echten Medien-Lauf abschließen.** Bucket `websitebucket` steht (Stand 2026-08-30), Bilder sind hochgeladen — **aber flach im Wurzelverzeichnis, mit Kameranamen und 11–12 MB**. So findet die Pipeline nichts. Zu tun:
  1. **Public access → Custom Domain** setzen, z. B. `medien.jakobsax.de`. ⚠️ Nicht die `…r2.dev`-Adresse.
  2. **Token** mit **Object Read & Write** für diesen Bucket, dann `.dev.vars` füllen (`R2_BUCKET=websitebucket`). Die Datei ist von Git ausgenommen — **nichts davon committen**.
     ⚠️ Der Bucket liegt in der Jurisdiction **EU**, der S3-Endpunkt heißt deshalb `…eu.r2.cloudflarestorage.com`. Die Zeile „S3 API" aus R2 → Bucket → Settings kopieren und als `R2_S3_ENDPOINT` eintragen.
  3. Das falsch Abgelegte im Bucket löschen und mit **`npm run verkleinern`** neu erzeugen — das benennt, verkleinert und entfernt die Standortdaten in einem Zug.
  4. **`npm run medien -- --probe`**, erst danach `npm run medien` und die Manifeste committen.
  - Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **⚠️ `verkleinern.mjs` begrenzt die falsche Kante.** `scripts/verkleinern.mjs:109` setzt `fit: "inside"` mit 3000×3000 — das begrenzt die **lange** Kante, bei einem Hochformat also die Höhe. Jakobs 4600×7000 wurde damit zu 1971×3000: Die Höhe trifft die 3000, die **Breite fällt auf 2000**. Da `srcset` breitenbasiert ist und `breitenFuer()` nie hochskaliert, hört so ein Bild bei der 1600er-Stufe auf, obwohl es 6 Megapixel mitbringt. Der Kommentar drei Zeilen darüber („ausgeliefert ohnehin höchstens 2400") meint die **Breite** — Kommentar und Code widersprechen sich.
  - ⚠️ **Seit dem 2026-09-12 in der Praxis umgangen**, aber weiterhin falsch: Jan legt die Originale jetzt mit `--original` in voller Größe ab, da greift die Verkleinerung gar nicht. Wer den Schalter **weglässt**, läuft weiter in den Fehler.
  - ✅ Die Budget-Frage dazu ist erledigt: `BUDGET` rechnet seit dem 2026-09-12 **je Megapixel** statt in festen Zahlen, `QUELLE_WARNUNG` steht auf 8000 px / 40 MB. Vorher hätte ein 2400er-Hochformat-AVIF mit rund 2,4 MB die harte Grenze (1,5 MB) gerissen und den ganzen Lauf abgebrochen.
- [ ] **Hochformat in Originalqualität ansehen können.** Jan am 2026-09-12: „ggf will ich ja ein Hochformat in Originalqualität laden."
  - ✅ **Der Weg dorthin steht seit dem 2026-09-13:** Jede Mosaikkachel öffnet im Lichtkasten, und der lädt **erst beim Öffnen** die große Fassung. Die Seite bleibt schnell, weil das nur passiert, wenn es jemand will.
  - **Offen bleibt die eigentliche Frage:** Der Lichtkasten zeigt derzeit die ausgelieferte WebP-Stufe, nicht die Datei aus `original/`. Soll er das Original laden? ⚠️ **Vorher müssen die EXIF-Daten der Originale nachweislich sauber sein (GPS!)** — der Bucket ist öffentlich. Abgesichert ist bisher die Pipeline; `scripts/exif.mjs` räumt die Originale seit dem 2026-09-12 mit auf, ein Nachweis über den **vorhandenen** Bestand fehlt aber.
- [ ] **⚠️ `Cache-Control` für HTML setzen.** Am 2026-09-13 zeigte die Startseite nach einem Deploy weiter die alte Kachel, während die Detailseite bereits die neue war — beide lesen dieselbe Manifest-Zeile, also lag altes **HTML** im Cloudflare-Edge-Cache. Inkognito und harter Reload halfen nicht, erst ein „Purge Everything" im Dashboard.
  - **Bilder sind seit dem Fingerabdruck (`?v=…`) sicher**: gleiche Adresse heißt gleiche Datei. Für HTML gilt das nicht — dort ist die Adresse stabil und der Inhalt ändert sich bei jedem Deploy. Genau die Lücke.
  - Zu tun: Für HTML-Antworten einen Header setzen, der den Edge revalidieren lässt (`Cache-Control: public, max-age=0, must-revalidate` oder `s-maxage=0`), die Bilder unter `b/` aber unangetastet lässt. Sonst muss nach jedem Deploy von Hand gepurgt werden — und **wer das vergisst, merkt es nicht**, weil die Seite ja etwas anzeigt.
- [ ] **Beschreibungstexte für die Arbeiten.** Auf den Detailseiten steht weiterhin nur „Beschreibung folgt." **Zwei bis vier Absätze je Arbeit von Jakob.** ⚠️ Nichts erfinden; bis dahin bleibt der ehrliche Platzhalter stehen.
  - ✅ **Der Layoutdruck ist seit dem 2026-09-13 weg.** Die Flanken hingen an der Textlänge: Bei einem Satz liefen sie unter den Text hinaus und die Mitte wurde zur leeren Rinne. Das Mosaik steht **unter** dem Text und hat diese Kopplung nicht — kurzer Text sieht jetzt dünn aus, aber nicht mehr kaputt. Damit ist der Punkt wieder eine Inhalts- und keine Layoutfrage.
- [ ] **Bildausschnitte im Hero wählen.** Die Detailseite zeigt ihre Bilder im Hero mit `object-fit: cover`; ein Hochformat ist dort zu **37,5 %** zu sehen, und welche 37,5 % das sein sollen, kann nur ein Mensch entscheiden. Ohne Eintrag steht jedes Bild mittig — bei keinem Motiv grob falsch, aber bei manchen eben auch nicht richtig.
  - **Werkzeug:** <https://claude.ai/code/artifact/ca3af403-f535-4e52-97e6-633cd9414c34> — Bilder laden, Punkt ziehen, roter Rahmen zeigt den übrigbleibenden Ausschnitt, unten fällt die fertige Datei heraus.
  - Ergebnis nach `lib/bildausschnitte.ts` kopieren. **Kein `npm run medien` nötig**, kein Bucket-Zugriff — Datei bearbeiten, pushen, fertig.
  - Offen für `wiwawo-53`: alle sieben. Jan hat am 2026-09-13 an drei Bildern gezeigt, dass der alte Pauschalwert nicht trug (Lagerfeuer, Kajakfahrer mit rotem Paddel).
- [ ] **⚠️ `wiwawo-53` gegenlesen.** Am 2026-08-30 angelegt, weil die Fotos „WiWaWo26" zu keiner bestehenden Arbeit passten. **`role` („Kamera, Schnitt") und `category` („bewegtbild") sind von den Geschwistereinträgen übernommen und nicht belegt** — geliefert wurden Fotos, nicht Bewegtbild. `place` fehlt. Jakob fragen, dann in `lib/content.ts` korrigieren.
- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt.
  - ✅ **Die Technik dahinter steht seit 2026-08-28** (`srcset`, AVIF/WebP, Vorschaubildchen, Größenbudget, GPS-Entfernung). Zu tun ist nur noch: **Datei als `original/arbeiten/<id>.jpg` in den Bucket legen** — `<id>` ist die `id` der Arbeit aus `lib/content.ts` — und einmal `npm run medien` laufen lassen. Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - **Offen bleibt der Alt-Text je Arbeit** (Feld `alt` in `lib/content.ts`). Er beschreibt die Szene und wird nicht erfunden. Fehlt er, setzt die Seite eine Notlösung aus Titel, Auftraggeber und Jahr ein — korrekt, aber wertlos.
- [ ] **⚠️ Porträt von Jakob ablegen.** Das Foto vom 2026-08-29 (Gegenlicht, Sonnenuntergang) als **`original/portrait.jpg`** in den Bucket legen und `npm run medien` laufen lassen — dann erscheint es im Kurzanriss der Startseite und oben auf `/ueber`. Es wird **nicht zugeschnitten**, die Form des Bildes bleibt; auf `/ueber` ist nur die Höhe auf 70 % des Bildschirms begrenzt.
  - Claude kann das nicht selbst: Ein Bild aus dem Chat lässt sich nicht ins Repo schreiben. Die Stelle ist gebaut und geprüft, es fehlt nur die Datei.
  - Die Bildbeschreibung steht in `lib/content.ts` (`ABOUT.portraitAlt`) und ist **von der Aufnahme abgeleitet, nicht von Jakob freigegeben** — gegenlesen.
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video als `original/hero/film.mp4` in den Bucket legen, Standbild als `original/hero/standbild.jpg`. Das Standbild dient sowohl als Poster als auch — ohne Video — selbst als Hero; dazu `HERO_ALT` in `lib/content.ts` füllen. Exportvorgaben (ohne Ton, 8–15 s, unter 8 MB, ffmpeg-Zeile) in `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **Bestandsaufnahme der Arbeiten — Voraussetzung für die neue Archivstruktur.** `lib/content.ts` enthält neun Einträge; das ist der **dokumentierte**, nicht der tatsächliche Bestand — Jakob hat deutlich mehr. Ohne zu wissen, wie viel es gibt und was gezeigt werden **darf**, lässt sich das Archiv nicht sinnvoll gliedern (asymmetrische Raster brauchen Masse, und die Rechtefrage entscheidet pro Arbeit über die Zeigbarkeit).
  - ⏳ **Vorlage ist fertig** (`bestandsaufnahme-arbeiten.csv` + Anleitung, am 2026-08-27 an Jan geschickt, siehe `AGENT-LOG.md`). Erfasst je Arbeit: Jahr, Auftraggeber, Titel, Ort, Rolle, Kategorie, vorhandenes Material, **Nutzungsrechte, Freigabe des Auftraggebers, erkennbare Personen**, Link zur Originalquelle.
  - **Offen:** Jakob ausfüllen lassen, dann die Daten nach `lib/content.ts` überführen.
- [ ] **Seitenstruktur unabhängig prüfen lassen.** Der Umbau (Startseite als Weiche, `/arbeiten`, `/arbeiten/[slug]`, `/ueber`, `/kontakt`) ist am 2026-08-27 umgesetzt, und der Abschnitt „Seitenstruktur" in `design/UI-SPEC.md` ist nachgezogen — aber **vom `gsd-ui-checker` noch nicht geprüft**. Das Sign-Off dort deckt weiterhin nur den Stand vom 2026-08-26.
- [ ] **Drei Türen: Bilder und Preisanker fehlen noch.** Der Block steht auf der Startseite, zeigt aber nur Text aus `SERVICES`. Es fehlen je drei starke Bilder und der Preisanker — letzterer beantwortet die Frage, die ein Kulturamt zuerst hat. Hängt an „Bildmaterial" und am langfristigen Punkt „Preisangaben".
- [ ] **Projektkontext je Arbeit.** Die Detailseiten zeigen aktuell nur Credits und den Hinweis „Beschreibung und Bildstrecke folgen". Zwei Sätze Kontext je Arbeit schreiben, dann in `lib/content.ts` ein Feld `context` ergänzen und in `app/arbeiten/[slug]/page.tsx` ausgeben (Stelle ist im Code markiert). **Nicht erfinden** — die Sätze müssen von Jakob kommen.
- [ ] **Lebenslauf verlinken.** `/ueber` hat bewusst keinen CV-Link, weil es noch keinen gibt. Sobald ein ausführlicher Lebenslauf vorliegt (Notion o.ä.), dort verlinken.
- [ ] **Versand des Anfrageformulars scharfschalten.** ⏳ Das Formular steht seit 2026-08-27 auf `/kontakt`, inklusive Validierung, aller Zustände und Spam-Grundschutz. **Es kann nur noch nicht zustellen** — dafür fehlen:
  1. Konto bei **Resend** (oder Postmark, dann `lib/mailer.ts` anpassen) und ein **Auftragsverarbeitungsvertrag**.
  2. Eine bei dem Anbieter **verifizierte Absenderdomain**.
  3. Drei Worker-Secrets setzen: `npx wrangler secret put RESEND_API_KEY`, `ANFRAGE_AN`, `ANFRAGE_VON`.
  4. `VERSAND_AKTIV` in `lib/legal.ts` auf `true` — das schaltet den Absatz zum Versanddienstleister in der Datenschutzerklärung frei. ⚠️ **Erst nach dem AV-Vertrag**, beides gehört zusammen.
  - Bis dahin antwortet die Route mit einer klaren Meldung, die auf die E-Mail-Adresse verweist — keine Anfrage geht still verloren.
- [ ] **Turnstile ergänzen**, sobald ein Site-Key vorliegt. Aktuell nur Honeypot und Mindest-Ausfüllzeit als Grundschutz. Beim Aktivieren die Datenschutzerklärung mitziehen (Stelle im Code markiert).
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner nötig** ist. Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.
- [ ] **Ein Zitat von tête-à-tête einholen.** Ein Satz der Festivalleitung mit Namen und Funktion schlägt drei Absätze Selbstbeschreibung. Billigstes Vertrauenselement überhaupt — braucht nur eine Freigabe-Mail, die für die Referenznennung ohnehin fällig ist (siehe Launch-Blocker).

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- 🔲 **Preisangaben:** Briefing empfiehlt einen Richtwert („Tagessatz ab €"), weil Festivals und Kulturämter mit festen Budgets planen — das spart beiden Seiten die Hälfte der Anfragen. Aktuell steht überall „noch festzulegen".
- 🔲 **Die Startseite wiederholt sich.** Die drei Türen zeigen denselben Text wie die Leistungsseiten, der Vertrauensblock denselben Absatz wie `/ueber`. Bei einer Weiche nicht per se falsch — aber jede Textänderung wirkt an zwei Stellen, ohne dass das jemand steuert. Sobald echte Texte da sind: **eigene, kürzere Anrisse** für die Startseite schreiben, nicht dieselben Sätze in kurz. (Aus dem Review vom 2026-08-28.)
- 🔲 **Trägt die Archivstruktur den Bestand?** `/arbeiten` mit Filter plus eine Detailseite je Arbeit ist für neun Einträge viel Apparat. Das ist eine bewusste Wette auf die Bestandsaufnahme. Ergibt sie, dass es bei zwölf bis fünfzehn zeigbaren Arbeiten bleibt, wäre ein einfacheres Archiv ehrlicher — **nach der Bestandsaufnahme neu entscheiden**, nicht vorher. (Aus dem Review vom 2026-08-28.)
- 🔲 **Die Kategorien mischen zwei Denkweisen.** `festivals` und `bewegtbild` sind Anlass bzw. Medium, `redaktion` ist eine Rolle. Ein Veranstalter denkt in Anlässen. In `SITE-PLAN.md` notiert, aber nicht behoben. ⚠️ Die Kategorie steckt in keiner URL — eine Änderung kostet also kein Ranking, solange die `id` je Arbeit gleich bleibt. (Aus dem Review vom 2026-08-28.)
- 🔲 **`lib/content.ts` mischt fünf Belange** (Hero, Arbeiten, Leistungen, Referenzen, Bio, Kontakt) auf zwölf Exporten. Bei der aktuellen Größe überschaubar, aber es wächst in die falsche Richtung. **Mit echtem Bestand** in `works.ts`, `services.ts` und `about.ts` trennen — vorher wäre es Aufwand ohne Nutzen. (Aus dem Review vom 2026-08-28.)
- ✅ **Bilder und Videos nach R2 ausgelagert — umgesetzt am 2026-08-29.** Der Cloudflare-Build verarbeitet kein Bild mehr; er liest nur noch `lib/bilder-manifest.json` und `lib/video-manifest.json`. Verarbeitet wird lokal mit `npm run medien`, die Originale und die fertigen Varianten liegen im R2-Bucket. Vorgezogen (geplant war „sobald die Bildstrecken kommen"), weil zwölf Kameradateien den Build zum Hängen gebracht und 134 MB in den Git-Verlauf getragen hatten. Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
  - ⚠️ **Der erste echte Lauf steht noch aus.** Geprüft ist alles gegen eine S3-Attrappe (44 Prüfungen) und gegen `wrangler dev` mit echten Dateien — **aber nie gegen einen echten R2-Bucket**, weil in der Sitzung keine Zugangsdaten vorlagen. Jan muss Bucket, Token und Custom Domain anlegen und einmal `npm run medien -- --probe` laufen lassen.
  - **Der Preis, wie vorhergesagt:** ein manueller Schritt vor jedem Push mit neuen Bildern, plus Bucket und Token. Dafür kann Jakob die Dateien jetzt **per Cloudflare-Dashboard** hochladen und braucht kein Git mehr — das ist unter dem Strich der einfachere Weg für ihn, nicht der schwerere.
- 🔲 **Untertitel für die Filme.** Die Filme zu den Arbeiten haben keinen `<track>`. Das ist bewusst — eine leere Spur wäre schlechter als keine, weil sie Barrierefreiheit vortäuscht. Sobald je Film eine `.vtt` vorliegt, gehört sie in `app/components/Film.tsx`. Bei einem Aftermovie ohne Sprache ist das verzichtbar, bei allem mit O-Ton nicht.
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- ✅ **Bildstrecken statt Einzelbilder** — **umgesetzt am 2026-08-29** als waagerechter Filmstreifen auf der Detailseite, ohne JavaScript. **Braucht von Jakob die Bilder** nach `original/arbeiten/<id>/` im Bucket, benannt `01.jpg`, `02.jpg`, … Der im Briefing erwähnte **kurze Vorspann je Strecke fehlt noch** — das ist Copy und kommt von Jakob (siehe „Projektkontext je Arbeit").
- 🔲 **Eine eigene URL pro Arbeit** (`/arbeiten/tete-a-tete-2026` statt nur Kacheln auf der Startseite). Die stärkste strukturelle SEO-Entscheidung: Damit rankt jede Bildstrecke für den Festivalnamen — und das Festivalpublikum, das „tête-à-tête Rastatt 2026 Fotos" sucht, ist genau das Publikum, aus dem Auftraggeber kommen. Statisch vorgerendert, kein Laufzeit-Mehraufwand. Gibt den Bildstrecken (Punkt darüber) gleichzeitig ihren Platz. Struktur siehe `SITE-PLAN.md`.
- ✅ **OG-Images pro Arbeit.** Wenn ein Festival den Link in die WhatsApp-Gruppe wirft, ist die Vorschaukarte die halbe Miete. **Umgesetzt am 2026-08-29** (`scripts/og.mjs`), Log-Eintrag in `AGENT-LOG.md`. ⚠️ Anders als der Rest **wirkt das schon heute ohne Fotos**: Die Karte trägt Wortmarke, ●REC-Chip, Auftraggeber, Titel und Metazeile. Mit Fotos wird sie besser, aber sie ist nicht leer.
- ✅ **Statt des Burst: der Kontaktbogen.** **Umgesetzt am 2026-08-29.** Alle Frames der Serie stehen nebeneinander, der gewählte rot gerahmt, darunter die Uhrzeit auf die Sekunde. Ruhiger als die geplante Hover-Animation und aus drei Gründen besser: Er versteckt den Beleg nicht hinter einer Geste, funktioniert auf Touch (wo es kein Hover gibt), und er braucht keine Ausnahme von der Motion-Regel. **Braucht von Jakob fünf Frames je Arbeit** nach `original/arbeiten/<id>/serie/` im Bucket — Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - Der ursprüngliche Vorschlag steht weiterhin in `design/UI-SPEC.md` unter „Geplante Erweiterungen": ~~beim Hover/Tap spielt eine Kachel fünf Frames derselben Serie mit ~6 fps ab und bleibt auf dem gewählten Bild stehen.~~ Zeigt statt behauptet, was die eigene Copy sagt („Ein Moment auf dem Hochseil passiert genau einmal") und was im „über."-Text steht: antizipieren, warten, auslösen. **Widerspricht dem bisherigen Motion-Vertrag** — die begründete Vertragsänderung steht in `design/UI-SPEC.md`, Abschnitt „Geplante Erweiterungen", und muss vor dem Code vom Checker geprüft werden. Braucht fünf Frames je Arbeit, also Bildmaterial.
- ✅ **EXIF-Zeile unter dem Bild** — `22:14 uhr · 1/500 · f/2.8 · iso 6400`, zur Build-Zeit automatisch aus den Dateien gelesen, null Pflegeaufwand. **Umgesetzt am 2026-08-28**, Log-Eintrag in `AGENT-LOG.md`.
  - GPS wird **gar nicht erst eingelesen** (abschließende Feldliste), nicht nachträglich entfernt.
  - ⚠️ **Sichtbar wird die Zeile erst mit echten Fotos** — und nur, wenn deren EXIF beim Export erhalten bleibt. Lightroom & Co. bieten „alle Metadaten entfernen"; das nimmt auch die Kameradaten. Richtig ist die Einstellung, die **Kamera-Informationen behält und Standortdaten entfernt** — Letzteres macht die Pipeline ohnehin.
  - **Offen bleibt:** Wetter oder Lichtsituation stehen nicht im EXIF. Falls solcher Kontext gewünscht ist, braucht es ein optionales Handfeld in `lib/content.ts` und eine Copy-Freigabe von Jakob.
- ⏳ **Ladezeit als Qualitätsmerkmal.** Unspektakulär, aber real: Der Kurator schaut sich das auf dem Festivalgelände mit schlechtem LTE an. Eine Fotoseite, die in unter einer Sekunde steht, ist in dieser Branche selten genug, um aufzufallen.
  - ✅ **Umgesetzt am 2026-08-28** (Log-Eintrag dort): AVIF/WebP mit `srcset`, Vorschaubildchen beim Laden, Größenbudget, `content-visibility` war schon da.
  - **Erst mit echten Fotos abschließend zu bewerten** — bis dahin sagt keine Messung etwas aus. Dann prüfen: Bleiben die 1200er-Varianten unter 200 kB (die Pipeline warnt), und wie lange steht die Startseite auf einer gedrosselten Verbindung?
