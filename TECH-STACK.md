# TECH-STACK.md — Technische Vorgaben & Konventionen

Verbindliche technische Fakten und Regeln für dieses Projekt. Bei jeder technischen Entscheidung (Framework, Hosting-Änderung, neue Abhängigkeit) **muss** diese Datei aktualisiert werden.

## Ziel-Stack (Framework)

- **Framework**: Next.js (App Router) mit **TypeScript** — wie beim CLAER-Projekt.
- **Cloudflare-Adapter**: `@opennextjs/cloudflare`. Next.js baut normalerweise für Node-Server/Vercel; dieser Adapter übersetzt den Next.js-Build so, dass er als **Cloudflare Worker** läuft. Ohne diesen Adapter funktioniert ein Next.js-Projekt auf Cloudflare Workers nicht sauber — das ist der "Connector", den es braucht.
- **Build-Command** (Cloudflare Build-Konfiguration): `npx opennextjs-cloudflare build` — falls eine ältere Next.js-Version (z.B. 14) verwendet wird, zusätzlich das Flag `--dangerouslyUseUnsupportedNextVersion` anhängen (siehe CLAER-Projekt als Referenz, dort war das nötig).
- **TypeScript**: durchgängig für neuen Code, kein plain JavaScript mehr für neue Dateien.
- Status: **Umgesetzt.** Next.js 16.3.3 + `@opennextjs/cloudflare` 1.20.3 (offiziell unterstützte Kombination, kein Legacy-Flag nötig). Lokal via `npm run build` und `npx opennextjs-cloudflare build` getestet.
- ⚠️ **Offen:** Die Build-/Deploy-Befehle im Cloudflare-Dashboard (Workers & Pages → personalwebsite → Settings → Build) müssen noch manuell auf `npx opennextjs-cloudflare build` (Build) / `npx wrangler deploy` (Deploy) umgestellt werden — siehe `TODO.md`.

## Hosting & Deploy

- **Hosting**: Cloudflare Worker mit dem Namen `personalwebsite`.
- **Domains**: `jakobsax.de` und `www.jakobsax.de`, beide als Custom Domain direkt am Worker gebunden (Workers & Pages → personalwebsite → Domains & Routes).
- **Deploy-Trigger**: Push auf `main` im GitHub-Repo `jh8yzpy6vj-dot/personalwebsite` — Cloudflare baut und deployed automatisch. Es gibt keine Preview-/Staging-Umgebung; jeder Push geht direkt live (siehe `CLAUDE.md` für die Branch-Regel).
- **DNS**: Nameserver von `jakobsax.de` liegen bei Cloudflare (nicht IONOS). Details und Gefahren dazu stehen in `CLAUDE.md` unter "DNS / Domain".
- **E-Mail**: läuft weiterhin über IONOS (MX-Records zeigen auf `mx00/mx01.ionos.de`). Hat nichts mit dem Website-Hosting zu tun, darf aber bei DNS-Änderungen nicht versehentlich mit gelöscht werden.

## Aktueller Stand (Code)

- Next.js App Router unter `app/` (`layout.tsx`, `page.tsx`, `page.module.css`, `globals.css`).
- Struktur folgt `SITE-PLAN.md`: Header/Nav, Hero, Über-mich-Section, Kontakt-Section, Footer — aktuell mit Platzhalter-Inhalten.
- Farb-Palette als CSS-Variablen in `app/globals.css` hinterlegt (siehe `SITE-PLAN.md` für die Referenztabelle).

## Konventionen

- Keine weiteren Frameworks/Build-Tools zusätzlich zum beschlossenen Next.js-Stack einführen, ohne dass es hier dokumentiert wird und beide (Jan & Jakob) das mittragen.
- Sprache im Code/Kommentaren: Deutsch oder Englisch ist beides ok, Konsistenz innerhalb einer Datei anstreben.
- Neue technische Entscheidungen (z.B. "wir nutzen jetzt ein CMS", "wir brauchen ein Kontaktformular mit Backend") hier ergänzen, sobald sie feststehen — nicht erst im Nachhinein.
