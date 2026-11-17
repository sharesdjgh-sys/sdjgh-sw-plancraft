import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const lineSeed = localFont({
  src: [
    { path: "./fonts/LINESeedKR-Rg.woff2", weight: "400", style: "normal" },
    { path: "./fonts/LINESeedKR-Bd.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ui",
  display: "swap",
});

const roundedSmile = localFont({
  src: "./fonts/HakgyoansimDunggeunmisoTTF-R.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlanCraft — AI와 함께 완성하는 SW 아이디어 공모전 기획서",
  description: "AI 멘토와 함께 SW 아이디어 공모전을 준비하세요. 아이디어 발굴부터 기획서 제출까지 6단계로 완성합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${lineSeed.variable} ${roundedSmile.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
