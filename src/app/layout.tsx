import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Noto_Music } from "next/font/google";
import "./globals.css";

// Display — substitute for the brand's "Nocturne Serif" (high-contrast modern serif).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body / UI — substitute for the brand's "Apparat" (humanist geometric sans).
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  weight: ["400", "500", "700"],
  display: "swap",
});

// Decorative musical glyphs only — never used for text.
const notoMusic = Noto_Music({
  subsets: ["latin"],
  variable: "--font-noto-music",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Salas da Estação · Estação Musical de Monção",
    template: "%s · Salas da Estação",
  },
  description:
    "Consulte a disponibilidade e reserve as salas de ensaio da Estação Musical de Monção.",
};

export const viewport: Viewport = {
  themeColor: "#1D1A55",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-PT"
      className={`${fraunces.variable} ${hanken.variable} ${notoMusic.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
