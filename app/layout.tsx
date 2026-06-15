import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreShell } from "@/components/store/store-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${SITE_NAME} — powered by Corvex CMS`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
