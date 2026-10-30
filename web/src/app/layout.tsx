import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";

// Geist runs the interface, Lora carries headlines and long-form reading, Geist Mono shows IDs and timestamps.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: {
    default: "PLAR Platform · TRU Open Learning",
    template: "%s · PLAR Platform",
  },
  description:
    "One secure home for the Competency-based Portfolio journey at TRU Open Learning — from readiness to credit, with people making every decision.",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${geist.variable} ${geistMono.variable} ${lora.variable} h-full`}>
      <body className="relative min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:px-4 focus:py-2 focus:shadow-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
