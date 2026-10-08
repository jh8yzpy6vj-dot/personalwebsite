/**
 * `npm run links` — prüft jeden Filmlink aus `FILME` in lib/content.ts.
 *
 * Grund: ARD- und SWR-Mediathek depublizieren nach Ablauf der Verweildauer.
 * Ein toter Link auf einer Seite, die nur aus Links besteht, ist ein
 * sichtbarer Mangel.
 *
 * **Bewusst nicht im Build:** Ein Deploy darf nicht davon abhängen, ob
 * YouTube gerade antwortet. Regelmäßig von Hand oder geplant laufen lassen.
 *
 * Braucht Node ≥ 22.18 (liest content.ts direkt).
 */
const { FILME } = await import("../lib/content.ts");

let fehler = 0;
for (const film of FILME) {
  let status;
  try {
    const antwort = await fetch(film.link, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (Linkpruefung jakobsax.de)" },
      signal: AbortSignal.timeout(15000),
    });
    status = antwort.status;
  } catch (e) {
    status = e.name === "TimeoutError" ? "Zeitüberschreitung" : e.message;
  }
  const ok = status === 200;
  if (!ok) fehler += 1;
  console.log(`${ok ? "  ok" : "  ! "} ${status}  ${film.id}  ${film.link}`);
}

console.log(
  FILME.length === 0
    ? "Keine Filme in content.ts."
    : `${FILME.length} Links geprüft, ${fehler} mit Problem.`,
);
process.exit(fehler > 0 ? 1 : 0);
