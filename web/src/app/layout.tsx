import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the fallback for non-Apple devices; Apple devices render the native system font (design system §4.1).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PLAR Platform · TRU Open Learning",
    template: "%s · PLAR Platform",
  },
  description:
    "One secure home for the Competency-based Portfolio journey at TRU Open Learning — from readiness to credit, with people making every decision.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${inter.variable} h-full`}>
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
