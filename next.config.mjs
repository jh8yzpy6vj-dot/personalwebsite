/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * Aus welchem Commit dieser Build stammt — fest eingesetzt, damit die
   * Verwaltung (`/api/admin/live`) melden kann, wann eine Speicherung
   * online ist. Workers Builds setzt `WORKERS_CI_COMMIT_SHA`, GitHub Actions
   * `GITHUB_SHA`; lokal bleibt es leer (= „unbekannt").
   */
  env: {
    BUILD_COMMIT: process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
      /*
       * HTML immer beim Worker nachfragen lassen (TODO.md, UMBAU 3.5). Am
       * 2026-09-13 lag nach einem Deploy altes HTML im Edge-Cache, bis jemand
       * von Hand „Purge Everything" drückte — wer das vergisst, merkt es
       * nicht. Gerade nach einem Strukturumbau zeigte altes HTML auf Routen,
       * die es nicht mehr gibt.
       *
       * Ausgenommen: `/_next/static` (Dateinamen mit Fingerabdruck, Next.js
       * setzt dort selbst `immutable`) und die Vorschaukarten unter `/og`.
       * Die Bilder liegen ohnehin auf der Medien-Domain. Ebenso `/uebergang/`
       * (das Video oben, `lib/uebergang.ts`): Adresse mit Fingerabdruck, die
       * Route setzt `immutable` — sonst lüde jeder Besuch die 7 MB neu.
       */
      {
        source: "/((?!_next/static|_next/image|og/|uebergang/).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      /*
       * Die Verwaltung: nie zwischenspeichern, nie indexieren.
       *
       * ⚠️ **Muss NACH der Regel oben stehen.** Passen mehrere Regeln auf
       * denselben Pfad und setzen denselben Header, gewinnt in Next.js die
       * spätere. Stünde das hier davor, bekäme `/admin` wieder
       * `public, must-revalidate` — und `public` erlaubt der Edge, Jakobs
       * Daten für den Nächsten aufzuheben. Die Routen setzen `no-store`
       * zusätzlich selbst (`lib/admin/antwort.ts`).
       */
      ...["/admin", "/admin/:path*", "/api/admin/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      })),
    ];
  },

  /*
   * Alte Adressen aus der Zeit der Auftragsseite (bis 2026-10-08). Die Seite
   * war nie indexiert; die Weiterleitungen fangen Links ab, die schon
   * herumgeschickt wurden. `permanent: true` → 308.
   */
  async redirects() {
    return [
      { source: "/arbeiten", destination: "/foto", permanent: true },
      { source: "/arbeiten/:slug*", destination: "/foto", permanent: true },
      /*
       * Die Detailseiten `/foto/<id>` waren am 2026-10-14 ein paar Stunden
       * live und sind auf Jakobs Wunsch wieder weg — alles steht im Mosaik
       * auf `/foto`. ⚠️ `permanent: false` (307), nicht 308: Ein 308 merkt
       * sich der Browser dauerhaft, und sollten Detailseiten je zurückkommen,
       * landeten Besucher trotzdem weiter auf `/foto`.
       */
      { source: "/foto/:id", destination: "/foto", permanent: false },
      { source: "/leistungen/:slug*", destination: "/", permanent: true },
      { source: "/kontakt", destination: "/ueber", permanent: true },
    ];
  },
};

export default nextConfig;
