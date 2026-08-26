import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jakob Sax",
  description: "Persönliche Website von Jakob Sax",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
