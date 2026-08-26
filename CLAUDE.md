# CLAUDE.md — Projektanleitung für Claude (jakobsax.de)

Diese Datei wird von Claude (und anderen KI-Agenten) automatisch gelesen, bevor an diesem Repo gearbeitet wird. Sie legt die Regeln fest, an die sich **jeder** Agent zu halten hat — egal ob Jan oder Jakob gerade arbeitet.

## Projekt-Kurzüberblick

- **Was**: Persönliche Website für Jakob Sax.
- **Wer arbeitet dran**: Jan und Jakob, beide gleichberechtigt.
- **Domain**: `jakobsax.de` und `www.jakobsax.de` (beide auf denselben Cloudflare Worker gebunden).
- **Deploy**: Cloudflare Worker `personalwebsite` (Cloudflare-Konto, in dem auch die Domain liegt). Kein Build-Framework, aktuell reines statisches HTML.

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

## Konventionen

- Keine unnötige Komplexität einbauen (kein Build-Framework, kein Static-Site-Generator), solange die Seite einfach bleibt — reines HTML/CSS reicht für den aktuellen Umfang.
- Neue größere Strukturentscheidungen (Framework-Wechsel, Umzug auf Pages statt Worker, Mehrsprachigkeit etc.) hier in dieser Datei dokumentieren, sobald sie getroffen werden.
