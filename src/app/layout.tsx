import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlanCraft — AI와 함께 완성하는 SW 아이디어 공모전 기획서",
  description: "AI 멘토와 함께 SW 아이디어 공모전을 준비하세요. 아이디어 발굴부터 기획서 제출까지 6단계로 완성합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${instrumentSerif.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          id="pretendard"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';document.head.appendChild(l)})()`,
          }}
        />
      </body>
    </html>
  );
}
