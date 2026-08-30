# Git-Historie bereinigen — Anleitung für Jan

> **Diese Datei ist eine Wegwerf-Anleitung.** Wenn die Bereinigung durch ist,
> gehört ein Eintrag nach `AGENT-LOG.md` und diese Datei wird gelöscht. Sie ist
> ausdrücklich **keine** vierte Kerndatei (siehe `CLAUDE.md`).

## Worum es geht

Am 2026-08-29 sind zwölf unbearbeitete Kameradateien nach `bilder/arbeiten/`
gepusht worden, zusammen rund **134 MB**. Sie wurden inzwischen gelöscht —
aber **Git vergisst nichts**: Die Dateien stecken weiterhin in jedem Commit
davor und werden bei jedem frischen Clone mitgeladen. Auch von Cloudflare,
bei jedem Build.

Das lässt sich nur beheben, indem die Historie **umgeschrieben** wird.

## ⚠️ Was das bedeutet

- Alle Commit-Hashes ab dem betroffenen Punkt ändern sich.
- Es braucht einen **Force-Push**.
- **Jede vorhandene lokale Kopie wird unbrauchbar.** Du und Jakob müsst danach
  neu klonen. Nicht `git pull` — das erzeugt ein Chaos aus doppelten Commits.
- Offene, nicht gepushte Arbeit vorher sichern.

Deshalb: **erst absprechen, wer gerade woran arbeitet**, dann machen.

## Vorher: Sicherung

```bash
# Vollständige Kopie des aktuellen Stands, falls etwas schiefgeht
git clone --mirror https://github.com/jh8yzpy6vj-dot/personalwebsite.git sicherung-personalwebsite.git
```

Die Sicherung erst löschen, wenn die Seite nach der Bereinigung nachweislich
wieder baut.

## Die Bereinigung

`git filter-repo` ist das empfohlene Werkzeug (die alte `filter-branch` ist
abgekündigt und langsam).

```bash
# 1. Werkzeug installieren
pip install git-filter-repo        # oder: brew install git-filter-repo

# 2. Frischen Klon anlegen — filter-repo verlangt das
git clone https://github.com/jh8yzpy6vj-dot/personalwebsite.git bereinigung
cd bereinigung

# 3. Nachsehen, was tatsächlich schwer ist (Kontrolle vor dem Eingriff)
git filter-repo --analyze
#    Ergebnis steht in .git/filter-repo/analysis/blob-shas-and-paths.txt

# 4. Alle JPGs aus bilder/arbeiten/ aus der gesamten Historie entfernen
git filter-repo --path-glob 'bilder/arbeiten/*.JPG' --path-glob 'bilder/arbeiten/*.jpg' --invert-paths

# 5. Prüfen: Repo-Größe und dass die Dateien weg sind
du -sh .git
git log --oneline | head
git rev-list --objects --all | grep -i "JakobSax_WiWaWo" || echo "sauber"
```

⚠️ **Schritt 4 entfernt auch künftig gültige Bilder mit diesen Namen aus der
Historie.** Das ist hier gewollt — es liegen ohnehin keine anderen darin.

```bash
# 6. Remote wieder eintragen (filter-repo entfernt ihn absichtlich)
git remote add origin https://github.com/jh8yzpy6vj-dot/personalwebsite.git

# 7. Force-Push
git push --force origin main
```

## Danach

1. **Alle alten lokalen Kopien löschen und neu klonen.** Du und Jakob.
2. Prüfen, dass Cloudflare wieder baut und die Seite steht.
3. Diese Datei löschen und den Vorgang in `AGENT-LOG.md` festhalten.

## Damit es nicht wieder passiert

**Das Problem ist seit dem 2026-08-29 an der Wurzel behoben: Fotos und Videos liegen
nicht mehr im Repo.** Sie liegen im R2-Bucket, verarbeitet wird lokal mit
`npm run medien`, und im Git stehen nur zwei kleine Manifestdateien. Es gibt
damit keinen Weg mehr, auf dem eine 12-MB-Kameradatei versehentlich in die
Historie gerät — auch nicht mit dem besten Willen zum Fehler.

Die Vorgaben für die Originale (**lange Kante 2400–3000 px, unter 3 MB**) stehen
jetzt in `TECH-STACK.md`, Abschnitt „Medien". Die Pipeline warnt weiterhin, wenn
eine Datei zu groß ist oder zu keiner Arbeit gehört — das kostet jetzt aber nur
noch Rechenzeit auf einem Laptop, nicht mehr Platz im Git-Verlauf.

⚠️ **Diese Bereinigung ist trotzdem noch fällig.** Die 134 MB von damals stecken
weiterhin in jedem Commit davor und werden bei jedem frischen Clone mitgeladen.
Dass es nicht wieder passieren kann, macht das Vorhandene nicht kleiner.
