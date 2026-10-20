import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "GTM Flywheel",
  description: "One-person GTM automation — signal detection, AI enrichment, personalized outreach, pipeline tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-[#0a0a0a] text-white antialiased font-sans">{children}</body>
    </html>
  );
}
