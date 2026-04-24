import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // 모든 검색 엔진 로봇 환영!
      allow: '/',     // 모든 페이지 다 가져가도 됨!
    },
    sitemap: 'https://busanyouthnews.co.kr/sitemap.xml',
  }
}