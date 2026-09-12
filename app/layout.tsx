import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

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
  title: "Xian's Game World - Cyber Arcade & Multiplayer Platform",
  description:
    "Play epic web games on Xian's Game World: Cyber Runner Royale multiplayer platformer, Neon Space Survivor arcade shooter, and Zombie Haven 3D co-op zombie survival. Real-time multiplayer rooms, solo speedruns, and live leaderboards.",
  applicationName: "Xian's Game World",
  keywords: [
    "xian games",
    "web games",
    "multiplayer",
    "arcade",
    "runner royale",
    "space survivor",
    "zombie haven",
    "co-op survival",
    "html5 games",
    "nextjs",
  ],
  authors: [{ name: "Saiful Xian" }],
  creator: "Saiful Xian",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Xian's Games",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Xian's Game World - Cyber Arcade & Multiplayer",
    description:
      "Play epic web games on Xian's Game World: Cyber Runner Royale multiplayer platformer, Neon Space Survivor arcade shooter, and Zombie Haven 3D co-op zombie survival.",
    siteName: "Xian's Game World",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xian's Game World - Cyber Arcade & Multiplayer",
    description:
      "Play epic web games on Xian's Game World: Cyber Runner Royale multiplayer platformer, Neon Space Survivor arcade shooter, and Zombie Haven 3D co-op zombie survival.",
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen w-full bg-[#060913] text-slate-100 overflow-x-hidden overflow-y-auto"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
