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

- [ ] **Pflichtangaben:** `/impressum` und `/datenschutz` mit echten Inhalten anlegen (§ 5 DDG, DSGVO) und im Footer verlinken. Aktuell steht „Impressum · Datenschutz" bewusst als reiner Text ohne Link im Footer — Kontext siehe `design/UI-SPEC.md`, Abschnitt „Seitenstruktur". Bei Selbstständigkeit gehört eine ladungsfähige Anschrift dazu; für Journalisten ein sensibler Punkt, ggf. über eine Geschäftsadresse lösen.
- [ ] **Alle Inhalte von Jakob freigeben lassen.** Sämtliche Angaben in `lib/content.ts` stammen aus dem Briefing und sind **nicht gegengeprüft**. Nichts davon darf ungeprüft live gehen.
- [ ] **Kontaktdaten sind Platzhalter:** `hallo@jakobsax.media` ist erfunden, die vertraulichen Kanäle (Signal/Threema/PGP) stehen auf „noch einzutragen". Echte Werte einsetzen oder die Blöcke entfernen.
- [ ] **Nebentätigkeit klären:** Braucht Jakob für die selbstständige Tätigkeit eine Genehmigung des SWR? Dürfen SWR-Beiträge eingebettet werden, oder nur auf die Autorenseite verlinkt?
- [ ] **Bild- und Persönlichkeitsrechte** an den Festivalfotos klären: Was darf werblich auf die eigene Seite, was nur ins Kundenarchiv? Bei Auftritten im öffentlichen Raum sind Persönlichkeitsrechte von Künstlerinnen, Künstlern und Publikum ein reales Thema.
- [ ] **Referenznennungen freigeben lassen:** Dürfen tête-à-tête und der Bayerische Kanu-Verband namentlich genannt werden?

## Kurzfristig

- [ ] Prüfen, ob `jakobsax.de` und `www.jakobsax.de` inzwischen für alle stabil ohne Fehler erreichbar sind (DNS-Propagation nach dem 525-Fix abschließend testen).
- [ ] **Wichtig — manueller Schritt in Cloudflare nötig:** Im Cloudflare Dashboard → Workers & Pages → personalwebsite → Settings → Build prüfen/setzen: Build command auf `npx opennextjs-cloudflare build`, Deploy command auf `npx wrangler deploy`. Ohne diese Umstellung erkennt Cloudflare das neue Next.js-Projekt beim nächsten Push evtl. nicht richtig (vorher war es eine reine statische Seite ohne Build-Schritt).
- [ ] **Bildmaterial beschaffen.** Die Seite lebt von Fotos, aktuell zeigt jede Kachel „Bild folgt". Laut Briefing schlagen 12–20 wirklich starke Bilder 60 gute. Klären, wer auswählt. Danach: `srcset`, moderne Formate, Alt-Texte, die die Szene beschreiben (Feld `alt` existiert je Arbeit in `lib/content.ts`).
- [ ] **Hero-Video.** Die Referenzseite hat ein randloses Loop-Video; unser Hero unterstützt das bereits (`HERO_VIDEO` in `lib/content.ts`), zeigt bis dahin einen Farbverlauf. Video liefern, zusätzlich ein Poster-Bild (`HERO_POSTER`) setzen.
- [ ] **Domain-Entscheidung:** Briefing empfiehlt `jakobsax.media` als primäre Domain (passend zum bestehenden Handle `@jakobsax.media`), `jakobsax.de` weiterleiten. Aktuell läuft alles auf `jakobsax.de`. Entscheiden, bevor Adressen gedruckt werden.

## Langfristig

- 🔲 **Onetake-Arbeiten:** Frühere Arbeiten (Kath. Kirche Rastatt, Stadtverwaltung Rastatt, Narren-Gemeinschaft, Schlosslichtspiele Karlsruhe) sind bewusst **nicht** auf der Seite — sie liefen über eine Firma, an der Jakob nicht mehr beteiligt ist. Klären, ob Nutzungsrechte und Freigabe vorliegen; falls ja, mit Produktionscredit „Produktion: Onetake Studios UG" aufnehmen.
- 🔲 **BKV-Videos verifizieren:** WiWaWo 50–52 sind Jakob sicher zuzuordnen. Falls weitere BKV-Arbeiten aufgenommen werden sollen, einzeln prüfen — falsche Credits auf einer Portfolio-Seite sind ein Reputationsrisiko.
- 🔲 **Weitere Festivals ergänzen** — und dabei die Rolle klären: offizieller Festivalfotograf im Auftrag, oder freie Arbeit? Das ist ein großer Unterschied in der Außendarstellung.
- 🔲 **Preisangaben:** Briefing empfiehlt einen Richtwert („Tagessatz ab €"), weil Festivals und Kulturämter mit festen Budgets planen — das spart beiden Seiten die Hälfte der Anfragen. Aktuell steht überall „noch festzulegen".
- 🔲 **Zweisprachigkeit prüfen (DE/EN):** Beim tête-à-tête wirken Compagnien aus über zehn Nationen mit.
- 🔲 **Bildstrecken statt Einzelbilder:** Das Briefing empfiehlt als Ausbaustufe kuratierte Strecken (8–12 Bilder je Festival mit kurzem Vorspann) statt eines reinen Rasters. Sinnvoll, sobald genug Material da ist.
