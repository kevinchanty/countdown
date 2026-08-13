import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mario",
});

export const metadata: Metadata = {
  title: "Super Mario Countdown",
  description: "A playable Super Mario Bros-style countdown game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body className={pressStart.className}>{children}</body>
    </html>
  );
}
