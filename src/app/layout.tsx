import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-jp",
});

const notoSerif = Noto_Serif_JP({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-jp",
});

export const metadata: Metadata = {
  title: {
    default: "Mado — Web Engineer",
    template: "%s | Mado",
  },
  description: "Mado のポートフォリオサイト。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoSerif.variable}`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
