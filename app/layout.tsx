import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: "Runner Royale - 2D Multiplayer Platformer",
  description:
    "Real-time multiplayer 2D platformer with room creation, double-jump, moving platforms, coins, hazards, and goal flag.",
  applicationName: "Runner Royale",
  keywords: [
    "platformer",
    "multiplayer",
    "game",
    "html5 game",
    "runner",
    "speedrun",
    "2d game",
    "nextjs",
  ],
  authors: [{ name: "Platformer Run Team" }],
  creator: "Platformer Run",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Runner Royale",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Runner Royale - 2D Multiplayer Platformer",
    description:
      "Real-time multiplayer 2D platformer with room creation, double-jump, moving platforms, coins, hazards, and race standings.",
    siteName: "Runner Royale",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Royale - 2D Multiplayer Platformer",
    description:
      "Real-time multiplayer 2D platformer with room creation, double-jump, moving platforms, coins, and race standings.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-hidden`}
    >
      <body
        suppressHydrationWarning
        className="h-full w-full bg-slate-950 text-slate-100 overflow-hidden select-none"
      >
        {children}
      </body>
    </html>
  );
}
