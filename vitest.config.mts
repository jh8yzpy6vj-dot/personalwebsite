import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests laufen in Node, nicht im Browser: Geprüft wird ausschließlich die
 * reine Logik in `lib/` — Validierung und Ableitungen aus den Inhalten.
 * Für die Oberfläche gibt es den Browser-Durchlauf, der in TECH-STACK.md
 * beschrieben ist; ein zweites, halbes Browser-Abbild wäre Aufwand ohne
 * zusätzliche Sicherheit.
 */
export default defineConfig({
  resolve: {
    // Dasselbe `@/`-Kürzel wie in tsconfig.json, damit Tests und Anwendung
    // dieselben Importpfade benutzen.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
