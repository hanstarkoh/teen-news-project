import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://busanyouthnews.co.kr',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1, // 메인 화면이 제일 중요함 (1점 만점)
    },
    {
      url: 'https://busanyouthnews.co.kr/request',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8, // 제보 페이지도 중요함
    },
  ]
}