import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ArticleClient from './ArticleClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: article } = await supabase
    .from('articles')
    .select('title, summary, thumbnail_url')
    .eq('id', id)
    .single();

  if (!article) {
    return { title: '기사를 찾을 수 없습니다 - BY NEWS' };
  }

  const description = (article.summary || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const image = article.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop';

  return {
    title: `${article.title} - BY NEWS`,
    description,
    openGraph: {
      title: article.title,
      description,
      images: [{ url: image }],
      type: 'article',
      siteName: 'BY NEWS',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

// 구글이 이 페이지를 진짜 뉴스 기사로 인식하고 색인 우선순위를 줄 수 있도록,
// 뉴스 사이트 표준 구조화 데이터(NewsArticle)를 심어줍니다.
export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const { data: article } = await supabase
    .from('articles')
    .select('title, summary, thumbnail_url, published_at')
    .eq('id', id)
    .single();

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [article.thumbnail_url || 'https://busanyouthnews.co.kr/icon-512.png'],
        datePublished: article.published_at,
        dateModified: article.published_at,
        description: (article.summary || '').replace(/\s+/g, ' ').trim().slice(0, 200),
        mainEntityOfPage: { '@type': 'WebPage', '@id': `https://busanyouthnews.co.kr/article/${id}` },
        author: { '@type': 'Organization', name: 'BY NEWS' },
        publisher: {
          '@type': 'Organization',
          name: 'BY NEWS',
          logo: { '@type': 'ImageObject', url: 'https://busanyouthnews.co.kr/icon-512.png' },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleClient />
    </>
  );
}
