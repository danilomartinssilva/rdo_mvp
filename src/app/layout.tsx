import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegistrar } from "@/components/pwa-registrar";
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
  title: "Canteiro | RDO Digital",
  description: "Relatório Diário de Obra digital.",
  applicationName: "Canteiro",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><PwaRegistrar />{children}</body>
    </html>
  );
}
