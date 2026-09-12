import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests laufen in Node, nicht im Browser: Geprüft wird die reine Logik in
 * `lib/` — Validierung und Ableitungen aus den Inhalten — sowie die
 * plattformabhängigen Teile der Skripte in `scripts/`.
 * Für die Oberfläche gibt es den Browser-Durchlauf, der in TECH-STACK.md
 * beschrieben ist; ein zweites, halbes Browser-Abbild wäre Aufwand ohne
 * zusätzliche Sicherheit.
 *
 * ⚠️ `scripts/` kam am 2026-09-12 dazu, nach einem Fehler, den nur eine
 * andere Plattform zeigte: Der Leser für `.dev.vars` zerlegte an `\n` und
 * scheiterte deshalb an Windows-Zeilenenden — hier auf Linux lief er,
 * bei Jan nie. Solche Stellen gehören unter Test, nicht unter Vermutung.
 */
export default defineConfig({
  resolve: {
    // Dasselbe `@/`-Kürzel wie in tsconfig.json, damit Tests und Anwendung
    // dieselben Importpfade benutzen.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
