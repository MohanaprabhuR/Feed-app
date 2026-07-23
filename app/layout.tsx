import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const timelessSans = localFont({
  src: "./fonts/TimelessSansVF.ttf",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

const timelessSerif = localFont({
  src: "./fonts/TimelessSerifVF.ttf",
  variable: "--font-serif",
  display: "swap",
  weight: "100 900",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedApp — Social Feed",
  description: "Connect, share, and discover on FeedApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${timelessSans.variable} ${timelessSerif.variable} ${geistMono.variable} h-full min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: browser extensions (Grammarly etc.) inject
          attributes into <body> before React hydrates; suppression is one
          element deep, so real mismatches in children still warn. */}
      <body
        className="flex min-h-dvh w-full flex-col font-sans"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
