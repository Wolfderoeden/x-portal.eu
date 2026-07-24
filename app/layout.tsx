import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "XPORTAL — The Private Gateway to Cardano DeFi",
  description:
    "Join the XPORTAL founding whitelist for early access to a focused Cardano DeFi experience.",
  icons: {
    icon: "/xportal-logo.jpg",
    shortcut: "/xportal-logo.jpg",
  },
  openGraph: {
    title: "XPORTAL — Cardano DeFi, Before the Crowd",
    description:
      "Join the founding whitelist for launch intelligence, early product access and priority onboarding.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "XPORTAL — The private gateway to Cardano DeFi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XPORTAL — Cardano DeFi, Before the Crowd",
    description: "Join the founding XPORTAL whitelist.",
    images: ["/og.png"],
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
