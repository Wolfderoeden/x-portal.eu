import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://x-portal.eu"),
  title: "XPORTAL — Verified Commercial Property Intelligence",
  description:
    "Explore controlled commercial property records across five European markets through an immersive cadastral intelligence map.",
  icons: {
    icon: "/xportal-logo.jpg",
    shortcut: "/xportal-logo.jpg",
  },
  openGraph: {
    title: "XPORTAL — Property Intelligence / Verified Data",
    description:
      "Backend-controlled property discovery with transparent due diligence, deterministic data fingerprints and explicit Cardano anchor status.",
    type: "website",
    images: [
      {
        url: "/og-strategy.png",
        width: 1254,
        height: 1254,
        alt: "XPORTAL property intelligence strategy map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XPORTAL — Property Intelligence / Verified Data",
    description: "A controlled B2B property map with explicit integrity proofs.",
    images: ["/og-strategy.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
