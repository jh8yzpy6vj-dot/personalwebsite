# AGENT-LOG.md — Protokoll aller abgeschlossenen Arbeiten

**Regel: Hier wird NIE etwas gelöscht oder überschrieben.** Jeder abgeschlossene Arbeitsschritt bekommt einen neuen Eintrag **oben** (neueste zuerst). Auch das Format dieser Datei bleibt unangetastet. Vor jeder neuen Änderung am Projekt: diese Datei lesen, um zu wissen, was bereits passiert ist.

Erledigte kurzfristige Todos aus `TODO.md` werden hier verlinkt/dokumentiert, sobald sie fertig sind (siehe `TODO.md` für die Regel).

---

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
