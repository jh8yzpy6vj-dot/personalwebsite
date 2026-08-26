# TODO.md — Offene Aufgaben

Hier stehen alle offenen Aufgaben, aufgeteilt in kurzfristig und langfristig.

**Regel für kurzfristige Todos:** Wenn ein kurzfristiger Punkt erledigt ist, wird er hier **entfernt** und stattdessen als Eintrag in `AGENT-LOG.md` dokumentiert (siehe dort für Format).

**Regel für langfristige Todos:** Bleiben hier stehen, bekommen aber ein Status-Symbol:
- 🔲 offen / noch nicht begonnen
- ⏳ in Arbeit
- ✅ erledigt (Log-Eintrag in `AGENT-LOG.md` verlinken, dann den Punkt hier nach kurzer Zeit archivieren/entfernen)

---

## Kurzfristig

- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Wichtig — manueller Schritt in Cloudflare nötig:** Im Cloudflare Dashboard → Workers & Pages → personalwebsite → Settings → Build prüfen/setzen: Build command auf `npx opennextjs-cloudflare build`, Deploy command auf `npx wrangler deploy`. Ohne diese Umstellung erkennt Cloudflare das neue Next.js-Projekt beim nächsten Push evtl. nicht richtig (vorher war es eine reine statische Seite ohne Build-Schritt).

## Langfristig

- 🔲 Klären, wozu die Seite dienen soll (CV/Portfolio, Business, Blog, o.ä.) — bestimmt Inhalt und Struktur.
- 🔲 Echten Content sammeln: Texte, Bilder, Kontaktdaten (aktuell nur Platzhalter in `app/page.tsx`, siehe `SITE-PLAN.md`).
- 🔲 Design/Layout aus `SITE-PLAN.md` verfeinern, sobald echter Zweck & Content feststehen (z.B. Portfolio-Section, Farb-Feinschliff).
