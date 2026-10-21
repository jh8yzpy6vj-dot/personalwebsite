# TECH-STACK.md — Technische Vorgaben & Konventionen

Verbindliche technische Fakten und Regeln für dieses Projekt. Bei jeder technischen Entscheidung (Framework, Hosting-Änderung, neue Abhängigkeit) **muss** diese Datei aktualisiert werden.

## Ziel-Stack (Framework)

- **Framework**: Next.js (App Router) mit **TypeScript** — wie beim CLAER-Projekt.
- **Cloudflare-Adapter**: `@opennextjs/cloudflare`. Next.js baut normalerweise für Node-Server/Vercel; dieser Adapter übersetzt den Next.js-Build so, dass er als **Cloudflare Worker** läuft. Ohne diesen Adapter funktioniert ein Next.js-Projekt auf Cloudflare Workers nicht sauber — das ist der "Connector", den es braucht.
- **Build-Command** (Cloudflare Build-Konfiguration): `npx opennextjs-cloudflare build` — falls eine ältere Next.js-Version (z.B. 14) verwendet wird, zusätzlich das Flag `--dangerouslyUseUnsupportedNextVersion` anhängen (siehe CLAER-Projekt als Referenz, dort war das nötig).
- **TypeScript**: durchgängig für neuen Code, kein plain JavaScript mehr für neue Dateien.
- Status: **Umgesetzt.** Next.js 16.3.3 + `@opennextjs/cloudflare` 1.20.3 (offiziell unterstützte Kombination, kein Legacy-Flag nötig). Lokal via `npm run build` und `npx opennextjs-cloudflare build` getestet.
- ✅ **Erledigt am 2026-08-27:** Die Build-/Deploy-Befehle im Cloudflare-Dashboard (Workers & Pages → personalwebsite → Settings → Build) sind auf den Next.js-Workflow umgestellt (`npx opennextjs-cloudflare build` / `npx wrangler deploy`). Erster erfolgreicher Build und Livegang mit dem neuen Stack bestätigt.

## ✅ Umbau „Präsenz statt Verkauf" (beschlossen 2026-10-08, im Code umgesetzt 2026-10-08)

Die Seite ist nach Jakobs Konzept umgebaut (`SITE-PLAN.md`, Plan in `TODO.md`, Abschnitt
„UMBAU", Log in `AGENT-LOG.md`). **Alles in diesem Abschnitt steht im Code — mit einer
Ausnahme: die Schriften** (siehe „Schriften"; bis die Lizenzdateien da sind, laufen freie
Ersatzschriften). Wo ein älterer Abschnitt weiter unten dem widerspricht, gilt dieser.

| Bereich | Bisher | Nach dem Umbau | Schritt |
|---------|--------|----------------|---------|
| Routen | `/`, `/arbeiten`, `/arbeiten/[slug]`, `/leistungen/[slug]`, `/kontakt`, `/ueber`, Pflichtseiten | `/`, `/foto`, `/film`, `/ueber`, Pflichtseiten | 4, 5 |
| Weiterleitungen | — | in `next.config.mjs`, dauerhaft (308): `/arbeiten` und `/arbeiten/:slug` → `/foto`, `/leistungen/:slug` → `/`, `/kontakt` → `/ueber`; dazu vorläufig (307) `/foto/:id` → `/foto` für die Detailseiten, die am 2026-10-14 kurz live waren | 5 |
| Inhalte | `WORKS`, `CATEGORIES`, `SERVICES`, `REFERENCES`, `CONTACT` | `FOTOS` (`id`, `titel`, `kunde`), `FILME` (dazu `link`), `ABOUT` — seit 2026-10-17 in `lib/inhalt.json`, siehe „Verwaltung (/admin)" | 2 |
| Schriften | Bricolage Grotesque, Newsreader, Martian Mono über `next/font/google` | Druk Wide Bold und Avenir Next über `next/font/local` — siehe „Schriften" unten | 3 |
| Kontaktformular | Route `app/api/anfrage`, `lib/anfrage.ts`, `lib/mailer.ts`, Resend, Turnstile | **entfällt ersatzlos.** Keine Worker-Secrets `RESEND_API_KEY`, `ANFRAGE_AN`, `ANFRAGE_VON`; kein AV-Vertrag nötig | 5 |
| Filme | selbst ausgeliefert aus `original/video/<id>.mp4` | **verlinkt**, nicht gespeichert. Nur das Standbild liegt bei uns: `original/film/<id>.jpg` | 2, 4 |
| Bucket-Pfade | siehe „Wohin welche Datei" | `original/arbeiten/<id>/01.jpg …` **bleibt**; neu `original/film/<id>.jpg`; entfallen: `original/arbeiten/<id>.jpg` (Leitbild), `…/serie/`, `original/video/` | 2 |
| EXIF | als Aufnahmezeile angezeigt | **nicht mehr angezeigt.** Die GPS-Sperre (`EXIF_FELDER`) bleibt unverändert — sie ist Schutz, nicht Anzeige | 2 |
| Vorschaukarten | je Arbeit eine plus `start.jpg` | nur noch `start.jpg` | 2 |
| Strukturierte Daten | `Person` + `ProfessionalService` | nur `Person` mit `sameAs` | 4 |
| Linkprüfung | — | `npm run links`: ruft jeden `FILME[].link` ab, meldet alles außer 200. **Nicht im Build** — ein Deploy darf nicht davon abhängen, ob YouTube antwortet | 2 |
| Cache-Control für HTML | fehlt (siehe `TODO.md`) | wird im Umbau gesetzt — bei einem Strukturumbau ist altes HTML im Edge-Cache besonders tückisch | 3 |

⚠️ **Warum die Filme nicht mehr bei uns liegen:** Jakobs Vorgabe („alle verlinkt, nicht auf
Website selbst gespeichert"). Folge: **Links verfallen.** ARD- und SWR-Mediathek depublizieren
nach Ablauf der Verweildauer. Deshalb die Linkprüfung, und deshalb wo möglich dauerhafte Orte
bevorzugen (YouTube-Kanal von Y-Kollektiv/funk, eigener Kanal). Ein eingebetteter Player kommt
nicht in Frage — er lädt beim Seitenaufruf Inhalte und Tracker eines Dritten.

## Schriften

> Beschlossen am 2026-10-08 (E5). ⏳ **Übergang:** Die Lizenzdateien liegen noch nicht vor, und
> das Repo ist (Stand 2026-10-08) nicht nachweislich privat. Bis dahin nennt `app/globals.css`
> „Druk Wide" und „Avenir Next" zuerst (wo installiert, z. B. Avenir Next auf Apple-Geräten,
> erscheinen sie) und fällt sonst auf **Archivo** (Breitenachse auf 125 %) und **Figtree**
> zurück — beide über `next/font/google` zur Build-Zeit geladen und vom eigenen Worker
> ausgeliefert, also ohne Anfrage an Google. Umstellen auf `next/font/local` in
> `app/layout.tsx`, sobald die drei Punkte unten geklärt sind.

| Familie | Schnitt | Hersteller | Lizenz |
|---------|---------|------------|--------|
| **Druk Wide** | Bold | Commercial Type | Jakob hat eine Lizenz — **Art noch bestätigen** (siehe unten) |
| **Avenir Next** | Regular | Linotype / Monotype | Jakob hat eine Lizenz — **Art noch bestätigen** |

**Eingebunden über `next/font/local`, ausgeliefert vom eigenen Worker.** Nie von einem fremden
Server (Adobe Fonts, Google-CDN, Monotype-CDN) — das wäre eine Datenübermittlung an Dritte und
gehörte in die Datenschutzerklärung. Nur die Schnitte einbinden, die das UI-SPEC nutzt; jede
Datei kostet Ladezeit.

⚠️ **Drei Dinge müssen geklärt sein, bevor eine Schriftdatei ins Projekt kommt:**

1. **Ist es eine Web-Lizenz?** Schriften werden getrennt für Desktop, Web, App und Video
   lizenziert. Eine Desktop-Lizenz erlaubt in aller Regel **nicht**, die Datei auf einem Server
   abzulegen. Festzuhalten (hier, in dieser Tabelle): Lizenzart, Lizenznehmer, Grenze der
   Seitenaufrufe, ob Selbsthosting erlaubt ist. Die Lizenzurkunde selbst gehört **nicht** ins
   Repo.
2. **⚠️ Das GitHub-Repo `jh8yzpy6vj-dot/personalwebsite` ist öffentlich** (geprüft am
   2026-10-08). Eine eingecheckte Schriftdatei wäre damit für jeden herunterladbar — das ist
   Weitergabe, und die erlaubt praktisch keine kommerzielle Lizenz, auch keine Web-Lizenz.
   **Vorher das Repo auf privat stellen** (GitHub → Settings → Danger Zone → Change visibility).
   Der Cloudflare-Build hat über die GitHub-App weiterhin Zugriff; nach dem Umstellen einen
   Deploy abwarten und prüfen, dass er durchläuft. Bis dahin: **keine Schriftdatei committen.**
3. **Dürfen die Vorschaukarten die Schrift verwenden?** `scripts/og.mjs` rendert Schrift in ein
   JPEG und braucht dafür TTF/OTF (Satori kann kein WOFF2, siehe `assets/fonts/README.md`). Ob
   die Lizenz Schrift in erzeugten Bildern deckt, steht im Lizenztext. Wenn nicht: die
   Vorschaukarte mit Schriftzug als fertigem Bild aus einem Programm mit Desktop-Lizenz.

**Rückfallweg für Avenir Next**, falls es nur eine Desktop-Lizenz gibt: den Namen in CSS
benennen statt die Datei mitzuliefern (`font-family: "Avenir Next", …`). Auf macOS und iOS ist
sie vorinstalliert und erscheint dort ohne Download; Windows und Android zeigen dann einen freien
Ersatz, der mit `next/font/google` mitgeliefert wird. Damit ist keine Web-Lizenz nötig. Für Druk
Wide gibt es diesen Weg nicht — sie ist nirgends vorinstalliert.

**Ablage:** `app/fonts/` (WOFF2 für die Seite), `assets/fonts/` (TTF/OTF für die
Vorschaukarten). Beide Ordner **erst nach Punkt 2** befüllen.

## Verwaltung (/admin)

> **Gebaut am 2026-10-17.** ⏳ **Eingerichtet ist sie erst, wenn die Schritte unter
> „Einrichtung" erledigt sind** (`TODO.md`, „🙋 Nur Jan & Jakob"). Bis dahin antwortet `/admin`
> mit 404 — das ist Absicht, nicht ein Fehler.

Unter `https://jakobsax.de/admin` bearbeitet Jakob die Seite selbst: Mosaik auf `/foto` frei
anordnen, Hero-Auswahl, Bilder auf `/ueber`, Bilder ausblenden, löschen (Papierkorb), neu
hochladen und ersetzen, Bildausschnitte setzen, Texte bearbeiten (Arbeiten, Bildtitel, Alt-Texte,
Über mich, Filme, Startseite) und frühere Stände wiederherstellen.

**Grundprinzip: Speichern ist ein Git-Commit.** Die Verwaltung schreibt genau eine Datei,
`lib/inhalt.json`, über die GitHub-API auf `main`. Cloudflare baut daraufhin wie nach jedem Push
(1–2 Minuten). Die öffentliche Seite bleibt **statisch gebaut** — es gibt keine Datenbank, keinen
fremden Dienst und keinen Code, der für Besucher zur Laufzeit Inhalte holt.

**Warum so und nicht mit einem fertigen CMS** (`CLAUDE.md`, „Konventionen"): Git bleibt die
einzige Quelle. Jede Änderung steht im Verlauf, lässt sich zurücknehmen (auch in der Verwaltung,
Reiter „Verlauf"), und ein kaputter Stand geht nie live, weil der Build ihn mit denselben Regeln
prüft wie die Verwaltung (`lib/inhalt-pruefen.ts`) und dann abbricht — Cloudflare lässt in dem
Fall die alte Fassung online.

### Architektur

```
Browser (Jakob)
  │  Passwort (ADMIN_PASSWORT) → Sitzungs-Cookie, 30 Tage
  ▼
Worker personalwebsite
  ├─ /admin                  Anmeldung bzw. Oberfläche (app/admin/), prüft das Cookie
  ├─ /api/admin/anmelden     Passwort prüfen, Cookie setzen   · /api/admin/abmelden  Cookie löschen
  ├─ /api/admin/stand        liest lib/inhalt.json + Bild-Manifest von main   ─┐
  ├─ /api/admin/speichern    prüft, committet lib/inhalt.json auf main        ├─ GitHub-API (GITHUB_TOKEN)
  ├─ /api/admin/verlauf      Commits, die lib/inhalt.json geändert haben      │
  ├─ /api/admin/zuruecksetzen Datei aus einem alten Commit als neuen Commit   │
  ├─ /api/admin/verarbeiten  startet die Medien-Action (workflow_dispatch)    │
  ├─ /api/admin/verarbeitung wartende Bilder + letzte Läufe der Action       ─┘
  ├─ /api/admin/live         aus welchem Commit die laufende Seite gebaut ist (BUILD_COMMIT)
  └─ /api/admin/hochladen    legt die Bilddatei in den PRIVATEN Eingangs-Bucket (R2, S3-API)
                                       │
GitHub Action Medien (.github/workflows/medien.yml)
  eingang → papierkorb → medien → Commit „Medien: …" auf main  →  Cloudflare baut
```

| Teil | Dateien |
|---|---|
| Vertrag zwischen Oberfläche und Server (Typen, Routen, `ZIEL`, `MAX_UPLOAD_BYTES`, `BILDTYPEN`) | `lib/admin/vertrag.ts` — **zuerst lesen** |
| Inhalte, Typen, Prüfung | `lib/inhalt.json`, `lib/inhalt.ts`, `lib/inhalt-pruefen.ts` |
| Zugang (Passwort, Sitzungs-Cookie, Herkunft, Anmeldebremse) | `lib/admin/zugang.ts`, Bindung `ANMELDUNG` in `wrangler.toml` |
| Einstellungen aus der Worker-Umgebung | `lib/admin/umgebung.ts` |
| GitHub-API, Eingangs-Bucket, gemeinsame Antworten | `lib/admin/github.ts`, `lib/admin/eingang.ts`, `lib/admin/antwort.ts` |
| Routen | `app/api/admin/*/route.ts` |
| Oberfläche | `app/admin/` (Server-Seite `page.tsx`, Client-Wurzel `Verwaltung.tsx`, je Reiter eine Datei), reine Hilfsfunktionen in `lib/admin/werkzeuge.ts`. Dialoge immer über `Dialog` in `teile.tsx`; Knöpfe darin schließen über `schliesse` (`children` als Funktion), nie über einen eigenen Setter — nur `close()` gibt den Fokus an den Auslöser zurück |
| Medien-Action und ihre Skripte | `.github/workflows/medien.yml`, `scripts/eingang.mjs`, `scripts/papierkorb.mjs`, `scripts/saeubern.mjs`, `scripts/inhalt.mjs`, `lib/inhalt-regeln.mjs` |

⚠️ **`lib/content.ts` ist keine Inhaltsquelle mehr.** Es reicht `lib/inhalt.json` unter den alten
Namen (`FOTOS`, `FOTO_HERO`, `ABOUT` …) an die Seiten weiter und prüft den Stand beim Build.
**Node-Skripte können es nicht importieren** (es importiert TypeScript und JSON ohne Endung, das
kann nur der Bündler) — sie lesen `lib/inhalt.json` über `scripts/inhalt.mjs`.

### Abläufe

**Laden.** `GET /api/admin/stand` holt `lib/inhalt.json` und `lib/bilder-manifest.json` frisch
von `main` (nicht den Stand des laufenden Builds), dazu die Blob-SHA der Datei. Ohne GitHub-Zugang
zeigt die Verwaltung den Stand des Builds, Speichern ist dann gesperrt.

**Speichern.** Die Oberfläche prüft jede Änderung sofort mit `pruefeInhalt` und zeigt Fehler,
Warnungen und Hinweise; Fehler sperren das Speichern. Beim Speichern prüft der Server noch einmal
(422 bei Fehlern) und committet dann **sofort** mit der SHA vom Laden — ob sie noch zu `main`
passt, entscheidet GitHub beim Commit (`speichereInhalt` in `lib/admin/antwort.ts`). ⚠️ Kein
Lesen von `main` vorher: GitHub liefert kurz nach einem Commit beim Lesen über den Branch
manchmal noch den Stand davor. Nähme Jakob seine gerade gespeicherte Änderung zurück, sähe das
aus wie „steht schon so da", und die Rücknahme ginge still verloren (bis 2026-10-21 so gebaut).

- **Lehnt GitHub ab und steht auf `main` schon genau dieser Inhalt**, gibt es keinen Commit, nur
  die aktuelle SHA (seit 2026-10-20). Das ist der Fall „Antwort ging unterwegs verloren": Jakob
  speichert noch einmal mit der alten SHA und bekam vorher „jemand anderes hat gespeichert",
  obwohl er es selbst war. `main` wird erst nach der Ablehnung gelesen.
- **Lehnt GitHub ab, weil die SHA wirklich abweicht** (Jan im Code, ein zweiter Tab, die
  Medien-Action, wenn sie abgelaufene Einträge aus dem Papierkorb entfernt): **409, nichts wird
  still überschrieben.** Die Verwaltung zeigt, was Neu laden verwerfen würde, und schließt den
  Dialog erst, wenn das Laden geklappt hat.
- **Nicht jede 409 von GitHub ist ein Konflikt** (`schreibeDatei` in `lib/admin/github.ts`):
  GitHub antwortet auch so, wenn der Branch während des Commits weitergerückt ist (die Action
  pusht gerade) oder eine Regel des Repos den Commit verbietet. Deshalb wird die SHA nachgelesen:
  abweichend → Konflikt; gleich → genau ein zweiter Versuch, scheitert der, steht GitHubs eigene
  Meldung da („GitHub hat das Speichern abgelehnt: …", 502).
- **Die Papierkorb-Daten setzt der Server**, siehe „Löschen = Papierkorb" unten — gemessen an
  dem Stand, den der Commit ersetzt. Den liest er über die SHA des Browsers als Blob
  (`leseBlob`, `/git/blobs/<sha>`): Blobs sind nach Inhalt benannt, da hinkt nichts hinterher.
  Die Antwort bringt die Daten mit, die Verwaltung übernimmt sie.

Danach fragt die Verwaltung alle 20 s `/api/admin/live`, bis die laufende Seite aus dem neuen
Commit gebaut ist, und meldet „Gespeichert und live".

**Commit-Nachricht:** `Verwaltung: <Betreff>` und darunter „Gespeichert über die Verwaltung
(/admin)." Der Betreff ist eine Zusammenfassung dessen, *was* sich geändert hat, ohne Werte;
E-Mail-Adressen werden auf beiden Seiten entfernt (`ohneEmail`, `betreffAus`). Kein `author`-Feld:
Der Commit läuft auf den Inhaber des Tokens.

**Verlauf und Zurücksetzen.** Der Reiter „Verlauf" zeigt die letzten Commits an `lib/inhalt.json`
(Name oder Login, nie die Mail). „Diesen Stand wiederherstellen" (beim zweiten Eintrag: „Letzte
Speicherung zurücknehmen") schreibt die Datei aus dem alten Commit als **neuen** Commit
(`Verwaltung: Stand vom TT.MM.JJJJ, HH:MM wiederhergestellt`) — dieselbe Prüfung wie beim
Speichern, nichts wird aus der Geschichte gelöscht. Seit 2026-10-20:

- Vorher holt die Rückfrage den alten Stand (`GET /api/admin/verlauf?commit=<sha>`, nur Hex-SHAs
  wie beim Zurücksetzen, `COMMIT` in `lib/admin/vertrag.ts`), prüft ihn mit den heutigen Regeln
  und zeigt, was sich ändert (`pruefeAltenStand` in `lib/admin/werkzeuge.ts`). Passt er nicht mehr
  zu den Regeln, ist „Wiederherstellen" gesperrt; der Server lehnt ihn ohnehin mit eigenem Text ab
  („… passt nicht mehr zu den heutigen Regeln (n Punkte) … Gib Jan Bescheid.").
- Danach übernimmt die Verwaltung nur einen Stand, der die SHA des neuen Commits trägt (bis zu
  vier Abrufe im Abstand von 1,5 s — GitHub hinkt manchmal kurz hinterher). Kommt er nicht,
  meldet die Leiste „Wiederhergestellt, aber der neue Stand ließ sich nicht laden" und Speichern
  bleibt gesperrt, bis neu geladen ist. Vorher blieben alter Inhalt und alte SHA stehen, und die
  Leiste sagte „Gespeichert".
- Seit 2026-10-21 gehört die Liste zu einem Stand (`sha`): Ändert der sich (gespeichert, neu
  geladen, wiederhergestellt), holt der Reiter sie neu und sperrt die Knöpfe, bis sie da ist.
  Nach eigenem Speichern muss der neue Commit darin stehen — sonst bis zu vier Abrufe im Abstand
  von 1,5 s, danach ein Hinweis und weiter gesperrt. Vorher blieb die alte Liste stehen, und
  „Letzte Speicherung zurücknehmen" zeigte auf den Eintrag davor: Jakob hätte zwei Speicherungen
  zurückgenommen statt einer.

**Hochladen und Ersetzen.**

1. Die Oberfläche wählt das Ziel (den künftigen Bildschlüssel, z. B. `arbeiten/<id>/07`, `ueber/03`,
   `film/<id>`, `portrait`) und prüft Größe, Typ und das Ziel gegen `ZIEL`. Ersetzen heißt: auf
   denselben Schlüssel hochladen.
2. `PUT /api/admin/hochladen?ziel=…` mit der Datei als rohem Rumpf. Der Worker prüft Ziel, Typ,
   Größe und die ersten Bytes (ein PNG muss wie ein PNG anfangen) und legt die Datei als
   `<ziel>.<endung>` in den **privaten Eingangs-Bucket**.
3. Danach stößt die Verwaltung die Medien-Action an und zeigt, was noch wartet.

⚠️ **Warum ein eigener, privater Bucket.** Eine frisch hochgeladene Datei trägt alle
Kameradaten, oft mit GPS. Läge sie auch nur Minuten im öffentlichen Bucket, wäre der Aufnahmeort
über ihre Adresse abrufbar. Erst die Action säubert sie. Und warum die Action und nicht der Worker:
`sharp` läuft im Worker nicht.

**Die Medien-Action** (`.github/workflows/medien.yml`, von Hand unter Actions → Medien → „Run
workflow", von der Verwaltung per `workflow_dispatch` und täglich um 03:17 UTC):

1. `npm run eingang` — je Ziel die neueste Datei aus dem Eingang holen, säubern
   (`scripts/saeubern.mjs`: GPS und alles außer Ausrichtung, Aufnahmezeit, Belichtung, Blende und
   ISO raus; PNG/WebP/TIFF werden JPEG), nach `original/<ziel>.jpg` legen, andere Endungen
   desselben Schlüssels löschen, **erst dann** aus dem Eingang löschen. Ein kaputtes Bild hält die
   anderen nicht auf, bleibt im Eingang liegen und färbt den Lauf am Ende rot.
   ⚠️ **Seit 2026-10-20 schneidet das Säubern JPEGs an ihrem echten Bildende (`EOI`) ab**
   (`jpegEnde` in `scripts/exif.mjs`). Dahinter hängen bei Kamera-JPEGs mit MPF weitere
   Vorschaubilder und bei „Motion Photos" vom Handy ein ganzes Video — jedes mit eigener
   Ortsangabe, die vorher im öffentlichen Original stehen blieb. Das Log nennt es als „Anhang
   hinter dem Bildende (n Bytes) entfernt". Endet das Ergebnis nicht sauber oder steckt noch ein
   zweites JPEG darin, bricht das Säubern ab („Säubern unvollständig"), statt hochzuladen.
   Ebenfalls seit dann: `APPn`- und `COM`-Blöcke **zwischen den Scans** progressiver JPEGs fallen
   weg (dort hätte ein eingeschobener EXIF-Block an der Positivliste vorbeigeführt), und ein
   JFIF-Kopf wird ohne Vorschaubild neu geschrieben; `JFXX` mit eingebettetem JPEG fällt ganz weg.
2. `npm run papierkorb` — siehe unten.
3. `npm run medien` — Varianten rechnen, Verwaistes wegräumen, Manifest und Vorschaukarte
   schreiben. Ohne `.medien-cache` trotzdem inkrementell: Unveränderte Bilder werden aus dem
   eingecheckten Manifest zurückgewonnen.
4. Was sich geändert hat (`lib/bilder-manifest.json`, `lib/video-manifest.json`,
   `lib/inhalt.json`, `public/og`), committet sie als `github-actions[bot]` mit `Medien: …`,
   holt vorher den neuesten Stand (`git pull --rebase`) und versucht den Push bei einem Fehler
   genau ein zweites Mal.
   ⚠️ **Den schreibberechtigten Token hat nur dieser letzte Schritt** (seit 2026-10-20): Der
   Checkout legt ihn nicht in `.git/config` ab (`persist-credentials: false`), und pull und push
   bekommen ihn über einen Credential-Helper aus der Umgebung des Schritts — nicht in der
   Adresse, die stünde sonst im Reflog (`.git/logs`) und in `FETCH_HEAD`. Vorher konnte jedes
   Installationsskript von `npm ci` ihn einfach aus `.git/config` lesen und auf `main` pushen —
   und `main` geht live. Ganz dicht ist es nicht: Ein Prozess, den ein Paket bei `npm ci` im
   Hintergrund weiterlaufen ließe, könnte die Umgebung des Commit-Schritts theoretisch auslesen.
   Die Git-Identität (`github-actions[bot]`) setzt der Schritt per `git config`, weil auch der
   Rebase sie braucht. Wer den Workflow ändert: kein weiterer Schritt mit `git fetch`/`pull`/
   `push`, ohne den Token genauso nur dort zu übergeben.

Sie läuft nie zweimal gleichzeitig und wird nie abgebrochen. Ein abgebrochener Lauf wird beim
nächsten nachgeholt: Was nicht fertig wurde, liegt noch im Eingang bzw. Papierkorb.

**Ausblenden.** Der Schlüssel kommt in `ausgeblendet`; die Datei bleibt im Bucket, das Bild
behält seinen Platz in der Reihenfolge und kehrt beim Einblenden dorthin zurück.

**Löschen = Papierkorb, 30 Tage.** Löschen trägt den Schlüssel mit dem heutigen Datum in
`papierkorb` ein; auf der Seite ist das Bild sofort weg, im Bucket liegt es noch. Seine Plätze in
Mosaik, Hero und Startseite bleiben stehen (seit 2026-10-21 auch der im Hero — vorher nahm Löschen
es dort heraus, und Wiederherstellen brachte es nicht zurück). Bis zum Ablauf stellt der Reiter
„Papierkorb" (oder das Bild-Panel) es mit einem Klick an genau diese Plätze zurück. Nach
**mehr als 30 Tagen** löscht die tägliche Action das Original im öffentlichen Bucket (die
Varianten räumt `npm run medien` direkt danach als verwaist weg) und entfernt den Schlüssel
**restlos** aus `lib/inhalt.json` — aus Reihenfolge, Hero, Ausschnitten, Bildtiteln und Alt-Texten;
Plätze auf der Startseite werden leer (`entferneSchluessel` in `lib/inhalt-regeln.mjs`).
⚠️ **Der einzige Schritt, der sich nicht zurücknehmen lässt.** Deshalb gilt ein unlesbares Datum
als nicht abgelaufen, und wurde nach dem Löschtag ein neues Bild unter demselben Schlüssel
hochgeladen, bleibt die Datei stehen und nur der Papierkorbeintrag fällt weg.
⚠️ **Das Datum legt seit 2026-10-20 der Server fest** (`papierkorbDaten` in
`lib/admin/antwort.ts`, beim Speichern wie beim Wiederherstellen): Liegt ein Schlüssel auf `main`
schon im Papierkorb, bleibt dessen Datum; jeder andere bekommt den heutigen Tag in deutscher Zeit
— auch einer, der mit einem alten Stand zurückkommt, also wieder volle 30 Tage. Vorher kam das
Datum aus dem Browser (eine falsch gehende Geräteuhr ließ Originale sofort löschen) bzw. aus dem
alten Stand („Stand vom 05.09." brachte einen Eintrag vom 01.09. zurück, der in der folgenden
Nacht ablief). Ein unmögliches Datum wie „2026-02-30" ist für `pruefeInhalt` ein Fehler.

Eine **Arbeit** lässt sich in der Verwaltung nur löschen, solange sie keine Bilder hat (weder im
Manifest noch im Eingang) — sonst rät die Oberfläche zum Ausblenden.

### Sicherheit

- **Fail closed.** Fehlt `ADMIN_PASSWORT` oder ist es kürzer als 12 Zeichen, antworten `/admin`
  und alle `/api/admin/*` mit **404**. Die Verwaltung ist dann nicht da, statt offen.
- **Anmeldung mit einem Passwort** (seit 2026-10-17, statt Cloudflare Access — das hätte nur
  Jakob im Dashboard anlegen können). `/admin` zeigt ohne Anmeldung ein Passwortfeld. Stimmt das
  Passwort, setzt `/api/admin/anmelden` das Cookie `__Host-verwaltung` (HttpOnly, Secure,
  SameSite=Lax, 30 Tage): Ablaufzeit plus HMAC-SHA256-Signatur, **Schlüssel ist das Passwort
  selbst**. Daraus folgt: **Passwort ändern = alle abmelden.** Das Passwort steht nirgends im
  Cookie und lässt sich nicht daraus zurückrechnen. Alle `/api/admin/*` prüfen das Cookie bei
  jeder Anfrage, ohne gültiges Cookie: 404.
- **Anmeldebremse** (seit 2026-10-20): höchstens **5 Anmeldeversuche je Minute und IP**, bei
  IPv6 je `/64`. Gezählt wird über die Bindung `ANMELDUNG` (Workers Rate Limiting, `[[ratelimits]]`
  in `wrangler.toml`, `anmeldungErlaubt` in `lib/admin/zugang.ts`) — sie braucht keinen eigenen
  Speicher und nichts im Dashboard, der Deploy legt sie an. Ab dem sechsten Versuch antwortet
  `/api/admin/anmelden` sofort mit `/admin?gesperrt=1` („Zu viele Versuche …"), **ohne das
  Passwort zu prüfen**. Die Zählung ist je Cloudflare-Rechenzentrum und ungefähr — eine Bremse,
  keine Sperre. Bewusst keine gemeinsame Grenze für alle IPs: die könnte jeder ausschöpfen und
  Jakob damit aussperren. Fehlt die Bindung, geht die Anmeldung ungebremst durch und das Log
  meldet „Anmeldebremse nicht verfügbar". Zusätzlich wartet jeder Fehlversuch 1,5 s.
- ⚠️ **Pflicht bei der Einrichtung: die WAF-Regel** (Schritt 6 unten). Sie hält Massenanfragen
  schon am Rand auf, bevor der Worker überhaupt läuft, und gilt auch dann, wenn die Bindung
  einmal fehlt. Den eigentlichen Schutz trägt trotzdem die Länge: **ein langes, zufälliges
  Passwort** wählen (z. B. vier, fünf zufällige Wörter), es nirgends sonst verwenden und nur
  Jakob und Jan geben.
- **Links landen maskiert im Code jeder Seite.** Die Adressen von „Über mich" (SWR, Instagram)
  stehen im JSON-LD (`app/StructuredData.tsx`) jeder Seite, auch auf `/admin`. Seit 2026-10-20
  doppelt gesichert: `pruefeInhalt` nimmt als Adresse (Links, Filmlinks, Hero-Video) nur
  `https://` mit Host und ohne Leerraum, spitze Klammern, Anführungszeichen, Backtick und
  Backslash an — beim Speichern wie beim Build —, und `alsJsonLd` (`lib/site.ts`) maskiert
  `<`, `>` und `&` trotzdem. Vorher hätte ein Link wie `https://x/</script><script>…` als Code
  auf jeder Seite laufen können. ⚠️ **Wer ein
  weiteres `<script>` mit Daten einbaut: immer über `alsJsonLd`, nie `JSON.stringify` allein.**
- **Mutierende Anfragen nur von derselben Seite** (`Origin` bzw. `Sec-Fetch-Site`), sonst 403.
- **Bildschlüssel werden immer gegen `ZIEL` bzw. feste Muster geprüft**, Pfade und Refs gegen
  `..` und leere Abschnitte — kein Ausbruch aus `lib/inhalt.json` oder dem Eingang.
- **Secrets gehen nie an den Browser, in Logs oder Fehlermeldungen.** Der Browser erfährt nur zwei
  Wahrheitswerte (`konfiguration`: GitHub ja/nein, Eingang ja/nein) — und nur unter `next dev`
  mit Schreibfreigabe zusätzlich Repo und Branch (`entwicklung`, siehe „Lokale Entwicklung"),
  beides kein Geheimnis. Fehlertexte von R2 werden nicht durchgereicht (das S3-Fehler-XML nennt
  die Key-ID), die Logs der Action ebenso wenig (`s3Grund` in `scripts/r2.mjs`).
- **Nie zwischenspeichern, nie indexieren.** `next.config.mjs` setzt für `/admin` und
  `/api/admin/*` `Cache-Control: no-store` und `X-Robots-Tag: noindex, nofollow` (nach der
  `must-revalidate`-Regel, sonst gewönne die), die Routen setzen `no-store` zusätzlich.
  `app/robots.ts` verbietet `/admin` und `/api/` — die **einzige** bewusste Ausnahme vom
  Grundsatz unter „Indexierbarkeit" unten, weil es dort nie einen Index-Eintrag gab, der
  verschwinden müsste.

⚠️ **Datenschutz: Das Repo ist öffentlich** — jeder Commit, jede Commit-Nachricht und jedes Log
der Action ist für immer lesbar.

- Die Verwaltung setzt kein `author`-Feld und entfernt Adressen aus der Nachricht; die Action
  committet als `github-actions[bot]` mit dessen noreply-Adresse.
- **Aber:** Commits der Verwaltung laufen auf das GitHub-Konto, dem der Token gehört, mit der
  Commit-Adresse aus dessen Kontoeinstellungen. Dort deshalb **GitHub → Settings → Emails → „Keep
  my email addresses private"** einschalten (dann steht die `…@users.noreply.github.com`-Adresse im
  Commit). Das liegt außerhalb des Codes.
- `notiz`-Felder in `lib/inhalt.json` erscheinen nur in der Verwaltung, **stehen aber öffentlich
  im Repo**. Nichts hineinschreiben, was nicht jeder lesen darf.

### Variablen und Secrets

**Im Worker** (Workers & Pages → personalwebsite → Settings → **Variables and Secrets** — die
Laufzeit-Variablen, **nicht** die „Build variables"):

| Name | Art | Pflicht | Zweck |
|---|---|---|---|
| `ADMIN_PASSWORT` | **Secret** | ja | das Passwort der Verwaltung, mindestens 12 Zeichen. Ändern meldet alle ab |
| `GITHUB_TOKEN` | **Secret** | für Speichern, Verlauf, Verarbeitung | fine-grained Token, nur dieses Repo |
| `GITHUB_REPO` | Text | nein | Standard `jh8yzpy6vj-dot/personalwebsite` |
| `GITHUB_BRANCH` | Text | nein | Standard `main` |
| `R2_ACCOUNT_ID` | Text | für Hochladen | Konto-ID aus R2 |
| `R2_JURISDICTION` | Text | wenn der Eingang eine hat | z. B. `eu` — ⚠️ der Bucket `websitebucket` liegt in der EU, ein Eingang daneben also auch |
| `EINGANG_BUCKET` | Text | für Hochladen | Name des privaten Eingangs-Buckets |
| `EINGANG_ACCESS_KEY_ID` | **Secret** | für Hochladen | R2-Token, Object Read & Write **nur** auf den Eingang |
| `EINGANG_SECRET_ACCESS_KEY` | **Secret** | für Hochladen | dito |
| `ADMIN_DEV` | — | **nie im Dashboard** | nur lokal, siehe „Lokale Entwicklung" |
| `ADMIN_DEV_SCHREIBEN` | — | **nie im Dashboard** (wirkt dort nicht) | nur lokal: erlaubt `next dev`, wirklich zu speichern (GitHub) und hochzuladen (Eingang) |

Die **Anmeldebremse** (`ANMELDUNG`) ist keine Variable, sondern eine Bindung in `wrangler.toml`;
sie kommt mit jedem Deploy, im Dashboard ist dafür nichts einzutragen.

Fehlt `ADMIN_PASSWORT` (oder ist zu kurz): 404. Fehlt `GITHUB_TOKEN`: Verwaltung lesbar, Speichern
gesperrt (Hinweisband). Fehlt einer der vier Eingangs-Werte: Datei-Knöpfe gesperrt (Hinweisband).

**Zur Build-Zeit:** `BUILD_COMMIT` setzt `next.config.mjs` aus `WORKERS_CI_COMMIT_SHA` (Workers
Builds) bzw. `GITHUB_SHA` fest ein. Daran erkennt `/api/admin/live`, ob ein gespeicherter Commit
online ist. Nichts einzutragen — solange Workers Builds die Variable setzt.

**In GitHub** (Repo → Settings → Secrets and variables → **Actions** → New repository secret), für
die Medien-Action:

| Name | Pflicht | Zweck |
|---|---|---|
| `R2_ACCOUNT_ID` | ja | wie lokal in `.dev.vars` |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | ja | R2-Token mit Object Read & Write auf **beide** Buckets (öffentlich und Eingang) |
| `R2_BUCKET` | ja | der öffentliche Bucket (`websitebucket`) |
| `R2_PUBLIC_URL` | ja | ⚠️ **exakt** wie lokal (z. B. `https://medien.jakobsax.de`) — sonst schreibt die Pipeline alle Manifest-Einträge neu |
| `EINGANG_BUCKET` | für Hochladen | Name des Eingangs. Fehlt er, meldet `npm run eingang` „nichts zu tun" — und Hochgeladenes bliebe für immer liegen |
| `R2_S3_ENDPOINT` oder `R2_JURISDICTION` | bei Jurisdiction | wie lokal (siehe „Medien" → „Zugangsdaten") |

Fehlt eines der fünf Pflicht-Secrets, endet die Action **grün** mit einem Hinweis und tut nichts.
⚠️ Die Action nimmt für den Eingang dieselbe Jurisdiction wie für den öffentlichen Bucket
(`EINGANG_JURISDICTION` kennt nur `scripts/r2.mjs` lokal, der Workflow reicht es nicht durch).
**Beide Buckets also in derselben Jurisdiction anlegen.**

⚠️ **`keep_vars = true` in `wrangler.toml` nicht entfernen.** Ohne die Zeile ersetzt jeder Deploy
die im Dashboard gesetzten Klartext-Variablen durch das, was in `wrangler.toml` steht — also durch
nichts —, und z. B. Hochladen wäre nach dem nächsten Push still gesperrt. Secrets
(`ADMIN_PASSWORT`, `GITHUB_TOKEN` …) bleiben ohnehin erhalten.

### Einrichtung — Schritt für Schritt

Einmalig, im Dashboard; Claude kann das nicht. Cloudflare Zero Trust/Access wird nicht
gebraucht.

1. **Passwort festlegen.** Lang und zufällig, z. B. vier, fünf zufällige Wörter
   (`kanu-nebel-trapez-walze-gold`), mindestens 12 Zeichen. Es kommt in Schritt 4 als Secret
   `ADMIN_PASSWORT` in den Worker. Jakob bekommt es auf einem sicheren Weg (nicht in einen
   Commit, nicht in ein Issue).
2. **Eingangs-Bucket in R2.** R2 → Create bucket, z. B. `jakobsax-eingang`, **dieselbe
   Jurisdiction wie `websitebucket` (EU)**.
   - ⚠️ **Privat lassen:** kein Public Access, keine `r2.dev`-Adresse, keine Custom Domain.
   - R2 → Manage API Tokens: **ein Token für den Worker** mit Object Read & Write **nur auf den
     Eingang** → `EINGANG_ACCESS_KEY_ID` / `EINGANG_SECRET_ACCESS_KEY`.
   - **Ein Token für die Action** mit Object Read & Write auf **beide** Buckets (öffentlich und
     Eingang) → `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` in GitHub. Der bisherige Token aus
     `.dev.vars` darf meist nur `websitebucket`; erweitern oder einen neuen anlegen.
   - Das Secret wird nur einmal angezeigt.
3. **GitHub-Token.** GitHub → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → Generate new token.
   - Resource owner: das Konto, dem das Repo gehört. Repository access: **Only select
     repositories** → `personalwebsite`.
   - Repository permissions: **Contents: Read and write**, **Actions: Read and write**, Metadata:
     Read (kommt automatisch). Nichts sonst.
   - **Ablaufdatum setzen** (z. B. ein Jahr) und den Tag in den Kalender eintragen. Ist der Token
     abgelaufen, meldet die Verwaltung „GitHub lehnt den Zugang ab — der Token ist abgelaufen oder
     falsch". Erneuern = neuen Token erzeugen, im Worker `GITHUB_TOKEN` ersetzen, alten löschen.
   - Im selben Konto „Keep my email addresses private" einschalten (siehe „Datenschutz" oben).
4. **Worker-Variablen.** Workers & Pages → personalwebsite → Settings → Variables and Secrets →
   Add: die Werte aus der Tabelle oben, `ADMIN_PASSWORT`, `GITHUB_TOKEN` und die beiden
   `EINGANG_*`-Schlüssel als **Secret** (Typ „Secret", nicht „Text"). Alternativ von der Kommandozeile:
   `npx wrangler secret put GITHUB_TOKEN` (fragt den Wert ab; nie als Argument übergeben, sonst
   steht er im Shell-Verlauf). Klartext-Variablen wirken ab dem nächsten Deploy bzw. sofort nach
   „Deploy" im Dashboard.
5. **GitHub-Actions-Secrets.** Repo → Settings → Secrets and variables → Actions: die Secrets aus
   der zweiten Tabelle. Unter Settings → Actions → General müssen Actions erlaubt sein; die
   Workflow-Rechte braucht man nicht zu ändern (der Workflow fordert `contents: write` selbst an).
   Gibt es je eine Branch-Protection auf `main`, muss `github-actions[bot]` pushen dürfen.
   Danach einmal von Hand starten (Actions → Medien → Run workflow) und im Log von „Varianten
   rechnen" nachsehen: Erwartet ist „… unverändert (davon N aus dem Manifest)" und **nichts** neu
   gerechnet.
6. **WAF-Regel für die Anmeldung (Pflicht).** Cloudflare → Domain `jakobsax.de` → Security →
   WAF → **Rate limiting rules** (im neueren Dashboard ggf. Security → Security rules) → Create
   rule:
   - Wenn: URI Path **equals** `/api/admin/anmelden` — mehr nicht. Der kostenlose Plan bietet
     in Rate-Limiting-Regeln nur die Felder Path und Verified Bot an; die Methode muss auch
     nicht dazu, an diese Adresse schickt nur das Anmeldeformular.
   - Zählen je IP; Grenze **10 Anfragen in 10 Sekunden**, Aktion **Block** (der kostenlose Plan
     lässt nur kurze Zeiträume zu — das genügt).
   - Die Grenze liegt bewusst über der Anmeldebremse im Code (5 je Minute): Wer sich von Hand
     vertippt, bekommt deren freundliche Meldung; die WAF trifft nur Skripte, und zwar schon vor
     dem Worker.
7. **Testen.**
   - `https://jakobsax.de/admin` in einem privaten Fenster: Es erscheint das **Passwortfeld**,
     nie die Verwaltung. Ein falsches Passwort → „Das Passwort stimmt nicht." Sechs falsche
     Versuche innerhalb einer Minute → beim sechsten „Zu viele Versuche. Warte eine Minute und
     versuch es dann noch einmal." (eine Minute warten, dann geht es wieder).
   - `https://jakobsax.de/api/admin/stand` ohne Anmeldung: **404**.
   - Mit dem richtigen Passwort anmelden: Die Verwaltung lädt ohne Hinweisbänder. „Abmelden"
     oben rechts führt zurück zum Passwortfeld.
   - Eine kleine Textänderung speichern und warten, bis „Gespeichert und live" erscheint; im
     GitHub-Verlauf prüfen, dass der Commit mit `Verwaltung:` beginnt und **keine private
     Adresse** zeigt (`git log --format='%an <%ae>' -1`).
   - Ein Testbild hochladen, die Verarbeitung abwarten, das Bild danach wieder löschen.

**Empfohlen:** Workers & Pages → personalwebsite → Settings → Domains & Routes die
`workers.dev`-Adresse (und die Preview-URLs) abschalten. Die Verwaltung ist dort genauso per
Passwort geschützt, aber eine zweite offene Adresse der Seite braucht niemand.

### Lokale Entwicklung

```
# .env.development.local  (von Git ausgenommen, gilt nur für `next dev`)
ADMIN_DEV=1
```

`npm run dev`, dann `http://localhost:3000/admin`. `ADMIN_DEV=1` schaltet die Anmeldung ab —
**nur**, wenn zugleich `NODE_ENV` `development` ist, also ausschließlich unter `next dev`. Im
Produktionsbuild setzt Next `NODE_ENV` fest auf `production`; dort öffnet `ADMIN_DEV` nichts,
auch nicht versehentlich im Dashboard gesetzt.

Ohne weitere Werte zeigt die Verwaltung den lokalen Stand von `lib/inhalt.json`, Speichern und
Hochladen sind gesperrt — zum Ansehen und Bauen der Oberfläche reicht das.

⚠️ **Schreiben unter `next dev` nur mit ausdrücklicher Freigabe** (seit 2026-10-20). Ein
`GITHUB_TOKEN` oder die vier Eingangs-Werte allein reichen lokal nicht mehr: Ohne
`ADMIN_DEV_SCHREIBEN=1` verhält sich die Verwaltung, als fehlten sie (Bänder „Speichern ist
noch nicht eingerichtet" und „Hochladen ist noch nicht eingerichtet", kein Verlauf, kein
Anstoßen der Action). Grund: Solche Werte stehen schnell einmal in der Shell oder in
`.dev.vars` — in Agenten-Containern sogar von selbst —, und dann committete ein Klick auf
„Speichern" beim Ausprobieren auf das echte `main`, und ein hochgeladenes Testbild verarbeitete
die nächste Medien-Action — **beides geht live.** Mit Freigabe zeigt die Verwaltung oben das
Band „Entwicklungsmodus — Speichern schreibt auf {Repo}@{Branch}. Ist das main, geht es sofort
live." Hochgeladenes landet dann im echten Eingang. Zum gefahrlosen Ausprobieren also zusätzlich
`GITHUB_BRANCH` auf einen eigenen, vorhandenen Branch setzen und nichts hochladen:

```
# .env.development.local — nur, wenn lokal wirklich gespeichert werden soll
ADMIN_DEV_SCHREIBEN=1
GITHUB_BRANCH=mein-testzweig
```

Im Produktionsbuild ändert die Freigabe nichts (dort ist `NODE_ENV` immer `production`).

**Woher `next dev` die Werte nimmt:** `getCloudflareContext` holt sich unter `next dev` die
Worker-Umgebung über Wrangler — also die Werte aus **`.dev.vars`** (die gewinnen) und die
Bindungen aus `wrangler.toml`, darunter die Anmeldebremse (Miniflare zählt dann lokal mit).
Alles Übrige kommt aus `.env*.local` bzw. der Shell (`lib/admin/umgebung.ts`). ⚠️ Steht
`ADMIN_PASSWORT` in `.dev.vars`, zeigt `/admin` ohne `ADMIN_DEV=1` die echte Anmeldung — und
ein `GITHUB_TOKEN` dort zählt genauso wie einer in der Shell.

### Fehlerbilder

| Was man sieht | Ursache | Abhilfe |
|---|---|---|
| `/admin` zeigt 404 statt Passwortfeld | `ADMIN_PASSWORT` fehlt, ist kürzer als 12 Zeichen oder steht unter „Build variables" statt unter „Variables and Secrets" | Schritt 1 und 4. Den Grund zeigen die Worker-Logs (Observability) |
| Richtiges Passwort, trotzdem wieder das Passwortfeld | Browser blockiert Cookies für die Seite, oder `/admin` über `http://` statt `https://` geöffnet (das Cookie ist `Secure`) | Über `https://jakobsax.de/admin` arbeiten, Cookies erlauben |
| „Zu viele Versuche. Warte eine Minute …" | Anmeldebremse: mehr als 5 Versuche in einer Minute von dieser IP (oder demselben IPv6-`/64`) | Eine Minute warten. Kommt es ohne eigene Fehlversuche, probiert jemand anderes — Worker-Logs ansehen („Anmeldung gebremst") |
| Cloudflare-Seite „Error 1015 — You are being rate limited" (HTTP 429) beim Anmelden | WAF-Regel aus Schritt 6 hat gegriffen | Kurz warten; trifft es Jakob beim normalen Arbeiten, die Grenze der Regel höher setzen |
| Lokal: `GITHUB_TOKEN` bzw. Eingangs-Schlüssel gesetzt, trotzdem „Speichern …" / „Hochladen ist noch nicht eingerichtet" | Unter `next dev` fehlt die Freigabe `ADMIN_DEV_SCHREIBEN=1` — Absicht | Siehe „Lokale Entwicklung"; vorher `GITHUB_BRANCH` auf einen Testzweig setzen |
| Nach einem Push plötzlich ein Band „… nicht eingerichtet" | `keep_vars` entfernt, die Klartext-Variablen sind weg (Secrets bleiben) | Zeile in `wrangler.toml` zurück, Variablen neu setzen |
| Band „Speichern ist noch nicht eingerichtet" | `GITHUB_TOKEN` fehlt | Schritt 3 und 4 |
| Band „Hochladen ist noch nicht eingerichtet" | Einer von `R2_ACCOUNT_ID`, `EINGANG_BUCKET`, `EINGANG_ACCESS_KEY_ID`, `EINGANG_SECRET_ACCESS_KEY` fehlt | Schritt 2 und 4 |
| „… der Token ist abgelaufen oder falsch" | Token abgelaufen oder widerrufen (GitHub 401) | Token erneuern (Schritt 3) |
| „… fehlende Rechte des Tokens oder zu viele Anfragen" / „nicht gefunden — Repo, Branch oder Rechte" | Token hat nicht Contents bzw. Actions „Read and write", gilt für ein anderes Repo, oder `GITHUB_REPO`/`GITHUB_BRANCH` falsch | Rechte des Tokens prüfen |
| Dialog „Inzwischen hat jemand anderes gespeichert" | `lib/inhalt.json` auf `main` hat wirklich eine andere SHA als beim Laden (Jan, zweiter Tab, Medien-Action beim Entfernen abgelaufener Papierkorb-Einträge). Ein verlorenes Antwortpaket oder ein Wettlauf mit einem Push lösen ihn seit 2026-10-20 nicht mehr aus | Der Dialog nennt, was Neu laden verwirft. Neu laden, Änderung wiederholen — „Abbrechen" lässt die Änderungen zum Ansehen stehen, speichern lassen sie sich so nicht |
| „GitHub hat das Speichern abgelehnt: „…"" | GitHub lehnt den Commit zweimal ab, obwohl die SHA stimmt — meist eine Regel des Repos (Branch-Schutz, Ruleset) | GitHubs Meldung in den Anführungszeichen „…" lesen; Regel unter Settings → Rules bzw. Branches prüfen |
| „Wiederhergestellt, aber der neue Stand ließ sich nicht laden. Bitte neu laden." | Der Commit ist da, aber `/api/admin/stand` lieferte viermal nicht den Stand mit der neuen SHA (GitHub hinkt hinterher oder ist kurz nicht erreichbar) | „Neu laden" in der Leiste; bis dahin ist Speichern gesperrt. Scheitert auch das, erscheint oben ein Band mit dem Grund und „Noch einmal laden" |
| „lib/inhalt.json auf GitHub ist kein gültiges JSON — bitte Jan Bescheid geben." | Die Datei auf `main` ist kaputt, z. B. Konfliktmarker nach einem Merge von Hand. Die Verwaltung ist dann ganz blockiert | Datei im Repo reparieren (letzten guten Stand aus dem Git-Verlauf). Die genaue Stelle steht im Worker-Log („… kein gültiges JSON (SyntaxError: …)") |
| Verlauf: „Dieser Stand passt nicht mehr zu den heutigen Regeln …" | Der alte Stand bricht eine Regel, die es damals noch nicht gab (z. B. ein Feld, das inzwischen Pflicht ist) | Die Befunde stehen in der Rückfrage. Den Stand bei Bedarf von Hand angleichen (`git show <commit>:lib/inhalt.json`) |
| Im Worker-Log „… (SyntaxError: …)" oder eine andere Fehlerart vor dem Text | Seit 2026-10-20 steht im Log die Art und Meldung jedes Fehlers (`logText`); Jakob sieht weiter nur „Unerwarteter Fehler auf dem Server." | Die Meldung im Log führt zur Ursache |
| Speichern gesperrt, rote Befunde | `pruefeInhalt` findet einen Fehler (z. B. doppelte Kennung, Link ohne `https://` oder mit Leerzeichen, Anführungszeichen, `<`/`>`) | Befund lesen und beheben; der Build würde sonst abbrechen |
| „Gespeichert, aber noch nicht live" | Cloudflare-Build gescheitert (Workers & Pages → Deployments), `BUILD_COMMIT` leer, oder die Medien-Action hat direkt danach committet und Cloudflare hat den späteren Commit gebaut | Build-Log ansehen; im letzten Fall ist alles online, nur die Meldung hinkt (bekannte Lücke) |
| Bild bleibt auf „wartet" | Medien-Action nicht eingerichtet (läuft grün, tut nichts), `EINGANG_BUCKET` fehlt in GitHub, oder der Eingang ist gescheitert (Lauf rot) | Actions → Medien → letzten Lauf ansehen |
| Im Log von „Eingang übernehmen": „Säubern unvollständig … — bleibt im Eingang." | Das JPEG endet nicht sauber, oder nach dem Abschneiden steckt noch ein zweites Bild darin (z. B. eine eingebettete Vorschau in einem behaltenen Block) | Das Bild am Rechner einmal neu als JPEG exportieren und erneut hochladen; die alte Datei im Eingang wird dabei ersetzt |
| „Verarbeitung starten" scheitert | Workflow-Datei heißt nicht `medien.yml`, Actions im Repo abgeschaltet, Token ohne Actions-Recht | Schritt 3 und 5 |
| Hochladen: 413 / 415 | Datei über der Grenze aus `MAX_UPLOAD_BYTES`, oder kein JPEG/PNG/WebP/TIFF (z. B. HEIC vom iPhone) | Kleiner bzw. als JPEG exportieren |
| Hochladen: 403 | Anfrage nicht von derselben Seite (z. B. Verwaltung über eine andere Adresse geöffnet) | Über `jakobsax.de/admin` arbeiten |
| Mitten in der Arbeit scheitert jede Aktion, „Lade die Seite neu" | Sitzung abgelaufen (nach 30 Tagen) oder das Passwort wurde inzwischen geändert | Neu laden und anmelden |
| Neues Bild verarbeitet, erscheint aber nicht | Sein Schlüssel steht noch in `ausgeblendet` oder `papierkorb` (z. B. gelöscht und dann unter demselben Platz neu hochgeladen) | In der Verwaltung einblenden bzw. aus dem Papierkorb wiederherstellen |

### Bekannte Grenzen

- Die Live-Meldung vergleicht den Commit exakt. Committet die Medien-Action kurz nach einer
  Speicherung, meldet die Verwaltung nach 15 Minuten nur „noch nicht live", obwohl alles online
  ist.
- Ob Cloudflare Workers Builds auf Pushes der Action (Token `GITHUB_TOKEN` der Action) baut, zeigt
  erst der erste echte Lauf. GitHub-Apps bekommen solche Push-Ereignisse normalerweise.
- GitHub schaltet geplante Läufe in öffentlichen Repos nach 60 Tagen ohne Aktivität ab; Commits
  aus der Verwaltung halten sie am Leben. Sonst unter Actions wieder einschalten.
- Neue **Kategorien** gibt es nur von Hand in `lib/inhalt.json` (`foto.kategorien`); die
  Verwaltung wählt nur aus.
- Der Server prüft nicht, ob der Rumpf von `speichern` unbekannte Zusatzfelder enthält —
  `pruefeInhalt` entscheidet, was durchgeht.

## Medien (Fotos und Videos) — sie liegen im R2-Bucket, nicht im Repo

**Seit dem 2026-08-29 liegt kein einziges Foto und kein Video mehr im Git.** Beides liegt im
Cloudflare-R2-Bucket, und der Build fasst es nicht an — er liest nur zwei eingecheckte
Manifestdateien. Warum, in einem Satz: Zwölf unbearbeitete Kameradateien hatten 134 MB in den
Git-Verlauf gebracht (dort bleiben sie für immer) und den Cloudflare-Build auf rund sechs
Minuten getrieben, weil er sie bei **jedem** Deploy neu berechnete.

### Der automatische Weg (seit 2026-10-17): über die Verwaltung

```
Verwaltung /admin  →  privater Eingangs-Bucket  →  Medien-Action  →  Commit „Medien: …"  →  Deploy
  (Jakob lädt hoch)     (nur der Worker schreibt)   (GitHub, sharp)    (Manifest, ggf. inhalt.json)
```

**Für Jakob ist das der Normalfall.** Er lädt in der Verwaltung hoch; die GitHub Action
`.github/workflows/medien.yml` entfernt die Metadaten (GPS!), legt das Original nach `original/`
im öffentlichen Bucket, rechnet mit `npm run medien` die Varianten und committet das Manifest.
Niemand muss etwas lokal laufen lassen. Ablauf, Secrets und Einrichtung: Abschnitt
„Verwaltung (/admin)" oben.

Der Weg von Hand unten bleibt gültig — für Jan, für Videos (die Verwaltung lädt nur Bilder) und
für den Fall, dass die Action nicht eingerichtet ist. Beide Wege schreiben dieselben Dateien.
⚠️ **Wer lokal `npm run medien` laufen lässt und committet, vorher `git pull`** — die Action
committet dasselbe Manifest.

### Der Weg von Hand

```
Datei in den Bucket legen  →  npm run medien  →  Manifeste committen  →  Deploy
   (auch per Dashboard)       (lokal, einmalig)    (zwei kleine .json)
```

1. **Ablegen** — im Cloudflare-Dashboard unter R2 → `<Bucket>` → `original/…`, oder per
   `rclone`/S3-Werkzeug, am besten mit `npm run verkleinern -- … --original --hochladen` (entfernt
   die Standortdaten). ⚠️ Eine Datei, die direkt per Dashboard nach `original/` kommt, liegt mit
   allen Metadaten öffentlich — für Jakob ist deshalb die Verwaltung der Weg, nicht das Dashboard.
2. **`npm run medien`** — läuft **lokal auf einem eurer Rechner**, nie im Deploy. Holt neue und
   geänderte Originale, erzeugt alle Größen und Formate, legt sie unter `b/…` zurück in den
   Bucket, schreibt die Manifeste und danach die Vorschaukarten.
3. **Committen** — `lib/bilder-manifest.json`, `lib/video-manifest.json` und die geänderten
   Karten in `public/og/`. ⚠️ **Ohne diesen Commit sieht die Seite die neuen Bilder nicht.**

`npm run medien -- --probe` zeigt vorher, was passieren würde: holt nichts, rechnet nichts,
schreibt nichts.

### Wohin welche Datei

> ✅ **Stand 2026-10-17:** Inhalte, Reihenfolgen und Beschriftungen stehen in `lib/inhalt.json`
> (siehe „Verwaltung (/admin)"); wo unten noch `lib/content.ts` als Ort für Inhalte steht, ist
> `lib/inhalt.json` gemeint. Die **Reihenfolge im Mosaik** bestimmt seitdem `foto.reihenfolge`
> (frei, in der Verwaltung gezogen), nicht mehr der Dateiname — Bilder ohne Platz dort kommen ans
> Ende, in der natürlichen Ordnung (Kategorie → Arbeit → Dateiname).
>
> ✅ **Stand 2026-10-14:** `original/arbeiten/<id>.jpg` ist das **Startbild** — in der natürlichen
> Ordnung das erste Bild der Arbeit. Welche Bilder im Hero von `/foto` laufen, steht in
> `foto.hero` (`lib/inhalt.json`). Dazu `original/arbeiten/<id>/01.jpg`,
> `02.jpg`, … in der Reihenfolge von Jakobs Liste und **`original/ueber/01.jpg`, …** für die
> Bilder auf `/ueber` (Beschriftung in `ueber.bilder`, Reihenfolge in `ueber.reihenfolge`,
> `lib/inhalt.json`). Hochgeladen mit
> `npm run verkleinern -- <ordner> --arbeit <id> --leitbild <erste Datei> --original --hochladen`,
> also in **voller Auflösung**, nur ohne Standort- und andere Metadaten. Ausgeliefert wird in
> sieben Breiten bis **4000 px** (`BREITEN` in `lib/bilder-regeln.mjs`). (Der Goldbarren-Platzhalter
> und `scripts/goldbarren.mjs` sind am 2026-10-14 abends entfallen.)
>
> Der folgende Hinweis vom 2026-10-08 ist damit in einem Punkt überholt: Das Leitbild entfällt
> **nicht**.
>
> ⏳ **Ändert sich mit dem Umbau (Schritt 2), siehe oben.** Es bleiben: `original/arbeiten/<id>/`
> mit `01.jpg`, `02.jpg`, … (die Fotos im Mosaik auf `/foto`), Hero-Video, Hero-Standbild,
> Porträt. Neu: **`original/film/<id>.jpg`** — das Standbild je Film, Querformat; `<id>` ist die
> `id` aus `filme` in `lib/inhalt.json`. Es entfallen: Leitbild `original/arbeiten/<id>.jpg`,
> Kontaktbogen `…/serie/`, Filme unter `original/video/`. Standbilder für Filme dürfen schon
> jetzt abgelegt werden; bis Schritt 2 meldet die Pipeline sie als „gehört zu nichts", das ist
> harmlos.

Alles unter dem Präfix `original/` im Bucket:

| Was | Schlüssel im Bucket | Dateiname |
|---|---|---|
| Leitbild (Startbild) einer Arbeit | `original/arbeiten/` | genau die `id` der Arbeit aus `lib/inhalt.json`, z. B. `tete-a-tete-2026.jpg` |
| **Bildstrecke** — die Folge, die im Hero läuft und darunter als Mosaik steht | `original/arbeiten/<id>/` | `01.jpg`, `02.jpg`, … |
| **Kontaktbogen** — alle Frames derselben Aufnahmeserie | `original/arbeiten/<id>/serie/` | `01.jpg`, `02.jpg`, … und beim Treffer `03-gewaehlt.jpg` |
| Film zu einer Arbeit (Aftermovie) | `original/video/` | `<id>.mp4` |
| Hero-Standbild | `original/hero/` | `standbild.jpg` |
| Hero-Video | `original/hero/` | `film.mp4` |
| **Porträt von Jakob** | `original/` (direkt darin) | `portrait.jpg` |

Die `id` steht in `lib/inhalt.json` bei jeder Arbeit (`"id": "..."`, in der Verwaltung
„Kennung", dort schreibgeschützt) und ist der Ordnername im Bucket. Detailseiten mit dieser
Adresse gibt es seit dem Umbau nicht mehr. ⚠️ Umbenennen hieße, den Ordner im Bucket
mitzunehmen.

Erlaubte Endungen für Bilder: `.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.webp`; für Videos
`.mp4`, `.webm`, `.mov`. Groß-/Kleinschreibung zählt.

Es gibt **kein Bildfeld bei einer Arbeit** — Konvention statt Konfiguration: Welches Bild zu
welcher Arbeit gehört, steht im Dateipfad. Ein zusätzliches `image` wäre eine zweite Stelle mit
demselben Namen und damit eine Stelle, an der er falsch stehen kann. Was `lib/inhalt.json` über
Bilder weiß, sind Schlüssel (`arbeiten/<id>/01`) in Reihenfolgen, Hero, Ausschnitten und Listen.

**Ausblenden und Löschen** (seit 2026-10-15, seit 2026-10-17 in der Verwaltung). Soll ein Bild
nicht mehr auf die Seite, aber im Bucket bleiben, steht sein Schlüssel in `ausgeblendet`
(`lib/inhalt.json`). Gelöschte Bilder stehen mit Datum in `papierkorb` und verschwinden nach 30
Tagen endgültig (siehe „Verwaltung"). Fehlt dadurch das Startbild, wird das erste übrige Bild zum
ersten der Arbeit. Grund für beides: Löschen im Bucket ist endgültig, und Umbenennen verschiebt
alle Nummern samt Alt-Texten. Die Prüfung warnt, wenn Startseite oder Hero auf ein verborgenes
Bild zeigen, und wenn ein Platz der Startseite kein Foto aus `/foto` ist: Die Startseite sucht
jedes Bild in `fotosFuerMosaik` (`app/page.tsx`), ein Bild von „Über mich" oder ein
Film-Standbild bliebe dort leer — deshalb bietet die Verwaltung auch nur diese Fotos an
(`waehlbareBilder`). Im Hero zählen für „sechs bis acht" und „mindestens eins" nur sichtbare
Bilder.

⚠️ **Führende Null nicht vergessen** (`01`, nicht `1`). Die natürliche Ordnung geht nach
Dateiname; ohne sie stünde `10` vor `2`. Die Verwaltung vergibt die Nummern selbst.

⚠️ **Der Bildausschnitt steht in `lib/inhalt.json` unter `bildausschnitte`** (seit 2026-10-17;
vorher als Code in `lib/bildausschnitte.ts`, das die Werte jetzt nur weiterreicht und die
Begründung behält), eine Zeile je Bild:

    "arbeiten/wiwawo-53/02": "50% 78%"

Der Schlüssel ist derselbe Pfad wie im Manifest (`arbeiten/<id>` fürs Leitbild,
`arbeiten/<id>/01` für die Strecke), der Wert ein `object-position`: erst waagerecht, dann
senkrecht. Ohne Eintrag steht das Bild mittig.

**Nicht schätzen — seit dem 2026-10-17 in der Verwaltung:** Bild öffnen, auf das Motiv klicken,
die Vorschau-Rahmen zeigen, was übrig bleibt, speichern. (Das ältere Werkzeug als Artifact,
<https://claude.ai/code/artifact/ca3af403-f535-4e52-97e6-633cd9414c34>, schrieb noch eine Datei
für `lib/bildausschnitte.ts` und ist damit überholt.)

Warum das je Bild gewählt werden muss: Ein Hochformat (4672 × 7008) zeigt in einem
1920 × 1080-Hero nur **37,5 % seiner Höhe** — bei jeder Einstellung. Welche 37,5 % die richtigen
sind, weiß nur, wer das Bild kennt. Eine feste Regel liegt bei jedem zweiten Motiv daneben; genau
das war am 2026-09-13 der Fall, als hier pauschal 38 % standen.

⚠️ **Eine Änderung hier braucht weder Bucket-Zugriff noch `npm run medien`** — in der Verwaltung
speichern (oder `lib/inhalt.json` bearbeiten und pushen), fertig. Eine Zwischenstufe mit Endungen am Dateinamen (`-oben`, `-unten`) ist am
2026-09-13 wieder verworfen worden: drei Stufen sind zu grob, und jede Änderung hätte Umbenennen
im Bucket **und** einen neuen Medien-Lauf verlangt.

**Das Mosaik ist davon nicht betroffen** — dort wird nichts beschnitten, jedes Bild steht in
voller Form. Der Wert wirkt **nur, wo beschnitten wird**: im Hero von `/foto`, auf der Startseite
(Hero, Wege, Highlights) und bei den Film-Standbildern.

⚠️ **`-gewaehlt` am Dateinamen** markiert im Kontaktbogen das Bild, das es geworden ist — es
bekommt den roten Rahmen. Genau eins pro Serie. Ist keins markiert, gibt es keine Markierung.
Der Kontaktbogen lebt davon, dass die Frames **Sekunden auseinanderliegen** und das im EXIF
steht: Darunter erscheint die Uhrzeit auf die Sekunde genau, und genau das ist die Aussage —
vier daneben, einer sitzt.

Liegt zu einer Arbeit keine Datei da, zeigt die Seite ihren Platzhalter („Bild folgt"). Das ist
kein Fehler. **Umgekehrt schon:** Eine Datei, deren Name zu keiner `id` passt, erscheint
nirgends. Die Pipeline sagt das ausdrücklich und **bevor** sie rechnet:

```
! arbeiten/©JakobSax_WiWaWo26_JPG6785: gehört zu nichts und erscheint nirgends auf der
  Seite. Erwartet wird eine id aus foto.arbeiten in lib/inhalt.json (tete-a-tete, …).
```

**Zwölf Fotos von einem Ereignis sind keine zwölf Leitbilder, sondern eine Bildstrecke** — die
gehört nach `original/arbeiten/<id>/`. Und wenn es die Arbeit in `lib/inhalt.json` noch gar nicht
gibt, muss sie dort zuerst angelegt werden (in der Verwaltung: Reiter „Arbeiten" → neue Arbeit).

**Das Porträt** erscheint im Kurzanriss der Startseite und oben auf `/ueber`. **Es wird nicht
zugeschnitten** — quer oder hochkant, beides geht, das Bild behält seine Form; auf `/ueber` ist
nur seine Höhe begrenzt (Wert im UI-SPEC). ⚠️ Die Bildbeschreibung dazu steht in
`lib/inhalt.json` unter `ueber.portraitAlt` (Verwaltung → „Über mich") und beschreibt die
**aktuelle** Aufnahme. Wer das Foto austauscht, muss sie mit austauschen.

### Zugangsdaten — sie gehören nicht ins Repo

`npm run medien` braucht fünf Werte. Sie gehören in **`.dev.vars`** im Projektordner (die Datei
ist bereits von Git ausgenommen) — **niemals in eine eingecheckte Datei.** Das Skript liest sie
von dort selbst ein; was schon in der Shell steht, gewinnt. Format wie bei `wrangler`:

```
R2_ACCOUNT_ID=…
R2_ACCESS_KEY_ID=…
R2_SECRET_ACCESS_KEY=…
R2_BUCKET=jakobsax-medien
R2_PUBLIC_URL=https://medien.jakobsax.de
```

| Variable | Woher |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare-Dashboard → R2 → rechts „Account ID" |
| `R2_ACCESS_KEY_ID` | R2 → „Manage API Tokens" → Token mit **Object Read & Write** für genau diesen Bucket |
| `R2_SECRET_ACCESS_KEY` | dito, wird **nur einmal** angezeigt |
| `R2_BUCKET` | Name des Buckets |
| `R2_PUBLIC_URL` | die öffentliche Adresse, z. B. `https://medien.jakobsax.de` |
| `R2_S3_ENDPOINT` | **nur bei einem Bucket mit Jurisdiction** — siehe unten |

⚠️ **Buckets mit Jurisdiction haben einen anderen S3-Endpunkt.** Wer beim Anlegen „European
Union (EU)" wählt (hinterher nicht mehr änderbar), bekommt
`<konto>.eu.r2.cloudflarestorage.com` statt `<konto>.r2.cloudflarestorage.com`. Ohne das `.eu.`
greift jede Anfrage ins Leere. Der sichere Weg ist, die Zeile **„S3 API"** aus R2 → Bucket →
Settings zu kopieren und als `R2_S3_ENDPOINT` einzutragen — der Bucketname darf dranhängen, er
wird abgeschnitten:

```
R2_S3_ENDPOINT=https://<konto>.eu.r2.cloudflarestorage.com/<bucket>
```

Alternativ reicht `R2_JURISDICTION=eu`. Ohne beides bleibt es beim Standard, und der stimmt für
Buckets ohne Jurisdiction.

⚠️ **`R2_PUBLIC_URL` sollte eine eigene Custom Domain sein** (R2 → Settings → Public access →
Custom Domain), nicht die `…r2.dev`-Adresse: Die ist von Cloudflare ausdrücklich nicht für den
Dauerbetrieb gedacht und hat eine Ratenbegrenzung.

⚠️ Die Adresse landet **fest in den Manifesten**. Ein Domainwechsel heißt: `npm run medien`
einmal neu laufen lassen. Das merkt die Pipeline von selbst und schreibt alle Einträge neu.

⚠️ **`scripts/r2.mjs` läuft nur lokal und in der Medien-Action** — nie im Worker und in keinem
Build-Schritt. Der Worker hat für den Eingangs-Bucket eine eigene, schmale Fassung
(`lib/admin/eingang.ts`, nur Ablegen und Auflisten). Wenn es jemals nötig scheint, `r2.mjs` im
Worker zu importieren, ist etwas anderes falsch.

⚠️ **Fehlermeldungen von `r2.mjs` nennen nur Code und Meldung der S3-Antwort** (`s3Grund`), nie
den ganzen Rumpf und nicht den Wert von `R2_S3_ENDPOINT`: Die Logs der Action sind öffentlich.

**Zwischenspeicher-Kopfzeilen:** Die Varianten unter `b/` haben Fingerabdruck-Abfragen
(`?v=…`) und laufen mit `immutable`. Originale unter `original/` bekommen seit dem 2026-10-17 nur
`public, max-age=3600` (`KURZ_ZWISCHENSPEICHERN`), weil sie beim Ersetzen unter gleichem Namen
überschrieben werden.

### Was die Pipeline erzeugt

| | |
|---|---|
| Eingang und Papierkorb | `scripts/eingang.mjs` (`npm run eingang`, hochgeladene Bilder aus dem privaten Eingang säubern und nach `original/` legen) und `scripts/papierkorb.mjs` (`npm run papierkorb`, abgelaufene Löschungen vollziehen). Beide mit `-- --probe`, beide laufen in der Medien-Action vor `medien`. Gemeinsame Säuberung: `scripts/saeubern.mjs`; Regeln (Ziele, 30 Tage, Entfernen eines Schlüssels): `lib/inhalt-regeln.mjs` |
| Inhalte lesen und schreiben | `scripts/inhalt.mjs` — `lib/inhalt.json`, im selben Format wie die Verwaltung. Die Skripte lesen **nicht** `lib/content.ts` (für Node nicht importierbar) |
| Skripte | `scripts/medien.mjs` (Bilder und Videos); es startet am Ende selbst `scripts/og.mjs` (Vorschaukarten). ⚠️ **Nicht** als `medien.mjs && og.mjs` in `package.json` verketten — npm hängt die Argumente hinter die ganze Kette, `npm run medien -- --probe` liefe damit als echter Lauf |
| Zugriff auf R2 | `scripts/r2.mjs`, signiert mit `aws4fetch` (88 kB, keine Abhängigkeiten) statt mit dem AWS-SDK |
| Regeln | `lib/bilder-regeln.mjs` (Breiten, Qualitäten, Budget). ⚠️ Nach Änderungen dort `PIPELINE_VERSION` erhöhen, sonst hält der Zwischenspeicher alte Dateien für aktuell |
| Ergebnis | `b/…` im Bucket, `lib/bilder-manifest.json`, `lib/video-manifest.json`, `public/og/*.jpg` |
| Im Git | **die Manifeste und die Vorschaukarten** — sonst nichts. `.medien-cache/` ist ignoriert und darf fehlen: Unveränderte Bilder gewinnt die Pipeline dann aus dem eingecheckten Manifest zurück (`ausManifest`), statt sie neu zu rechnen — so arbeitet die Action |
| Zugriff im Code | `bild(schluessel)` / `leitbildZurArbeit(id)` aus `lib/bilder.ts`, `video(schluessel)` / `heroVideo()` aus `lib/video.ts`; welche Bilder wo und in welcher Reihenfolge erscheinen, leitet `lib/arbeiten.ts` aus `lib/inhalt.json` und dem Manifest ab (`fotosFuerMosaik`, `fotosFuerHero`, `bilderFuerUeber`, `filmeMitStandbild`) |

Erzeugt werden **AVIF und WebP in bis zu fünf Breiten (480–2400)**, dazu ein JPEG als Rückfall
und ein 16 px breites Vorschaubildchen, das als Datei-URI im Manifest und damit im HTML landet.
**Nie hochskaliert.**

⚠️ **AVIF war bis zum 2026-09-12 bei 1600 gekappt** — eine reine Bauzeit-Entscheidung aus der
Zeit, als der Cloudflare-Build jedes Bild bei jedem Deploy neu rechnete. Mit dem R2-Umbau ist
sie hinfällig geworden, blieb aber stehen, und das kostete sichtbar Qualität: Das Detailbild
läuft mit `sizes="100vw"`, ein Retina-Bildschirm fordert über 2000px an, fand im AVIF-Satz aber
nur 1600 und rechnete hoch. Messwerte und die ganze Begründung stehen in `lib/bilder-regeln.mjs`.

**Ein Format darf dem anderen nie hinterherhinken** — sonst greift der Browser stillschweigend
zur schlechteren Auflösung, ohne dass es irgendwo als Fehler auftaucht.

Die Ableitungen liegen unter `b/` im **selben Baum** wie die Originale unter `original/`, mit der
Breite im Dateinamen: `b/arbeiten/tete-a-tete-2026-1200.avif`. Gehashte Namen wären
platzsparender, aber im Dashboard könnte dann niemand mehr nachsehen, was wozu gehört.
Ausgeliefert werden sie mit `cache-control: public, max-age=31536000, immutable`.

**Verwaiste Ableitungen räumt die Pipeline weg** — was unter `b/` liegt und zu keinem Original
mehr gehört, wird gelöscht. Umgekehrt merkt sie auch, wenn unter `b/` etwas fehlt, das laut
Zwischenspeicher da sein müsste, und erzeugt es neu.

**Größenbudget:** Warnung ab 200 kB für die 1200er-AVIF-Variante, **Abbruch** ab 1,5 MB für jede
Variante. Der Abbruch ist kein Feinschliff, sondern fängt den Fall ab, dass jemand einen
Screenshot oder ein unkomprimiertes PNG einkippt.

### Vorgaben für die Originale — bitte vorher verkleinern

**Lange Kante rund 2400–3000 px, JPEG in sRGB, guter Qualität, unter 3 MB.** Kleiner als 1200 px
sollte es nicht sein, sonst ist das Bild auf großen Bildschirmen weich. Seitenverhältnis egal,
die Kacheln schneiden auf 4:3 (mobil 4:5) zu; wichtige Bildteile also nicht ganz an den Rand
legen.

**Keine unbearbeiteten Kameradateien.** Ausgeliefert wird ohnehin höchstens 2400 px — alles
darüber wird weggeworfen, kostet aber Bandbreite beim Hochladen, Rechenzeit beim Verarbeiten und
Speicher im Bucket. Die Pipeline **warnt** ab 4000 px Kantenlänge oder 6 MB; sie bricht nicht ab.
Wer die Warnung sieht, sollte das Original ersetzen, nicht ignorieren.

**Einmal auf 2400–3000 px exportieren, das ist der ganze Aufwand.** Nicht nötig — und bitte auch
nicht machen: mehrere Größen selbst anlegen, in WebP oder AVIF umwandeln, Wasserzeichen einbauen.

#### `npm run verkleinern` nimmt einem genau das ab

Wer einen Ordner voller Kameradateien hat, muss weder verkleinern noch umbenennen:

```
npm run verkleinern -- <ordner> --arbeit wiwawo-53 --leitbild JPG7043.JPG
npm run verkleinern -- <ordner> --serie tete-a-tete-2026
npm run verkleinern -- <datei>  --einzel portrait
```

Das Skript legt einen fertigen `original/`-Baum unter `.medien-vorbereitet/` an: auf 3000 px
verkleinert, als JPEG, **richtig benannt** (`<id>.jpg` fürs Leitbild, `<id>/01.jpg`, `02.jpg`, …
für die Strecke). Der Ordner lässt sich als Ganzes ins R2-Dashboard ziehen; mit `--hochladen`
schiebt das Skript ihn selbst in den Bucket.

Ohne `--leitbild` wird die **erste Datei** zum Leitbild — eine Notlösung, keine Auswahl. Welches
Bild die Kachel trägt, ist eine fotografische Entscheidung.

⚠️ **Das Skript entfernt die Standortdaten, behält aber die Aufnahmedaten.** Das ist an dieser
Stelle wichtiger als bei den Ableitungen: Die Originale liegen unter `original/` in einem
**öffentlichen** Bucket (die Videos werden von dort ausgeliefert) und sind über ihre Adresse
abrufbar. `sharp` kennt nur ganz oder gar nicht — ohne Angabe verschwindet jedes Metadatum,
mit `withMetadata()` bleibt auch GPS. Deshalb liest das Skript die fünf Felder aus `EXIF_FELDER`
aus und schreibt genau die zurück. Kameramarke, Modell und Urheberzeile fallen dabei mit weg.

⚠️ Die `id` wird **vor** dem Rechnen gegen `lib/inhalt.json` geprüft (bis 2026-10-17 gegen
`lib/content.ts`). Gibt es die Arbeit dort nicht, bricht das Skript ab und nennt die bekannten
ids — statt zwölf Dateien zu verarbeiten, die nirgends erscheinen. Genau das ist beim ersten Upload passiert.

**Beim Export: Kameradaten drin lassen.** Unter dem Bild erscheint automatisch eine Zeile
`22:14 uhr · 1/500 · f/2.8 · iso 6400`. Sie kommt aus dem EXIF — nichts einzutragen, nichts zu
pflegen —, aber nur, wenn die Angaben beim Export erhalten bleiben. In Lightroom heißt die
richtige Einstellung im Feld „Metadaten" **nicht** „Alle außer Kamera- und Camera-Raw-Infos"
(das entfernt genau die Werte, die wir zeigen wollen), sondern die, die **Kamera-Informationen
behält**. Ist kein EXIF da, erscheint einfach keine Zeile; das ist kein Fehler.

**Um die Standortdaten muss sich niemand kümmern.** Die Pipeline liest ausschließlich die fünf
Felder aus `EXIF_FELDER` in `lib/bilder-regeln.mjs` — GPS wird gar nicht erst eingelesen und
landet in keiner ausgelieferten Datei und in keinem Manifest. Diese Liste ist eine
**Sicherheitsgrenze, keine Bequemlichkeit**: Bei Aufnahmeorten und bei einem Journalisten ist das
kein Randthema. `sharp` schreibt darüber hinaus gar keine Metadaten mit, die EXIF-Ausrichtung
wird vorher angewendet (`.rotate()`), sonst lägen Hochformate aus dem Telefon quer.

⚠️ **Alt-Texte stehen nicht im Dateinamen**, sondern bei der Arbeit in `lib/inhalt.json` (Feld
`alt`, je Bildname; in der Verwaltung im Seitenpanel des Bildes). Sie beschreiben die Szene, nicht das Bild: „Höhenartistik über dem Ehrenhof des Rastatter
Schlosses", nicht „Foto von einem Artisten". Fehlt der Text, setzt die Seite eine Notlösung aus
Titel, Auftraggeber und Jahr ein — die ist korrekt, aber nichts wert.

⚠️ **Bevor ein Bild in den Bucket kommt:** Nutzungs- und Persönlichkeitsrechte müssen geklärt
sein. Bei Auftritten im öffentlichen Raum betrifft das Künstlerinnen, Künstler **und** Publikum.
Siehe `TODO.md` — das sind Launch-Blocker.

### Videos — sie werden nicht umgerechnet

> ⏳ **Mit dem Umbau bleibt nur das Hero-Video.** Filme zu Arbeiten werden verlinkt, nicht mehr
> ausgeliefert; die rechte Spalte der Tabelle und der Absatz zu Untertiteln entfallen. Für das
> Hero-Video zusätzlich: **Anfang und Ende müssen ineinander übergehen**, es läuft in Schleife
> unter dem Schriftzug — ein sichtbarer Sprung alle zwölf Sekunden fällt mehr auf als jeder
> Schnitt.

Anders als Bilder rührt die Pipeline Videos nicht an. Sie verzeichnet nur, was da ist, und die
Datei wird direkt aus dem Bucket ausgeliefert. Umrechnen bräuchte ffmpeg im Werkzeugkasten und
gehört ohnehin in die Hand dessen, der den Schnitt gemacht hat. **Also bitte fertig exportieren:**

| | Hero-Video (`original/hero/film.mp4`) | Film zu einer Arbeit (`original/video/<id>.mp4`) |
|---|---|---|
| Tonspur | **gar keine**, nicht nur stumm | mit Ton, er wird nur auf Wunsch abgespielt |
| Länge | 8–15 s, läuft in Schleife | so lang wie nötig |
| Format | H.264 in MP4, `+faststart` | H.264 in MP4, `+faststart` |
| Seitenverhältnis | egal, der Hero schneidet zu | **16:9** — der Rahmen richtet sich danach |
| Auflösung | 1920×1080 | 1920×1080 |
| Größe | **unter 8 MB** (die Pipeline warnt darüber) | keine harte Grenze, aber Vernunft |

```
# Hero: ohne Ton, kurz, klein
ffmpeg -i original.mov -an -t 12 -vf "scale=1920:-2" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 26 -preset slow -movflags +faststart film.mp4

# Standbild daraus (kommt in den Bucket nach original/hero/standbild.jpg)
ffmpeg -i film.mp4 -ss 2 -vframes 1 -q:v 2 standbild.jpg
```

`-an` entfernt die Tonspur komplett, `-movflags +faststart` lässt das Video starten, bevor es
fertig geladen ist.

**Das Hero-Poster ist nicht optional** — iPhones spielen im Energiesparmodus gar kein Video ab,
auch kein stummes. Ohne `original/hero/standbild.jpg` sehen diese Besucher eine schwarze Fläche.
Dasselbe Standbild dient, solange kein Video da ist, auch selbst als Hero.

Filme zu Arbeiten laufen **nicht** von selbst und laden nur ihre Metadaten vor. Sie haben
**keine Untertitel** — sobald eine `.vtt` vorliegt, gehört sie als `<track>` in
`app/components/Film.tsx`; eine leere Spur wäre schlechter als keine, weil sie Barrierefreiheit
vortäuscht. Siehe `TODO.md`.

`startseite.heroVideo` in `lib/inhalt.json` (im Code `HERO_VIDEO`) ist der **Ausnahmeweg** für ein extern gehostetes Video (etwa
bei einem Streamingdienst) und hat Vorrang vor dem Bucket. Normalfall ist `null`.

### Vorschaukarten (OpenGraph)

> ⏳ **Mit dem Umbau nur noch eine Karte** (`start.jpg`) für alle Seiten — ohne Detailseiten gibt
> es keine Karte je Arbeit. Die Schriften wechseln auf Druk Wide und Avenir Next, **sofern die
> Lizenz Schrift in erzeugten Bildern erlaubt** (siehe „Schriften").

`scripts/og.mjs` erzeugt je Arbeit und einmal für die Seite selbst eine Karte unter
`public/og/<id>.jpg` (1200×630). Referenziert wird sie in `app/layout.tsx` und in
`generateMetadata` der Detailseite.

**Das ist die Karte, die WhatsApp und Slack zeigen.** Sie funktioniert schon ohne Fotos — dann
trägt sie Wortmarke, ●REC-Chip, Auftraggeber, Titel und Metazeile auf `--buehne`. Sobald Fotos da
sind, liegt das Foto dahinter, mit demselben Verlauf wie über den Kacheln.

| | |
|---|---|
| Quelle des Fotos | zuerst der lokale Zwischenspeicher `.medien-cache/`; fehlt die Datei dort (in der Action immer), lädt das Skript die Rückfall-Fassung aus dem Manifest herunter. Ist das Foto gar nicht zu holen und gibt es schon eine Karte, bleibt die alte stehen, statt eine Karte ohne Foto zu committen |
| Schriften | `assets/fonts/*.ttf` — nur lokal gelesen, **nicht** ausgeliefert. Warum doppelt: siehe `assets/fonts/README.md` |
| Format | **JPEG, nicht PNG.** `ImageResponse` liefert PNG; mit Foto waren das ~970 kB je Karte. Über sharp als JPEG sind es ~35 kB. Budget: Warnung ab 250 kB |
| Im Git | **ja** — rund zehn Dateien à 35 kB. So ist die Seite ohne den Bucket vollständig |
| Texte | aus `lib/inhalt.json` (`seite.name`, Foto aus `startseite.heroErsatz`). ⚠️ Bis 2026-10-17 las das Skript `lib/content.ts` direkt (Node ≥ 22.18, Typen-Stripping); das geht seit dem Umzug der Inhalte nicht mehr, siehe „Verwaltung" |

⚠️ **Warum das nicht als `app/**/opengraph-image.tsx` gebaut ist**, obwohl Next genau das
anbietet: Genau so stand es zuerst da, `next build` hat die Karten sauber vorgerendert — **und im
echten Worker gaben sie 500 zurück** (`[unenv] fs.readFile is not implemented`). Der Adapter
bediente die Route nicht aus dem Vorrender-Cache, sondern führte sie zur Laufzeit aus, und dort
gibt es kein Dateisystem. Aufgefallen erst beim Prüfen gegen `wrangler dev`. Als statische Datei
ist das Problem strukturell weg.

### Was noch nach `public/` gehört — und was nicht

⚠️ **Alles unter `public/` wird unverändert und öffentlich ausgeliefert** — der Pfad in der URL
entspricht dem Pfad im Ordner, nur ohne `public`. Deshalb steht diese Anleitung hier und **nicht**
als `public/README.md`: Die lag dort kurzzeitig und wäre unter `jakobsax.de/README.md` für jeden
lesbar gewesen, inklusive der Hinweise auf ungeklärte Bildrechte. Beim Code-Review aufgefallen.

**Nicht nach `public/` gehören:** Rohdateien, interne Notizen und Bilder mit ungeklärten Rechten.
Fotos gehören generell nicht mehr dorthin, sondern in den Bucket.

## ⚠️ `package-lock.json` — nicht von Hand anfassen

Cloudflare baut mit **`npm ci`**, und das ist streng: Passt das Lockfile nicht exakt zu
`package.json`, bricht der Build ab, bevor überhaupt etwas kompiliert wird. `npm install`
auf dem eigenen Rechner ist dagegen nachsichtig und zieht Fehlendes still nach — der
Unterschied fällt deshalb erst im Deploy auf.

Am 2026-09-12 genau so passiert: Ein Commit „Update package-lock.json" entfernte drei
`@emnapi/*`-Einträge (Zubehör von `sharp` für Systeme ohne fertige Binärdatei). Lokal
lief alles weiter, der Cloudflare-Build scheiterte mit `Missing: @emnapi/runtime from
lock file`.

**Die Ursache ist ein Versionsunterschied:** Jan arbeitet mit **npm 11**, Cloudflare baut
mit **npm 10**. Die beiden räumen optionale, plattformabhängige Pakete unterschiedlich
auf. Ein unter npm 11 erzeugtes Lockfile kann unter npm 10 unvollständig sein.

**Daraus folgt:**

- `package-lock.json` **nie von Hand bearbeiten** — auch nicht im GitHub-Weboberflächen-Editor.
- Ändert sich eine Abhängigkeit: `npm install` laufen lassen und das Ergebnis committen.
- **Vor dem Push prüfen, ob der Build es akzeptiert** — dieselbe Prüfung, die Cloudflare macht:

  ```
  npm ci --dry-run
  ```

  Meldet das `EUSAGE` oder `Missing: … from lock file`, wäre der Deploy gescheitert.
- Kommt es trotzdem vor, ist die Reparatur ein `npm install` in einer Umgebung mit npm 10
  (oder von Claude aus dieser Sitzung, die auf Linux mit npm 10 läuft) und ein Commit des
  Ergebnisses.

## Tests und Werkzeuge

**Testläufer: Vitest** (`npm test`, `npm run test:watch`). Konfiguration in `vitest.config.mts`,
Tests liegen neben dem Code als `lib/*.test.ts`, `lib/admin/*.test.ts` (Zugang, GitHub, Eingang,
Routen der Verwaltung) und `scripts/*.test.mjs` (Pipeline, Eingang, Papierkorb).

**Getestet wird ausschließlich die reine Logik in `lib/`** — die Validierung des Anfrageformulars
und die Ableitungen aus den Inhalten. (⏳ Die Formulartests entfallen mit dem Umbau, die
Datenzusagen werden auf `FOTOS`/`FILME` umgestellt: ids eindeutig, jeder Film mit
`https://`-Link, Beschriftung im Format „Titel – Kunde".) Für die Oberfläche gibt es den Browser-Durchlauf im
Abschnitt darunter; ein zweites, halbes Browser-Abbild wäre Aufwand ohne zusätzliche Sicherheit.

Ein Teil der Tests prüft **die Daten selbst** auf Zusagen, auf die sich der Code verlässt: dass
Slugs eindeutig sind (sie werden URLs), dass jede Arbeit eine bekannte Kategorie und einen Credit
trägt, und dass jede Leistung nur auf existierende Arbeiten verweist. Ein Tippfehler in
`content.ts` ließe eine Arbeit sonst stillschweigend verschwinden.

✅ **Seit dem 2026-10-17 prüft das `lib/inhalt-pruefen.ts`** (`pruefeInhalt`) — in den Tests,
**beim Build** (`lib/content.ts` wirft bei Fehlern, der Deploy bricht ab und die alte Fassung
bleibt online) und vor jedem Speichern in der Verwaltung. Wer eine neue Zusage an die Daten
einführt, trägt sie dort ein, nicht nur in einem Test — sonst prüft die Verwaltung sie nicht.

**Linting: ESLint mit Flat Config** (`npm run lint`, Konfiguration in `eslint.config.mjs`).

⚠️ **`next lint` gibt es in Next 16 nicht mehr.** Bis 2026-08-28 stand es trotzdem in der
`package.json` — der Befehl las „lint" als Verzeichnisnamen und brach ab. Das Skript war also
wirkungslos und gab falsche Sicherheit. Wer es zurückändert, schaltet die Prüfung wieder aus.

**Zwei Regeln sind bewusst abgeschaltet**, mit Begründung in der Konfiguration:
`no-html-link-for-pages` (wir verlinken absichtlich mit `<a>`, weil seitenübergreifende View
Transitions echte Navigationen brauchen) und `no-img-element` (der OpenNext-Adapter bringt keinen
Bildoptimierer für `next/image` mit; die Optimierung passiert vorab in `npm run medien`).

## Geteilte CSS-Bausteine

`app/components/shared.module.css` hält, was mehrere Seiten teilen: den gefüllten CTA-Knopf, die
helle Lesefläche und die Metazeilen-Optik. Eingebunden wird über **`composes`**, nicht über
globale Klassen — so bleibt die Kapselung der CSS-Modules erhalten und jede Seite benennt
ausdrücklich, was sie übernimmt.

⚠️ Anlass war ein Befund aus dem Review: Der CTA-Knopf stand **dreimal** als eigene Kopie im
Projekt, inklusive dreifach hartkodiertem Hover-Rot außerhalb des Token-Systems. Wer ihn geändert
hätte, hätte ihn an einem Drittel der Stellen geändert.

## Prüfen vor dem Deploy — nicht mit `next build` aufhören

⚠️ **`npm run build` und `npm start` prüfen die falsche Umgebung.** Das ist ein Node-Server;
live läuft die Seite als Cloudflare Worker über den OpenNext-Adapter — anderer Build, andere
Laufzeit. Ein Build, der in Node durchläuft, kann im Worker scheitern.

Die aussagekräftige Prüfung ist deshalb:

```
npx opennextjs-cloudflare build     # der Build, der auch live gebaut wird
npx wrangler dev --local            # der Worker in der echten Laufzeit (workerd)
```

Erst dagegen testen, nicht gegen `next start`. Am 2026-08-27 lief die gesamte Entwicklung eines
Tages nur gegen den Node-Server — der Adapter-Build wurde erst auf Nachfrage überhaupt einmal
ausgeführt. Er lief zwar durch, aber das war Glück, keine Prüfung.

**Sinnvoll dabei mitzutesten**, weil es im Build nicht auffällt: Topbar-Farbwechsel beim Scrollen
(`IntersectionObserver`), Kategoriefilter, Tastaturfokus, `prefers-reduced-motion`, Mobilbreiten
375px und 320px.

⏳ **Nach dem Umbau** stattdessen: Pause-Knopf am Hero-Video (Tastatur, Screenreader-Ansage),
Video unter `prefers-reduced-motion` (darf nicht von selbst starten), Lichtkasten über alle
Bilder von `/foto`, Weiterleitungen der alten Adressen, und **die Navigation bei 320px mit der
echten Schrift** — Druk Wide ist so breit, dass „über mich" dort als Erstes umbricht.

**Bei Änderungen an Bewegung oder Layout zusätzlich** — alles im Browser gegen den laufenden
Worker, nicht aus dem Quelltext geschlossen:

| Was | Wie |
|---|---|
| Waagerechtes Scrollen | `documentElement.scrollWidth > clientWidth` bei **320, 360, 390, 414px** auf jeder Seite. 320px ist der Ernstfall: Dort sprengen deutsche Komposita die Zeile |
| Tippflächen | Jedes `a`/`button`/`input` bei 390px vermessen. Links **im Fließtext** sind laut WCAG 2.5.8 ausgenommen — freistehende Ziele nicht |
| Ruckeln | 2 s gleichmäßig durchscrollen und die Abstände zwischen den Bildern messen, mit `Emulation.setCPUThrottlingRate` auf 4 und 6. Alles über 33 ms ist ein ausgelassenes Bild. **Immer gegen `prefers-reduced-motion: reduce` vergleichen** — nur der Unterschied sagt etwas über die Kosten der Animation aus |
| Bewegung abgeschaltet | Mit `reducedMotion: "reduce"` laden und prüfen, dass **nichts unsichtbar bleibt** und die Seite lesbar ist. Das ist der Fehler, der bei scrollgetriebenen Animationen wirklich passiert |
| Ohne Unterstützung | Im gebauten CSS nachsehen, dass **jede** Regel mit einem unsichtbaren Startzustand innerhalb von `@supports (animation-timeline: …)` steht |

⚠️ **`animation-duration: 0.01ms` schaltet scrollgetriebene Animationen nicht ab.** Sie haben
keine Laufzeit. Abgeschaltet wird, indem die Regel nur unter
`prefers-reduced-motion: no-preference` überhaupt gilt.

**Bei Änderungen an Bildern zusätzlich:** gegen Testbilder prüfen, welche Datei der Browser je
Fenstergröße tatsächlich wählt (`img.currentSrc`) — ein falsches `sizes` fällt sonst nicht auf,
die Seite sieht richtig aus und lädt nur das Doppelte. Und den Kontrast von Schrift über Fotos
**über einem rein weißen Testbild** messen, nicht über dem endgültigen Foto: Der ungünstigste
Fall ist der, der zählt (siehe „Text über Fotos" in `design/UI-SPEC.md`).

**Was auch das nicht abdeckt:** Safari und iOS (lokal steht nur Chromium zur Verfügung), die
Live-Domain selbst, und alles mit echtem Bildmaterial. Nach einem Deploy mit sichtbaren
Änderungen gehört ein Blick auf ein echtes iPhone dazu.

## Hosting & Deploy

- **Hosting**: Cloudflare Worker mit dem Namen `personalwebsite`.
- **Domains**: `jakobsax.de` und `www.jakobsax.de`, beide als Custom Domain direkt am Worker gebunden (Workers & Pages → personalwebsite → Domains & Routes).
- **Deploy-Trigger**: Push auf `main` im GitHub-Repo `jh8yzpy6vj-dot/personalwebsite` — Cloudflare baut und deployed automatisch. Es gibt keine Preview-/Staging-Umgebung; jeder Push geht direkt live (siehe `CLAUDE.md` für die Branch-Regel).
- **Wer pusht auf `main`:** Jan und Jakob von Hand, seit dem 2026-10-17 außerdem die Verwaltung (Commits `Verwaltung: …`, über die GitHub-API) und die Medien-Action (Commits `Medien: …`, als `github-actions[bot]`). Jeder davon löst einen Build aus. Deshalb vor eigener Arbeit `git pull`.
- **DNS**: Nameserver von `jakobsax.de` liegen bei Cloudflare (nicht IONOS). Details und Gefahren dazu stehen in `CLAUDE.md` unter "DNS / Domain".
- **E-Mail**: läuft weiterhin über IONOS (MX-Records zeigen auf `mx00/mx01.ionos.de`). Hat nichts mit dem Website-Hosting zu tun, darf aber bei DNS-Änderungen nicht versehentlich mit gelöscht werden.

## Aktueller Stand (Code)

- Next.js App Router unter `app/` (`layout.tsx`, `page.tsx`, `page.module.css`, `globals.css`).
- Struktur folgt `SITE-PLAN.md`: Header/Nav, Hero, Über-mich-Section, Kontakt-Section, Footer — aktuell mit Platzhalter-Inhalten.
- Farb-Palette als CSS-Variablen in `app/globals.css` hinterlegt (siehe `SITE-PLAN.md` für die Referenztabelle).

## Beschlossene Richtungen — noch nicht umgesetzt (Stand 2026-08-27)

Ergebnis des Feature-/SEO-Brainstorms. **Richtung steht, Code existiert noch nicht.** Sobald ein
Punkt gebaut ist, wird er hier auf „umgesetzt" gesetzt und in `AGENT-LOG.md` protokolliert. Die
Aufgaben selbst stehen in `TODO.md`.

### Kontaktformular

> ❌ **Verworfen am 2026-10-08** mit der Neuausrichtung: Die Seite verkauft nichts, Kontakt ist
> eine Zeile mit E-Mail und Instagram auf `/ueber` (E6). Das bereits gebaute Formular samt Route
> wird in Schritt 5 des Umbaus entfernt; Resend, AV-Vertrag und Turnstile werden nie gebraucht.
> Der Text darunter bleibt zur Nachvollziehbarkeit stehen.

- Formular-Endpoint als Route im bestehenden Worker — **kein zusätzlicher Dienst, kein Backend**.
- **Versand:** ⚠️ MailChannels' Gratis-Versand für Cloudflare Workers ist seit 2024 eingestellt.
  Deshalb ein Transaktions-Mailer mit API — **Resend oder Postmark** (beide mit ausreichendem
  Gratiskontingent für dieses Volumen). API-Key als Worker-Secret über `wrangler secret put`,
  **nicht** in `wrangler.toml` und nicht ins Repo.
- **Spam-Schutz:** Cloudflare Turnstile — läuft im selben Konto, ist datenschutzfreundlich und
  braucht kein Google reCAPTCHA.
- **Felder:** Datum, Ort, Art der Veranstaltung, Budgetrahmen, Freitext, Absenderadresse.
- **Datenschutz:** Die Formulardaten gehen an einen Auftragsverarbeiter — das muss in der
  Datenschutzerklärung stehen, und für den Anbieter wird ein AV-Vertrag gebraucht. Gehört zum
  Launch-Blocker „Pflichtangaben" in `TODO.md`.
- ⚠️ **Folge für den Design-Vertrag:** `design/UI-SPEC.md` führt Fehler- und Ladezustände bisher
  als „nicht anwendbar — statische Seite ohne Formular". Mit dem Formular gilt das nicht mehr;
  die Zustände müssen dort ergänzt werden, **bevor** der Code entsteht.

### Analytics & Datenschutz

- **Cloudflare Web Analytics** (cookielos, keine Einwilligung nötig, keine personenbezogene
  Speicherung). Bewusst **kein** Google Analytics — das würde ein Consent-Banner erzwingen, siehe
  die Anti-Feature-Liste in `SITE-PLAN.md`.
- **Schriften sind bereits unbedenklich:** `next/font/google` lädt die Schriften zur Build-Zeit
  herunter und liefert sie vom eigenen Worker aus. Es gibt **keine** Anfrage des Browsers an ein
  Google-CDN — die bekannte Google-Fonts-Abmahnfalle greift hier nicht. Das darf nicht
  versehentlich rückgängig gemacht werden (kein `<link>` auf `fonts.googleapis.com`).
  ⏳ Mit dem Umbau gilt dasselbe für `next/font/local`: Druk Wide und Avenir Next kommen vom
  eigenen Worker, nie von Adobe Fonts oder einem Monotype-CDN (siehe „Schriften").

### Bilder & EXIF

- ✅ **Erledigt am 2026-08-28:** Auslieferung als AVIF/WebP mit `srcset`, Vorschaubildchen als
  Ladezustand, Größenbudget. Beschreibung oben unter „Medien".
- ✅ **Erledigt am 2026-08-28 — EXIF-Zeile:** Aufnahmedaten werden von `npm run medien` mit `exifr`
  ausgelesen, landen im Manifest und werden als statischer Text mitgerendert — keine
  Laufzeit-Abhängigkeit, kein Client-JS. Formatierung in `lib/bilder.ts` (`aufnahmeZeile`),
  Ausgabe auf der Detailseite.
- ✅ **GPS-Tags:** erledigt, an zwei Stellen. Erstens schreibt die Pipeline keine Metadaten in
  die Ausgabedateien. Zweitens liest sie beim EXIF **nur eine abschließende Feldliste**
  (`EXIF_FELDER` in `lib/bilder-regeln.mjs`) — Standortdaten werden gar nicht erst eingelesen.
  ⚠️ **Diese Liste ist eine Sicherheitsgrenze, keine Bequemlichkeit.** Wer sie erweitert, muss
  wissen, was er tut. Verifiziert mit einer Quelldatei, der GPS-Koordinaten eingesetzt wurden:
  im Original vorhanden, im Manifest und in allen Ausgabedateien nicht.
- Ausgegeben werden **vier Werte: Uhrzeit, Belichtungszeit, Blende, ISO**. Brennweite und
  Kamera wären lesbar, machen die Zeile aber länger, ohne mehr zu sagen.
- ⚠️ **Die Uhrzeit wird als Zeichenkette übernommen** (`reviveValues: false`), nicht als Datum
  interpretiert. Im EXIF steht keine Zeitzone — ein `Date` daraus zu bauen hieße, die Zeitzone
  des Build-Rechners anzunehmen, und die Seite zeigte je nach Server eine andere Uhrzeit.
- ⚠️ Kontext wie Wetter steht **nicht** im EXIF und müsste ein optionales Handfeld in
  `lib/inhalt.json` werden (Typ in `lib/inhalt.ts`, Regel in `lib/inhalt-pruefen.ts`) — mit
  Copy-Freigabe.

### SEO-Technik

- ✅ **Umgesetzt am 2026-08-27:** `metadataBase`, OpenGraph/Twitter-Tags, Canonical,
  `app/robots.ts`, `app/sitemap.ts` und JSON-LD (`app/StructuredData.tsx`) mit `Person` +
  `sameAs` und `ProfessionalService` + `areaServed`.
- ✅ **OG-Images vorab erzeugen**, nicht zur Laufzeit — auf dem Worker ist eine statische
  Datei die risikoärmere Variante, und genau das hat sich bestätigt (siehe „Vorschaukarten"
  oben). Umgesetzt; die Karten liegen fertig in `public/og/`.

### Indexierbarkeit — ein zentraler Schalter

`lib/site.ts` hält zwei technische Werte, bewusst getrennt von den Inhalten in `lib/inhalt.json`
(und damit außer Reichweite der Verwaltung):

- **`SITE_URL`** — die kanonische Basis-URL an genau einer Stelle. Die Domain-Entscheidung
  (`.de` vs. `.media`) ist offen, ein Wechsel ist dadurch ein Einzeiler.
- **`INDEXABLE`** — steht auf `false` und steuert `robots` in `app/layout.tsx` sowie die
  Sitemap-Anmeldung in `app/robots.ts`. Grund: Die Seite ist live und war bis dahin
  uneingeschränkt indexierbar — mit erfundener E-Mail-Adresse, Preisen auf „noch festzulegen",
  ungeprüften Inhalten und **ohne Impressum**.

⚠️ **Feinheit, die oft falsch gemacht wird:** `robots.txt` enthält für die Seite bewusst **kein**
`Disallow`. (Einzige Ausnahme seit 2026-10-17: `/admin` und `/api/` — Begründung unter
„Verwaltung (/admin)" › „Sicherheit" und in `app/robots.ts`.)
`Disallow` verbietet das *Crawlen*, nicht das *Indexieren* — wer beides kombiniert, erreicht das
Gegenteil, weil der Crawler das `noindex` im HTML dann nie liest. Richtig ist: **Crawlen
erlauben, Indexieren per `noindex` verbieten.** Das ist in `app/robots.ts` auskommentiert
festgehalten, damit es niemand „korrigiert".

⚠️ **Keine Platzhalter in strukturierten Daten.** `app/StructuredData.tsx` enthält bewusst keine
Kontaktdaten, solange die Adresse in `content.ts` erfunden ist — Google übernimmt solche Angaben
in Wissensfelder, wo sie schwerer zu korrigieren sind als auf der Seite.
- ❌ **Verworfen am 2026-10-08** (keine Detailseiten mehr, siehe `SITE-PLAN.md`) — der folgende
  Punkt gilt nicht mehr und wird mit dem Umbau durch Weiterleitungen ersetzt.
- **Routing:** perspektivisch eine statisch vorgerenderte Route pro Arbeit
  (`/arbeiten/[slug]`), gespeist aus dem bestehenden `WORKS`-Array in `lib/content.ts`. Die
  `id`-Felder dort dienen dann als Slug — sie sind entsprechend stabil zu halten, ein späterer
  Umbenennung wäre ein URL-Bruch.

## Konventionen

- Keine weiteren Frameworks/Build-Tools zusätzlich zum beschlossenen Next.js-Stack einführen, ohne dass es hier dokumentiert wird und beide (Jan & Jakob) das mittragen.
- Sprache im Code/Kommentaren: Deutsch oder Englisch ist beides ok, Konsistenz innerhalb einer Datei anstreben.
- Neue technische Entscheidungen (z.B. "wir nutzen jetzt ein CMS", "wir brauchen ein Kontaktformular mit Backend") hier ergänzen, sobald sie feststehen — nicht erst im Nachhinein. (Die eigene Verwaltung vom 2026-10-17 ist kein fremdes CMS; sie steht oben unter „Verwaltung (/admin)", die Begründung in `CLAUDE.md`, „Konventionen".)
