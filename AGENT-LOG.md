# AGENT-LOG.md — Protokoll aller abgeschlossenen Arbeiten

**Regel: Hier wird NIE etwas gelöscht oder überschrieben.** Jeder abgeschlossene Arbeitsschritt bekommt einen neuen Eintrag **oben** (neueste zuerst). Auch das Format dieser Datei bleibt unangetastet. Vor jeder neuen Änderung am Projekt: diese Datei lesen, um zu wissen, was bereits passiert ist.

Erledigte kurzfristige Todos aus `TODO.md` werden hier verlinkt/dokumentiert, sobald sie fertig sind (siehe `TODO.md` für die Regel).

---

## 2026-08-26 — Echte Seitenstruktur nach Briefing gebaut, Inhalte zu Jakob Sax eingesetzt
- **Grundlage:** Briefing „Private Website Jakob Sax" (Rev. 5, liegt außerhalb des Repos) und die Referenzseite [bildmanufaktur.de](https://www.bildmanufaktur.de). Deren Struktur wurde analysiert (fixe Topbar, randloses Hero-Video mit `loop`/`muted`/`playsinline`, Kategoriefilter, randlos aneinanderstoßendes 2-Spalten-Kachelraster mit `gap: 0` und Auftraggeber-Label) und übernommen — die Gestaltung ist eigenständig.
- **Positionierung korrigiert:** Jakob ist nicht „Journalist mit Nebenerwerb", sondern Fotograf für Straßentheater und zeitgenössischen Zirkus *und* SWR-Journalist. Umgesetzt über das Zwei-Hälften-Prinzip: dunkel = sehen (Fotografie, hier wird gebucht), hell = lesen (Vertrauen, Journalismus als Beleg). Die dunkle Hälfte steht oben.
- **Inhalte** zentral in neuer Datei `lib/content.ts`: Arbeiten (tête-à-tête Rastatt, WiWaWo 50–52 des Bayerischen Kanu-Verbands, Filmworkshop, SWR-Klimaredaktion, ARD aktuell, STRG_F/Panorama, SWR Heimat), drei Leistungen, Referenzen, Kurzbio in erster Person, Kontakt. Jede Arbeit trägt Auftraggeber, Rolle und Jahr — saubere Credits sind belegt Jakobs Arbeitsweise.
- **Bewusst weggelassen:** Onetake-Arbeiten (Freigabe und Nutzungsrechte ungeklärt), Preisangaben (stehen nicht fest), erfundene Details. Wo Angaben fehlen, steht „noch festzulegen" statt einer Erfindung.
- **Design nach Briefing-Tokens:** `rec` #E11B1B (seine eigene ●REC-Bildmarke), `buehne`, `papier`, `stein`, `ton`. Schriften Bricolage Grotesque / Newsreader / Martian Mono über `next/font/google`. Sektionstitel klein mit Schlusspunkt (`buchbar.`, `kontakt.`) — belegt seine Handschrift.
- **Neue Komponenten:** `app/components/Works.tsx` (Kategoriefilter, Client Component) und `app/components/Topbar.tsx`. Die Topbar wechselt per `IntersectionObserver` die Farbe je nach Hälfte — ohne das wäre die weiße Wortmarke über dem hellen Bereich unlesbar (im Test aufgefallen).
- **Design-Vertrag `design/UI-SPEC.md` komplett neu geschrieben** (der alte ging von einer falschen Positionierung aus) und **drei Runden vom `gsd-ui-checker` geprüft**:
  - Runde 1 → BLOCKED: deklarierter CTA „E-Mail schreiben" existierte gar nicht im Code; 5 statt 4 Schriftgrößen, wobei 12px und 14px derselbe Schriftschnitt waren; tote Impressum-/Datenschutz-Elemente.
  - Runde 2 → BLOCKED: der Launch-Blocker im Vertrag verwies auf `TODO.md`, dort stand aber nichts.
  - Runde 3 → **APPROVED**, 6/6 Dimensionen.
- **Behoben:** CTA an zwei Stellen ergänzt (einziger gefüllter Button der Seite); Skala auf genau 4 Größen (14/18/28/56) und 2 Gewichte reduziert; ●-Punkt überall einheitlich 8px (vorher 7/8/10); `scroll-margin-top` mobil ergänzt; unsichtbare Screenreader-Überschrift bekam eine explizite Größe, weil die Browser-Vorgabe sonst einen undeklarierten 27px-Wert einschleppte.
- **Kontraste gemessen statt geschätzt:** Die Briefing-Farben verfehlen als kleiner Text die im Briefing selbst gesetzten 4.5:1 (`ton` auf Papier 4.11, `rec` auf Schwarz 4.37). Deshalb zugängliche Textvarianten eingeführt (`--ton-papier`, `--ton-buehne`, `--rec-text`, `--auf-rec`); Markenfarben bleiben für Flächen, Punkte und Linien. Gemessenes Minimum jetzt **4.80:1**.
- **Verifiziert im Browser:** genau 4 Schriftgrößen und 2 Gewichte im gerenderten DOM nachgezählt, alle Kontraste geprüft, Filter getestet (9 → 1 → 4 → 9 Kacheln, `aria-pressed` korrekt), Mobilansicht bei 375px ohne horizontalen Überlauf, keine Konsolenfehler.
- **`TODO.md` um einen Abschnitt „🚫 LAUNCH-BLOCKER" erweitert** — Pflichtangaben (Impressum/Datenschutz), Freigabe aller Inhalte durch Jakob, echte Kontaktdaten, Nebentätigkeitsgenehmigung SWR, Bild- und Persönlichkeitsrechte, Freigabe der Referenznennungen.
- **Wichtig:** Die Seite ist **nicht live gegangen**. Alle Inhalte stammen aus dem Briefing und sind ungeprüft; Bildmaterial und Hero-Video fehlen noch (Kacheln zeigen „Bild folgt", Hero einen Farbverlauf).
- Von: Jan (mit Claude, geprüft durch `gsd-ui-checker`)

## 2026-08-26 — Design-Vertrag `design/UI-SPEC.md` erstellt, geprüft und im Code umgesetzt
- Neues Verzeichnis `design/` mit `UI-SPEC.md` — verbindlicher Design-Vertrag (Spacing-Skala, Typografie, Farbregeln inkl. Accent-Reservierung, Copywriting, Zustands-Abdeckung, Visual Hierarchy).
- Erstellt mit dem GSD-Agenten `gsd-ui-researcher`, anschließend unabhängig geprüft vom `gsd-ui-checker` (6-Dimensionen-Review). Ergebnis: 5× PASS, 1× FLAG (fehlender Fokuspunkt der Hero-Section) — FLAG behoben durch neue Sektion "Visual Hierarchy", danach `status: approved`.
- Bewusste Entscheidung im Vertrag festgehalten: **kein Tailwind/shadcn** (Tool: none), stattdessen CSS-Custom-Properties + CSS-Modules — begründet mit der `TECH-STACK.md`-Konvention "keine unnötige Komplexität".
- Code an den Vertrag angeglichen: Design-Tokens (Spacing, Schriftgrößen, -gewichte, Zeilenhöhen) als CSS-Variablen in `app/globals.css`; `app/page.module.css` nutzt durchgängig diese Tokens; Font-Gewichte auf genau 2 vereinheitlicht (400/700, vorher zusätzlich 600); Abstände auf 4er-Skala korrigiert (vorher u.a. 20px/9.6px); Touch-Targets auf min. 44px; sichtbarer Fokus-Ring ergänzt; Mobile-Breakpoint bei 640px; CTA-Label von "E-Mail" auf "E-Mail schreiben" (Verb+Nomen).
- Verifiziert: Build fehlerfrei; im Browser gegen den Vertrag geprüft (via DOM-Auslesen, nicht nur visuell) — exakt 4 Schriftgrößen (14/16/24/40px), exakt 2 Gewichte (400/700), Farbwerte korrekt, Touch-Targets 44px, kein horizontaler Überlauf. Zusätzlich auf 375px Mobile-Breite getestet: kein Überlauf, Nav bricht um.
- `SITE-PLAN.md` verweist jetzt auf `design/UI-SPEC.md` als verbindliche Quelle für Design-Werte (SITE-PLAN bleibt für Struktur/Absicht).
- **Weiterhin offen:** Copywriting-Werte im Vertrag sind bewusst als vorläufige Platzhalter markiert, bis der Zweck der Seite (CV/Portfolio/Business) feststeht.
- Von: Jan (mit Claude, GSD-Agenten `gsd-ui-researcher` + `gsd-ui-checker`)

## 2026-08-26 — Migration auf Next.js + TypeScript umgesetzt, SITE-PLAN.md angelegt
- `SITE-PLAN.md` erstellt: Seitenstruktur (Header/Hero/Über mich/Kontakt/Footer), Farb-Palette (Hex-Codes), Typografie und offene Content-Fragen dokumentiert.
- Next.js-Projekt aufgesetzt: `package.json`, `tsconfig.json`, `next.config.mjs`, `wrangler.toml`, `open-next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/page.module.css`, `app/globals.css`, `.gitignore`.
- Next.js 16.3.3 + `@opennextjs/cloudflare` 1.20.3 verwendet (offiziell unterstützte Kombination, kein `--dangerouslyUseUnsupportedNextVersion`-Flag nötig).
- Alte statische `index.html` entfernt, Inhalt nach `app/page.tsx` migriert (gleiche Platzhalter-Inhalte, jetzt nach SITE-PLAN.md strukturiert: Header mit Nav, Hero, Über-mich-Section, Kontakt-Section, Footer).
- Lokal getestet: `npm run build` (Next.js-Build) und `npx opennextjs-cloudflare build` liefen fehlerfrei; `npx wrangler dev` lokal gestartet und die Seite im Browser visuell geprüft (Layout, Farben, Kontakt-Buttons) — funktioniert wie geplant.
- **Offener Punkt (siehe TODO.md, Kurzfristig):** Die Build-/Deploy-Befehle im Cloudflare-Dashboard für das Worker-Projekt `personalwebsite` müssen manuell auf den Next.js-Workflow umgestellt werden (Build command `npx opennextjs-cloudflare build`, Deploy command `npx wrangler deploy`) — das kann nicht per Code/Git erledigt werden, sondern nur direkt im Cloudflare Dashboard.
- Von: Jan (mit Claude)

## 2026-08-26 — Ziel-Stack festgelegt: Next.js + TypeScript + @opennextjs/cloudflare
- Entscheidung getroffen: Umstellung von reinem statischem HTML auf Next.js (App Router) mit TypeScript, Deploy weiterhin als Cloudflare Worker über den `@opennextjs/cloudflare`-Adapter (analog zum CLAER-Projekt).
- `TECH-STACK.md` entsprechend ergänzt (neuer Abschnitt "Ziel-Stack"), `TODO.md` um den kurzfristigen Punkt "Next.js-Setup aufsetzen" erweitert.
- Migration selbst ist noch **nicht** durchgeführt, aktueller Code ist weiterhin reines HTML.
- Von: Jan (mit Claude)

## 2026-08-26 — CLAUDE.md mit Branch- und DNS-Regeln angelegt
- `CLAUDE.md` erstellt: Branch-Regel (main = live, Jan & Jakob gleichberechtigt, direktes Pushen erlaubt) und DNS-Warnhinweise (IONOS-Mail-Records nie löschen, DNS läuft über Cloudflare) dokumentiert.
- Von: Jan (mit Claude)

## 2026-08-26 — Cloudflare Error 525 behoben (DNS/Custom-Domain-Konflikt)
- Ursache gefunden: `jakobsax.de` (ohne www) hatte noch einen alten `A`/`AAAA`-Eintrag auf eine IONOS-IP (`217.160.0.153` / `2001:8d8:100f:f000::200`), während der Cloudflare Worker `personalwebsite` nur auf `www.jakobsax.de` als Custom Domain gebunden war. Dadurch ging der Traffic auf die apex-Domain an den falschen (nicht mehr erreichbaren) Server → SSL-Handshake-Fehler (Cloudflare Error 525).
- Fix: alten `A`/`AAAA`-Eintrag für `jakobsax.de` in Cloudflare DNS gelöscht, danach `jakobsax.de` zusätzlich als Custom Domain beim Worker `personalwebsite` hinzugefügt (Workers & Pages → personalwebsite → Domains & Routes).
- Nach dem Fix kurzzeitig unterschiedliches Verhalten je nach Standort/Gerät beobachtet — reine DNS-Propagation/Caching-Verzögerung (Router- bzw. Provider-DNS-Cache), kein weiterer Fehler.
- Von: Jan & Jakob (mit Claude)

## 2026-08-26 — Erste Testseite live geschaltet
- Repo `personalwebsite` (GitHub: jh8yzpy6vj-dot/personalwebsite) geklont, ursprünglicher Inhalt war nur ein "Hello World" in `index.html`.
- Einfache Platzhalter-Personal-Website für Jakob Sax gebaut (Name, Rolle, Bio-Platzhaltertext, Kontakt-Links) und auf `main` gepusht, um den Deploy-Workflow zu testen.
- Von: Jan (mit Claude)
