import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BY NEWS - 부산 청소년의 새로운 소식",
  description: "부산 지역 청소년들을 위한 가장 빠르고 생생한 뉴스, BY NEWS입니다.",
  // ⭐️ 여기에 편집장님의 네이버 소유확인 암호가 들어갑니다!
  verification: {
    other: {
      "naver-site-verification": "18cb8f44310631fee4d91335bc5d76b7b5e0454e",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}