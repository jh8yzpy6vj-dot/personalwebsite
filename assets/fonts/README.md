# assets/fonts/ — Schriften für die Vorschaukarten

Diese TrueType-Dateien werden **ausschließlich zur Bauzeit** von
`scripts/og.mjs` gelesen, um die OpenGraph-Karten zu setzen. Sie werden
**nicht an Browser ausgeliefert** — die Seite selbst lädt ihre Schriften über
`next/font/google` (siehe `app/layout.tsx`).

## Warum liegen sie hier und nicht bei den anderen Schriften

`next/font` lädt WOFF2. Satori, die Bibliothek hinter den Karten, kann damit
nichts anfangen und braucht TTF oder OTF. Deshalb dieselben zwei Schnitte
noch einmal in einem anderen Format.

⚠️ **Wer die Schriften der Seite wechselt, muss diese beiden Dateien
mitwechseln** — sonst sehen die Vorschaukarten anders aus als die Seite, und
niemand merkt es, weil die Karten im Browser nie erscheinen.

| Datei | Familie | Schnitt |
|---|---|---|
| `bricolage-700.ttf` | Bricolage Grotesque | 700 |
| `martianmono-400.ttf` | Martian Mono | 400 |

Bezogen von Google Fonts (`fonts.gstatic.com`), lateinischer Ausschnitt.

## Lizenz

Beide stehen unter der **SIL Open Font License 1.1**. Der Lizenztext liegt
daneben (`OFL-*.txt`) und gehört zur Weitergabe dazu — deshalb ist er
eingecheckt und darf nicht entfernt werden.
