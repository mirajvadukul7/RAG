import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ORYNTH — Secure Intelligence. Controlled Access.",
  description: "ORYNTH: Zero-leakage enterprise multimodal RAG with cryptographic permission enforcement.",
  openGraph: {
    title: "ORYNTH — Secure Intelligence. Controlled Access.",
    description: "ORYNTH: Zero-leakage enterprise multimodal RAG with cryptographic permission enforcement.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#060a12] text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300`}>
        {children}
      </body>
    </html>
  );
}
