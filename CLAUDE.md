# CLAUDE.md — Projektanleitung für Claude (jakobsax.de)

Diese Datei wird von Claude (und anderen KI-Agenten) automatisch gelesen, bevor an diesem Repo gearbeitet wird. Sie legt die Regeln fest, an die sich **jeder** Agent zu halten hat — egal ob Jan oder Jakob gerade arbeitet.

## Projekt-Kurzüberblick

- **Was**: Persönliche Website für Jakob Sax.
- **Wer arbeitet dran**: Jan und Jakob, beide gleichberechtigt.
- **Domain**: `jakobsax.de` und `www.jakobsax.de` (beide auf denselben Cloudflare Worker gebunden).
- **Deploy**: Cloudflare Worker `personalwebsite` (Cloudflare-Konto, in dem auch die Domain liegt). Next.js + TypeScript, gebaut über den `@opennextjs/cloudflare`-Adapter — Details in `TECH-STACK.md`.

## 🔒 Branch- & Deploy-Regel

- **`main` ist der einzige Branch und geht direkt live.** Es gibt (Stand jetzt) keine Trennung zwischen Preview und Produktion.
- **Jan und Jakob dürfen beide direkt auf `main` committen und pushen.** Keine Freigabe durch die jeweils andere Person nötig.
- Genau deswegen: Änderungen vor dem Pushen kurz selbst gegenlesen — es gibt kein Sicherheitsnetz durch einen zweiten Branch.
- Falls das Projekt größer wird und ein Redesign/Preview-Branch sinnvoll wird, hier in dieser Datei aktualisieren, bevor der Workflow geändert wird.

## ⚠️ DNS / Domain — unbedingt beachten

Die Nameserver von `jakobsax.de` liegen bei **Cloudflare** (nicht mehr bei IONOS). Das bedeutet:

- **DNS-Einstellungen im IONOS-Panel sind wirkungslos.** Alle echten DNS-Änderungen passieren im Cloudflare Dashboard unter der Domain `jakobsax.de` → DNS → Records.
- **E-Mail läuft weiterhin über IONOS.** Folgende Records im Cloudflare-DNS dürfen **niemals** gelöscht oder verändert werden, sonst geht die E-Mail-Zustellung für `@jakobsax.de` kaputt:
  - `MX` Records (`mx00.ionos.de`, `mx01.ionos.de`)
  - `CNAME`-Records für `autodiscover`, `_dmarc`, `_domainconnect`, sowie eventuelle `*_domainkey`-Einträge (DKIM)
  - `TXT`-Record mit `v=spf1 ...`
- **Die Website-Verbindung läuft über den Cloudflare Worker `personalwebsite`**, gebunden als Custom Domain auf `jakobsax.de` und `www.jakobsax.de` (Workers & Pages → personalwebsite → Settings → Domains & Routes). Solange dort beide Domains mit Status "Active" gelistet sind, ist alles korrekt verbunden.
- Falls jemals wieder ein reiner `A`/`AAAA`-Eintrag für `jakobsax.de` oder `www` auftaucht, der **nicht** über "Custom Domains" des Workers erzeugt wurde: das ist ein Überbleibsel und verursacht einen SSL-Fehler (Cloudflare Error 525), weil die Anfrage dann an einen falschen Server geht statt an den Worker. Löschen, dann die Domain erneut über Workers & Pages → Domains & Routes hinzufügen.
- DNS-Änderungen können 1–5 Minuten brauchen, bis sie überall (Router, Provider) ankommen. Bei "geht bei der einen Person, bei der anderen nicht" direkt nach dem Ändern: normal, kurz abwarten oder mobile Daten zum Testen nutzen statt WLAN.

## 📁 Dokumentenstruktur — Pflicht für alle Agenten

Damit nichts verloren geht und sich Jan, Jakob und jede KI-Session (Claude, sonstige) jederzeit denselben Stand anschauen können, gibt es genau drei Kerndokumente. Keine neuen Planungs-/Log-Dateien frei erfinden — alles kommt in eines dieser drei:

1.  **`AGENT-LOG.md` (das unantastbare Protokoll)**
    *   Chronologisches, *append-only* Protokoll aller **abgeschlossenen** Arbeiten.
    *   **Nie löschen oder überschreiben.** Neue Einträge kommen immer oben rein.
    *   Vor jeder neuen Änderung am Projekt lesen, um den aktuellen Stand zu kennen.
2.  **`TODO.md` (offene Aufgaben)**
    *   Zwei Abschnitte: **Kurzfristig** und **Langfristig**.
    *   Erledigte kurzfristige Punkte werden hier entfernt und stattdessen als Eintrag in `AGENT-LOG.md` dokumentiert — Todo-Erledigung ist also immer auch ein Log-Eintrag, nicht nur ein Häkchen.
    *   Langfristige Punkte bleiben stehen und bekommen ein Status-Symbol (🔲/⏳/✅), bis sie abgeschlossen und geloggt sind.
3.  **`TECH-STACK.md` (technische Vorgaben)**
    *   Beschreibt Hosting, Deploy-Weg, Domains, DNS-Besonderheiten und Code-Konventionen.
    *   Bei jeder technischen Entscheidung (neues Framework, andere Hosting-Lösung, neue Abhängigkeit) **sofort** aktualisieren — nicht im Nachhinein.

Für das Design gibt es zusätzlich zwei Dokumente:

*   **`SITE-PLAN.md`** — Struktur und Absicht: welche Sections gibt es, was kommt wohin, welche offenen Content-Fragen bestehen.
*   **`design/UI-SPEC.md`** — der **verbindliche Design-Vertrag**: Abstände, Schriftskala, Farbregeln inkl. Liste wofür die Akzentfarbe reserviert ist, Copy-Texte, Bildbehandlung, Zustands-Abdeckung. **Bei Widerspruch zu SITE-PLAN.md gilt das UI-SPEC.** Vor jeder Design-/CSS-Änderung lesen und einhalten; wenn eine Änderung dem Vertrag widerspricht, erst den Vertrag anpassen (und die Änderung begründen), dann den Code.
    *   ⚠️ **Konkrete Zahlen stehen ausschließlich im UI-SPEC, nicht hier.** Werden sie doppelt geführt, laufen die Dokumente auseinander — genau das ist einmal passiert.

## 🛠 Verwaltung (`/admin`) — Jakob ändert Inhalte selbst

Seit dem 2026-10-17 gibt es unter `https://jakobsax.de/admin` eine eigene Verwaltung: Jakob ordnet dort Bilder, blendet sie aus, löscht, lädt hoch und bearbeitet die Texte — ohne Git und ohne Editor. Was das für **jeden**, der am Code arbeitet, bedeutet:

- **Alle Inhalte stehen in `lib/inhalt.json`** (Typen und Feldbeschreibungen in `lib/inhalt.ts`). `lib/content.ts` enthält keine Inhalte mehr; es reicht den Stand nur unter den alten Namen (`FOTOS`, `FOTO_HERO`, `ABOUT` …) an die Seiten weiter und prüft ihn beim Build. Wer einen Text, eine Reihenfolge oder einen Bildausschnitt ändern will, ändert `lib/inhalt.json` — oder lässt es Jakob in der Verwaltung tun.
- **Jakob committet über die Verwaltung direkt auf `main`.** Deshalb **vor jeder eigenen Arbeit `git pull`** und vor dem Push noch einmal (`git pull --rebase`). Wer das vergisst, bekommt beim Push einen Konflikt in `lib/inhalt.json` — oder überschreibt im schlimmsten Fall Jakobs Änderung.
- **Woran man die Commits erkennt:** Commits der Verwaltung beginnen mit `Verwaltung:`, Commits der Medien-Action (Bilder verarbeitet, Papierkorb geleert) mit `Medien:`. Beides ist normal und kein Fremdeingriff.
- `lib/inhalt.json` von Hand nur im Format der Verwaltung bearbeiten (zwei Leerzeichen Einzug, Zeilenumbruch am Ende) — sonst entsteht beim nächsten Speichern ein Diff über die ganze Datei.
- ⚠️ **Das Repo ist öffentlich.** Commits aus der Verwaltung und der Action tragen keine private E-Mail-Adresse; das darf auch kein Agent ändern (kein `author`-Feld mit einer Mail, keine Mail in der Nachricht).
- **Einrichtung, Ablauf, Secrets und Fehlerbilder: `TECH-STACK.md`, Abschnitt „Verwaltung (/admin)".** Gestaltung der Verwaltung: `design/UI-SPEC.md`, Abschnitt „Verwaltung (/admin)". Konkrete Zahlen (Anzahl der Hero-Bilder usw.) weiterhin nur im UI-SPEC.

## Konventionen

- Keine unnötige Komplexität einbauen: kein Tailwind, kein Design-System-Framework (shadcn o.ä.), **kein fremdes CMS und kein CMS-Framework** — solange die Seite klein bleibt, reichen CSS-Variablen + CSS-Modules. Diese Entscheidung ist in `design/UI-SPEC.md` begründet festgehalten.
  - **Ausnahme seit 2026-10-17: die eigene Verwaltung `/admin`** (siehe oben). Sie ist erlaubt, weil sie nichts Neues an die Seite hängt: keine Datenbank, kein fremder Dienst, keine Laufzeit-Abhängigkeit für Besucher. Sie schreibt **nur `lib/inhalt.json` per Git-Commit**; die öffentliche Seite bleibt statisch gebaut, jede Änderung steht im Git-Verlauf und lässt sich zurücknehmen. Ein fremdes CMS hätte eine zweite Datenquelle neben Git bedeutet — genau das soll es nicht geben.
- Neue größere Strukturentscheidungen (Framework-Wechsel, Umzug auf Pages statt Worker, Mehrsprachigkeit etc.) in `TECH-STACK.md` dokumentieren, sobald sie getroffen werden.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
