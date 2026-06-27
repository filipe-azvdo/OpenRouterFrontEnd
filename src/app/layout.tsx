import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Stand-in editorial para a PP Editorial Old (comercial): near-serif elegante.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-serif",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PersonalRouter — Planejamento de Rotas",
  description:
    "Planeje rotas com paradas, perfis de transporte e pedágios sobre o trajeto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col bg-canvas text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
