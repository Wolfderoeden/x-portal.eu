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
  title: "XPORTAL — Coming Soon",
  description:
    "XPORTAL is coming soon. Join the whitelist for early access.",
  icons: {
    icon: "/xportal-logo.jpg",
    shortcut: "/xportal-logo.jpg",
  },
  openGraph: {
    title: "XPORTAL — Coming Soon",
    description: "The next portal opens soon. Join the whitelist.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1732,
        height: 909,
        alt: "XPORTAL — The next portal opens soon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XPORTAL — Coming Soon",
    description: "The next portal opens soon. Join the whitelist.",
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
