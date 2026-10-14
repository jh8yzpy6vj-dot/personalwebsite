/** @type {import('next').NextConfig} */
const nextConfig = {
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
       * Die Bilder liegen ohnehin auf der Medien-Domain.
       */
      {
        source: "/((?!_next/static|_next/image|og/).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
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
