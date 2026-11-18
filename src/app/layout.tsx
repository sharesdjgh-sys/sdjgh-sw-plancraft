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
  title: "PlanCraft — AI와 함께 완성하는 서비스 기획서",
  description: "학생, 선생님, 일반 사용자 누구나 일상과 업무의 아이디어를 서비스로 기획하세요. 아이디어봇과 6단계로 바이브코딩을 위한 기획서를 완성합니다.",
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
