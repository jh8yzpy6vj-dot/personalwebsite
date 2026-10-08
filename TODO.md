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
- [ ] 6.4 Merge nach `main` (= live). Gebaut wurde auf dem Arbeitsbranch `main-wlv97t`;
  der Merge bleibt eine menschliche Entscheidung (siehe „Schreibzugriff" unten). ⚠️ Ohne
  Filme zeigt `/film` „Filme folgen." und ohne Hero-Material die Startseite eine leere
  dunkle Fläche mit Schriftzug — gültige Zustände, aber kein guter erster Eindruck.

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
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Und ist es unproblematisch, eigene SWR-Beiträge auf `/film` zu **verlinken**? Eingebettet wird nach dem Umbau nichts mehr.
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
| 🔲 | **Zwei Listen liefern: Fotoarbeiten und Filme** | Je Zeile Titel und Kunde, bei Filmen dazu der Link. Ersetzt die alte Bestandsaufnahme (CSV). Details: UMBAU, Schritt 7 |
| 🔲 | **Alle Inhalte gegenlesen** | Alles in `lib/content.ts` stammt ungeprüft aus dem Briefing |
| 🔲 | **USt-IdNr. mitteilen**, falls vorhanden | Nie die normale Steuernummer |
| 🔲 | **Nebentätigkeit beim SWR klären** | Genehmigung nötig? Ist Verlinken eigener Beiträge unproblematisch? |
| 🔲 | **Bild- und Persönlichkeitsrechte klären** | Was darf werblich auf die Seite, was nur ins Kundenarchiv? |
| 🔲 | **Referenznennungen freigeben lassen** (tête-à-tête, BKV, Sender) | Kunden stehen auf `/foto` und `/film` mit Namen |
| 🔲 | **Onetake-Rechte klären**, falls die Arbeiten gezeigt werden sollen | Liefen über eine Firma, an der er nicht mehr beteiligt ist |
| 🔲 | **Schriftdateien liefern und Lizenzart nennen** | Druk Wide Bold und Avenir Next als `woff2`; Desktop- oder Web-Lizenz? Siehe `TECH-STACK.md`, „Schriften“ |
| 🔲 | **3–4 Zeilen für „Über mich“ schreiben** | Wird nicht erfunden |
| 🔲 | **WiWaWo 50–52 online stellen** (YouTube oder Vimeo) | Filme werden nur noch verlinkt; diese liegen bisher nirgends öffentlich |
| 🔲 | **Hell oder dunkel?** (E1) | Gebaut wird dunkel, bis er widerspricht |

### Jan

| | Was | Warum es an ihm hängt |
|---|---|---|
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
- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt.
  - ✅ **Die Technik dahinter steht seit 2026-08-28** (`srcset`, AVIF/WebP, Vorschaubildchen, Größenbudget, GPS-Entfernung). Zu tun ist nur noch: **Datei als `original/arbeiten/<id>.jpg` in den Bucket legen** — `<id>` ist die `id` der Arbeit aus `lib/content.ts` — und einmal `npm run medien` laufen lassen. Anleitung in `TECH-STACK.md`, Abschnitt „Medien".
  - **Offen bleibt der Alt-Text je Arbeit** (Feld `alt` in `lib/content.ts`). Er beschreibt die Szene und wird nicht erfunden. Fehlt er, setzt die Seite eine Notlösung aus Titel, Auftraggeber und Jahr ein — korrekt, aber wertlos.
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video als `original/hero/film.mp4` in den Bucket legen, Standbild als `original/hero/standbild.jpg`. Das Standbild dient sowohl als Poster als auch — ohne Video — selbst als Hero; dazu `HERO_ALT` in `lib/content.ts` füllen. Exportvorgaben (ohne Ton, 8–15 s, unter 8 MB, ffmpeg-Zeile) in `TECH-STACK.md`, Abschnitt „Medien".
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.
  - **Gegenvorschlag aus dem Brainstorm (2026-08-27): `.de` als primäre Domain behalten**, `.media` per 301 darauf weiterleiten. Begründung: deutsches Publikum, deutsche Auftraggeber, lokale Suchintention („Festivalfotograf Rastatt") — `.de` ist bei Vertrauen und lokalem Ranking im Vorteil. Handle-Konsistenz mit Instagram wiegt das nicht auf. **Wichtig unabhängig von der Entscheidung: vor dem ersten externen Link entscheiden**, ein späterer Domainwechsel kostet Ranking.
- [ ] **`INDEXABLE` auf `true` setzen** (`lib/site.ts`), sobald die Launch-Blocker oben erledigt sind. Steht bewusst auf `false` — die Seite ist live und war bis dahin uneingeschränkt indexierbar, mit erfundener E-Mail-Adresse und ohne Impressum. **Beim Umlegen zusätzlich:** OpenGraph-Bild in `app/layout.tsx` ergänzen und echte Kontaktdaten in `app/StructuredData.tsx` nachtragen (beides dort als Kommentar markiert).
- [ ] **Cloudflare Web Analytics aktivieren** — cookielos, damit **kein Cookie-Banner nötig** ist. Das ist eine bewusste Entscheidung, kein Verzicht: siehe die Anti-Feature-Liste in `SITE-PLAN.md`.

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
