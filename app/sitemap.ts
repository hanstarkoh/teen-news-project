import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, published_at')
    .eq('source_type', 'manual')
    .order('published_at', { ascending: false })

  const articleUrls: MetadataRoute.Sitemap = (articles || []).map((article) => ({
    url: `https://busanyouthnews.co.kr/article/${article.id}`,
    lastModified: new Date(article.published_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

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
    ...articleUrls,
  ]
}