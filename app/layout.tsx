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
  title: "Platformer Run - 2D Multiplayer Platformer Game",
  description: "Real-time multiplayer 2D platformer with room creation, double-jump, moving platforms, coins, hazards, and goal flag.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Platformer Run",
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
