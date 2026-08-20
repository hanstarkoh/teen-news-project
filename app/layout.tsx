import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans-kr",
});

const notoSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-serif-kr",
});

export const metadata: Metadata = {
  // ⭐️ 검색 결과에 뜨는 굵은 파란색 제목
  title: "부산청소년뉴스 BY NEWS", 
  // ⭐️ 검색 결과 제목 아래에 뜨는 회색 설명글
  description: "부산 지역 청소년들을 위한 가장 빠르고 생생한 뉴스 제보 및 보도 매체, 부산청소년뉴스 BY NEWS입니다.",
  // ⭐️ 네이버 로봇이 참고할 핵심 키워드들
  keywords: "부산청소년뉴스, 부산 청소년, 부산 뉴스, 청소년 기자단, BY NEWS, 학생기자단",
  
  // ⭐️ 카톡이나 페이스북에 링크 공유할 때 뜨는 예쁜 카드 정보
  openGraph: {
    title: "부산청소년뉴스 BY NEWS",
    description: "부산 청소년의 새로운 소식",
    url: "https://busanyouthnews.co.kr",
    siteName: "BY NEWS",
    locale: "ko_KR",
    type: "website",
  },
  
  // 편집장님의 네이버 소유확인 암호 (그대로 유지)
  verification: {
    other: {
      "naver-site-verification": "18cb8f44310631fee4d91335bc5d76b7b5e0454e",
    },
  },

  // ⭐️ RSS 피드 (네이버 뉴스 등록, RSS 리더 구독용)
  alternates: {
    types: {
      "application/rss+xml": "https://busanyouthnews.co.kr/feed.xml",
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
      <body className={`${notoSans.variable} ${notoSerif.variable} font-sans`}>{children}</body>
    </html>
  );
}