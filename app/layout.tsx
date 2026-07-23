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
  title: "XPORTAL — Verified Commercial Property on Cardano",
  description:
    "Discover verified commercial development sites across five European markets and reserve through a non-custodial Cardano workflow.",
  icons: {
    icon: "/xportal-logo.jpg",
    shortcut: "/xportal-logo.jpg",
  },
  openGraph: {
    title: "XPORTAL — Commercial Ground for What Comes Next",
    description:
      "Verified commercial property discovery with transparent diligence and Cardano-enabled reservations.",
    type: "website",
    images: [
      {
        url: "/og-marketplace.png",
        width: 1536,
        height: 1024,
        alt: "XPORTAL commercial property marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XPORTAL — Verified Commercial Property",
    description: "Join the qualified buyer whitelist.",
    images: ["/og-marketplace.png"],
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
