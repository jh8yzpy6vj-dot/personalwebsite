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

## 🧭 UMBAU: Präsenz statt Verkauf — Umsetzungsplan (Stand 2026-10-08)

> **Grundlage:** Jakobs Konzept vom 2026-10-08, im Wortlaut oben in `SITE-PLAN.md`. Es ersetzt
> die bisherige Ausrichtung („aus Gesehenem eine Anfrage machen"). **Die Seite verkauft nichts
> mehr** — kein Angebot, kein Preis, kein Formular, kein „hier buchen". Sie ist eine Bühne für
> Fotos und Filme und tritt selbst zurück.
>
> **Die Reihenfolge ist verbindlich:** erst die Entscheidungen (Schritt 0), dann der Vertrag
> (Schritt 1), dann der Code (Schritte 2–6). So verlangt es `CLAUDE.md`: Widerspricht eine
> Änderung dem UI-SPEC, wird zuerst der Vertrag angepasst.
>
> ✅ **Die durch den Umbau hinfälligen Punkte sind am 2026-10-08 entfernt** (Begründung je Punkt
> in `AGENT-LOG.md`). Bei Widerspruch zwischen diesem Abschnitt und dem Rest der Datei gilt
> dieser Abschnitt.

### Zielbild

| Route | Inhalt | Text auf der Seite |
|-------|--------|--------------------|
| `/` | Video in voller Fensterhöhe, mittig der Schriftzug „jakob sax", darüber die Navigation | Schriftzug und Navigation, sonst nichts |
| `/foto` | Mosaik aus den Fotos aller Arbeiten, jedes Bild in seiner eigenen Form | „Titel – Kunde", erst beim Überfahren bzw. im Lichtkasten (E4) |
| `/film` | Raster aus Standbildern, jedes ein Link nach außen (YouTube, Vimeo, Mediathek) | je Film „Titel – Kunde" |
| `/ueber` | Bild links, rechts 3–4 Zeilen, darunter E-Mail und Instagram | 3–4 Zeilen |
| `/impressum`, `/datenschutz` | Pflichtseiten | im Footer verlinkt, auf `/` klein unten links im Video; nie im Header |

**Navigation:** foto · film · über mich. Der Schriftzug führt zur Startseite.

**Fällt weg:** `/arbeiten`, `/arbeiten/[slug]`, `/leistungen/[slug]`, `/kontakt`, das
Anfrageformular samt API-Route, Preisanker, „Anfrage stellen", Referenzzeile, Porträt auf der
Startseite („nicht durch meine Fresse"), EXIF-Zeile, Kontaktbogen, selbst gehostete Filme.

**Was wiederverwendet wird:** Medien-Pipeline (R2, `npm run medien`, AVIF/WebP, GPS-Entfernung),
Hero mit Video und Standbild, `Mosaik` mit Lichtkasten und Blättertasten, `Bild`, `LegalPage`,
Impressum/Datenschutz, Sicherheits-Header, `INDEXABLE`-Schalter.

---

### Schritt 0 — Entscheidungen (Jakob, mit Jan)

Jede Frage hat eine Empfehlung. **Bis jemand widerspricht, wird mit der Empfehlung gebaut.** Die
Stellen sind so angelegt, dass ein späterer Wechsel billig bleibt (letzte Spalte).

✅ = **von Jakob entschieden am 2026-10-08** (über Jan). Für die übrigen gilt die Empfehlung, bis
jemand widerspricht.

| # | Frage | Empfehlung | Warum | Wo ein Wechsel ansetzt |
|---|-------|------------|-------|------------------------|
| E1 | Grundfläche hell oder dunkel? | **Dunkel, eine einzige Fläche** für die ganze Seite | Das Video im Hero geht nahtlos in die Seite über; Fotos und Standbilder tragen auf fast Schwarz am stärksten; eine Fläche statt zwei Hälften ist die reduzierteste Form | drei Farb-Tokens in `app/globals.css` |
| E2 ✅ | Bleibt das rote ●REC als Akzent? | **Entschieden: Das ●REC bleibt.** Rot ist die **einzige** Farbe neben Grund und Schrift und dem ●REC vorbehalten. Ob es zusätzlich den Fokusring trägt, legt 1.2 fest — sonst nirgends | Seine Bildmarke. Als einzige Farbe auf einer sonst farblosen Seite wirkt sie stärker als vorher | Token `--rec` bleibt |
| E3 | Ist die Startseite nur das Video? | **Ja**, nichts darunter, kein Scrollen | Konzept: „Startseite (Video)". Alles andere hat eine eigene Seite | `app/page.tsx` |
| E4 ✅ | Foto: ein Mosaik oder nach Arbeit gruppiert? | **Entschieden: ein Mosaik, ohne Zwischenzeilen.** Arbeiten hintereinander. „Titel – Kunde" beim Überfahren (nur mit Maus) und im Lichtkasten (überall) | Die Fläche bleibt textfrei, die Zuordnung trotzdem erreichbar | Zwischenzeilen wären eine Zeile in `app/foto/page.tsx` |
| E5 ✅ | Schriftlizenzen? | **Entschieden: Jakob hat die Lizenzen.** Beide Schriften werden selbst ausgeliefert (`next/font/local`), kein Ersatz. ⚠️ Vorher prüfen, dass es eine **Web**-Lizenz ist (siehe 1.3), und die `woff2`-Dateien besorgen (Schritt 7) | Eine Desktop-Lizenz erlaubt in der Regel nicht, die Schrift in eine Website einzubetten | je Familie eine CSS-Variable |
| E6 ✅ | Kontakt? | **Entschieden: E-Mail und Instagram als Zeile auf `/ueber`.** Kein Formular, keine vertraulichen Kanäle | Kein „hier buchen", aber erreichbar bleiben. Ein Vertraulichkeitsversprechen ohne eingerichtete Kanäle ist schlimmer als keines | `lib/content.ts` |
| E7 | Schreibweise | Wie im Konzept: „jakob sax" klein; Navigation klein, **ohne** Schlusspunkt | Der Punkt-Stil (`arbeiten.`) gehört zur alten Gestaltung, Jakobs Konzept nutzt ihn nicht | Labels in `lib/nav.ts` |
| E8 | Detailseiten je Arbeit? | **Weg** | Im Konzept nicht vorgesehen, und sie bestehen vor allem aus Text. Verlust: eine eigene URL je Festival für die Suche — das war ein Verkaufsargument | Weiterleitungen in `next.config.mjs` |
| E9 | Filmworkshops? | **Kein eigener Bereich.** Ein Film aus dem Workshop kann in `/film` stehen | Nicht im Konzept, ohne Angebotsseiten gibt es keinen Ort dafür | — |
| E10 ✅ | Kundennamen | **Entschieden: ohne „e.V."**, also „WiWaWo 2026 – Bayerischer Kanuverband". Daraus als Copy-Regel fürs UI-SPEC: **keine Rechtsformzusätze** (e.V., GmbH, gGmbH) in der Beschriftung | Kürzer, und die Rechtsform sagt dem Betrachter nichts | `lib/content.ts` |
| E11 | Externe Filmlinks im selben Tab? | **Ja, selber Tab** | Der Zurück-Knopf führt zurück; neue Tabs ungefragt zu öffnen ist eine Barriere | `app/film/page.tsx` |
| E12 | SWR-Autorenseite auf `/ueber` verlinken? | **Ja, als eine Zeile** neben E-Mail und Instagram | Kostet keinen Text, und sie verknüpft für Google „Jakob Sax, SWR" mit dieser Seite (`sameAs`) | `lib/content.ts` |

---

### Schritt 1 — Vertrag und Dokumente ✅ (2026-10-08)

Erledigt, siehe `AGENT-LOG.md`:
- `SITE-PLAN.md` neu gefasst, die alte Fassung steht unverändert unter „Abgelöst“
- `design/UI-SPEC.md` neu geschrieben, der alte Vertrag ist in Git (`9a04e0d`)
- `TECH-STACK.md` um den Abschnitt zum Umbau und um „Schriften“ ergänzt
- diese Datei von hinfälligen Punkten befreit

Offen:

- [ ] **1.6 Sign-Off für das neue UI-SPEC einholen** (`gsd-ui-checker`). Das Sign-Off vom
  2026-08-26 galt dem abgelösten Vertrag und überträgt sich nicht. **Vor Schritt 3.**

---

### Schritte 2–5 — Datenmodell, Grundlage, Seiten, Abbau ✅ (2026-10-08)

Erledigt, Einzelheiten in `AGENT-LOG.md`. Offen geblieben, weil es an Material oder Menschen
hängt:

- [ ] **3.2 Echte Schriften einbinden** (Druk Wide Bold, Avenir Next über `next/font/local`).
  Wartet auf die `woff2`-Dateien, die Lizenzart und ein **privates Repo**. Bis dahin laufen
  Archivo (breit) und Figtree als Ersatz, siehe `TECH-STACK.md`, „Schriften".
  - Danach: Schriftzug „jakob sax" bei **320px** nachmessen (UI-SPEC, „Typografie") und
    `--topbar-h` neu messen.
- [ ] **Alt-Texte, Titel, Kunden, Zeilen auf `/ueber`** von Jakob gegenlesen lassen.
- [ ] **Jakob: Highlights und Wege-Bild auf der Startseite wählen.** `HIGHLIGHTS` (vier Plätze)
  und `WEGE.foto` in `lib/content.ts` sind eine Vorauswahl von Claude. Leere Plätze zeigen
  „Highlight folgt".
- [ ] **Jakob: Foto für die Startseite bestätigen oder tauschen.** Bis ein Hero-Video da ist,
  trägt `HERO_ERSATZ` in `lib/content.ts` (seit 2026-10-15 `arbeiten/tete-a-tete/01`, SPPI bei
  Nacht — der Bus ist ausgeblendet) die Startseite. Von Claude gewählt, nicht von Jakob. Ebenso
  das Bild der Kachel „foto" (`WEGE.foto`, jetzt `wiwawo-53/08`, Kajak im Wasserfall).
- [ ] **Vorschaukarte mit Foto:** nach dem nächsten `npm run medien` einmal `npm run og` und
  `public/og/start.jpg` committen. In der Cloud-Sitzung war die Medien-Domain gesperrt.

---

### Schritt 6 — Prüfen und ausliefern

- [x] 6.1 `npm run lint`, `npm test`, `npm run build`, `npm run cf:build` grün (2026-10-08).
- [x] 6.2 teilweise: Breiten 375 / 768 / 1440 auf allen Seiten ohne waagerechtes Scrollen;
  Lichtkasten per Tastatur (Enter, →, Esc, Fokus zurück auf die Kachel, Scrollposition
  bleibt); Weiterleitungen und `Cache-Control` per `curl`.
- [ ] 6.2 Rest: Hero-Video mit Pause-Knopf, `prefers-reduced-motion` und Video-Ausfall —
  **erst prüfbar, wenn ein Video im Bucket liegt.** Gedrosseltes 4G ebenso erst mit
  Hero-Standbild.
- [ ] 6.3 UI-Prüfung gegen das neue UI-SPEC (`gsd-ui-checker`), zusammen mit 1.6.
- [x] 6.4 Live seit 2026-10-09 (siehe `AGENT-LOG.md`). Offen: einmal auf `jakobsax.de` im
  Browser ansehen — aus der Cloud-Sitzung war die Domain nicht erreichbar.

---

### Schritt 7 — Material von Jakob (läuft parallel, ab sofort)

**Der eigentliche Engpass.** Im Bucket liegen heute acht Bilder (sieben von `wiwawo-53`, ein
Porträt) und **kein einziges Video**. Eine Seite, die nur aus Arbeit besteht, ist ohne Material
leer — der Code ist in Schritt 2–6 schneller fertig als das.

| Was | Vorgaben | Ablage |
|-----|----------|--------|
| **Hero-Video** | stumm, 8–15 s, Anfang und Ende gehen ineinander über (Loop), H.264-MP4, 1920 px breit, unter 8 MB (Details und ffmpeg-Zeile in `TECH-STACK.md`, „Medien") | `original/hero/film.mp4` |
| **Standbild zum Video** | ein Frame aus dem Video, der allein trägt | `original/hero/standbild.jpg` |
| **Fotos** | Auswahl je Arbeit; über alle Arbeiten lieber 20–40 starke als 100 gute | `original/arbeiten/<id>/01.jpg`, `02.jpg`, … |
| **Liste Fotoarbeiten** | je Zeile: Titel, Kunde, Jahr | an Jan/Claude → `lib/content.ts` |
| **Liste Filme** | je Zeile: Titel, Kunde, Jahr, **Link** | an Jan/Claude → `lib/content.ts` |
| **Standbild je Film** | Querformat | `original/film/<id>.jpg` |
| **Über mich** | 3–4 Zeilen; Wahl des Bildes | `lib/content.ts`, `original/portrait.jpg` |
| **Schriftdateien** | Druk Wide Bold und Avenir Next als `woff2` (Web-Fassung aus dem Lizenzpaket), dazu die Angabe, welche Lizenz es ist (E5) | an Jan/Claude → `app/fonts/` — ⚠️ erst einchecken, wenn das Repo privat ist |

- **WiWaWo 50–52** liegen nirgends öffentlich, die Seite hat sie bisher selbst ausliefern wollen.
  Für `/film` müssen sie auf YouTube oder Vimeo (eigener Kanal oder der des BKV).
- **Freigaben bleiben nötig, auch ohne Verkauf:**
  - Bild- und Persönlichkeitsrechte an den Fotos
  - Nennung der Kunden
  - SWR-Nebentätigkeit: Ist **Verlinken** von eigenen Beiträgen unproblematisch? Vermutlich
    ja, aber fragen.

---

### Schritt 8 — Danach

- [ ] `npm run links` regelmäßig laufen lassen, z. B. vierteljährlich oder als geplanter Lauf.
- [ ] `INDEXABLE` auf `true`, sobald die verbleibenden Launch-Blocker erledigt sind. Übrig nach
  dem Umbau: Rechtstexte prüfen lassen, Bild- und Persönlichkeitsrechte, Kundennennung,
  Nebentätigkeit, Jakobs Freigabe aller Texte.
- [ ] Domain-Entscheidung (`.de`/`.media`), cookielose Analytics — beide unverändert offen.

### Umfang und Abhängigkeiten

| Schritt | Wer | Hängt an | Umfang |
|---------|-----|----------|--------|
| 0 Entscheidungen | Jakob, Jan | — | ein Gespräch |
| 1 Vertrag | Claude | 0 (oder Empfehlungen) | mittel |
| 2 Datenmodell | Claude | 1 | mittel |
| 3 Grundlage | Claude | 1.2, Schriftdateien von Jakob | mittel |
| 4 Seiten | Claude | 2, 3 | groß |
| 5 Abbau | Claude | 4 | klein |
| 6 Ausliefern | Claude, Jan (Push) | 5 | klein |
| 7 Material | Jakob | — | **der lange Pol** |

Die Schritte 1–6 sind ohne Material baubar: Die Seiten zeigen dann ehrlich, was da ist. Live
geht der Umbau aber am besten erst, wenn mindestens das **Hero-Standbild**, **eine Fotoarbeit**
und **drei Filme mit Standbild** vorliegen. Sonst ist `/film` leer.

---

## 🚫 LAUNCH-BLOCKER — muss erledigt sein, bevor die Seite öffentlich beworben wird

> ⚠️ Achtung: Laut `TECH-STACK.md` geht **jeder Push auf `main` sofort live**. Zwischen „hier notiert" und „öffentlich online" steht nichts. Diese Punkte deshalb vor dem Push abarbeiten oder den Push zurückhalten.

- [ ] **Pflichtangaben — Daten sind drin, Prüfung fehlt.** ✅ Anschrift (Röttererbergstraße 1, 76437 Rastatt) und E-Mail (`mail@jakobsax.de`) sind am 2026-08-27 eingetragen, `LEGAL_DATA_COMPLETE` steht auf `true`. Offen bleibt:
  - ⚠️ **Von jemandem gegenlesen lassen, der Rechtsberatung darf.** Struktur und Bausteine sind üblich, aber **nicht anwaltlich geprüft**. Das ist der eigentliche verbleibende Blocker.
  - ✅ **Wohnadresse: von Jakob am 2026-08-27 ausdrücklich bestätigt.** Das Risiko (dauerhaft öffentlich auffindbar, bei einem Journalisten mit Rechtsextremismus-Recherche relevant) und die Alternativen wurden vorher benannt. Nicht ohne Rücksprache ändern.
  - **USt-IdNr., falls vorhanden** (`DE` + neun Ziffern) in `lib/legal.ts` ergänzen. § 5 DDG fordert sie nur „soweit vorhanden" — ohne eine erscheint der Abschnitt gar nicht, und ein Hinweis auf § 19 UStG ist **nicht** nötig (der gehört auf Rechnungen). ⚠️ **Niemals die normale Steuernummer eintragen.**
  - **§ 18 Abs. 2 MStV, falls einschlägig:** Der Abschnitt erscheint nur, wenn `mstvResponsible` gesetzt ist. Ein reines Portfolio ist in der Regel kein journalistisch-redaktionelles Angebot; eigene Beiträge oder redaktionell aufbereitete Bildstrecken können die Pflicht auslösen.
  - **Beim Aktivieren der Analytics:** Die Datenschutzerklärung beschreibt bewusst nur, was tatsächlich passiert. Cloudflare Web Analytics muss dort ergänzt werden, sobald es live ist. Das Kontaktformular entfällt mit dem Umbau (E6); Formular, Versanddienstleister und Turnstile werden in UMBAU-Schritt 4.5 aus der Datenschutzerklärung entfernt.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Und ist es unproblematisch, eigene Beiträge auf `/film` zu zeigen? **Seit 2026-10-24 werden YouTube-Filme eingebettet** (auch Brisant, Tagesschau, Tagesthemen, STRG_F von den Senderkanälen) — die Frage gilt damit fürs Einbetten, nicht nur fürs Verlinken.
- [ ] **Bild- und Persönlichkeitsrechte** an den Festivalfotos klären: Was darf werblich auf die eigene Seite, was nur ins Kundenarchiv? Bei Auftritten im öffentlichen Raum sind Persönlichkeitsrechte von Künstlerinnen, Künstlern und Publikum ein reales Thema.
- [ ] **Referenznennungen freigeben lassen:** Dürfen tête-à-tête und der Bayerische Kanu-Verband namentlich genannt werden?

## 🙋 Nur Jan & Jakob können das — Claude nicht

Kurzliste dessen, was an einem Menschen hängt. **Die Details stehen jeweils weiter unten**, hier
nur, wer was anstoßen muss. Alles, was nicht hier steht, kann Claude selbst erledigen.

### Jakob

| | Was | Warum es an ihm hängt |
|---|---|---|
| ⏳ | **Bilder liefern und auswählen** | ✅ 33 Fotos mit Liste am 2026-10-14 geliefert und online. ✅ „Tödliches Gold" am 2026-10-15 nachgeliefert und online. Offen: **ONE09024 „Cie. Sept fois la langue" (STAMP)** — steht in der Liste, lag nicht im Ordner |
| 🔲 | **Hero-Auswahl auf `/foto` bestätigen** | Acht Bilder in `FOTO_HERO` (`lib/content.ts`) — Claudes Vorschlag nach dem Ordner-Screenshot: at.tension (Cie. Dyptik), Commando Percu (rotes Feuer), WiWaWo-Bus im Nebel, SPPI bei Nacht (tête-à-tête), Malunés am Trapez, WiWaWo 2025 Walze, Stadtfest-Tuchakrobatik, Chloe Loftus. Jakob tauscht oder nennt seine 6–8 |
| 🔲 | **Zuordnung gegenlesen** (Stand 2026-10-14) | ① **ONE09173** lag ohne Listeneintrag im Ordner und zeigt eine Moderation vor einem SWR-Logo — steht jetzt unter `/ueber`. Richtig? ② Titel „Stadtfest" für das KME-Bild (in der Liste ohne Überschrift). ③ Welttheater der Strasse komplett unter „theater", auch Commando Percu und Malunés (in der Liste „Festival"). ④ „journalismus" statt „SWR" als Kategorie. ⑤ Startbild je Arbeit = erste Zeile der Liste (im Mosaik das erste Bild der Arbeit). ⑥ Bildausschnitte im Hero (`lib/bildausschnitte.ts`) und die vier Highlights auf `/` — Claudes Wahl |
| ✅ | **Hero-Video live** (Übergangsfassung aus dem Repo, 2026-10-23) | Läuft oben auf der Startseite aus `public/uebergang/` (TECH-STACK, „Übergang"). **Offen:** auf einem echten iPhone prüfen (Range über die Route), und sobald Hochladen eingerichtet ist und Jakob das Video hochgeladen hat, die Übergangsdateien löschen (Liste in TECH-STACK) |
| ⏳ | **Hero-Video über die Verwaltung** | Geliefert (`261017_jakobsax.de_Header_v1.mov`, 18 s, 30 MB). Seit 2026-10-23 lädt Jakob es selbst hoch: Verwaltung → Startseite → „Video" → „Video hochladen"; die Medien-Action macht daraus ein stummes MP4 ohne Metadaten (7,1 MB) und das Standbild. `startseite.heroArt` steht schon auf `"video"`. **Geht erst, wenn „Hochladen" eingerichtet ist** (Eingangs-Bucket, Worker-Variablen, Action-Secrets — `TECH-STACK.md`, „Einrichtung"). Bis dahin der Weg von Hand: **Jan** legt die fertig umgerechneten Dateien (`film.mp4`, `film.jpg` aus der Sitzung vom 2026-10-23) nach `original/hero/` und lässt `npm run medien` laufen. Danach 6.2 (Pause-Knopf, reduzierte Bewegung, Ausfall) prüfen |
| ⏳ | **Zwei Listen liefern: Fotoarbeiten und Filme** | ✅ Filmliste am 2026-10-22 geliefert, alle 8 Filme stehen in `lib/inhalt.json`. ✅ „Tödliches Gold“ verlinkt seit 2026-10-24 die ganze Doku in der ARD Mediathek (statt des Trailers). ✅ Standbild (Titelbild der Doku, von Jan) seit 2026-10-24 übergangsweise aus dem Repo (`public/uebergang/film/`, TECH-STACK „Übergang") — löschen, sobald es im Bucket liegt bzw. Jakob eins in der Verwaltung hochlädt. Die Mediathek wird nicht eingebettet, die Kachel bleibt ein Link. ⚠️ Mediathek-Beiträge werden nach der Verweildauer depubliziert; `npm run links` meldet das. Die sieben YouTube-Filme brauchen seit 2026-10-24 **kein** Standbild mehr (nach der Einwilligung zeigt `/film` YouTubes Vorschaubild); ein eigenes hat trotzdem Vorrang. **Porträt tauschen** gegen das Foto mit Kamera und Gimbal (Verwaltung → Über mich) |
| 🔲 | **Alle Inhalte gegenlesen** | Alles in `lib/content.ts` stammt ungeprüft aus dem Briefing |
| 🔲 | **USt-IdNr. mitteilen**, falls vorhanden | Nie die normale Steuernummer |
| 🔲 | **Nebentätigkeit beim SWR klären** | Genehmigung nötig? Ist Verlinken eigener Beiträge unproblematisch? |
| 🔲 | **Bild- und Persönlichkeitsrechte klären** | Was darf werblich auf die Seite, was nur ins Kundenarchiv? |
| 🔲 | **Referenznennungen freigeben lassen** (tête-à-tête, BKV, Sender) | Kunden stehen auf `/foto` und `/film` mit Namen |
| 🔲 | **Onetake-Rechte klären**, falls die Arbeiten gezeigt werden sollen | Liefen über eine Firma, an der er nicht mehr beteiligt ist |
| 🔲 | **Schriftdateien liefern und Lizenzart nennen** | Druk Wide Bold und Avenir Next als `woff2`; Desktop- oder Web-Lizenz? Siehe `TECH-STACK.md`, „Schriften“ |
| 🔲 | **3–4 Zeilen für „Über mich“ schreiben** | Wird nicht erfunden |
| 🔲 | **WiWaWo 50–52 online stellen** (YouTube oder Vimeo) | Diese liegen bisher nirgends öffentlich. Auf YouTube laufen sie dann direkt auf `/film` (seit 2026-10-24) |
| 🔲 | **Hell oder dunkel?** (E1) | Gebaut wird dunkel, bis er widerspricht |

### Jan

| | Was | Warum es an ihm hängt |
|---|---|---|
| 🔲 | **Verwaltung `/admin` einrichten** (Passwort `ADMIN_PASSWORT`, Eingangs-Bucket, Worker-Variablen, GitHub-Token, Action-Secrets, **WAF-Regel für die Anmeldung** — kein Cloudflare Access mehr nötig) | Nur im Cloudflare- bzw. GitHub-Dashboard möglich. Bis dahin antwortet `/admin` absichtlich mit 404. Anleitung: `TECH-STACK.md`, „Verwaltung (/admin)" → „Einrichtung — Schritt für Schritt" |
| 🔲 | **Patches einspielen und pushen** | Claude hat keinen Schreibzugriff |
| 🔲 | **Schreibzugriff für Claude freischalten** | GitHub-App auf „Read and write", siehe unten |
| 🔲 | **Cloudflare Web Analytics aktivieren** | Dashboard, nicht per Code |
| 🔲 | **DNS abschließend prüfen** (`jakobsax.de`, `www`) | Nach dem 525-Fix nie final getestet |
| 🔲 | **GitHub-Repo auf privat stellen** — vor UMBAU-Schritt 3 | Es ist öffentlich; kommerzielle Schriftdateien darin wären öffentliche Weitergabe. Siehe `TECH-STACK.md`, „Schriften“ |

### Gemeinsam zu entscheiden

| | Was | Stand |
|---|---|---|
| 🔲 | **Rechtstexte anwaltlich prüfen lassen** | ⚠️ **Der letzte echte Launch-Blocker.** Impressum und Datenschutz sind inhaltlich vollständig, aber von mir geschrieben, nicht von einer Kanzlei |
| 🔲 | **Domain: `.de` oder `.media`?** | Meine Empfehlung: `.de` behalten. Vor dem ersten externen Link entscheiden |
| 🔲 | **Tailwind ja oder nein?** | Meine Empfehlung: nein. Braucht laut `TECH-STACK.md` beider Zustimmung |

---

## Reihenfolge (Stand 2026-10-08)

Die Priorität steht im Abschnitt **UMBAU** oben: erst der Vertrag, dann der Code, das Material
von Jakob parallel dazu. Die Reihenfolge vom 2026-08-27 (Anfrageformular, URL pro Arbeit, Burst)
ist mit der Neuausrichtung hinfällig.

> ⚠️ **Das Material bleibt der Engpass.** Im Bucket liegen acht Bilder (sieben von `wiwawo-53`,
> ein Porträt) und kein Video. Eine Seite, die nur aus Arbeit besteht, ist ohne Material leer.

## Kurzfristig

- [ ] **YouTube-Filme auf `/film` einmal echt abspielen** (seit 2026-10-24 eingebettet). Aus der
  Cloud-Sitzung ist YouTube gesperrt; geprüft ist der Ablauf mit nachgebautem Player. Am Handy
  und am Rechner: Hinweis erscheint → „Erlauben" → Vorschaubilder → ▶ spielt. Falls ein Kanal das
  Einbetten gesperrt hat, zeigt der Player „Auf YouTube ansehen" — dann den Film hier notieren
  (er lässt sich als Link behalten, indem man in der Verwaltung z. B. die Kanal-Adresse statt
  des Videos einträgt, oder ein eigenes Upload nutzt).

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
  - **Offen bleibt die eigentliche Frage:** Der Lichtkasten zeigt derzeit die ausgelieferte WebP-Stufe, nicht die Datei aus `original/`. Soll er das Original laden? ⚠️ **Vorher müssen die EXIF-Daten der Originale nachweislich sauber sein (GPS!)** — der Bucket ist öffentlich. Abgesichert ist bisher die Pipeline; `scripts/exif.mjs` räumt die Originale seit dem 2026-09-12 mit auf, ein Nachweis über den **vorhandenen** Bestand fehlt aber (siehe den nächsten Punkt).
- [ ] **Vorhandene Originale in `original/` einmal auf Bytes hinter dem ersten EOI prüfen und ggf. neu säubern.** Bis 2026-10-20 übernahm das Säubern bei JPEGs alles ab den Bilddaten bis zum Dateiende — auch, was hinter dem Bildende (`FFD9`) hing: bei Kamera-JPEGs mit MPF weitere Vorschaubilder, bei „Motion Photos" vom Handy ein Video, jeweils mit eigener Ortsangabe. Seitdem schneidet `saeubereJpeg` dort ab (`jpegEnde` in `scripts/exif.mjs`). Für den Bestand: jede Datei unter `original/` laden, `jpegEnde(buf, jpegSegmente(buf).bilddatenAb)` mit der Dateilänge vergleichen und in `jpegBilddaten(…).segmente` nach `APPn`/`COM` zwischen den Scans sehen (fällt seitdem ebenfalls weg); wo etwas davon steht, die Datei mit `saeubere` (`scripts/saeubern.mjs`) neu säubern und an dieselbe Stelle zurücklegen. `exifr.gps` allein reicht als Prüfung **nicht** — es liest nur den ersten EXIF-Block.
- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Alt-Texte für die neuen Bilder** (Feld `alt` in `lib/content.ts`). Bisher hat nur `wiwawo-53` Szenenbeschreibungen; alle anderen tragen die Notlösung „Beschriftung, Bild n" — korrekt, aber ohne Information über das Motiv. Kann Claude aus den Bildern vorschlagen, Jakob gibt frei.
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Seit 2026-10-23 über die Verwaltung (Reiter Startseite, „Video hochladen") — Umrechnen und Standbild (`original/hero/film.jpg`, das erste Bild) macht die Medien-Action; siehe den Punkt „Hero-Video live bringen". Von Hand weiterhin als `original/hero/film.mp4` plus `film.jpg`. `HERO_ALT` in `lib/inhalt.json` füllen, falls das Standbild beschrieben werden soll. Vorgaben in `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner auf allen Seiten** nötig ist (der Hinweis für die YouTube-Filme steht nur auf `/film`). Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- ✅ **Bilder und Videos nach R2 ausgelagert — umgesetzt am 2026-08-29.** Der Cloudflare-Build verarbeitet kein Bild mehr; er liest nur noch `lib/bilder-manifest.json` und `lib/video-manifest.json`. Verarbeitet wird lokal mit `npm run medien`, die Originale und die fertigen Varianten liegen im R2-Bucket. Vorgezogen (geplant war „sobald die Bildstrecken kommen"), weil zwölf Kameradateien den Build zum Hängen gebracht und 134 MB in den Git-Verlauf getragen hatten. Anleitung: `TECH-STACK.md`, Abschnitt „Medien".
  - ⚠️ **Der erste echte Lauf steht noch aus.** Geprüft ist alles gegen eine S3-Attrappe (44 Prüfungen) und gegen `wrangler dev` mit echten Dateien — **aber nie gegen einen echten R2-Bucket**, weil in der Sitzung keine Zugangsdaten vorlagen. Jan muss Bucket, Token und Custom Domain anlegen und einmal `npm run medien -- --probe` laufen lassen.
  - **Der Preis, wie vorhergesagt:** ein manueller Schritt vor jedem Push mit neuen Bildern, plus Bucket und Token. Dafür kann Jakob die Dateien jetzt **per Cloudflare-Dashboard** hochladen und braucht kein Git mehr — das ist unter dem Strich der einfachere Weg für ihn, nicht der schwerere.
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- ⏳ **Ladezeit als Qualitätsmerkmal.** Unspektakulär, aber real: Der Kurator schaut sich das auf dem Festivalgelände mit schlechtem LTE an. Eine Fotoseite, die in unter einer Sekunde steht, ist in dieser Branche selten genug, um aufzufallen.
  - ✅ **Umgesetzt am 2026-08-28** (Log-Eintrag dort): AVIF/WebP mit `srcset`, Vorschaubildchen beim Laden, Größenbudget, `content-visibility` war schon da.
  - **Erst mit echten Fotos abschließend zu bewerten** — bis dahin sagt keine Messung etwas aus. Dann prüfen: Bleiben die 1200er-Varianten unter 200 kB (die Pipeline warnt), und wie lange steht die Startseite auf einer gedrosselten Verbindung?
