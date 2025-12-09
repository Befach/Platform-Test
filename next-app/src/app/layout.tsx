import type { Metadata } from "next";
import Script from "next/script";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ReactGrabWrapper } from "@/components/dev/react-grab-wrapper";

// Temporarily commented out due to Google Fonts network issue
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Product Lifecycle Platform",
  description: "Manage your product roadmap with confidence - from ideation to launch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Script
          src="https://cdn.jsdelivr.net/npm/@tweakcn/preview@latest/dist/preview.js"
          strategy="afterInteractive"
          data-project-id="preview"
        />
        {/* React Grab - DEV ONLY for Claude Code efficiency */}
        <ReactGrabWrapper />
      </body>
    </html>
  );
}
